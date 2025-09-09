import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Input } from "../components";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { AudioWaveform } from 'lucide-react';
import { apiService } from "../services/api";

type NodeType =
  | "start"
  | "text"
  | "image"
  | "audio"
  | "video"
  | "question"
  | "decision"
  | "feedback"
  | "assessment"
  | "end"
  | (string & {});

interface NodeData {
  textDraft: string;
  messages: string[];
  keywords?: string[];
  errorMessage?: string;
  choices?: string[];
  passingScore?: number;
  timeLimit?: number;
  mediaUrl?: string;
}

interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  data: NodeData;
}

interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: { type: "auto" | "decision" | "question"; choiceKey?: string; keywords?: string[] };
  comment?: string;
}

const PALETTE = [
  { type: "start", label: "Start", color: "bg-emerald-700" },
  { type: "text", label: "Text", color: "bg-sky-700" },
  { type: "image", label: "Image", color: "bg-teal-700" },
  { type: "audio", label: "Audio", color: "bg-indigo-700" },
  { type: "video", label: "Video", color: "bg-violet-700" },
  { type: "question", label: "Question", color: "bg-blue-800" },
  { type: "decision", label: "Decision", color: "bg-amber-600" },
  { type: "feedback", label: "Feedback", color: "bg-slate-600" },
  { type: "assessment", label: "Assessment", color: "bg-cyan-700" },
  { type: "end", label: "End", color: "bg-emerald-800" },
];

