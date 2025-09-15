import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
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
import { Button, Modal } from '../index';
import { nodeTypes, nodeTypeDefinitions } from './FlowNodeTypes';
import type { FlowNodeData } from './FlowNodeTypes';
import { FlowValidator } from '../../services/flowValidation';
import type { FlowValidationResult } from '../../services/flowValidation';
import { 
  Plus, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  Trash2,
  X
} from 'lucide-react';

interface ReactFlowNodeData extends FlowNodeData {
  label?: string;
}

interface EnhancedFlowEditorProps {
  initialNodes?: Node<ReactFlowNodeData>[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node<ReactFlowNodeData>[], edges: Edge[], name?: string) => void;
  onValidate?: (result: FlowValidationResult) => void;
  onFlowChange?: (nodes: Node<ReactFlowNodeData>[], edges: Edge[]) => void;
  initialName?: string;
  showTopPanel?: boolean;
  autoSave?: boolean;
  onNameChange?: (name: string) => void;
}

export interface EnhancedFlowEditorHandle {
  setName: (name: string) => void;
  getName: () => string;
  openSaveModal: () => void;
  validate: () => void;
  exportFlow: () => void;
  save: () => void;
}

const EnhancedFlowEditor = forwardRef<EnhancedFlowEditorHandle, EnhancedFlowEditorProps & { project: any; fitViewFn?: (opts?: any) => void }>(({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onValidate,
  onFlowChange,
  initialName,
  showTopPanel = true,
  autoSave = false,
  project,
  fitViewFn,
  onNameChange
}, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<ReactFlowNodeData> | null>(null);
  const [showNodeProperties, setShowNodeProperties] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [validationResult, setValidationResult] = useState<FlowValidationResult | null>(null);
  const [flowName, setFlowName] = useState(initialName || 'Untitled Flow');
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const [isValidating, setIsValidating] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showEdgeProperties, setShowEdgeProperties] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showDesktopPalette, setShowDesktopPalette] = useState(true);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const lastAddedNodeIdRef = useRef<string | null>(null);

  const normalizeNodePositions = useCallback((nds: Node<ReactFlowNodeData>[]) => {
    const spacingX = 260;
    const spacingY = 140;
    return nds.map((n, i) => {
      const x = Number.isFinite((n as any)?.position?.x) ? (n as any).position.x : 120 + (i % 3) * spacingX;
      const y = Number.isFinite((n as any)?.position?.y) ? (n as any).position.y : 160 + Math.floor(i / 3) * spacingY;
      return { ...n, position: { x, y } } as Node<ReactFlowNodeData>;
    });
  }, []);

  useEffect(() => {
    if (!selectedNode) return;
    const latest = nodes.find((n) => n.id === selectedNode.id) || null;
    if (latest && latest !== selectedNode) {
      setSelectedNode(latest);
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    if (!selectedEdge) return;
    const latest = edges.find((e) => e.id === selectedEdge.id) || null;
    if (latest && latest !== selectedEdge) {
      setSelectedEdge(latest);
    }
  }, [edges, selectedEdge]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (onSave) {
          onSave(nodes, edges, flowName);
        } else {
          setShowSaveModal(true);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nodes, edges, flowName, onSave]);

  useEffect(() => {
    if (nodes.length === 0) {
      const startNode: Node<ReactFlowNodeData> = {
        id: `start_${Date.now()}`,
        type: 'start',
        position: { x: 120, y: 160 },
        data: {
          textDraft: '',
          messages: []
        }
      } as any;
      setNodes([startNode]);
      lastAddedNodeIdRef.current = startNode.id;
    } else if (!lastAddedNodeIdRef.current) {
      lastAddedNodeIdRef.current = nodes[nodes.length - 1]?.id || null;
    }
  }, []);

  useEffect(() => {
    if (initialName && initialName !== flowName) {
      setFlowName(initialName);
    }
  }, [initialName]);

  useEffect(() => {
    if (onNameChange) onNameChange(flowName);
  }, [flowName, onNameChange]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const keys = nodes.map((n) => `${Math.round(n.position?.x ?? NaN)}_${Math.round(n.position?.y ?? NaN)}`);
    const hasInvalid = nodes.some((n) => !Number.isFinite(n.position?.x) || !Number.isFinite(n.position?.y));
    const hasOverlap = new Set(keys).size < nodes.length;
    if (hasInvalid || hasOverlap) {
      const normalized = normalizeNodePositions(nodes);
      setNodes(normalized);
      requestAnimationFrame(() => fitViewFn?.({ padding: 0.2, duration: 400 }));
    } else {
      requestAnimationFrame(() => fitViewFn?.({ padding: 0.2, duration: 400 }));
    }
  }, [nodes.length]);

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
      condition: (e as any)?.data?.condition,
      data: (e as any)?.data
    }));
  }, []);

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
    (params: Connection) => {
      setEdges((eds) => {
        const edgeWithDefaults: Edge = {
          id: `e_${params.source}_${params.target}_${Date.now()}`,
          source: params.source!,
          target: params.target!,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: 'smoothstep',
          label: 'next',
          data: { conditionType: 'none', conditions: [], validators: [], postFunctions: [], triggers: [], properties: {}, keywords: [], expectedCorrectness: 'correct' }
        } as any
        return addEdge(edgeWithDefaults as any, eds)
      })
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<ReactFlowNodeData>) => {
    setSelectedNode(node);
    setShowNodeProperties(true);
    lastAddedNodeIdRef.current = node.id;
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setShowEdgeProperties(true);
  }, []);

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node<ReactFlowNodeData>) => {
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
    const newNodeId = `node_${Date.now()}`;
    const newNode: Node<ReactFlowNodeData> = {
      id: newNodeId,
      type,
      position,
      data: {
        textDraft: '',
        messages: [],
        choices: type === 'question' ? ['Choice 1', 'Choice 2'] : undefined
      } as ReactFlowNodeData
    };

    setNodes((prevNodes) => {
      return [...prevNodes, newNode];
    });

    setEdges((prevEdges) => {
      const singleExistingNodeId = (nodes.length === 1) ? nodes[0].id : null;
      const fromId = lastAddedNodeIdRef.current || singleExistingNodeId;
      if (!fromId) {
        lastAddedNodeIdRef.current = newNodeId;
        return prevEdges;
      }
      const newEdge: Edge = {
        id: `e_${fromId}_${newNodeId}`,
        source: fromId,
        target: newNodeId,
        label: 'next',
        data: { conditionType: 'none', conditions: [], validators: [], postFunctions: [], triggers: [], properties: {}, keywords: [], expectedCorrectness: 'correct' }
      } as any;
      lastAddedNodeIdRef.current = newNodeId;
      return [...prevEdges, newEdge];
    });

    lastAddedNodeIdRef.current = newNodeId;
  }, []);

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

  const updateEdgeData = useCallback((edgeId: string, newData: Record<string, any>) => {
    setEdges((eds) => eds.map((e) => {
      if (e.id === edgeId) {
        return { ...e, data: { ...(e as any).data, ...newData } } as Edge;
      }
      return e;
    }));
  }, [setEdges]);

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
      onSave(nodes, edges, flowName);
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

  useImperativeHandle(ref, () => ({
    setName: (name: string) => setFlowName(name),
    getName: () => flowName,
    openSaveModal: () => setShowSaveModal(true),
    validate: () => { validateFlow(); },
    exportFlow: () => { exportFlow(); },
    save: () => { saveFlow(); }
  }), [flowName, validateFlow, exportFlow, saveFlow]);

  useEffect(() => {
    if (!onSave || !autoSave) return;
    const handle = setTimeout(() => {
      onSave(nodes, edges, flowName);
    }, 800);
    return () => clearTimeout(handle);
  }, [nodes, edges, flowName, onSave, autoSave]);

  useEffect(() => {
    if (onFlowChange) {
      onFlowChange(nodes, edges);
    }
  }, [nodes, edges, onFlowChange]);

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

  useEffect(() => {
    if (!selectedNode) return;
    const lines = (selectedNode.data?.textDraft || '').replace(/\r\n?/g, '\n').split('\n');
    const prevRef = (selectedNode as any)._prevLineCount || 0;
    (selectedNode as any)._prevLineCount = lines.length;
    if (lines.length > prevRef) {
      setShowNewMessageIndicator(true);
      const t = setTimeout(() => setShowNewMessageIndicator(false), 1500);
      return () => clearTimeout(t);
    }
  }, [selectedNode?.data?.textDraft]);

  const insertVariableAtCursor = useCallback((variable: string) => {
    if (!selectedNode) return;
    const ta = textareaRef.current;
    const current = selectedNode.data?.textDraft || '';
    if (!ta) {
      const appended = current + `{${variable}}`;
      updateNodeData(selectedNode.id, { textDraft: appended });
      return;
    }
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    const newValue = current.substring(0, start) + `{${variable}}` + current.substring(end);
    updateNodeData(selectedNode.id, { textDraft: newValue });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + variable.length + 2;
      ta.setSelectionRange(pos, pos);
    });
  }, [selectedNode, updateNodeData]);

  const getTypeHints = useCallback((type?: string) => {
    const t = (type === 'completion' ? 'end' : (type || 'text')) as string;
    const hints: Record<string, string[]> = {
      start: ['Welcome messages and initial context', 'Variable collection and setup', 'Flow direction control'],
      text: ['Simple text responses', 'Variable interpolation', 'Multi-line messages'],
      image: ['Display images via URL', 'Add alt text', 'Use for visual cues'],
      audio: ['Play audio via URL', 'Add transcript text', 'Use for instructions'],
      video: ['Embed video via URL', 'Add caption text', 'Use for demonstrations'],
      question: ['User input collection', 'Validation and error handling', 'Branching based on responses'],
      decision: ['Logic-based branching', 'Variable comparison', 'Flow control decisions'],
      feedback: ['Craft specific feedback for outcomes', 'Different messages for correct/incorrect'],
      assessment: ['Define scoring and pass criteria', 'Weight questions', 'Branch on pass/fail'],
      end: ['Completion messages', 'Summary and next steps', 'Session termination']
    };
    return hints[t] || [];
  }, []);

  const handleWrapperDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null
    if (target && target.closest('.react-flow__panel')) return
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      setShowDesktopPalette(true)
    }
  }

  return (
    <div className="h-full w-full" ref={reactFlowWrapper} onDoubleClick={handleWrapperDoubleClick}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false, style: { stroke: '#40B1DF', strokeWidth: 1.5 }, labelStyle: { fill: '#334155', fontSize: 11 }, labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85, stroke: '#e2e8f0' }, labelShowBg: true }}
        connectionLineStyle={{ stroke: '#40B1DF', strokeWidth: 1.5 }}
        connectionLineType={"smoothstep" as any}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background />
        <MiniMap />
        {nodes.length === 0 && (
          <Panel position="top-center" className="bg-white rounded-lg shadow p-2 text-xs text-gray-600">
            Start by dragging a node. A Start and End node will be required.
          </Panel>
        )}
        
        {showTopPanel && (
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
        )}

        <Panel position="top-center" className="bg-white rounded-lg shadow p-2 m-2 block sm:hidden">
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => setShowMobilePalette((v) => !v)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Node
            </Button>
            <Button size="sm" onClick={() => setShowSaveModal(true)} className="bg-slate-700 hover:bg-slate-800 text-white">
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        </Panel>

        {showDesktopPalette && (
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 m-4 hidden sm:block">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Add Nodes</h3>
              <Button size="sm" variant="accent" onClick={() => setShowDesktopPalette(false)} aria-label="Close">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {nodeTypeDefinitions.map((nodeType) => (
                <div
                  key={nodeType.type}
                  draggable
                  onDragStart={(event) => onDragStart(event, nodeType.type)}
                  className={`${nodeType.color} text-white p-2 rounded cursor-move hover:opacity-80 transition-opacity text-center text-xs`}
                  title={nodeType.description}
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    {nodeType.icon}
                    <span>{nodeType.label}</span>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {!showDesktopPalette && (
          <Panel position="top-right" className="bg-white rounded-lg shadow p-2 m-4 hidden sm:block">
            <Button size="sm" onClick={() => setShowDesktopPalette(true)} className="bg-blue-600 hover:bg-blue-700 text-white">Show Nodes</Button>
          </Panel>
        )}

        {showMobilePalette && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setShowMobilePalette(false)} />
            <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
              <div className="bg-white rounded-t-2xl shadow-2xl p-4 max-h-[65vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Add Nodes</h3>
                  <Button size="sm" variant="accent" onClick={() => setShowMobilePalette(false)}>Close</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {nodeTypeDefinitions.map((nodeType) => (
                    <button
                      key={nodeType.type}
                      onClick={() => {
                        const container = reactFlowWrapper.current;
                        const rect = container?.getBoundingClientRect();
                        const pos = project({ x: (rect?.width || 0) / 2, y: (rect?.height || 0) / 2 });
                        addNode(nodeType.type, pos);
                        setShowMobilePalette(false);
                      }}
                      className={`${nodeType.color} text-white p-2 rounded text-center text-xs`}
                      title={nodeType.description}
                    >
                      {nodeType.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

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
                ref={textareaRef}
                value={selectedNode.data?.textDraft || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { textDraft: e.target.value })}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter node content..."
              />
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">Available Variables (click to insert)</div>
                <div className="grid grid-cols-2 gap-2">
                  {['first_name', 'last_name', 'email', 'company', 'role', 'department'].map((v) => (
                    <button
                      key={v}
                      onClick={() => insertVariableAtCursor(v)}
                      className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {`{${v}}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Live Preview</span>
                  {showNewMessageIndicator && (
                    <span className="text-xs text-green-600 font-medium animate-pulse">New line added</span>
                  )}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 max-h-40 overflow-auto space-y-2">
                  {((selectedNode.data?.textDraft || '')?.replace(/\r\n?/g, '\n').split('\n')).map((line, idx, arr) => (
                    <div
                      key={idx}
                      className={`text-sm px-2 py-1 rounded ${showNewMessageIndicator && idx === arr.length - 1 ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}
                    >
                      {line || <span className="italic text-gray-400">(empty line)</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(selectedNode.type === 'image' || selectedNode.type === 'audio' || selectedNode.type === 'video') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media URL
                </label>
                <input
                  type="url"
                  value={(selectedNode.data as any)?.mediaUrl || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { mediaUrl: e.target.value } as any)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                />
              </div>
            )}

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
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={(selectedNode.data?.keywords || []).join(', ')}
                    onChange={(e) => {
                      const kws = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      updateNodeData(selectedNode.id, { keywords: kws })
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., yes, agree, proceed"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type Hints</label>
              <div className="space-y-2">
                {getTypeHints(selectedNode.type).map((hint, i) => (
                  <div key={i} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            </div>

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

      <Modal
        isOpen={showEdgeProperties}
        onClose={() => setShowEdgeProperties(false)}
        title={`Transition Properties`}
        size="md"
      >
        {selectedEdge && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transition Name
              </label>
              <input
                type="text"
                value={(selectedEdge.label as string) || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setEdges((eds) => eds.map((ed) => ed.id === selectedEdge.id ? { ...ed, label: value } : ed))
                  setSelectedEdge((prev) => prev ? { ...prev, label: value } : prev)
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., Approve, Move to In Progress"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition Type
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={((selectedEdge as any).data?.conditionType) || 'none'}
                onChange={(e) => updateEdgeData(selectedEdge.id, { conditionType: e.target.value })}
              >
                <option value="none">Nothing required (auto-continue)</option>
                <option value="decision">Decision (by branch)</option>
                <option value="question">Question (match keywords)</option>
                <option value="correctness">Correctness (from previous question)</option>
              </select>
            </div>

            {((selectedEdge as any).data?.conditionType) === 'question' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={(((selectedEdge as any).data?.keywords) || []).join(', ')}
                  onChange={(e) => {
                    const kws = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    updateEdgeData(selectedEdge.id, { keywords: kws })
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., yes, next, continue"
                />
              </div>
            )}

            {((selectedEdge as any).data?.conditionType) === 'correctness' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Correctness</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={((selectedEdge as any).data?.expectedCorrectness) || 'correct'}
                  onChange={(e) => updateEdgeData(selectedEdge.id, { expectedCorrectness: e.target.value })}
                >
                  <option value="correct">Correct</option>
                  <option value="incorrect">Incorrect</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resolution (optional)</label>
              <input
                type="text"
                value={((selectedEdge as any).data?.resolution) || ''}
                onChange={(e) => updateEdgeData(selectedEdge.id, { resolution: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., Done, Won't Do"
              />
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button variant="accent" onClick={() => setShowEdgeProperties(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
      

      <Modal
        isOpen={showValidationPanel}
        onClose={() => setShowValidationPanel(false)}
        title="Flow Validation Results"
        size="lg"
      >
        {validationResult && (
          <div className="space-y-6">
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
});

const EnhancedFlowEditorInner = forwardRef<EnhancedFlowEditorHandle, EnhancedFlowEditorProps>((props, ref) => {
  const { project, fitView } = useReactFlow();
  return <EnhancedFlowEditor {...props} project={project} fitViewFn={fitView as any} ref={ref} />;
});

const EnhancedFlowEditorWrapper = forwardRef<EnhancedFlowEditorHandle, EnhancedFlowEditorProps>((props, ref) => (
  <ReactFlowProvider>
    <EnhancedFlowEditorInner {...props} ref={ref} />
  </ReactFlowProvider>
));

export default EnhancedFlowEditorWrapper;