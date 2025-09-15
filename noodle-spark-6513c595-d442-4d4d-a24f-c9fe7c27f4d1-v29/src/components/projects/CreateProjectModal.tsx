import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { X, Plus, Calendar, Users, Settings, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: string;
}

interface CreateProjectData {
  name: string;
  ownerId: string;
  startAt: string;
  endAt: string;
  template: 'blank' | 'paper-writing';
  members: Array<{ userId: string; role: 'STUDENT' | 'CONTRIBUTOR' | 'MANAGER' }>;
  llmSettings: {
    lookbackDays: number;
    weighting: 'points';
    smoothing: 'medium';
    triggers: string[];
  };
  description?: string;
  sprint?: {
    name: string;
    startAt: string;
    endAt: string;
    goal?: string;
  };
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'quick' | 'advanced'>('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    ownerId: '',
    startAt: new Date().toISOString().split('T')[0],
    endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    template: 'blank',
    members: [],
    llmSettings: {
      lookbackDays: 7,
      weighting: 'points',
      smoothing: 'medium',
      triggers: ['onSubmit', 'nightly']
    }
  });

  const [duration, setDuration] = useState<'2' | '4' | '8' | 'custom'>('2');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, current user:', user);
      console.log('User ID:', user?.id);
      console.log('User role:', user?.role);
      fetchUsers();
      // Set default owner to current user from auth context
      if (user?.id) {
        setFormData(prev => ({ ...prev, ownerId: user.id }));
      }
    }
  }, [isOpen, user]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Found' : 'Not found');
      console.log('Token length:', token ? token.length : 0);
      console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
      
      if (!token) {
        console.error('No token found in localStorage');
        setError('Authentication required. Please log in again.');
        return;
      }

      console.log('Fetching users with token:', token.substring(0, 20) + '...', 'URL: http://localhost:4000/api/users');
      
      const response = await fetch('http://localhost:4000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Users response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        setUsers(data.users || []);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch users - Status:', response.status, 'Response:', errorText);
        setError('Failed to load users. Please try again.');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Network error while loading users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDurationChange = (newDuration: '2' | '4' | '8' | 'custom') => {
    setDuration(newDuration);
    
    if (newDuration !== 'custom') {
      const weeks = parseInt(newDuration);
      const startDate = new Date(formData.startAt);
      const endDate = new Date(startDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
      setFormData(prev => ({
        ...prev,
        endAt: endDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleMemberToggle = (userId: string, role: 'STUDENT' | 'CONTRIBUTOR' | 'MANAGER') => {
    setFormData(prev => {
      const existingIndex = prev.members.findIndex(m => m.userId === userId);
      
      if (existingIndex >= 0) {
        // Remove member
        return {
          ...prev,
          members: prev.members.filter(m => m.userId !== userId)
        };
      } else {
        // Add member
        return {
          ...prev,
          members: [...prev.members, { userId, role }]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const orgId = localStorage.getItem('orgId') || '';

      // Prepare payload
      const payload = {
        orgId,
        name: formData.name,
        ownerId: formData.ownerId,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        template: formData.template,
        members: formData.members,
        llmSettings: formData.llmSettings,
        ...(formData.description && { description: formData.description }),
        ...(formData.sprint && { sprint: formData.sprint })
      };

      const response = await fetch('http://localhost:4000/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        onClose();
        // Navigate to project detail with first-run checklist
        navigate(`/projects/${data.project.id}`, { 
          state: { isNewProject: true } 
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create project');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.ownerId;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
            <p className="text-sm text-gray-600 mt-1">Set up a new project to track team progress</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'quick'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Quick Setup
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'advanced'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Advanced
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Quick Tab */}
          {activeTab === 'quick' && (
            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>

              {/* Owner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner *
                </label>
                <select
                  value={formData.ownerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loadingUsers}
                >
                  <option value="">
                    {loadingUsers ? 'Loading users...' : 'Select owner'}
                  </option>
                  {/* Show current user as default option */}
                  {user && (user.role === 'manager' || user.role === 'programme-manager') && (
                    <option value={user.id}>{user.name} (You)</option>
                  )}
                  {/* Show other users */}
                  {users.filter(u => u.role === 'manager' || u.role === 'programme-manager').map(userOption => (
                    <option key={userOption.id} value={userOption.id}>
                      {userOption.name}
                    </option>
                  ))}
                </select>
                {loadingUsers && (
                  <p className="text-sm text-gray-500 mt-1">Loading available users...</p>
                )}
                {error && !loadingUsers && (
                  <div className="mt-2">
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                      type="button"
                      onClick={fetchUsers}
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Retry loading users
                    </button>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, startAt: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => handleDurationChange(e.target.value as any)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="2">2 weeks</option>
                    <option value="4">4 weeks</option>
                    <option value="8">8 weeks</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {duration === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, endAt: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={formData.template}
                  onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="blank">Blank Project</option>
                  <option value="paper-writing">Paper Writing & Submission</option>
                </select>
                {formData.template === 'paper-writing' && (
                  <p className="text-sm text-gray-600 mt-2">
                    This template will create Sprint 1 and 5 suggested tasks for academic paper writing.
                  </p>
                )}
              </div>

              {/* Members */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Members (Optional)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {users.map(user => {
                    const isSelected = formData.members.some(m => m.userId === user.id);
                    return (
                      <label key={user.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleMemberToggle(user.id, 'STUDENT')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900">{user.name}</span>
                        <span className="text-xs text-gray-500">({user.role})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the project goals and scope..."
                />
              </div>

              {/* Sprint 1 */}
              {formData.template !== 'blank' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Sprint 1 Setup</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sprint Name
                      </label>
                      <input
                        type="text"
                        value={formData.sprint?.name || 'Sprint 1'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sprint: { ...prev.sprint, name: e.target.value, startAt: prev.startAt, endAt: prev.endAt }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sprint Goal
                      </label>
                      <input
                        type="text"
                        value={formData.sprint?.goal || 'Complete first draft'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sprint: { ...prev.sprint, goal: e.target.value }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LLM Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">AI Progress Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lookback Window: {formData.llmSettings.lookbackDays} days
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="14"
                      value={formData.llmSettings.lookbackDays}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        llmSettings: { ...prev.llmSettings, lookbackDays: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>• Weighting: {formData.llmSettings.weighting}</p>
                    <p>• Smoothing: {formData.llmSettings.smoothing}</p>
                    <p>• Triggers: {formData.llmSettings.triggers.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Creating...' : 'Create & Open'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
