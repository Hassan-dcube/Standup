import React, { useState } from 'react';
import { 
  Filter,
  Search,
  Plus,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Circle,
  Play,
  Edit,
  Trash2
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

interface Project {
  id: string;
  name: string;
  tasks: Task[];
  members: Array<{
    id: string;
    userId: string;
    role: 'MANAGER' | 'STUDENT' | 'CONTRIBUTOR';
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

interface ProjectTasksProps {
  project: Project;
  onTaskClick: (task: Task) => void;
  onTaskOverride: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onAddTask?: () => void;
  isManager: boolean;
}

const ProjectTasks: React.FC<ProjectTasksProps> = ({ project, onTaskClick, onTaskOverride, onTaskEdit, onTaskDelete, onAddTask, isManager }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dueFilter, setDueFilter] = useState<string>('all');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    return Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getProgressPercent = (task: Task) => {
    if (task.progress.length === 0) return 0;
    
    // Sort by source (MANUAL first) then by date
    const sorted = [...task.progress].sort((a, b) => {
      if (a.source !== b.source) {
        return a.source === 'MANUAL' ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return Math.round(sorted[0].percent * 100);
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'bg-gray-200';
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredTasks = project.tasks.filter(task => {
    // Search filter
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && task.status !== selectedStatus) {
      return false;
    }

    // Assignee filter
    if (selectedAssignee !== 'all') {
      const hasAssignee = task.assignees.some(assignee => assignee.userId === selectedAssignee);
      if (selectedAssignee === 'unassigned' && hasAssignee) return false;
      if (selectedAssignee !== 'unassigned' && !hasAssignee) return false;
    }

    // Due date filter
    if (dueFilter !== 'all') {
      const daysUntilDue = getDaysUntilDue(task.dueDate);
      if (dueFilter === 'overdue' && (!task.dueDate || daysUntilDue! >= 0)) return false;
      if (dueFilter === 'due-today' && daysUntilDue !== 0) return false;
      if (dueFilter === 'due-this-week' && (!task.dueDate || daysUntilDue! < 0 || daysUntilDue! > 7)) return false;
    }

    return true;
  });

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
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

  const TaskRow: React.FC<{ task: Task }> = ({ task }) => {
    const daysUntilDue = getDaysUntilDue(task.dueDate);
    const progressPercent = getProgressPercent(task);
    
    // Get latest progress with MANUAL prioritization
    const getLatestProgress = () => {
      if (task.progress.length === 0) return null;
      
      const sorted = [...task.progress].sort((a, b) => {
        if (a.source !== b.source) {
          return a.source === 'MANUAL' ? -1 : 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      return sorted[0];
    };
    
    const latestProgress = getLatestProgress();

    return (
      <div 
        className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => onTaskClick(task)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h4 className="font-medium text-gray-900">{task.title}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
              {/* Progress Chip */}
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                progressPercent >= 80 ? 'bg-green-100 text-green-800' :
                progressPercent >= 50 ? 'bg-yellow-100 text-yellow-800' :
                progressPercent >= 20 ? 'bg-orange-100 text-orange-800' :
                progressPercent > 0 ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  progressPercent >= 80 ? 'bg-green-500' :
                  progressPercent >= 50 ? 'bg-yellow-500' :
                  progressPercent >= 20 ? 'bg-orange-500' :
                  progressPercent > 0 ? 'bg-red-500' :
                  'bg-gray-400'
                }`}></div>
                {progressPercent}%
              </div>
              
              {/* Confidence Indicator */}
              {latestProgress && latestProgress.confidence && latestProgress.confidence > 0 && (
                <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                  latestProgress.confidence >= 0.8 ? 'bg-green-50 text-green-700' :
                  latestProgress.confidence >= 0.6 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }`} title={`Confidence: ${Math.round(latestProgress.confidence * 100)}%`}>
                  <div className={`w-1 h-1 rounded-full mr-1 ${
                    latestProgress.confidence >= 0.8 ? 'bg-green-500' :
                    latestProgress.confidence >= 0.6 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  {Math.round(latestProgress.confidence * 100)}%
                </div>
              )}
              
              {/* Action Buttons for Managers */}
              {isManager && (
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskOverride(task);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Manual Override"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  {onTaskEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskEdit(task);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Edit Task"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                  {onTaskDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskDelete(task);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{task.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              {task.dueDate && (
                <span className={daysUntilDue! < 0 ? 'text-red-600' : daysUntilDue! <= 3 ? 'text-yellow-600' : 'text-gray-500'}>
                  {daysUntilDue! < 0 ? 'Overdue' : 
                   daysUntilDue === 0 ? 'Due today' :
                   daysUntilDue === 1 ? 'Due tomorrow' :
                   `Due in ${daysUntilDue}d`}
                </span>
              )}
              {task.assignees.length > 0 && (
                <span>Assigned to: {task.assignees.map(a => a.user.name).join(', ')}</span>
              )}
              {task.estimatePoints && (
                <span>{task.estimatePoints} points</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const columns = [
    { id: 'TODO', title: 'To-do', color: 'border-gray-200' },
    { id: 'DOING', title: 'Doing', color: 'border-blue-200' },
    { id: 'BLOCKED', title: 'Blocked', color: 'border-red-200' },
    { id: 'DONE', title: 'Done', color: 'border-green-200' }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="TODO">To-do</option>
            <option value="DOING">Doing</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {project.members.map(member => (
              <option key={member.id} value={member.userId}>
                {member.user.name}
              </option>
            ))}
          </select>

          {/* Due Date Filter */}
          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Due Dates</option>
            <option value="overdue">Overdue</option>
            <option value="due-today">Due Today</option>
            <option value="due-this-week">Due This Week</option>
          </select>

          {/* Add Task Button - Both Manager and Employee */}
          {onAddTask && (
            <button 
              onClick={onAddTask}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Tasks</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm">No tasks match your filters</div>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskRow key={task.id} task={task} />
            ))
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && project.tasks.length > 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks match your filters</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {project.tasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first task</p>
          {isManager && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Plus className="w-4 h-4 mr-2" />
              Create First Task
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;
