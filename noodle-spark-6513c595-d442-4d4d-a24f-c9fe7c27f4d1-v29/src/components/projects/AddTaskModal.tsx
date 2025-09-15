import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    acceptanceCriteria: '',
    estimatePoints: 1,
    dueDate: '',
    assigneeId: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      setError('Network error while loading users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          title: formData.title,
          description: formData.description,
          acceptanceCriteria: formData.acceptanceCriteria,
          estimatePoints: formData.estimatePoints,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          status: 'TODO',
          assigneeId: formData.assigneeId || null
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          title: '',
          description: '',
          acceptanceCriteria: '',
          estimatePoints: 1,
          dueDate: '',
          assigneeId: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Task</h2>
            <p className="text-sm text-gray-600 mt-1">Create a new task for this project</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
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

          <div className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the task..."
              />
            </div>

            {/* Acceptance Criteria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acceptance Criteria
              </label>
              <textarea
                value={formData.acceptanceCriteria}
                onChange={(e) => setFormData(prev => ({ ...prev, acceptanceCriteria: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Define what needs to be completed..."
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to (Optional)
              </label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No assignment</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimate Points and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimate Points
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.estimatePoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatePoints: parseInt(e.target.value) || 1 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
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
              disabled={!formData.title.trim() || loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
