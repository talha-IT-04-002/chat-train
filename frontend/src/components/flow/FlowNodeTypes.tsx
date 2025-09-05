import React from 'react';
import { Handle, Position } from 'reactflow';
import { Rocket, BookOpen, HelpCircle, GitBranch, MessageSquare, BarChart3, CheckCircle2, Image as ImageIcon, Music2, Clapperboard, Paperclip } from 'lucide-react';

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
}

export const StartNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-green-600 text-white p-4 rounded-lg shadow-lg border-2 border-green-700 min-w-[150px]">
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
    <div className="text-center">
      <div className="font-bold text-sm mb-2 inline-flex items-center gap-1"><Rocket className="w-4 h-4" /> Start</div>
      <div className="text-xs opacity-90">{data.textDraft || 'Training begins here'}</div>
    </div>
  </div>
);

export const ContentNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg border-2 border-blue-600 min-w-[200px]">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
    <div className="text-center">
      <div className="font-bold text-sm mb-2 inline-flex items-center gap-1"><BookOpen className="w-4 h-4" /> Content</div>
      <div className="text-xs opacity-90 max-h-20 overflow-y-auto">
        {data.textDraft || 'Add your training content here'}
      </div>
      {data.mediaUrl && (
        <div className="mt-2 text-xs opacity-75">
          <span className="inline-flex items-center gap-1"><Paperclip className="w-3 h-3" /> Media attached</span>
        </div>
      )}
    </div>
  </div>
);

export const QuestionNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-purple-600 text-white p-4 rounded-lg shadow-lg border-2 border-purple-700 min-w-[180px]">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
    <div className="text-center">
      <div className="font-bold text-sm mb-2 inline-flex items-center gap-1"><HelpCircle className="w-4 h-4" /> Question</div>
      <div className="text-xs opacity-90 mb-2">
        {data.textDraft || 'Ask a question here'}
      </div>
      {data.choices && data.choices.length > 0 && (
        <div className="text-xs opacity-75">
          {data.choices.length} choices available
        </div>
      )}
    </div>
  </div>
);

export const DecisionNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-amber-500 text-white p-4 rounded-lg shadow-lg border-2 border-amber-600 min-w-[180px]">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-white" />
    <div className="text-center">
      <div className="font-bold text-sm mb-2 inline-flex items-center gap-1"><GitBranch className="w-4 h-4" /> Decision</div>
      <div className="text-xs opacity-90">
        {data.textDraft || 'Make a decision here'}
      </div>
      {data.conditions && data.conditions.length > 0 && (
        <div className="text-xs opacity-75 mt-1">
          {data.conditions.length} conditions
        </div>
      )}
    </div>
  </div>
);

export const FeedbackNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-indigo-600 text-white p-4 rounded-lg shadow-lg border-2 border-indigo-700 min-w-[180px]">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
    <div className="text-center">
      <div className="font-bold text-sm mb-2 inline-flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Feedback</div>
      <div className="text-xs opacity-90">
        {data.textDraft || 'Provide feedback here'}
      </div>
    </div>
  </div>
);

export const AssessmentNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg border-2 border-red-700 min-w-[180px]">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
    <div className="text-center">
      <div className="font-bold text-sm mb-2 inline-flex items-center gap-1"><BarChart3 className="w-4 h-4" /> Assessment</div>
      <div className="text-xs opacity-90">
        {data.textDraft || 'Assessment content here'}
      </div>
      {data.validation && (
        <div className="text-xs opacity-75 mt-1">
          {data.validation.required ? 'Required' : 'Optional'}
        </div>
      )}
    </div>
  </div>
);

export const CompletionNode: React.FC<{ data: FlowNodeData }> = ({ data }) => (
  <div className="bg-teal-600 text-white p-4 rounded-lg shadow-lg border-2 border-teal-700 min-w-[150px]">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
    <div className="text-center">
      <div className="font-bold text-sm mb-2 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Complete</div>
      <div className="text-xs opacity-90">
        {data.textDraft || 'Training completed'}
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
    <div className="bg-emerald-600 text-white p-4 rounded-lg shadow-lg border-2 border-emerald-700 min-w-[180px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
      <div className="text-center">
        <div className="font-bold text-sm mb-2 inline-flex items-center gap-1">{getIcon()} {getTypeLabel()}</div>
        <div className="text-xs opacity-90">
          {data.textDraft || `${getTypeLabel()} content`}
        </div>
        {data.mediaUrl && (
          <div className="text-xs opacity-75 mt-1">
            <span className="inline-flex items-center gap-1"><Paperclip className="w-3 h-3" /> Media attached</span>
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
  feedback: FeedbackNode,
  assessment: AssessmentNode,
  end: CompletionNode,
  completion: CompletionNode
};

export const nodeTypeDefinitions = [
  { type: 'start', label: 'Start', color: 'bg-green-600', description: 'Training begins here' },
  { type: 'text', label: 'Content', color: 'bg-blue-500', description: 'Add training content' },
  { type: 'image', label: 'Image', color: 'bg-emerald-600', description: 'Visual content' },
  { type: 'audio', label: 'Audio', color: 'bg-emerald-600', description: 'Audio content' },
  { type: 'video', label: 'Video', color: 'bg-emerald-600', description: 'Video content' },
  { type: 'question', label: 'Question', color: 'bg-purple-600', description: 'Interactive questions' },
  { type: 'decision', label: 'Decision', color: 'bg-amber-500', description: 'Conditional logic' },
  { type: 'feedback', label: 'Feedback', color: 'bg-indigo-600', description: 'User feedback' },
  { type: 'assessment', label: 'Assessment', color: 'bg-red-600', description: 'Knowledge testing' },
  { type: 'completion', label: 'Complete', color: 'bg-teal-600', description: 'Training ends here' }
];