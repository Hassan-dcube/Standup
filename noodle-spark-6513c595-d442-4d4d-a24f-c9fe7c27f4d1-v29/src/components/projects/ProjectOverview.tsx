import React from 'react';
import { 
  Calendar, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Target,
  TrendingUp
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNING';
  owner: {
    id: string;
    name: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  progressCached: number | null;
  updatedAt: string;
  activeSprint?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    goal: string;
  };
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
  _count?: {
    sprints: number;
    tasks: number;
  };
}

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

interface ProjectOverviewProps {
  project: Project;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project }) => {
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

  return (
    <div className="space-y-6">

      {/* Upcoming Tasks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h3>
        {(() => {
          const upcomingTasks = project.tasks
            .filter(task => task.dueDate && task.status !== 'DONE')
            .sort((a, b) => {
              const aOverdue = new Date(a.dueDate!) < new Date();
              const bOverdue = new Date(b.dueDate!) < new Date();
              if (aOverdue && !bOverdue) return -1;
              if (!aOverdue && bOverdue) return 1;
              return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
            })
            .slice(0, 5);

          if (upcomingTasks.length === 0) {
            return (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming tasks</p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {upcomingTasks.map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                const daysUntilDue = task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          task.status === 'TODO' ? 'bg-gray-100 text-gray-600' :
                          task.status === 'DOING' ? 'bg-blue-100 text-blue-600' :
                          task.status === 'BLOCKED' ? 'bg-red-100 text-red-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {task.status}
                        </span>
                        {task.assignees.length > 0 && (
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {task.assignees.map(a => a.user.name).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        isOverdue ? 'text-red-600' : 
                        daysUntilDue && daysUntilDue <= 3 ? 'text-yellow-600' : 
                        'text-gray-600'
                      }`}>
                        {isOverdue ? 'Overdue' : 
                         daysUntilDue === 0 ? 'Due today' :
                         daysUntilDue === 1 ? 'Due tomorrow' :
                         daysUntilDue ? `Due in ${daysUntilDue} days` : 'No due date'}
                      </div>
                      {task.dueDate && (
                        <div className="text-xs text-gray-500">
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* LLM Insights */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">LLM Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* What moved yesterday */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              What moved yesterday
            </h4>
            <div className="space-y-2">
              {project.tasks
                .filter(task => task.progress.length > 0)
                .slice(0, 3)
                .map(task => {
                  const latestProgress = task.progress[0];
                  return (
                    <div key={task.id} className="text-sm">
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-gray-600">
                        +{Math.round((latestProgress.percent || 0) * 100)}% 
                        {latestProgress.summary && (
                          <span className="text-gray-500 ml-2">"{latestProgress.summary.substring(0, 50)}..."</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              {project.tasks.filter(task => task.progress.length > 0).length === 0 && (
                <p className="text-sm text-gray-500">No recent progress updates</p>
              )}
            </div>
          </div>

          {/* New/active blockers */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
              Active Blockers
            </h4>
            <div className="space-y-2">
              {project.tasks
                .filter(task => task.status === 'BLOCKED')
                .slice(0, 3)
                .map(task => (
                  <div key={task.id} className="text-sm">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-gray-600">
                      {task.assignees.length > 0 ? 
                        `Assigned to ${task.assignees.map(a => a.user.name).join(', ')}` :
                        'Unassigned'
                      }
                    </div>
                  </div>
                ))}
              {project.tasks.filter(task => task.status === 'BLOCKED').length === 0 && (
                <p className="text-sm text-gray-500">No active blockers</p>
              )}
            </div>
          </div>

          {/* At-risk this week */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-yellow-600" />
              At-risk this week
            </h4>
            <div className="space-y-2">
              {project.tasks
                .filter(task => {
                  if (!task.dueDate) return false;
                  const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const latestProgress = task.progress[0];
                  const progressPercent = latestProgress?.percent || 0;
                  const confidence = latestProgress?.confidence || 0;
                  
                  return daysUntilDue <= 7 && (progressPercent < 0.5 || confidence < 0.5);
                })
                .slice(0, 3)
                .map(task => {
                  const daysUntilDue = Math.ceil((new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const latestProgress = task.progress[0];
                  const progressPercent = Math.round((latestProgress?.percent || 0) * 100);
                  
                  return (
                    <div key={task.id} className="text-sm">
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-gray-600">
                        {progressPercent}% complete, due in {daysUntilDue} days
                      </div>
                    </div>
                  );
                })}
              {project.tasks.filter(task => {
                if (!task.dueDate) return false;
                const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const latestProgress = task.progress[0];
                const progressPercent = latestProgress?.percent || 0;
                const confidence = latestProgress?.confidence || 0;
                return daysUntilDue <= 7 && (progressPercent < 0.5 || confidence < 0.5);
              }).length === 0 && (
                <p className="text-sm text-gray-500">No at-risk tasks this week</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {project.tasks
            .filter(task => task.progress.length > 0)
            .flatMap(task => 
              task.progress.slice(0, 2).map(progress => ({
                ...progress,
                taskTitle: task.title,
                taskId: task.id
              }))
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((activity, index) => (
              <div key={`${activity.taskId}-${activity.id}`} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.source === 'MANUAL' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{activity.taskTitle}</span>
                    <span className="text-gray-500 ml-2">
                      {activity.source === 'MANUAL' ? 'manually updated' : 'progress updated'} to {Math.round(activity.percent * 100)}%
                    </span>
                  </div>
                  {activity.summary && (
                    <div className="text-sm text-gray-600 mt-1">
                      "{activity.summary.substring(0, 100)}{activity.summary.length > 100 ? '...' : ''}"
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {getTimeAgo(activity.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          {project.tasks.filter(task => task.progress.length > 0).length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">Activity will appear after standups or manual updates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
