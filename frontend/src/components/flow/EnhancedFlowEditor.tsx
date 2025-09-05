import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';

import { Button, Modal, Dialog } from '../index';
import { nodeTypes, nodeTypeDefinitions } from './FlowNodeTypes';
import type { FlowNodeData } from './FlowNodeTypes';
import { FlowValidator } from '../../services/flowValidation';
import type { FlowValidationResult } from '../../services/flowValidation';
import { 
  Plus, 
  Save, 
  Play, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Download,
  Upload,
  Trash2
} from 'lucide-react';

// Type mapping for ReactFlow nodes
interface ReactFlowNodeData extends FlowNodeData {
  label?: string;
}

interface EnhancedFlowEditorProps {
  initialNodes?: Node<ReactFlowNodeData>[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node<ReactFlowNodeData>[], edges: Edge[]) => void;
  onValidate?: (result: FlowValidationResult) => void;
  trainerId?: string;
}

const EnhancedFlowEditor: React.FC<EnhancedFlowEditorProps & { project: any }> = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onValidate,
  trainerId,
  project
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<ReactFlowNodeData> | null>(null);
  const [showNodeProperties, setShowNodeProperties] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [validationResult, setValidationResult] = useState<FlowValidationResult | null>(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Convert ReactFlow nodes to custom flow nodes for validation
  const convertToCustomNodes = useCallback((reactFlowNodes: Node<ReactFlowNodeData>[]) => {
    return reactFlowNodes.map(n => ({
      id: n.id,
      type: n.type || 'text',
      label: n.data?.label || n.id,
      x: n.position.x,
      y: n.position.y,
      w: 200,
      h: 100,
      data: n.data || { textDraft: '', messages: [] }
    }));
  }, []);

  const convertToCustomEdges = useCallback((reactFlowEdges: Edge[]) => {
    return reactFlowEdges.map(e => ({
      id: e.id,
      from: e.source,
      to: e.target,
      label: typeof e.label === 'string' ? e.label : undefined,
      condition: (e as any)?.data?.condition
    }));
  }, []);

  // Auto-validate flow when nodes/edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const customNodes = convertToCustomNodes(nodes);
      const customEdges = convertToCustomEdges(edges);
      const result = FlowValidator.validateFlow(customNodes, customEdges);
      setValidationResult(result);
      if (onValidate) {
        onValidate(result);
      }
    }
  }, [nodes, edges, onValidate, convertToCustomNodes, convertToCustomEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<ReactFlowNodeData>) => {
    setSelectedNode(node);
    setShowNodeProperties(true);
  }, []);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node<ReactFlowNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return { ...n, position: node.position };
        }
        return n;
      })
    );
  }, [setNodes]);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNode: Node<ReactFlowNodeData> = {
      id: `node_${Date.now()}`,
      type,
      position,
      data: {
        textDraft: '',
        messages: [],
        choices: type === 'question' ? ['Choice 1', 'Choice 2'] : undefined,
        validation: type === 'assessment' ? { required: true } : undefined
      } as ReactFlowNodeData
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(type, position);
    },
    [project, addNode]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const updateNodeData = useCallback((nodeId: string, newData: Partial<ReactFlowNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, ...newData } };
        }
        return n;
      })
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const validateFlow = useCallback(async () => {
    setIsValidating(true);
    try {
      const customNodes = convertToCustomNodes(nodes);
      const customEdges = convertToCustomEdges(edges);
      const result = FlowValidator.validateFlow(customNodes, customEdges);
      setValidationResult(result);
      setShowValidationPanel(true);
    } finally {
      setIsValidating(false);
    }
  }, [nodes, edges, convertToCustomNodes, convertToCustomEdges]);

  const saveFlow = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
    setShowSaveModal(false);
  }, [nodes, edges, onSave]);

  const exportFlow = useCallback(() => {
    const customNodes = convertToCustomNodes(nodes);
    const customEdges = convertToCustomEdges(edges);
    
    const flowData = {
      name: flowName,
      nodes: customNodes,
      edges: customEdges,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        stats: FlowValidator.getFlowStats(customNodes, customEdges),
        estimatedDuration: FlowValidator.estimateDuration(customNodes, customEdges)
      }
    };

    const dataStr = JSON.stringify(flowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flowName.replace(/\s+/g, '_')}_flow.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [flowName, nodes, edges, convertToCustomNodes, convertToCustomEdges]);

  const clearFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setFlowName('Untitled Flow');
  }, [setNodes, setEdges]);

  const getFlowStats = useCallback(() => {
    const customNodes = convertToCustomNodes(nodes);
    const customEdges = convertToCustomEdges(edges);
    return FlowValidator.getFlowStats(customNodes, customEdges);
  }, [nodes, edges, convertToCustomNodes, convertToCustomEdges]);

  const getEstimatedDuration = useCallback(() => {
    const customNodes = convertToCustomNodes(nodes);
    const customEdges = convertToCustomEdges(edges);
    return FlowValidator.estimateDuration(customNodes, customEdges);
  }, [nodes, edges, convertToCustomNodes, convertToCustomEdges]);

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background />
        <MiniMap />
        
        {/* Top Panel */}
        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4 m-4">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="text-lg font-semibold border-none outline-none bg-transparent"
              placeholder="Flow Name"
            />
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => setShowSaveModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              
              <Button
                size="sm"
                onClick={validateFlow}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isValidating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1" />
                )}
                Validate
              </Button>
              
              <Button
                size="sm"
                onClick={exportFlow}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </Panel>

        {/* Right Panel - Node Palette */}
        <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 m-4">
          <h3 className="font-semibold text-gray-700 mb-3">Add Nodes</h3>
          <div className="grid grid-cols-2 gap-2">
            {nodeTypeDefinitions.map((nodeType) => (
              <div
                key={nodeType.type}
                draggable
                onDragStart={(event) => onDragStart(event, nodeType.type)}
                className={`${nodeType.color} text-white p-2 rounded cursor-move hover:opacity-80 transition-opacity text-center text-xs`}
                title={nodeType.description}
              >
                {nodeType.label}
              </div>
            ))}
          </div>
        </Panel>

        {/* Bottom Panel - Flow Stats */}
        <Panel position="bottom-left" className="bg-white rounded-lg shadow-lg p-4 m-4">
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="font-medium">Nodes:</span> {getFlowStats().totalNodes}
            </div>
            <div>
              <span className="font-medium">Edges:</span> {getFlowStats().totalEdges}
            </div>
            <div>
              <span className="font-medium">Duration:</span> ~{getEstimatedDuration()} min
            </div>
            <div>
              <span className="font-medium">Complexity:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                getFlowStats().complexity === 'low' ? 'bg-green-100 text-green-800' :
                getFlowStats().complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {getFlowStats().complexity}
              </span>
            </div>
          </div>
        </Panel>

        {/* Validation Status */}
        {validationResult && (
          <Panel position="bottom-right" className="m-4">
            <div className={`rounded-lg p-3 ${
              validationResult.isValid 
                ? 'bg-green-100 border border-green-200' 
                : 'bg-red-100 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {validationResult.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  validationResult.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.isValid ? 'Flow Valid' : 'Flow Has Issues'}
                </span>
                {validationResult.errors.length > 0 && (
                  <span className="text-red-600 text-sm">
                    ({validationResult.errors.length} errors)
                  </span>
                )}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Node Properties Modal */}
      <Modal
        isOpen={showNodeProperties}
        onClose={() => setShowNodeProperties(false)}
        title={`Edit Node: ${selectedNode?.data?.label || selectedNode?.id || 'Unknown'}`}
        size="md"
      >
        {selectedNode && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Label
              </label>
              <input
                type="text"
                value={selectedNode.data?.label || ''}
                onChange={(e) => {
                  updateNodeData(selectedNode.id, { label: e.target.value });
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={selectedNode.data?.textDraft || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { textDraft: e.target.value })}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter node content..."
              />
            </div>

            {selectedNode.type === 'question' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Choices
                </label>
                <div className="space-y-2">
                  {(selectedNode.data?.choices || []).map((choice, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) => {
                          const newChoices = [...(selectedNode.data?.choices || [])];
                          newChoices[index] = e.target.value;
                          updateNodeData(selectedNode.id, { choices: newChoices });
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                        placeholder={`Choice ${index + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => {
                          const newChoices = (selectedNode.data?.choices || []).filter((_, i) => i !== index);
                          updateNodeData(selectedNode.id, { choices: newChoices });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => {
                      const newChoices = [...(selectedNode.data?.choices || []), `Choice ${(selectedNode.data?.choices || []).length + 1}`];
                      updateNodeData(selectedNode.id, { choices: newChoices });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Choice
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="accent"
                onClick={() => setShowNodeProperties(false)}
              >
                Close
              </Button>
              
              <Button
                variant="error"
                onClick={() => deleteNode(selectedNode.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Node
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Validation Panel Modal */}
      <Modal
        isOpen={showValidationPanel}
        onClose={() => setShowValidationPanel(false)}
        title="Flow Validation Results"
        size="lg"
      >
        {validationResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div className={`p-4 rounded-lg ${
              validationResult.isValid 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {validationResult.isValid ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
                <h3 className={`text-lg font-semibold ${
                  validationResult.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.isValid ? 'Flow is Valid!' : 'Flow Has Issues'}
                </h3>
              </div>
            </div>

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">Errors ({validationResult.errors.length})</h4>
                <div className="space-y-2">
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-700 mb-2">Warnings ({validationResult.warnings.length})</h4>
                <div className="space-y-2">
                  {validationResult.warnings.map((warning, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">{warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {validationResult.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-700 mb-2">Suggestions ({validationResult.suggestions.length})</h4>
                <div className="space-y-2">
                  {validationResult.suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flow Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Flow Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Nodes:</span> {getFlowStats().totalNodes}
                </div>
                <div>
                  <span className="font-medium">Total Edges:</span> {getFlowStats().totalEdges}
                </div>
                <div>
                  <span className="font-medium">Estimated Duration:</span> ~{getEstimatedDuration()} minutes
                </div>
                <div>
                  <span className="font-medium">Complexity Level:</span> {getFlowStats().complexity}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Save Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Flow"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flow Name
            </label>
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter flow name"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="accent"
              onClick={() => setShowSaveModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveFlow}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Flow
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Wrapper component to provide ReactFlow context
const EnhancedFlowEditorInner: React.FC<EnhancedFlowEditorProps> = (props) => {
  const { project } = useReactFlow();
  return <EnhancedFlowEditor {...props} project={project} />;
};

const EnhancedFlowEditorWrapper: React.FC<EnhancedFlowEditorProps> = (props) => (
  <ReactFlowProvider>
    <EnhancedFlowEditorInner {...props} />
  </ReactFlowProvider>
);

export default EnhancedFlowEditorWrapper;
