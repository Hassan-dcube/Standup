import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Calendar, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  TrendingUp,
  BarChart3,
  AlertCircle,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';
import ProjectBadges from './ProjectBadges';
import { ProjectVisualization } from './ProjectVisualization';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  owner: {
    id: string;
    name: string;
  };
  progressCached: number | null;
  activeSprint?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  taskStats?: {
    total: number;
    completed: number;
    blocked: number;
    overdue: number;
  };
  _count?: {
    sprints: number;
    tasks: number;
  };
}

interface BlockerHelpData {
  projectId: string;
  blockers: Array<{ user: string; text: string; date: string }>;
  helpNeeded: Array<{ user: string; text: string; date: string }>;
  lastUpdated: string;
}

const ProjectsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'on_hold'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [blockersHelpData, setBlockersHelpData] = useState<Record<string, BlockerHelpData>>({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        let projects = data.projects || [];
        
        // For employees, filter to show only projects they are assigned to
        if (user?.role === 'employee') {
          projects = projects.filter((project: any) => 
            project.members?.some((member: any) => member.userId === user.id)
          );
        }
        
        setProjects(projects);
        
        // Fetch blockers and help data for each project (only for managers)
        if (user?.role === 'manager' || user?.role === 'programme-manager') {
          fetchBlockersHelpData(projects);
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockersHelpData = async (projects: Project[]) => {
    const data: Record<string, BlockerHelpData> = {};
    
    for (const project of projects) {
      try {
        const response = await fetch(`http://localhost:4000/api/projects/${project.id}/blockers-help`);
        if (response.ok) {
          const blockerHelpData = await response.json();
          data[project.id] = blockerHelpData;
        }
      } catch (error) {
        console.error(`Error fetching blockers/help for project ${project.id}:`, error);
      }
    }
    
    setBlockersHelpData(data);
  };

  const getRiskLevel = (project: Project): 'LOW' | 'MEDIUM' | 'HIGH' => {
    // Handle missing taskStats gracefully
    const taskStats = project.taskStats || { blocked: 0, overdue: 0 };
    if (taskStats.blocked > 0 || taskStats.overdue > 0) {
      return 'HIGH';
    }
    if (project.progressCached && project.progressCached < 0.3) {
      return 'MEDIUM';
    }
    return 'LOW';
  };

  const getRiskBadge = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (riskLevel) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            High Risk
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Medium Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Low Risk
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Active
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            On Hold
          </span>
        );
      default:
        return null;
    }
  };

  const handleCreateSuccess = (projectId: string) => {
    // Navigate to the new project detail page
    navigate(`/projects/${projectId}`);
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status.toLowerCase() === filter;
  });

  // Check if user can create projects
  const canCreateProjects = user?.role === 'manager' || user?.role === 'programme-manager';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Back Button for Employees */}
          {user?.role === 'employee' && (
            <Link 
              to="/standup" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Standup"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Track and manage all your projects</p>
          </div>
        </div>
        {canCreateProjects && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All Projects' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'on_hold', label: 'On Hold' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Projects</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredProjects.map((project) => {
            const riskLevel = getRiskLevel(project);
            const progress = project.progressCached || 0;
            
            return (
              <div
                key={project.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <Link to={`/projects/${project.id}`} className="block">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {project.name}
                        </h3>
                        {getStatusBadge(project.status)}
                        {getRiskBadge(riskLevel)}
                        <ProjectBadges projectId={project.id} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {project.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Owner: {project.owner.name}</span>
                        {project.activeSprint && (
                          <span>Sprint: {project.activeSprint.name}</span>
                        )}
                        <span>
                          {project.taskStats ? 
                            `${project.taskStats.completed}/${project.taskStats.total} tasks` :
                            `${project._count?.tasks || 0} tasks`
                          }
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {Math.round(progress * 100)}%
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Project Visualizations - Only for Managers */}
                {(user?.role === 'manager' || user?.role === 'programme-manager') && (
                  <ProjectVisualization 
                    project={project} 
                    blockersHelpData={blockersHelpData[project.id]} 
                  />
                )}

                {/* Blockers and Help Needed - Only for Managers */}
                {(user?.role === 'manager' || user?.role === 'programme-manager') && blockersHelpData[project.id] && (
                  <div className="mt-3 space-y-2">
                    {/* Blockers */}
                    {blockersHelpData[project.id].blockers.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs font-medium text-red-700 mb-1">
                            Blockers ({blockersHelpData[project.id].blockers.length})
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {blockersHelpData[project.id].blockers.slice(0, 2).map((blocker, idx) => (
                              <div key={idx} className="truncate">
                                <span className="font-medium">{blocker.user}:</span> {blocker.text.substring(0, 100)}
                                {blocker.text.length > 100 && '...'}
                              </div>
                            ))}
                            {blockersHelpData[project.id].blockers.length > 2 && (
                              <div className="text-gray-500">
                                +{blockersHelpData[project.id].blockers.length - 2} more blockers
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Help Needed */}
                    {blockersHelpData[project.id].helpNeeded.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs font-medium text-blue-700 mb-1">
                            Help Needed ({blockersHelpData[project.id].helpNeeded.length})
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {blockersHelpData[project.id].helpNeeded.slice(0, 2).map((help, idx) => (
                              <div key={idx} className="truncate">
                                <span className="font-medium">{help.user}:</span> {help.text.substring(0, 100)}
                                {help.text.length > 100 && '...'}
                              </div>
                            ))}
                            {blockersHelpData[project.id].helpNeeded.length > 2 && (
                              <div className="text-gray-500">
                                +{blockersHelpData[project.id].helpNeeded.length - 2} more requests
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? "Get started by creating your first project."
              : `No ${filter} projects found.`
            }
          </p>
          {filter === 'all' && canCreateProjects && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New project
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default ProjectsListPage;
