import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  BarChart3,
  Edit,
  Plus,
  MoreVertical,
  RefreshCw,
  TrendingUp,
  Target,
  Search,
  Filter,
  UserPlus,
  Settings,
  Archive,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import TaskCard from './TaskCard';
import ManualOverrideDialog from './ManualOverrideDialog';
import FirstRunChecklist from './FirstRunChecklist';
import ProjectOverview from './ProjectOverview';
import ProjectTasks from './ProjectTasks';
import TaskDrawer from './TaskDrawer';
import ProjectMembers from './ProjectMembers';
import ProjectSearch from './ProjectSearch';
import AddMemberModal from './AddMemberModal';
import AddTaskModal from './AddTaskModal';
import EditProjectModal from './EditProjectModal';
import ProjectSettingsModal from './ProjectSettingsModal';
import ProjectBadges from './ProjectBadges';
import EditTaskModal from './EditTaskModal';

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

type TabType = 'overview' | 'tasks' | 'members' | 'search' | 'settings';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showFirstRunChecklist, setShowFirstRunChecklist] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);

  useEffect(() => {
    if (project && location.state?.isNewProject) {
      setShowFirstRunChecklist(true);
    }
  }, [project, location.state]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        console.error('Failed to fetch project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecompute = async () => {
    try {
      setRecomputing(true);
      setIsRecomputing(true);
      
      const startTime = Date.now();
      const response = await fetch(`http://localhost:4000/api/project-recompute/${projectId}/recompute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && result.success) {
        // Show success message with timing
        console.log('Progress recomputed successfully', {
          previous: result.progress.previous,
          new: result.progress.new,
          change: result.progress.change,
          durationMs: result.metadata.durationMs
        });
        
        // Refresh project data
        await fetchProject();
      } else {
        console.error('Recompute failed:', result.error);
        // Could show error toast here
      }
    } catch (error) {
      console.error('Error recomputing progress:', error);
    } finally {
      setRecomputing(false);
      setIsRecomputing(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDrawer(true);
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Navigate back to projects list
        navigate('/projects');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete project: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Network error during delete. Please try again.');
    }
  };

  const handleAddMember = () => {
    setShowAddMemberModal(true);
  };

  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  const handleEditProject = () => {
    setShowEditProjectModal(true);
  };

  const handleTaskOverride = (task: Task) => {
    setSelectedTask(task);
    setShowManualOverride(true);
  };

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setShowEditTaskModal(true);
  };

  const handleTaskDelete = async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete the task "${task.title}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/tasks/${task.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Refresh project data
          if (projectId) {
            await fetchProject(projectId);
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to delete task: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Network error. Please try again.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'COMPLETED': { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      'ON_HOLD': { color: 'bg-yellow-100 text-yellow-800', label: 'On Hold' },
      'PLANNING': { color: 'bg-gray-100 text-gray-800', label: 'Planning' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PLANNING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getRiskLevel = (): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (!project) return 'LOW';
    
    const blockedTasks = project.tasks.filter(task => task.status === 'BLOCKED').length;
    const overdueTasks = project.tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
    ).length;
    
    if (blockedTasks > 0 || overdueTasks > 0) return 'HIGH';
    if (project.progressCached && project.progressCached < 0.3) return 'MEDIUM';
    return 'LOW';
  };

  const getRiskBadge = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    const config = {
      'LOW': { color: 'bg-green-100 text-green-800', label: 'Low Risk' },
      'MEDIUM': { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Risk' },
      'HIGH': { color: 'bg-red-100 text-red-800', label: 'High Risk' }
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[riskLevel].color}`}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {config[riskLevel].label}
      </span>
    );
  };

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

  const isManager = user?.role === 'manager' || user?.role === 'programme-manager';
  const isStudent = user?.role === 'student' || user?.role === 'employee';
  
  // Enhanced RBAC helpers
  const canEditProject = isManager;
  const canManageMembers = isManager;
  const canOverrideTasks = isManager;
  const canViewAllTasks = isManager;
  const canSearchProject = isManager;
  
  // Students can only see their assigned tasks
  const getVisibleTasks = (tasks: Task[]) => {
    if (isManager) return tasks;
    if (isStudent) {
      return tasks.filter(task => 
        task.assignees.some(assignee => assignee.userId === user?.id)
      );
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        <Link 
          to={user?.role === 'employee' ? "/standup" : "/projects"} 
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to {user?.role === 'employee' ? 'Standup' : 'Projects'}
        </Link>
      </div>
    );
  }

  const riskLevel = getRiskLevel();

  return (
    <div className="space-y-6">
      {/* First Run Checklist */}
      {showFirstRunChecklist && (
        <FirstRunChecklist
          projectId={projectId!}
          onDismiss={() => setShowFirstRunChecklist(false)}
        />
      )}

      {/* Top Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Link 
            to={user?.role === 'employee' ? "/standup" : "/projects"} 
            className="hover:text-gray-700 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {user?.role === 'employee' ? 'Standup' : 'Projects'}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{project.name}</span>
        </div>

        {/* Project Title and Status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mb-3">{project.description}</p>
            )}
            <div className="flex items-center space-x-3">
              {getStatusBadge(project.status)}
              {getRiskBadge(riskLevel)}
              <ProjectBadges projectId={project.id} />
            </div>
          </div>
          
          {/* Action Buttons */}
          {isManager && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRecompute}
                disabled={recomputing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${recomputing ? 'animate-spin' : ''}`} />
                Recompute
              </button>
              <button 
                onClick={handleAddMember}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </button>
              <button 
                onClick={handleEditProject}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button 
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Project Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Owner */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-medium text-sm">
                {project.owner.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{project.owner.name}</p>
              <p className="text-xs text-gray-500">Owner</p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-900">
                {formatDate(project.startDate)} → {formatDate(project.endDate)}
              </p>
              <p className="text-xs text-gray-500">Duration</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center">
            <BarChart3 className="w-4 h-4 text-gray-400 mr-2" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((project.progressCached || 0) * 100)}%
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    Updated {getTimeAgo(project.updatedAt)}
                  </span>
                  {isManager && (
                    <button
                      onClick={handleRecompute}
                      disabled={recomputing}
                      className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                      title="Recompute progress"
                    >
                      {recomputing ? 'Computing...' : 'Recompute'}
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (project.progressCached || 0) >= 0.8 ? 'bg-green-500' :
                    (project.progressCached || 0) >= 0.5 ? 'bg-yellow-500' :
                    (project.progressCached || 0) >= 0.2 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${(project.progressCached || 0) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Task Count */}
          <div className="flex items-center">
            <Target className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {project._count?.tasks || 0} tasks
              </p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3, visible: true },
              { id: 'tasks', label: 'Tasks', icon: Target, visible: true },
              { id: 'members', label: 'Members', icon: Users, visible: true },
              { id: 'search', label: 'Search', icon: Search, visible: canSearchProject },
              { id: 'settings', label: 'Settings', icon: Settings, visible: isManager }
            ].filter(tab => tab.visible).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && project && (
            <ProjectOverview project={{...project, tasks: getVisibleTasks(project.tasks)}} />
          )}

          {activeTab === 'tasks' && project && (
            <ProjectTasks 
              project={{...project, tasks: getVisibleTasks(project.tasks)}} 
              onTaskClick={handleTaskClick}
              onTaskOverride={handleTaskOverride}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onAddTask={handleAddTask}
              isManager={isManager}
            />
          )}


          {activeTab === 'members' && project && (
            <ProjectMembers 
              project={project} 
              onMemberUpdate={fetchProject}
              isManager={isManager}
            />
          )}

          {activeTab === 'search' && project && (
            <ProjectSearch 
              project={project} 
              onTaskClick={handleTaskClick}
              isManager={isManager}
            />
          )}

          {activeTab === 'settings' && project && (
            <div className="p-6">
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Settings</h3>
                <p className="text-gray-600 mb-6">
                  Configure how progress assessment and aggregation work for this project.
                </p>
                
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Drawer */}
      {showTaskDrawer && selectedTask && (
        <TaskDrawer
          task={selectedTask}
          isOpen={showTaskDrawer}
          onClose={() => setShowTaskDrawer(false)}
          onTaskUpdate={fetchProject}
          isManager={isManager}
        />
      )}

      {/* Manual Override Dialog */}
      {showManualOverride && selectedTask && (
        <ManualOverrideDialog
          task={selectedTask}
          isOpen={showManualOverride}
          onClose={() => setShowManualOverride(false)}
          onSuccess={() => {
            setShowManualOverride(false);
            fetchProject();
          }}
        />
      )}

      {/* Delete Project Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteDialog(false)}></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{project?.name}</strong>? 
                This will permanently remove the project and all associated data including tasks, sprints, and progress history.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    handleDeleteProject();
                  }}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSuccess={() => {
          // Refresh project data
          if (projectId) {
            fetchProject(projectId);
          }
        }}
        projectId={projectId || ''}
        existingMembers={project?.members?.map(m => m.userId) || []}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSuccess={() => {
          // Refresh project data
          if (projectId) {
            fetchProject(projectId);
          }
        }}
        projectId={projectId || ''}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showEditProjectModal}
        onClose={() => setShowEditProjectModal(false)}
        onSuccess={() => {
          // Refresh project data
          if (projectId) {
            fetchProject(projectId);
          }
        }}
        project={project}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        projectId={projectId || ''}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSuccess={() => {
          // Refresh project data to reflect settings changes
          if (projectId) {
            fetchProject(projectId);
          }
        }}
      />

      {/* Edit Task Modal */}
      {selectedTask && (
        <EditTaskModal
          task={selectedTask}
          isOpen={showEditTaskModal}
          onClose={() => setShowEditTaskModal(false)}
          onSuccess={() => {
            // Refresh project data to reflect task changes
            if (projectId) {
              fetchProject(projectId);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;