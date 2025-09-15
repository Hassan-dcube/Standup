import React, { useState } from 'react';
import { 
  Calendar, 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';
import EditSprintModal from './EditSprintModal';

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
}

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
  estimatePoints: number | null;
  assignees: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

interface Project {
  id: string;
  name: string;
  sprints: Sprint[];
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

interface ProjectSprintProps {
  project: Project;
  onSprintUpdate: () => void;
  isManager: boolean;
}

const ProjectSprint: React.FC<ProjectSprintProps> = ({ 
  project, 
  onSprintUpdate, 
  isManager 
}) => {
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCurrentSprint = () => {
    const now = new Date();
    return project.sprints.find(sprint => {
      const startDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      return startDate <= now && endDate >= now;
    });
  };

  const getSprintProgress = (sprint: Sprint) => {
    const sprintTasks = project.tasks.filter(task => {
      // This is a simplified approach - in a real app, you'd have sprint-task relationships
      return true; // For now, consider all tasks as part of the current sprint
    });

    const totalTasks = sprintTasks.length;
    const completedTasks = sprintTasks.filter(task => task.status === 'DONE').length;
    const totalPoints = sprintTasks.reduce((sum, task) => sum + (task.estimatePoints || 0), 0);
    const completedPoints = sprintTasks
      .filter(task => task.status === 'DONE')
      .reduce((sum, task) => sum + (task.estimatePoints || 0), 0);

    return {
      totalTasks,
      completedTasks,
      totalPoints,
      completedPoints,
      progressPercent: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      pointsProgressPercent: totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0
    };
  };

  const getDaysRemaining = (sprint: Sprint) => {
    const now = new Date();
    const endDate = new Date(sprint.endDate);
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const currentSprint = getCurrentSprint();
  const sprintProgress = currentSprint ? getSprintProgress(currentSprint) : null;

  return (
    <div className="space-y-6">
      {/* Current Sprint */}
      {currentSprint ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{currentSprint.name}</h3>
              <p className="text-sm text-gray-600">{currentSprint.goal}</p>
            </div>
            {isManager && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingSprint(currentSprint)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => setShowTaskPicker(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tasks
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Sprint Dates */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Sprint Dates
              </h4>
              <div className="text-sm text-gray-600">
                <div>{formatDate(currentSprint.startDate)} → {formatDate(currentSprint.endDate)}</div>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getDaysRemaining(currentSprint) <= 3 ? 'bg-red-100 text-red-800' :
                    getDaysRemaining(currentSprint) <= 7 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {getDaysRemaining(currentSprint)} days left
                  </span>
                </div>
              </div>
            </div>

            {/* Task Progress */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Task Progress
              </h4>
              <div className="text-sm text-gray-600">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {sprintProgress?.completedTasks}/{sprintProgress?.totalTasks}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sprintProgress?.progressPercent || 0}%` }}
                  ></div>
                </div>
                <div className="mt-1">{Math.round(sprintProgress?.progressPercent || 0)}% complete</div>
              </div>
            </div>

            {/* Points Progress */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Points Progress
              </h4>
              <div className="text-sm text-gray-600">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {sprintProgress?.completedPoints}/{sprintProgress?.totalPoints}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sprintProgress?.pointsProgressPercent || 0}%` }}
                  ></div>
                </div>
                <div className="mt-1">{Math.round(sprintProgress?.pointsProgressPercent || 0)}% complete</div>
              </div>
            </div>
          </div>

          {/* Burn-up Chart Placeholder */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Sprint Burn-up
            </h4>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Burn-up chart will be implemented here</p>
              <p className="text-sm text-gray-400 mt-1">Shows daily progress towards sprint goal</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sprint</h3>
            <p className="text-gray-500 mb-4">Create a new sprint to start tracking progress</p>
            {isManager && (
              <button
                onClick={() => setShowCreateSprint(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Sprint
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sprint History */}
      {project.sprints.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprint History</h3>
          <div className="space-y-4">
            {project.sprints
              .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
              .map(sprint => {
                const progress = getSprintProgress(sprint);
                const isCurrent = sprint.id === currentSprint?.id;
                
                return (
                  <div key={sprint.id} className={`border rounded-lg p-4 ${
                    isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{sprint.name}</h4>
                          {isCurrent && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{sprint.goal}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}</span>
                          <span>{progress.completedTasks}/{progress.totalTasks} tasks</span>
                          <span>{progress.completedPoints}/{progress.totalPoints} points</span>
                        </div>
                      </div>
                      {isManager && !isCurrent && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingSprint(sprint)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Create Sprint Modal Placeholder */}
      {showCreateSprint && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCreateSprint(false)}></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Sprint</h3>
              <p className="text-gray-600">Sprint creation form will be implemented here...</p>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateSprint(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateSprint(false)}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Sprint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sprint Modal */}
      <EditSprintModal
        isOpen={!!editingSprint}
        onClose={() => setEditingSprint(null)}
        onSuccess={() => {
          setEditingSprint(null);
          onSprintUpdate();
        }}
        sprint={editingSprint}
      />

      {/* Task Picker Modal Placeholder */}
      {showTaskPicker && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowTaskPicker(false)}></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Tasks to Sprint</h3>
              <p className="text-gray-600">Task picker will be implemented here...</p>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowTaskPicker(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowTaskPicker(false)}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Selected Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSprint;
