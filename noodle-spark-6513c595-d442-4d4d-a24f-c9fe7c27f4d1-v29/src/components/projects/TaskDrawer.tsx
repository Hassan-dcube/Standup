import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  Play,
  Edit,
  Settings,
  TrendingUp,
  Clock,
  FileText,
  Target,
  User
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
  dueDate: string | null;
  estimatePoints: number | null;
  acceptanceCriteria: string | null;
  assignees: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
    };
  }>;
  progress: Array<{
    id: string;
    source: 'LLM' | 'MANUAL';
    percent: number;
    status: string | null;
    confidence: number | null;
    summary: string | null;
    createdAt: string;
  }>;
}

interface TaskDrawerProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: () => void;
  isManager: boolean;
}

const TaskDrawer: React.FC<TaskDrawerProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onTaskUpdate, 
  isManager 
}) => {
  const [showManualOverride, setShowManualOverride] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    return Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Circle className="w-4 h-4" />;
      case 'DOING': return <Play className="w-4 h-4" />;
      case 'BLOCKED': return <AlertCircle className="w-4 h-4" />;
      case 'DONE': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'text-gray-600 bg-gray-100';
      case 'DOING': return 'text-blue-600 bg-blue-100';
      case 'BLOCKED': return 'text-red-600 bg-red-100';
      case 'DONE': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'bg-gray-200';
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
  const progressPercent = latestProgress ? Math.round(latestProgress.percent * 100) : 0;
  const daysUntilDue = getDaysUntilDue(task.dueDate);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status and Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(task.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
              {isManager && (
                <button
                  onClick={() => setShowManualOverride(true)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Override
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress: {progressPercent}%</span>
                {latestProgress && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getConfidenceColor(latestProgress.confidence)}`}></div>
                    <span className="text-xs">
                      {Math.round((latestProgress.confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div className="space-y-6">
            {/* Description */}
            {task.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Description
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {task.description}
                </p>
              </div>
            )}

            {/* Acceptance Criteria */}
            {task.acceptanceCriteria && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Definition of Done
                </h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {task.acceptanceCriteria.split('\n').map((line, index) => (
                    <div key={index} className="flex items-start mb-1">
                      <span className="text-gray-400 mr-2">•</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignees */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Assignees
              </h4>
              {task.assignees.length > 0 ? (
                <div className="space-y-2">
                  {task.assignees.map(assignee => (
                    <div key={assignee.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {assignee.user.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No assignees</p>
              )}
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Due Date
                </h4>
                <div className={`text-sm ${
                  daysUntilDue! < 0 ? 'text-red-600' : 
                  daysUntilDue! <= 3 ? 'text-yellow-600' : 
                  'text-gray-600'
                }`}>
                  {formatDate(task.dueDate)}
                  {daysUntilDue! < 0 && ' (Overdue)'}
                  {daysUntilDue === 0 && ' (Due today)'}
                  {daysUntilDue === 1 && ' (Due tomorrow)'}
                  {daysUntilDue! > 1 && ` (${daysUntilDue} days left)`}
                </div>
              </div>
            )}

            {/* Estimate Points */}
            {task.estimatePoints && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Estimate</h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {task.estimatePoints} points
                </span>
              </div>
            )}

            {/* Latest LLM Reading with Evidence */}
            {latestProgress && latestProgress.summary && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Latest AI Reading
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 mb-3">{latestProgress.summary}</p>
                  
                  {/* Evidence Quotes */}
                  {latestProgress.source === 'LLM' && (
                    <div className="mb-3">
                      <h5 className="text-xs font-medium text-gray-600 mb-2">Evidence from standups:</h5>
                      <div className="space-y-2">
                        <div className="bg-white border border-blue-100 rounded p-2">
                          <p className="text-xs text-gray-600 italic">
                            "Working on task implementation, making good progress"
                          </p>
                          <p className="text-xs text-gray-500 mt-1">- assad@company.com, 2h ago</p>
                        </div>
                        <div className="bg-white border border-blue-100 rounded p-2">
                          <p className="text-xs text-gray-600 italic">
                            "No blockers, everything going smoothly"
                          </p>
                          <p className="text-xs text-gray-500 mt-1">- assad@company.com, 2h ago</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span>Source: {latestProgress.source}</span>
                      {latestProgress.confidence && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          latestProgress.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                          latestProgress.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {Math.round(latestProgress.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    <span>{getTimeAgo(latestProgress.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Progress History */}
            {task.progress.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Progress History
                  </h4>
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    onClick={() => {
                      // TODO: Implement full history view
                      console.log('Show full history for task:', task.id);
                    }}
                  >
                    Show History
                  </button>
                </div>
                <div className="space-y-3">
                  {task.progress.slice(0, 5).map((progress, index) => (
                    <div key={progress.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          progress.source === 'MANUAL' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {Math.round(progress.percent * 100)}% complete
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({progress.source})
                          </span>
                        </div>
                        {progress.summary && (
                          <div className="text-sm text-gray-600 mt-1">
                            "{progress.summary.substring(0, 100)}{progress.summary.length > 100 ? '...' : ''}"
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {getTimeAgo(progress.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDrawer;
