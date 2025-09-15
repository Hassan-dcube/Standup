import React from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  Activity
} from 'lucide-react';

interface ProjectVisualizationProps {
  project: {
    id: string;
    name: string;
    progressCached: number | null;
    taskStats?: {
      total: number;
      completed: number;
      blocked: number;
      overdue: number;
    };
    _count?: {
      tasks: number;
    };
    members?: Array<{
      user: {
        name: string;
      };
    }>;
  };
  blockersHelpData?: {
    blockers: Array<{ user: string; text: string; date: string }>;
    helpNeeded: Array<{ user: string; text: string; date: string }>;
  };
}

export const ProjectVisualization: React.FC<ProjectVisualizationProps> = ({ 
  project, 
  blockersHelpData 
}) => {
  const progress = project.progressCached || 0;
  const taskStats = project.taskStats || { 
    total: project._count?.tasks || 0, 
    completed: Math.floor((project._count?.tasks || 0) * progress), // Estimate completed based on progress
    blocked: 0, 
    overdue: 0 
  };

  // Calculate task status distribution
  const todoCount = taskStats.total - taskStats.completed - taskStats.blocked;
  const taskDistribution = [
    { status: 'Completed', count: taskStats.completed, color: 'bg-green-500', icon: CheckCircle },
    { status: 'In Progress', count: Math.max(0, todoCount), color: 'bg-blue-500', icon: Clock },
    { status: 'Blocked', count: taskStats.blocked, color: 'bg-red-500', icon: AlertTriangle },
    { status: 'Overdue', count: taskStats.overdue, color: 'bg-orange-500', icon: XCircle },
  ].filter(item => item.count > 0);

  // Calculate team activity (mock data for now)
  const teamActivity = [
    { name: 'Active Members', count: project.members?.length || 0, color: 'bg-blue-100 text-blue-800' },
    { name: 'Blockers', count: blockersHelpData?.blockers?.length || 0, color: 'bg-red-100 text-red-800' },
    { name: 'Help Requests', count: blockersHelpData?.helpNeeded?.length || 0, color: 'bg-yellow-100 text-yellow-800' },
  ];

  return (
    <div className="mt-4 space-y-4">
      {/* Progress Chart */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Progress</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>


      {/* Team Activity */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Team Activity</span>
        </div>
        <div className="flex items-center justify-between">
          {teamActivity.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>
                {item.count}
              </div>
              <span className="text-xs text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <div className="text-lg font-semibold text-blue-900">
            {project.members?.length || 0}
          </div>
          <div className="text-xs text-blue-700">Team Members</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-semibold text-green-900">
            {taskStats.completed}
          </div>
          <div className="text-xs text-green-700">Completed Tasks</div>
        </div>
      </div>
    </div>
  );
};
