import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

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

interface ManualOverrideDialogProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
}

const ManualOverrideDialog: React.FC<ManualOverrideDialogProps> = ({
  task,
  onClose,
  onComplete
}) => {
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState<'TODO' | 'DOING' | 'BLOCKED' | 'DONE'>(task.status);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for the override');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/task-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: task.id,
          percent: percent / 100, // Convert to decimal
          status,
          summary: `Manual override: ${reason}`,
          source: 'MANUAL'
        })
      });

      if (response.ok) {
        // Also update the task status if it changed
        if (status !== task.status) {
          await fetch(`http://localhost:4000/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
          });
        }

        onComplete();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update task progress');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      case 'DOING':
        return 'bg-blue-100 text-blue-800';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Manual Override</h3>
            <p className="text-sm text-gray-600 mt-1">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Progress Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress: {percent}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={percent}
              onChange={(e) => setPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['TODO', 'DOING', 'BLOCKED', 'DONE'] as const).map((statusOption) => (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => setStatus(statusOption)}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    status === statusOption
                      ? getStatusColor(statusOption)
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {statusOption}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Override *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're overriding the AI progress..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualOverrideDialog;
