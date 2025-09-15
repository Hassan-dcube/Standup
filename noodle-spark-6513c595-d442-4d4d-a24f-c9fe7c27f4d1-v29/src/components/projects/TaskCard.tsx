import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Edit, 
  MoreVertical,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
  dueDate: string | null;
  estimatePoints: number | null;
  assignees: Array<{
    id: string;
    name: string;
  }>;
  progress: Array<{
    id: string;
    percent: number;
    status: string;
    confidence: number | null;
    summary: string | null;
    source: 'LLM' | 'MANUAL';
    createdAt: string;
  }>;
}

interface TaskCardProps {
  task: Task;
  onOverride: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isManager?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onOverride, onEdit, onDelete, isManager = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Get the latest progress entry (prefer MANUAL over LLM)
  const getLatestProgress = () => {
    if (!task.progress || task.progress.length === 0) return null;
    
    // Sort by source (MANUAL first) then by date
    const sorted = [...task.progress].sort((a, b) => {
      if (a.source !== b.source) {
        return a.source === 'MANUAL' ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return sorted[0];
  };

  const latestProgress = getLatestProgress();
  const progressPercent = latestProgress?.percent || 0;
  const confidence = latestProgress?.confidence || 0;
  const summary = latestProgress?.summary || '';
  const source = latestProgress?.source || 'LLM';

  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  // Get progress color based on percent
  const getProgressColor = (percent: number) => {
    if (percent >= 0.8) return 'bg-green-500';
    if (percent >= 0.5) return 'bg-yellow-500';
    if (percent >= 0.2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Task Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        {isManager && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={onOverride}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Manual Override"
            >
              <Edit className="w-3 h-3" />
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-blue-600"
                title="Edit Task"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete Task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress Chip with Confidence */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {/* Progress Chip */}
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            progressPercent >= 0.8 ? 'bg-green-100 text-green-800' :
            progressPercent >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
            progressPercent >= 0.2 ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
              progressPercent >= 0.8 ? 'bg-green-500' :
              progressPercent >= 0.5 ? 'bg-yellow-500' :
              progressPercent >= 0.2 ? 'bg-orange-500' :
              'bg-red-500'
            }`}></div>
            {Math.round(progressPercent * 100)}%
          </div>
          
          {/* Confidence Indicator */}
          {confidence > 0 && (
            <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
              confidence >= 0.8 ? 'bg-green-50 text-green-700' :
              confidence >= 0.6 ? 'bg-yellow-50 text-yellow-700' :
              'bg-red-50 text-red-700'
            }`}>
              <div className={`w-1 h-1 rounded-full mr-1 ${
                confidence >= 0.8 ? 'bg-green-500' :
                confidence >= 0.6 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
        
        {/* Source Badge */}
        <span className={`text-xs px-2 py-1 rounded-full ${
          source === 'MANUAL' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          {source}
        </span>
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className={`flex items-center text-xs mb-3 ${
          isOverdue ? 'text-red-600' : 'text-gray-600'
        }`}>
          <Calendar className="w-3 h-3 mr-1" />
          <span>
            Due: {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue && ' (Overdue)'}
          </span>
        </div>
      )}

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex items-center text-xs text-gray-600 mb-3">
          <Users className="w-3 h-3 mr-1" />
          <span>
            {task.assignees.map(a => a.name).join(', ')}
          </span>
        </div>
      )}

      {/* LLM Summary with Confidence */}
      {summary && (
        <div className="relative">
          <div
            className="text-xs text-gray-600 bg-gray-50 rounded p-2 cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">AI Summary:</span>
              <span className={`font-medium ${getConfidenceColor(confidence)}`}>
                {Math.round(confidence * 100)}% confidence
              </span>
            </div>
            <p className="line-clamp-2">{summary}</p>
          </div>

          {/* Tooltip with full summary */}
          {showTooltip && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">AI Analysis</span>
                <span className={`font-medium ${getConfidenceColor(confidence)}`}>
                  {Math.round(confidence * 100)}% confidence
                </span>
              </div>
              <p className="mb-2">{summary}</p>
              <div className="text-gray-300 text-xs">
                Source: {source} • Updated: {new Date(latestProgress!.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estimate Points */}
      {task.estimatePoints && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">Estimate:</span>
          <span className="text-xs font-medium text-gray-700">
            {task.estimatePoints} pts
          </span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
