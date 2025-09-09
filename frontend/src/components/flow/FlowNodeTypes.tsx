import React from 'react';
import { Handle, Position } from 'reactflow';
import { Rocket, BookOpen, HelpCircle, GitBranch, CheckCircle2, Image as ImageIcon, Music2, Clapperboard, Paperclip } from 'lucide-react';

export interface FlowNodeData {
  textDraft: string;
  messages: string[];
  keywords?: string[];
  errorMessage?: string;
  choices?: string[];
  mediaUrl?: string;
  conditions?: Array<{
    type: 'text' | 'score' | 'time' | 'custom';
    value: string;
    action: 'redirect' | 'show' | 'hide' | 'end';
  }>;
  validation?: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  statusCategory?: 'to-do' | 'in-progress' | 'done';
}

export const StartNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-white text-[#313F4E] p-2 rounded-md shadow border border-[#e2e8f0] min-w-[140px]">
    <Handle type="source" position={Position.Right} className="w-2 h-2 bg-[#40B1DF]" />
    <div className="text-center">
      <div className="font-semibold text-[11px] mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e6f6fd] text-[#0f3c4c]">
        <Rocket className="w-3 h-3" /> Start
      </div>
      <div className="text-[10px] opacity-90">{data.textDraft || ''}</div>
    </div>
  </div>
);

export const ContentNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-white text-[#313F4E] p-2 rounded-md shadow border border-[#e2e8f0] min-w-[150px]">
    <Handle type="target" position={Position.Left} className="w-2 h-2 bg-[#40B1DF]" />
    <Handle type="source" position={Position.Right} className="w-2 h-2 bg-[#40B1DF]" />
    <div className="text-center">
      <div className="font-semibold text-[11px] mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e6f6fd] text-[#0f3c4c]">
        <BookOpen className="w-3 h-3" /> Text
      </div>
      <div className="text-[10px] opacity-90 max-h-14 overflow-y-auto">
        {data.textDraft || ''}
      </div>
      {data.mediaUrl && (
        <div className="mt-1 text-[9px] opacity-75">
          <span className="inline-flex items-center gap-1"><Paperclip className="w-3 h-3" /> media</span>
        </div>
      )}
    </div>
  </div>
);

export const QuestionNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-white text-[#313F4E] p-2 rounded-md shadow border border-[#e2e8f0] min-w-[150px]">
    <Handle type="target" position={Position.Left} className="w-2 h-2 bg-[#40B1DF]" />
    <Handle type="source" position={Position.Right} className="w-2 h-2 bg-[#40B1DF]" />
    <div className="text-center">
      <div className="font-semibold text-[11px] mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eef2ff] text-[#3730a3]">
        <HelpCircle className="w-3 h-3" /> Question
      </div>
      <div className="text-[10px] opacity-90 mb-1">
        {data.textDraft || ''}
      </div>
      {data.choices && data.choices.length > 0 && (
        <div className="text-[9px] opacity-75">
          {data.choices.length} choices
        </div>
      )}
    </div>
  </div>
);

export const DecisionNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-white text-[#313F4E] p-2 rounded-md shadow border border-[#e2e8f0] min-w-[150px]">
    <Handle type="target" position={Position.Left} className="w-2 h-2 bg-[#40B1DF]" />
    <Handle type="source" position={Position.Right} className="w-2 h-2 bg-[#40B1DF]" />
    <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-[#40B1DF]" />
    <div className="text-center">
      <div className="font-semibold text-[11px] mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e]">
        <GitBranch className="w-3 h-3" /> Decision
      </div>
      <div className="text-[10px] opacity-90">
        {data.textDraft || 'Choose a path'}
      </div>
      {data.conditions && data.conditions.length > 0 && (
        <div className="text-[9px] opacity-75 mt-1">
          {data.conditions.length} conditions
        </div>
      )}
    </div>
  </div>
);

// Removed Feedback and Assessment nodes to align with Jira-like model

export const CompletionNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-white text-[#313F4E] p-2 rounded-md shadow border border-[#e2e8f0] min-w-[140px]">
    <Handle type="target" position={Position.Left} className="w-2 h-2 bg-[#40B1DF]" />
    <div className="text-center">
      <div className="font-semibold text-[11px] mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46]">
        <CheckCircle2 className="w-3 h-3" /> Complete
      </div>
      <div className="text-[10px] opacity-90">
        {data.textDraft || 'End'}
      </div>
    </div>
  </div>
);

export const MediaNode: React.FC<{ data: FlowNodeData; type: 'image' | 'audio' | 'video' }> = ({ data, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'audio': return <Music2 className="w-4 h-4" />;
      case 'video': return <Clapperboard className="w-4 h-4" />;
      default: return <Paperclip className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'image': return 'Image';
      case 'audio': return 'Audio';
      case 'video': return 'Video';
      default: return 'Media';
    }
  };

  return (
    <div className="bg-white text-[#313F4E] p-2 rounded-md shadow border border-[#e2e8f0] min-w-[150px]">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-[#40B1DF]" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-[#40B1DF]" />
      <div className="text-center">
        <div className="font-semibold text-[11px] mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e6f6fd] text-[#0f3c4c]">{getIcon()} {getTypeLabel()}</div>
        <div className="text-[10px] opacity-90">
          {data.textDraft || ''}
        </div>
        {data.mediaUrl && (
          <div className="text-[9px] opacity-75 mt-1">
            <span className="inline-flex items-center gap-1"><Paperclip className="w-3 h-3" /> media</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const nodeTypes = {
  start: StartNode,
  text: ContentNode,
  image: (props: { data: FlowNodeData }) => <MediaNode {...props} type="image" />,
  audio: (props: { data: FlowNodeData }) => <MediaNode {...props} type="audio" />,
  video: (props: { data: FlowNodeData }) => <MediaNode {...props} type="video" />,
  question: QuestionNode,
  decision: DecisionNode,
  end: CompletionNode,
  completion: CompletionNode
};

export const nodeTypeDefinitions = [
  { type: 'start', label: 'Start', icon: <Rocket className="w-4 h-4" />, color: 'bg-[#40B1DF]', description: 'Entry point' },
  { type: 'text', label: 'Text', icon: <BookOpen className="w-4 h-4" />, color: 'bg-[#40B1DF]', description: 'Text content' },
  { type: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" />, color: 'bg-[#40B1DF]', description: 'Visual content' },
  { type: 'audio', label: 'Audio', icon: <Music2 className="w-4 h-4" />, color: 'bg-[#40B1DF]', description: 'Audio content' },
  { type: 'video', label: 'Video', icon: <Clapperboard className="w-4 h-4" />, color: 'bg-[#40B1DF]', description: 'Video content' },
  { type: 'question', label: 'Question', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-[#5156D8]', description: 'Interactive questions; supports correctness branching' },
  { type: 'decision', label: 'Decision', icon: <GitBranch className="w-4 h-4" />, color: 'bg-[#f59e0b]', description: 'Conditional logic (branching incl. correctness)' },
  { type: 'completion', label: 'Complete', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-[#16a34a]', description: 'End' }
];