let idCounter = 1;
const nextId = () => "n" + idCounter++;
export default function TrainerBuilder() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [trainerName, setTrainerName] = useState<string>("Untitled Trainer");
  const [flowId, setFlowId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [flowStatus, setFlowStatus] = useState<'draft' | 'published' | null>(null);
  const [isLoadingFlow, setIsLoadingFlow] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [viewTranslate, setViewTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewStartRef = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pendingClickNodeId, setPendingClickNodeId] = useState<string | null>(null);
  const [downPos, setDownPos] = useState<{ x: number; y: number } | null>(null);
  const [showPalette, setShowPalette] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : false));
  const [showProperties, setShowProperties] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.deltaMode === 0) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(5, Math.max(0.1, prev + delta)));
    } else {
      setViewTranslate((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trainerId = params.get('trainerId');
    if (!trainerId) return;

    let cancelled = false;
    (async () => {
      try {
        setIsLoadingFlow(true);
        const res = await apiService.getLatestTrainerFlow(trainerId, 'draft');
        const flow = (res as any)?.data;
        if (!cancelled && flow) {
          setTrainerName(flow.name || 'Untitled Trainer');
          setNodes(flow.nodes || []);
          setEdges(flow.edges || []);
          setFlowId(flow._id);
          setFlowStatus(flow.status || 'draft');
        }
      } catch (e) {
        console.error('Failed to load flow:', e);
      } finally {
        if (!cancelled) {
          setIsLoadingFlow(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trainerId = params.get('trainerId');
    if (!trainerId) return;

    const handler = setTimeout(async () => {
      try {
        setIsSaving(true);
        if (flowId) {
          await apiService.updateTrainerFlow(flowId, { name: trainerName, nodes, edges });
        } else {
          const createRes = await apiService.createTrainerFlow(trainerId, { name: trainerName, nodes, edges });
          const created = (createRes as any)?.data;
          if (created?._id) setFlowId(created._id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [nodes, edges, trainerName, flowId]);

  const manualSave = async () => {
    const params = new URLSearchParams(window.location.search);
    const trainerId = params.get('trainerId');
    if (!trainerId) {
      alert('Missing trainerId in URL (e.g., ?trainerId=...)');
      return;
    }
    try {
      setIsSaving(true);
      if (flowId) {
        await apiService.updateTrainerFlow(flowId, { name: trainerName, nodes, edges });
      } else {
        const res = await apiService.createTrainerFlow(trainerId, { name: trainerName, nodes, edges });
        const created = (res as any)?.data;
        if (created?._id) setFlowId(created._id);
      }
    } catch (e) {
      alert((e as Error).message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async () => {
    try {
      setIsValidating(true);
      setValidationErrors([]);
      
      const res = await apiService.validateTrainerFlow({ nodes, edges, settings: {} });
      const data: any = res?.data || {};
      
      if (data.isValid) {
        setValidationErrors([]);
        alert('Flow validation passed! Your flow is ready to publish.');
      } else {
        const errors = Array.isArray(data.errors) ? data.errors : ["Validation failed"];
        setValidationErrors(errors);
        alert(`Validation failed:\n\n${errors.join('\n')}`);
      }
    } catch (e) {
      const errorMessage = (e as Error)?.message || 'Validation request failed';
      setValidationErrors([errorMessage]);
      alert(`Validation error: ${errorMessage}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePublish = async () => {
    if (!flowId) {
      alert('Flow not saved yet. Please wait for autosave to create a flow.');
      return;
    }
    
    try {
      setIsValidating(true);
      const validationRes = await apiService.validateTrainerFlow({ nodes, edges, settings: {} });
      const validationData: any = validationRes?.data || {};
      
      if (!validationData.isValid) {
        const errors = Array.isArray(validationData.errors) ? validationData.errors : ["Validation failed"];
        setValidationErrors(errors);
        alert(`Cannot publish: Flow validation failed:\n\n${errors.join('\n')}`);
        return;
      }
      
      setValidationErrors([]);
      
      const res = await apiService.publishTrainerFlow(flowId);
      if (!(res as any)?.success) {
        throw new Error((res as any)?.message || 'Publish failed');
      }
      
             alert('Flow published successfully! Your trainer is now live and ready to use.');
       setFlowStatus('published');
      
    } catch (e) {
      const errorMessage = (e as Error)?.message || 'Publish failed';
      alert(`Publish failed: ${errorMessage}`);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selected) || null,
    [nodes, selected]
  );

  const getCanvasPos = useCallback(
    (evt: { clientX: number; clientY: number }) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const clientX = evt.clientX - rect.left;
      const clientY = evt.clientY - rect.top;
      return {
        x: (clientX - viewTranslate.x) / zoom,
        y: (clientY - viewTranslate.y) / zoom,
      };
    },
    [viewTranslate.x, viewTranslate.y, zoom]
  );



  const handleDragStart = (
    evt: React.DragEvent<HTMLButtonElement>,
    item: { type: NodeType; label?: string; color?: string }
  ) => {
    evt.dataTransfer.setData("application/node-type", item.type);
    evt.dataTransfer.setData("text/plain", item.type);
  };

  const handleDrop = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    const type = evt.dataTransfer.getData("application/node-type");
    if (!type) return;
    const { x, y } = getCanvasPos(evt);
    const id = nextId();
    const label = prettyLabelForType(type as NodeType) + " " + id.toUpperCase();
    const size = sizeForType(type as NodeType);
    const initialMessages = defaultMessagesForType(type as NodeType);
    setNodes((n) => [
      ...n,
      {
        id,
        type: type as NodeType,
        label,
        x: x - size.w / 2,
        y: y - size.h / 2,
        w: size.w,
        h: size.h,
        data: {
          textDraft: initialMessages.join("\n"),
          messages: initialMessages,
          ...(type === "question" ? { keywords: [], errorMessage: "Sorry, I didn't catch that." } : {}),
          ...(type === "decision" ? { choices: ["A", "B"] } : {}),
        },
      },
    ]);
    setSelected(id);
  };

  const allowDrop = (evt: React.DragEvent<HTMLDivElement>) => evt.preventDefault();

  const onNodeMouseDown = (
    evt: React.MouseEvent<HTMLDivElement>,
    node: FlowNode
  ) => {
    evt.stopPropagation();
    
    if (connectingFrom && connectingFrom !== node.id) {
      const edgeId = `e_${connectingFrom}_${node.id}_${Math.random().toString(36).slice(2, 7)}`;
      const fromNode = nodes.find((n) => n.id === connectingFrom);
      const defaultCondition = (() => {
        if (!fromNode) return { type: "auto" as const };
        if (fromNode.type === "decision") {
          const choices = fromNode.data.choices || ["A", "B"];
          const used = new Set(
            edges.filter((e) => e.from === connectingFrom && e.condition?.type === "decision").map((e) => e.condition?.choiceKey).filter(Boolean) as string[]
          );
          const nextChoice = choices.find((c) => !used.has(c));
          return { type: "decision" as const, choiceKey: nextChoice || choices[0] };
        }
        if (fromNode.type === "question") return { type: "question" as const, keywords: [] };
        return { type: "auto" as const };
      })();
      const defaultLabel = defaultCondition.type === "auto" ? "Auto" : defaultCondition.type === "decision" ? (defaultCondition.choiceKey || "Choice") : "Keywords";
      setEdges((es) =>
        es.some((e) => e.from === connectingFrom && e.to === node.id)
          ? es
          : [...es, { id: edgeId, from: connectingFrom, to: node.id, label: defaultLabel, condition: defaultCondition, comment: "" }]
      );
      setConnectingFrom(null);
      return;
    }
    
    const { x, y } = getCanvasPos(evt);
    setDragging({ id: node.id, offsetX: x - node.x, offsetY: y - node.y });
    setSelected(node.id);
    if (!isMobile) {
      setShowProperties(true);
    }
    setPendingClickNodeId(node.id);
    setDownPos({ x, y });
  };

  const onCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.button === 1 || e.button === 0) && !dragging) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      viewStartRef.current = { ...viewTranslate };
    }
  };

  const isNodeOverlapping = (node1: FlowNode, node2: FlowNode) => {
    const margin = 30;
    const overlap = (
      node1.x < node2.x + node2.w + margin &&
      node1.x + node1.w + margin > node2.x &&
      node1.y < node2.y + node2.h + margin &&
      node1.y + node1.h + margin > node2.y
    );
    
    if (overlap) {
      console.log('Nodes overlapping:', {
        node1: { id: node1.id, x: node1.x, y: node1.y, w: node1.w, h: node1.h },
        node2: { id: node2.id, x: node2.x, y: node2.y, w: node2.w, h: node2.h },
        margin
      });
    }
    
    return overlap;
  };

  const getDefaultCondition = (nodeType: NodeType) => {
    switch (nodeType) {
      case "decision":
        return { type: "decision" as const, choiceKey: "A" };
      case "question":
        return { type: "question" as const, keywords: [] };
      default:
        return { type: "auto" as const };
    }
  };

  const getDefaultLabel = (condition: { type: "auto" | "decision" | "question"; choiceKey?: string; keywords?: string[] }) => {
    switch (condition.type) {
      case "auto":
        return "Auto";
      case "decision":
        return condition.choiceKey || "Choice";
      case "question":
        return "Keywords";
      default:
        return "Auto";
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging) {
      const { x, y } = getCanvasPos(e);
      setNodes((prev) =>
        prev.map((n) => (n.id === dragging.id ? { ...n, x: x - dragging.offsetX, y: y - dragging.offsetY } : n))
      );
      
      setMousePos({ x, y });
      return;
    }
    
    if (!isPanning || !panStartRef.current || !viewStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setViewTranslate({
      x: viewStartRef.current.x + dx,
      y: viewStartRef.current.y + dy,
    });
  };

  const onMouseUp = () => {
    if (dragging) {
      console.log('Mouse up - checking for automatic connections...');
      const draggedNode = nodes.find(n => n.id === dragging.id);
      
      if (draggedNode) {
        console.log('Dragged node:', draggedNode);
        const nearbyNodes = nodes.filter(n => n.id !== dragging.id);
        console.log('Nearby nodes:', nearbyNodes);
        
        for (const nearbyNode of nearbyNodes) {
          const isOverlapping = isNodeOverlapping(draggedNode, nearbyNode);
          console.log(`Checking overlap with ${nearbyNode.id}:`, isOverlapping);
          
          if (isOverlapping) {
            console.log('Nodes overlap! Creating connection...');
            const edgeId = `e_${draggedNode.id}_${nearbyNode.id}_${Math.random().toString(36).slice(2, 7)}`;
            const defaultCondition = getDefaultCondition(draggedNode.type);
            const defaultLabel = getDefaultLabel(defaultCondition);
            
            const connectionExists = edges.some(e => 
              (e.from === draggedNode.id && e.to === nearbyNode.id) ||
              (e.from === nearbyNode.id && e.to === draggedNode.id)
            );
            
            if (!connectionExists) {
              console.log('Creating new connection:', { from: draggedNode.id, to: nearbyNode.id, label: defaultLabel });
              setEdges((es) => [...es, { 
                id: edgeId, 
                from: draggedNode.id, 
                to: nearbyNode.id, 
                label: defaultLabel, 
                condition: defaultCondition,
                comment: ""
              }]);
            } else {
              console.log('Connection already exists');
            }
            break;
          }
        }
      }
      
      setDragging(null);
      setPendingClickNodeId(null);
      setDownPos(null);
    }
    
    setIsPanning(false);
    panStartRef.current = null;
    viewStartRef.current = null;
  };

  const onTouchMove = (evt: React.TouchEvent<HTMLDivElement>) => {
    evt.preventDefault();
    const touch = evt.touches[0];
    const pos = getCanvasPos({ clientX: touch.clientX, clientY: touch.clientY });
    setMousePos(pos);
    if (downPos && pendingClickNodeId) {
      const dx = pos.x - downPos.x;
      const dy = pos.y - downPos.y;
      if (dx * dx + dy * dy > 36) {
        setPendingClickNodeId(null);
      }
    }
    if (!dragging) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === dragging.id ? { ...n, x: pos.x - dragging.offsetX, y: pos.y - dragging.offsetY } : n))
    );
  };

  const onTouchEnd = () => {
    if (dragging) {
      console.log('Touch end - checking for automatic connections...');
      const draggedNode = nodes.find(n => n.id === dragging.id);
      
      if (draggedNode) {
        console.log('Dragged node (touch):', draggedNode);
        const nearbyNodes = nodes.filter(n => n.id !== dragging.id);
        console.log('Nearby nodes (touch):', nearbyNodes);
        
        for (const nearbyNode of nearbyNodes) {
          const isOverlapping = isNodeOverlapping(draggedNode, nearbyNode);
          console.log(`Checking overlap with ${nearbyNode.id} (touch):`, isOverlapping);
          
          if (isOverlapping) {
            console.log('Nodes overlap (touch)! Creating connection...');
            const edgeId = `e_${draggedNode.id}_${nearbyNode.id}_${Math.random().toString(36).slice(2, 7)}`;
            const defaultCondition = getDefaultCondition(draggedNode.type);
            const defaultLabel = getDefaultLabel(defaultCondition);
            
            const connectionExists = edges.some(e => 
              (e.from === draggedNode.id && e.to === nearbyNode.id) ||
              (e.from === nearbyNode.id && e.to === draggedNode.id)
            );
            
            if (!connectionExists) {
              console.log('Creating new connection (touch):', { from: draggedNode.id, to: nearbyNode.id, label: defaultLabel });
              setEdges((es) => [...es, { 
                id: edgeId, 
                from: draggedNode.id, 
                to: nearbyNode.id, 
                label: defaultLabel, 
                condition: defaultCondition,
                comment: ""
              }]);
            } else {
              console.log('Connection already exists (touch)');
            }
            break;
          }
        }
      }
    }
    
    if (pendingClickNodeId && isMobile) {
      setShowPalette(false);
      setShowProperties(true);
    }
    setPendingClickNodeId(null);
    setDownPos(null);
    setDragging(null);
  };

  const removeSelected = useCallback(() => {
    if (!selected) return;
    setEdges((es) => es.filter((e) => e.from !== selected && e.to !== selected));
    setNodes((ns) => ns.filter((n) => n.id !== selected));
    setSelected(null);
  }, [selected]);

  const keyHandler = useCallback(
    (evt: KeyboardEvent) => {
      const target = evt.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      
      if (evt.key === "Delete" || evt.key === "Backspace") removeSelected();
      if ((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "e") {
        evt.preventDefault();
        downloadJSON();
      }
      if ((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "s") {
        evt.preventDefault();
        manualSave();
      }
      if (evt.key === "c" && !connectingFrom) {
        evt.preventDefault();
        if (selected) {
          setConnectingFrom(selected);
        }
      }
      if (evt.key === "Escape" && connectingFrom) {
        evt.preventDefault();
        setConnectingFrom(null);
      }
    },
    [removeSelected, connectingFrom, selected]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [keyHandler]);

  useEffect(() => {
    if (nodes.length === 0) {
      const startId = nextId();
      const startSize = sizeForType("start");
      setNodes([
        {
          id: startId,
          type: "start",
          label: "Start " + startId.toUpperCase(),
          x: 120,
          y: 160,
          w: startSize.w,
          h: startSize.h,
          data: { textDraft: "Welcome!", messages: ["Welcome to the flow."] },
        },
      ]);
      setEdges([]);
      setSelected(null);
      setConnectingFrom(null);
    }
  }, [nodes.length]);

  const downloadJSON = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trainer_flow.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result;
        if (typeof result !== "string") throw new Error("Invalid file content");
        const data = JSON.parse(result);
        setNodes((data.nodes as FlowNode[]) || []);
        setEdges((data.edges as FlowEdge[]) || []);
        setSelected(null);
        setConnectingFrom(null);
      } catch (e) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const updateSelectedNodeData = (partial: Partial<NodeData>) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, ...partial } } : n))
    );
  };

  const onDraftChange = (val: string) => {
    const messages = normalizeDraftToMessages(val);
    updateSelectedNodeData({ textDraft: val, messages });
  };

  const edgeLines = useMemo(() => {
    const lookup: Record<string, FlowNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));
    return edges
      .map((e) => {
        const a = lookup[e.from];
        const b = lookup[e.to];
        if (!a || !b) return null;
        const p1 = centerOf(a);
        const p2 = centerOf(b);
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        return (
          <g key={e.id}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} strokeWidth={2} markerEnd="url(#arrow)" className="stroke-slate-600" />
            {e.label ? (
              <text x={mid.x} y={mid.y - 4} textAnchor="middle" className="fill-slate-700" style={{ fontSize: 10 }}>{e.label}</text>
            ) : null}
          </g>
        );
      })
      .filter(Boolean);
  }, [edges, nodes]);

  const tempEdge = useMemo(() => {
    if (!connectingFrom) return null;
    const a = nodes.find((n) => n.id === connectingFrom);
    if (!a) return null;
    const p1 = centerOf(a);
    const p2 = mousePos;
    return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} strokeWidth={1.5} strokeDasharray="4 4" markerEnd="url(#arrow)" className="stroke-slate-400" />;
  }, [connectingFrom, nodes, mousePos]);

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex flex-col overflow-hidden">
        <div className="bg-white border-b border-[#e2e8f0] px-4 md:px-8 py-1 shadow-sm flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <img src={logo} alt="ChatTrain Logo" className="w-auto" style={{height: '80px'}} />
            </Link>
            <span className="text-[#cbd5e1]">/</span>
            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-base md:text-xl lg:text-2xl font-bold text-[#313F4E] tracking-tight heading-font">
                  Training Track Designer
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[#64748b] text-lg hidden sm:inline">•</span>
                  <Input
                    type="text"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className="text-sm md:text-lg font-semibold bg-transparent border-0 focus:ring-2 focus:ring-[#0B3A6F] px-2 py-1"
                    placeholder="Enter trainer name..."
                  />
                  {flowStatus && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      flowStatus === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {flowStatus === 'published' ? 'Published' : 'Draft'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {!isMobile && (<></>)}
          {isMobile && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPalette(!showPalette)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
                  showPalette 
                    ? 'bg-[#40B1DF] text-white' 
                    : 'bg-white border border-[#e2e8f0] text-[#313F4E] hover:bg-[#f8fafc]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Palette</span>
              </button>
              <button
                onClick={() => setShowProperties(!showProperties)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
                  showProperties 
                    ? 'bg-[#40B1DF] text-white' 
                    : 'bg-white border border-[#e2e8f0] text-[#313F4E] hover:bg-[#f8fafc]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Properties</span>
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] hover:border-[#40B1DF] transition-colors font-medium text-[#313F4E]"
              title="Export flow (Ctrl/Cmd + E)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
            <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] hover:border-[#40B1DF] transition-colors cursor-pointer font-medium text-[#313F4E]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} className="hidden" />
            </label>
            <button
              onClick={() => {
                setNodes([]);
                setEdges([]);
                setSelected(null);
                setConnectingFrom(null);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-[#e2e8f0] rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={manualSave}
              className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white h-10 md:h-12 px-4 md:px-6 text-sm hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
              title="Save flow (Ctrl/Cmd + S)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">{isSaving ? 'Saving…' : 'Save Flow'}</span>
            </button>
            <button
              onClick={handleValidate}
              className="inline-flex items-center gap-3 rounded-xl bg-white border border-[#e2e8f0] text-[#313F4E] h-10 md:h-12 px-4 md:px-6 text-sm hover:bg-[#f8fafc] transition-all duration-200 font-medium"
              title="Validate flow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">{isValidating ? 'Validating…' : 'Validate'}</span>
            </button>
            <button
              onClick={handlePublish}
              disabled={isValidating}
              className={`inline-flex items-center gap-3 rounded-xl h-10 md:h-12 px-4 md:px-6 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                isValidating
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  : 'bg-[#313F4E] text-white hover:bg-[#2a3542]'
              }`}
              title={isValidating ? "Validating and publishing..." : "Publish flow"}
            >
              {isValidating ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
              <span className="hidden sm:inline">{isValidating ? 'Publishing...' : 'Publish'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {!isMobile && !showPalette && (
          <button
            onClick={() => setShowPalette(true)}
            className="absolute left-2 z-30 flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors font-medium bg-white border border-[#e2e8f0] text-[#313F4E] hover:bg-[#f8fafc] shadow"
            title="Show Node Palette"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden lg:inline">Node Palette</span>
          </button>
        )}
        {isMobile && (showPalette || showProperties) && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowPalette(false);
              setShowProperties(false);
            }}
          />
        )}
        <aside className={`${
          isMobile 
            ? (showPalette ? 'fixed inset-0 z-50 w-full' : 'hidden')
            : (showPalette ? 'w-72' : 'w-0 hidden')
        } border-r border-[#e2e8f0] bg-white shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.03)] backdrop-blur-sm flex flex-col overflow-hidden`}>
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] bg-white">
              <h2 className="text-lg font-semibold text-[#313F4E] heading-font">
                Node Palette
              </h2>
              <button
                onClick={() => setShowPalette(false)}
                className="p-2 text-[#64748b] hover:text-[#313F4E] hover:bg-[#f8fafc] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="p-6 border-b border-[#e2e8f0] flex-shrink-0 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#313F4E] flex items-center gap-2 heading-font">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Node Palette
            </h2>
            {!isMobile && (
              <button
                onClick={() => setShowPalette(false)}
                className="p-2 inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white h-10 md:h-12 px-4 md:px-6 text-sm hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                title="Hide Palette"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="p-4 md:p-6 flex flex-col gap-6 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              {PALETTE.map((item) => (
                <button
                  key={item.type}
                  draggable={!isMobile}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onClick={isMobile ? () => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      const rect = canvas.getBoundingClientRect();
                      const x = rect.width / 2 - 100;
                      const y = rect.height / 2 - 65;
                      const id = nextId();
                      const label = prettyLabelForType(item.type as NodeType) + " " + id.toUpperCase();
                      const size = sizeForType(item.type as NodeType);
                      const initialMessages = defaultMessagesForType(item.type as NodeType);
                      setNodes((n) => [
                        ...n,
                        {
                          id,
                          type: item.type as NodeType,
                          label,
                          x,
                          y,
                          w: size.w,
                          h: size.h,
                          data: {
                            textDraft: initialMessages.join("\n"),
                            messages: initialMessages,
                            ...(item.type === "question" ? { keywords: [], errorMessage: "Sorry, I didn't catch that." } : {}),
                            ...(item.type === "decision" ? { choices: ["A", "B"] } : {}),
                          },
                        },
                      ]);
                      setSelected(id);
                      setShowPalette(false);
                    }
                  } : undefined}
                  className='inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white text-sm hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium'
                  title={isMobile ? "Tap to add to canvas" : "Drag onto the canvas"}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xl md:text-2xl opacity-90">{getNodeIcon(item.type)}</span>
                    <span className="text-xs md:text-sm">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-br from-[#40B1DF]/10 to-[#40B1DF]/0 rounded-xl border border-[#40B1DF]/20">
              <h3 className="text-sm font-semibold text-[#313F4E] mb-3 flex items-center gap-2 heading-font">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Quick Tips
              </h3>
              <div className="space-y-2 text-xs text-[#64748b]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#40B1DF] rounded-full"></span>
                  <span>Drag nodes onto the canvas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#40B1DF] rounded-full"></span>
                  <span>Double click on a node to add a connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#40B1DF] rounded-full"></span>
                  <span>Use variables like {`{first_name}`}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main
          ref={canvasRef}
          onDrop={handleDrop}
          onDragOver={allowDrop}
          onMouseDown={onCanvasMouseDown}
          onDoubleClick={() => { if (!isMobile) setShowPalette(true); }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={handleWheel}
          className={`relative flex-1 overflow-auto bg-white bg-[radial-gradient(circle_at_1px_1px,rgba(64,177,223,0.05)_1px,transparent_0)] bg-[length:20px_20px] min-h-0 ${
            isMobile && (showPalette || showProperties) ? 'hidden' : ''
          }`}
        >     
          {validationErrors.length > 0 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="font-semibold text-sm">Validation Errors</div>
              </div>
              <ul className="list-disc pl-5 text-xs space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i} className="text-red-600">{err}</li>
                ))}
              </ul>
              <div className="mt-3 text-xs text-red-600">
                Fix these issues before publishing your flow.
              </div>
            </div>
          )}
          {isLoadingFlow ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#f8fafc]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#40B1DF] mx-auto mb-4"></div>
                <p className="text-[#64748b]">Loading flow...</p>
              </div>
            </div>
          ) : nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#f8fafc]">
              <div className="text-center max-w-md p-4 md:p-8">
                <div className="flex justify-center mb-4 md:mb-6">
                  <div className="relative">
                    <svg className="w-16 h-16 md:w-24 md:h-24 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <div className="absolute inset-0 flex justify-center opacity-20">
                      <svg className="w-16 h-16 md:w-24 md:h-24 text-[#40B1DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#313F4E] mb-3 md:mb-4 heading-font">Start Building Your Flow</h3>
                <p className="text-[#64748b] text-base md:text-lg leading-relaxed mb-6 md:mb-8">
                  {isMobile 
                    ? "Tap the Palette button to add nodes to your canvas"
                    : "Drag nodes from the palette onto the canvas to create your conversational training flow"
                  }
                </p>
                <div className="flex items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-[#64748b] flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#40B1DF] rounded-full animate-pulse"></span>
                    <span>{isMobile ? "Tap to Add" : "Drag & Drop"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#40B1DF] rounded-full animate-pulse"></span>
                    <span>Connect Nodes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></span>
                    <span>Test & Deploy</span>
                  </div>
                </div>
                
                <div className="mt-6 md:mt-8 p-4 md:p-6 bg-white/50 rounded-lg border border-[#e2e8f0] max-w-md mx-auto">
                  <h4 className="text-sm md:text-base font-semibold text-[#313F4E] mb-3 heading-font">How to Connect Nodes:</h4>
                  <div className="space-y-2 text-xs md:text-sm text-[#64748b]">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#40B1DF] rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Double-click</strong> any node to start a connection</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#40B1DF] rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Click</strong> another node to complete the connection</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Press 'C'</strong> on selected node to start connection</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Press 'Escape'</strong> to cancel connection mode</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Drag & Drop</strong> nodes over each other to auto-connect</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>No Plus Button</strong> - connections work directly with nodes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div style={{
              transform: `translate(${viewTranslate.x}px, ${viewTranslate.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: "100%",
              height: "100%",
              position: "relative",
            }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" className="fill-slate-600" />
                </marker>
              </defs>
              {edgeLines}
              {tempEdge}
            </svg>

          {nodes.map((node) => (
              <NodeView
                key={node.id}
                node={node}
                selected={selected === node.id}
                connectingFrom={connectingFrom}
                onMouseDown={onNodeMouseDown}
                setConnectingFrom={setConnectingFrom}
              />
            ))}
            
            {isMobile && nodes.length === 0 && (
              <div className="fixed bottom-6 right-6 z-40">
                <button
                  onClick={() => setShowPalette(true)}
                  className="bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            )}
            
            {connectingFrom && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Connection Mode: Click on another node to connect (no + button needed)</span>
                <button
                  onClick={() => setConnectingFrom(null)}
                  className="ml-2 p-1 hover:bg-green-600 rounded transition-colors"
                  title="Cancel connection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
              </div>
            )}
            
            {dragging && (
              <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  {(() => {
                    const draggedNode = nodes.find(n => n.id === dragging.id);
                    if (draggedNode) {
                      const nearbyNodes = nodes.filter(n => n.id !== dragging.id);
                      const overlappingNode = nearbyNodes.find(n => isNodeOverlapping(draggedNode, n));
                      if (overlappingNode) {
                        return `Release to connect with "${overlappingNode.label}"`;
                      }
                    }
                    return "Drag over another node to auto-connect";
                  })()}
                </span>
              </div>
            )}
          </div>
        </main>

        <aside className={`${
          isMobile 
            ? showProperties 
              ? 'fixed inset-0 z-50 w-full' 
              : 'hidden'
            : (showProperties && selectedNode ? 'w-[340px]' : 'w-0 hidden')
        } border-l border-[#e2e8f0] bg-white shadow-[inset_1px_0_0_0_rgba(255,255,255,0.03)] backdrop-blur-sm flex flex-col overflow-hidden`}>
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] bg-white">
              <h2 className="text-lg font-semibold text-[#313F4E] heading-font">
                Node Properties
              </h2>
              <button
                onClick={() => setShowProperties(false)}
                className="p-2 text-[#64748b] hover:text-[#313F4E] hover:bg-[#f8fafc] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="p-6 border-b border-[#e2e8f0] flex-shrink-0 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#313F4E] flex items-center gap-2 heading-font">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Node Properties
            </h2>
            {!isMobile && (
              <button
                onClick={() => setShowProperties(false)}
                className="p-2 inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white h-10 md:h-12 px-4 md:px-6 text-sm hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                title="Hide Properties"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="p-4 md:p-6 flex flex-col gap-6 overflow-y-auto flex-1 bg-[#f8fafc] min-h-0">
          {!selectedNode ? (
            <div className="text-center py-8 md:py-16">
              <div className="relative mb-4 md:mb-6">
                <div className="flex justify-center mb-3 md:mb-4">
                  <svg className="w-16 h-16 md:w-20 md:h-20 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="absolute inset-0 flex justify-center opacity-20">
                  <svg className="w-16 h-16 md:w-20 md:h-20 text-[#40B1DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-[#313F4E] mb-2 md:mb-3 heading-font">No Node Selected</h3>
              <p className="text-[#64748b] text-sm md:text-base leading-relaxed max-w-sm mx-auto px-4">
                {isMobile 
                  ? "Tap on any node in the canvas to configure its properties"
                  : "Click on any node in the canvas to configure its properties, messages, and behavior"
                }
              </p>
            </div>
          ) : (
            <NodeProperties
              node={selectedNode}
              onChangeDraft={onDraftChange}
              onRelabel={(newLabel) =>
                setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, label: newLabel } : n)))
              }
              onDelete={removeSelected}
              onChangeData={(partial) => updateSelectedNodeData(partial)}
              edgesFromNode={edges.filter((e) => e.from === selectedNode.id)}
              onUpdateEdge={(edgeId, update) =>
                setEdges((prev) => prev.map((e) => (e.id === edgeId ? { ...e, ...update } : e)))
              }
              onDeleteEdge={(edgeId) => setEdges((prev) => prev.filter((e) => e.id !== edgeId))}
              resolveLabel={(nodeId) => nodes.find((n) => n.id === nodeId)?.label || nodeId}
            />
          )}
          </div>
        </aside>
      </div>
    </div>
  );
}

interface NodePropertiesProps {
  node: FlowNode;
  onChangeDraft: (val: string) => void;
  onRelabel: (label: string) => void;
  onDelete: () => void;
  onChangeData: (partial: Partial<NodeData>) => void;
  edgesFromNode: FlowEdge[];
  onUpdateEdge: (edgeId: string, update: Partial<FlowEdge>) => void;
  onDeleteEdge: (edgeId: string) => void;
  resolveLabel: (nodeId: string) => string;
}

function NodeProperties({ node, onChangeDraft, onRelabel, onDelete, onChangeData, edgesFromNode, onUpdateEdge, onDeleteEdge, resolveLabel }: NodePropertiesProps) {
  const [messageCount, setMessageCount] = useState(node.data.messages.length);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const [keywordInputByEdge, setKeywordInputByEdge] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const currentCount = node.data.messages.length;
    if (currentCount > messageCount) {
      setShowNewMessageIndicator(true);
      setTimeout(() => setShowNewMessageIndicator(false), 3000); 
    }
    setMessageCount(currentCount);
  }, [node.data.messages.length, messageCount]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-[#0B3A6F] mb-2">Node Label</label>
        <Input
          type="text"
          value={node.label}
          onChange={(e) => onRelabel(e.target.value)}
          className="w-full px-4 py-3 text-sm"
          placeholder="Enter node label..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#313F4E] mb-2">Node Type</label>
        <div className="px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm text-[#64748b]">
          {prettyLabelForType(node.type)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-[#313F4E]">End‑user Messages</label>
          <button
            onClick={() => {
              const newMessages = [...node.data.messages, ""];
              onChangeDraft(newMessages.join("\n"));
            }}
            style={{fontSize: '12px'}}
            className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white h-10 md:h-12 px-4 md:px-6 text-sm hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium py-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Message</span>
          </button>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {node.data.messages.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-[#e2e8f0]">
              <div className="flex justify-center mb-3">
                <svg className="w-12 h-12 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-[#64748b] font-medium">No messages yet</p>
              <p className="text-xs text-[#64748b] mt-1">Click "Add Message" to get started</p>
            </div>
          )}
          {node.data.messages.map((message, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                type="text"
                value={message}
                onChange={(e) => {
                  const newMessages = [...node.data.messages];
                  newMessages[idx] = e.target.value;
                  onChangeDraft(newMessages.join("\n"));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const newMessages = [...node.data.messages];
                    newMessages.splice(idx + 1, 0, "");
                    onChangeDraft(newMessages.join("\n"));
                    setTimeout(() => {
                      const inputs = document.querySelectorAll('input[data-index]');
                      const nextInput = inputs[idx + 1] as HTMLInputElement;
                      if (nextInput) nextInput.focus();
                    }, 0);
                  }
                }}
                data-index={idx}
                className="flex-1 px-3 py-2 text-sm"
                placeholder="Enter message..."
              />
              <button
                onClick={() => {
                  const newMessages = node.data.messages.filter((_, i) => i !== idx);
                  onChangeDraft(newMessages.join("\n"));
                }}
                className="p-2 inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white h-10 md:h-12 px-4 md:px-6 text-sm hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                title="Remove message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {node.type === "image" && (
        <div>
          <label className="block text-sm font-semibold text-[#313F4E] mb-2">Image</label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={node.data.messages[0] || ""}
                onChange={(e) => {
                  const newMessages = [...node.data.messages];
                  newMessages[0] = e.target.value;
                  onChangeDraft(newMessages.join("\n"));
                }}
                className="flex-1 px-3 py-2 text-sm"
                placeholder="Image URL (will be set after upload)"
              />
              <label className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>{isUploading ? 'Uploading…' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setIsUploading(true);
                      const res = await apiService.uploadContentFiles([file]);
                      const first = res.data?.files?.[0];
                      if (first?.publicUrl) {
                        const url = first.publicUrl;
                        const newMessages = [...node.data.messages];
                        newMessages[0] = `Image URL: ${url}`;
                        if (!newMessages[1]) newMessages[1] = "Alt: Descriptive text";
                        onChangeDraft(newMessages.join("\n"));
                      }
                    } catch (err) {
                      alert((err as Error).message || 'Upload failed');
                    } finally {
                      setIsUploading(false);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </label>
            </div>
            {(() => {
              const urlLine = node.data.messages[0] || "";
              const match = urlLine.match(/https?:[^\s]+\.(png|jpg|jpeg|gif|webp|svg)/i) || urlLine.match(/https?:[^\s]+/i);
              const imgUrl = match ? match[0].replace(/^Image URL:\s*/i, '') : '';
              return imgUrl ? (
                <div className="border border-[#e2e8f0] rounded-lg p-2 bg-white">
                  <img src={imgUrl} alt={(node.data.messages[1] || '').replace(/^Alt:\s*/i, '') || 'Uploaded image'} className="max-h-40 object-contain mx-auto" />
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {node.type === "decision" && (
        <div>
          <label className="block text-sm font-semibold text-[#313F4E] mb-2">Decision Choices</label>
          <div className="space-y-2">
            {(node.data.choices || []).map((choice, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={choice}
                  onChange={(e) => {
                    const newChoices = [...(node.data.choices || [])];
                    newChoices[idx] = e.target.value;
                    onChangeData({ choices: newChoices });
                  }}
                  className="flex-1 px-3 py-2 text-sm"
                  placeholder={`Choice ${idx + 1}`}
                />
                <button
                  onClick={() => {
                    const newChoices = (node.data.choices || []).filter((_, i) => i !== idx);
                    onChangeData({ choices: newChoices });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors hover:text-red-600"
                  title="Remove choice"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newChoices = [...(node.data.choices || []), String.fromCharCode(65 + (node.data.choices?.length || 0))];
                onChangeData({ choices: newChoices });
              }}
              className="text-sm bg-white border border-[#e2e8f0] px-3 py-2 rounded-lg hover:bg-[#f8fafc]"
            >
              Add Choice
            </button>
          </div>
        </div>
      )}

      {node.type === "question" && (
        <div>
          <div>
            <label className="block text-sm font-semibold text-[#0B3A6F] mb-1">Error message</label>
            <Input
              type="text"
              value={node.data.errorMessage || "Sorry, I didn't catch that."}
              onChange={(e) => onChangeData({ errorMessage: e.target.value })}
              className="w-full px-3 py-2 text-sm"
              placeholder="Shown if user input doesn't match condition"
            />
          </div>
        </div>
      )}

      {node.type === "feedback" && (
        <div>
          <label className="block text-sm font-semibold text-[#313F4E] mb-2">Feedback Messages</label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Correct Answer Feedback</label>
              <Input
                type="text"
                value={node.data.messages[0] || "That's correct! Well done."}
                onChange={(e) => {
                  const newMessages = [...node.data.messages];
                  newMessages[0] = e.target.value;
                  onChangeDraft(newMessages.join("\n"));
                }}
                className="w-full px-3 py-2 text-sm"
                placeholder="Message shown for correct answers"
              />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Incorrect Answer Feedback</label>
              <Input
                type="text"
                value={node.data.messages[1] || "Not quite right. Here's the correct answer..."}
                onChange={(e) => {
                  const newMessages = [...node.data.messages];
                  newMessages[1] = e.target.value;
                  onChangeDraft(newMessages.join("\n"));
                }}
                className="w-full px-3 py-2 text-sm"
                placeholder="Message shown for incorrect answers"
              />
            </div>
          </div>
        </div>
      )}

      {node.type === "assessment" && (
        <div>
          <label className="block text-sm font-semibold text-[#313F4E] mb-2">Assessment Settings</label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Passing Score (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={node.data.passingScore || 70}
                onChange={(e) => onChangeData({ passingScore: parseInt(e.target.value) || 70 })}
                className="w-full px-3 py-2 text-sm"
                placeholder="Minimum score to pass"
              />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Time Limit (minutes)</label>
              <Input
                type="number"
                min="0"
                value={node.data.timeLimit || 30}
                onChange={(e) => onChangeData({ timeLimit: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 text-sm"
                placeholder="Assessment time limit"
              />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Pass Message</label>
              <Input
                type="text"
                value={node.data.messages[0] || "Congratulations! You passed the assessment."}
                onChange={(e) => {
                  const newMessages = [...node.data.messages];
                  newMessages[0] = e.target.value;
                  onChangeDraft(newMessages.join("\n"));
                }}
                className="w-full px-3 py-2 text-sm"
                placeholder="Message shown when user passes"
              />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Fail Message</label>
              <Input
                type="text"
                value={node.data.messages[1] || "You didn't meet the passing score. Please review and try again."}
                onChange={(e) => {
                  const newMessages = [...node.data.messages];
                  newMessages[1] = e.target.value;
                  onChangeDraft(newMessages.join("\n"));
                }}
                className="w-full px-3 py-2 text-sm"
                placeholder="Message shown when user fails"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-[#313F4E] mb-2">Transitions</label>
        {edgesFromNode.length === 0 ? (
          <div className="text-xs text-[#64748b]">No outgoing connections</div>
        ) : (
          <div className="space-y-3">
            {edgesFromNode.map((edge) => (
              <div key={edge.id} className="bg-white border border-[#e2e8f0] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[#64748b]">to → <span className="font-medium text-[#313F4E]">{resolveLabel(edge.to)}</span></div>
                  <button
                    onClick={() => onDeleteEdge(edge.id)}
                    className=" inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white h-10 md:h-12 px-4 md:px-6 text-sm hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 
                    transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium
                    hover:text-red-600"
                  >Remove</button>
                </div>
                <div className="">
                  <div className="col-span-1">
                    <label className="block text-[11px] text-[#64748b] mb-1">Condition</label>
                    <select
                      className="w-full px-2 py-2 border border-[#e2e8f0] rounded"
                      value={edge.condition?.type || "auto"}
                      onChange={(e) => {
                        const t = e.target.value as "auto" | "decision" | "question";
                        const base: any = { type: t };
                        if (t === "decision") base.choiceKey = (node.data.choices || ["A","B"])[0];
                        if (t === "question") base.keywords = [];
                        onUpdateEdge(edge.id, { condition: base, label: t === "auto" ? "Auto" : t === "decision" ? (base.choiceKey || "Choice") : "Keywords" });
                      }}
                    >
                      <option value="auto">Auto</option>
                      <option value="decision">Decision</option>
                      <option value="question">Question</option>
                    </select>
                  </div>

                  {edge.condition?.type === "decision" && (
                    <div className="col-span-1">
                      <label className="block text-[11px] text-[#64748b] mb-1">Choice</label>
                      <select
                        className="w-full px-2 py-2 border border-[#e2e8f0] rounded"
                        value={edge.condition.choiceKey || ""}
                        onChange={(e) => {
                          onUpdateEdge(edge.id, { condition: { ...(edge.condition || { type: "decision" }), type: "decision", choiceKey: e.target.value }, label: e.target.value });
                        }}
                      >
                        {(node.data.choices || ["A","B"]).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {edge.condition?.type === "question" && (
                    <div className="col-span-2">
                      <label className="block text-[11px] text-[#64748b] mb-1">Keywords</label>
                      <div className="w-full border border-[#e2e8f0] rounded px-2 py-2 bg-white">
                        <div className="flex flex-wrap gap-2">
                          {(edge.condition.keywords || []).map((kw, i) => (
                            <span key={`${kw}-${i}`} className="inline-flex items-center gap-1 bg-[#f1f5f9] text-[#313F4E] text-[11px] px-2 py-1 rounded">
                              {kw}
                              <button
                                className="inline-flex items-center justify-center w-5 h-5 text-[12px] md:text-[14px] leading-none text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Remove keyword"
                                onClick={() => {
                                  const updated = (edge.condition?.keywords || []).filter((_, idx) => idx !== i);
                                  onUpdateEdge(edge.id, { condition: { ...(edge.condition || { type: "question" }), type: "question", keywords: updated }, label: updated.length ? `Keywords: ${updated.join('/')}` : "Keywords" });
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            className="flex-1 min-w-[120px] px-2 py-1 text-sm outline-none"
                            placeholder="Type a keyword and press Enter"
                            value={keywordInputByEdge[edge.id] || ""}
                            onChange={(e) => setKeywordInputByEdge((prev) => ({ ...prev, [edge.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const value = (keywordInputByEdge[edge.id] || '').trim();
                                if (!value) return;
                                const current = edge.condition?.keywords || [];
                                const updated = [...current, value];
                                onUpdateEdge(edge.id, { condition: { ...(edge.condition || { type: "question" }), type: "question", keywords: updated }, label: `Keywords: ${updated.join('/')}` });
                                setKeywordInputByEdge((prev) => ({ ...prev, [edge.id]: "" }));
                              }
                              if (e.key === 'Backspace' && (keywordInputByEdge[edge.id] || '').length === 0) {
                                const current = edge.condition?.keywords || [];
                                if (current.length > 0) {
                                  const updated = current.slice(0, -1);
                                  onUpdateEdge(edge.id, { condition: { ...(edge.condition || { type: "question" }), type: "question", keywords: updated }, label: updated.length ? `Keywords: ${updated.join('/')}` : "Keywords" });
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-[11px] text-[#64748b] mb-1">Comment</label>
                    <input
                      type="text"
                      className="w-full px-2 py-2 border border-[#e2e8f0] rounded"
                      value={edge.comment || ""}
                      onChange={(e) => onUpdateEdge(edge.id, { comment: e.target.value })}
                      placeholder="Add a note about this connection"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-[#64748b]">Live Preview</p>
          {showNewMessageIndicator && (
            <span className="text-xs text-[#10b981] font-medium animate-pulse">✨ New message created!</span>
          )}
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 max-h-48 overflow-y-auto">
          {node.data.messages.length === 0 ? (
            <p className="text-sm text-[#64748b] italic">No messages to preview</p>
          ) : (
            <div className="space-y-2">
              {node.data.messages.map((line, idx) => (
                <div
                  key={idx}
                  className={`text-sm px-3 py-2 rounded-2xl transition-all duration-300 ${
                    showNewMessageIndicator && idx === node.data.messages.length - 1
                      ? 'bg-[#10b981]/10 border border-[#10b981]/30 animate-pulse'
                      : 'bg-[#f8fafc]'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2 text-[#40B1DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {line || <span className="italic text-[#64748b]">(empty line)</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#313F4E] mb-2">Available Variables</label>
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
          <p className="text-xs text-[#64748b] mb-3">Click to insert into your messages:</p>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
            {["first_name", "last_name", "email", "company", "role", "department"].map((variable) => (
              <button
                key={variable}
                onClick={() => {
                  const focusedInput = document.querySelector('input:focus') as HTMLInputElement;
                  if (focusedInput) {
                    const start = focusedInput.selectionStart || 0;
                    const end = focusedInput.selectionEnd || 0;
                    const value = focusedInput.value;
                    const newValue = value.substring(0, start) + `{${variable}}` + value.substring(end);
                    focusedInput.value = newValue;
                    
                    const index = parseInt(focusedInput.getAttribute('data-index') || '0');
                    const newMessages = [...node.data.messages];
                    newMessages[index] = newValue;
                    onChangeDraft(newMessages.join("\n"));
                    
                    setTimeout(() => {
                      focusedInput.focus();
                      focusedInput.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
                    }, 0);
                  }
                }}
                className="text-xs inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] 
                to-[#40B1DF] text-white h-10 md:h-12 px-4 md:px-6 hover:from-[#40B1DF]/90
                hover:to-[#40B1DF]/80 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
              >
                {`{${variable}}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#313F4E] mb-2">Type Hints</label>
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
          <p className="text-xs text-[#64748b] mb-3">This node type supports:</p>
          <div className="space-y-2">
            {getTypeHints(node.type).map((hint: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#40B1DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-[#64748b]">{hint}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white h-10 md:h-12 px-4 md:px-6 text-sm hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium py-2"
          title="Delete this node (or press Delete/Backspace)"
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Node
        </button>
      </div>
    </div>
  );
}

function NodeView({ node, selected, connectingFrom, onMouseDown, setConnectingFrom }: { node: FlowNode; selected: boolean; connectingFrom: string | null; onMouseDown: (e: React.MouseEvent<HTMLDivElement>, node: FlowNode) => void; setConnectingFrom: (id: string | null) => void }) {
  const shape = shapeForType(node.type);

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, node)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!connectingFrom || connectingFrom !== node.id) {
          setConnectingFrom(node.id);
        }
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        const mouseEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          stopPropagation: () => e.stopPropagation(),
        } as React.MouseEvent<HTMLDivElement>;
        onMouseDown(mouseEvent, node);
      }}
      className={`absolute group select-none transition-transform hover:scale-105 ${
        connectingFrom && connectingFrom !== node.id 
          ? 'cursor-pointer' 
          : 'cursor-grab active:cursor-grabbing'
      }`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      title={
        connectingFrom && connectingFrom !== node.id
          ? "Click to connect to this node"
          : connectingFrom === node.id
          ? "Click another node to finish connection"
          : "Click to select, double-click to start connection, drag to move"
      }
    >
      <div className={`relative h-full w-full rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 ${shape.bg} overflow-hidden border-2 border-white/20 ${
        selected ? 'ring-4 ring-[#40B1DF] ring-opacity-50' : ''
      } ${
        connectingFrom && connectingFrom !== node.id ? 'ring-2 ring-green-400 ring-opacity-70 shadow-lg shadow-green-400/30' : ''
      } ${
        connectingFrom === node.id ? 'ring-2 ring-blue-400 ring-opacity-80 shadow-lg shadow-blue-400/40' : ''
      }`}>
        {shape.inner()}
        <div className="absolute inset-0 p-3 md:p-4 text-white drop-shadow flex flex-col">
          <div className="font-bold text-xs md:text-sm mb-1 md:mb-2 truncate">{node.label}</div>
          <div className="flex-1 text-xs space-y-1 md:space-y-2 overflow-hidden">
            {(node.data?.messages || []).slice(0, 2).map((line, i) => (
              <div key={i} className="bg-white/20 rounded-lg px-2 md:px-3 py-1 md:py-2 truncate backdrop-blur-sm text-[10px] md:text-xs">{line}</div>
            ))}
            {(node.data?.messages || []).length > 2 && (
              <div className="text-[8px] md:text-[10px] opacity-90 bg-white/10 rounded px-1 md:px-2 py-0.5 md:py-1 text-center">+ {(node.data.messages.length - 2)} more…</div>
            )}
          </div>
        </div>

        
        {connectingFrom === node.id && (
          <div className="absolute -left-2 -top-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

function prettyLabelForType(type: NodeType) {
  const map: Record<Exclude<NodeType, string>, string> = {
    start: "Start",
    text: "Text",
    image: "Image",
    audio: "Audio",
    video: "Video",
    question: "Question",
    decision: "Decision",
    feedback: "Feedback",
    assessment: "Assessment",
    end: "End",
  };
  return (map as Partial<Record<NodeType, string>>)[type] || "Node";
}

function sizeForType(type: NodeType) {
  switch (type) {
    case "start":
      return { w: 200, h: 110 };
    case "end":
      return { w: 200, h: 110 };
    case "assessment":
      return { w: 220, h: 160 };
    case "decision":
      return { w: 180, h: 160 };
    default:
      return { w: 200, h: 130 };
  }
}
function shapeForType(type: NodeType) {
  switch (type) {
    case "start":
      return { bg: "bg-emerald-700", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
    case "text":
      return { bg: "bg-sky-700", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
    case "image":
      return { bg: "bg-teal-700", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
    case "audio":
      return { bg: "bg-indigo-700", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
    case "video":
      return { bg: "bg-violet-700", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
    case "question":
      return { bg: "bg-blue-800", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
    case "decision":
      return {
        bg: "bg-amber-600",
        inner: () => (
          <div className="absolute inset-0" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}>
            <div className="w-full h-full bg-amber-600" />
          </div>
        ),
      };
    case "feedback":
      return { bg: "bg-slate-600", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
    case "assessment":
      return { bg: "bg-cyan-700", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
    case "end":
      return { bg: "bg-emerald-800", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
    default:
      return { bg: "bg-slate-500", inner: () => <div className="absolute inset-0 rounded-2xl" /> };
  }
}
function getTypeHints(type: NodeType): string[] {
  const hints: Record<NodeType, string[]> = {
    start: [
      "Welcome messages and initial context",
      "Variable collection and setup",
      "Flow direction control"
    ],
    text: [
      "Simple text responses",
      "Variable interpolation",
      "Multi-line messages"
    ],
    image: [
      "Display images via URL",
      "Add alt text",
      "Use for visual cues"
    ],
    audio: [
      "Play audio via URL",
      "Add transcript text",
      "Use for instructions"
    ],
    video: [
      "Embed video via URL",
      "Add caption text",
      "Use for demonstrations"
    ],
    question: [
      "User input collection",
      "Validation and error handling",
      "Branching based on responses"
    ],
    decision: [
      "Logic-based branching",
      "Variable comparison",
      "Flow control decisions"
    ],
    feedback: [
      "Craft specific feedback for outcomes",
      "Different messages for correct/incorrect",
      "Auto-advance or manual continue"
    ],
    assessment: [
      "Define scoring and pass criteria",
      "Weight questions",
      "Branch on pass/fail"
    ],
    end: [
      "Completion messages",
      "Summary and next steps",
      "Session termination"
    ]
  };
  return hints[type] || [];
}
function centerOf(node: FlowNode) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

function normalizeDraftToMessages(textDraft: string) {
  
  return textDraft.replace(/\r\n?/g, "\n").split("\n");
}

function defaultMessagesForType(type: NodeType) {
  switch (type) {
    case "start":
      return ["Hi {first_name}, how are you today?"]; 
    case "text":
      return ["This is a text content node."];
    case "image":
      return ["Image URL: https://example.com/image.png", "Alt: Descriptive text"];
    case "audio":
      return ["Audio URL: https://example.com/audio.mp3", "Transcript: ..."];
    case "video":
      return ["Video URL: https://example.com/video.mp4", "Caption: ..."];
    case "question":
      return ["What is your answer to …?"]; 
    case "decision":
      return ["Configure branching based on the previous response."];
    case "feedback":
      return ["That's correct! Let's move on…", "Not quite. Here's why…"];
    case "assessment":
      return ["Assessment starting…", "You need at least 70% to pass."];
    case "end":
      return ["You've reached the end. Great job!"];
    default:
      return [""];
  }
}

function getNodeIcon(type: NodeType) {
  switch (type) {
    case "start":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "text":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
        </svg>
      );
    case "image":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l4-4 4 4 5-5 5 5" />
        </svg>
      );
    case "audio":
      return (
        <AudioWaveform />
      );
    case "video":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />
          <rect x="3" y="6" width="12" height="12" rx="2" ry="2" />
        </svg>
      );
    case "question":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "decision":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case "feedback":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "assessment":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "end":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
  }
}