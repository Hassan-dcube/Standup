import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Info } from 'lucide-react';

interface ProjectSettings {
  lookbackDays: number;
  weighting: 'points' | 'equal';
  smoothing: 'low' | 'med' | 'high';
  dailyJumpCap: number;
  ragTopK: number;
  triggersOnSubmit: boolean;
  triggersNightly: boolean;
}

interface ProjectSettingsModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [settings, setSettings] = useState<ProjectSettings>({
    lookbackDays: 7,
    weighting: 'points',
    smoothing: 'med',
    dailyJumpCap: 0.15,
    ragTopK: 15,
    triggersOnSubmit: true,
    triggersNightly: true
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, projectId]);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load settings');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      lookbackDays: 7,
      weighting: 'points',
      smoothing: 'med',
      dailyJumpCap: 0.15,
      ragTopK: 15,
      triggersOnSubmit: true,
      triggersNightly: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Project Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading settings...</span>
            </div>
          ) : (
            <>
              {/* Lookback Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lookback Days
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.lookbackDays}
                    onChange={(e) => setSettings({...settings, lookbackDays: parseInt(e.target.value) || 7})}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">days</span>
                  <div className="flex items-center text-gray-400">
                    <Info className="w-4 h-4 mr-1" />
                    <span className="text-xs">Days to look back for standup data</span>
                  </div>
                </div>
              </div>

              {/* Weighting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Weighting
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['points', 'equal'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSettings({...settings, weighting: option})}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        settings.weighting === option
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium capitalize">{option}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {option === 'points' ? 'Weight by estimate points' : 'Equal weight for all tasks'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Smoothing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Smoothing
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['low', 'med', 'high'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSettings({...settings, smoothing: option})}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        settings.smoothing === option
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium capitalize">{option}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {option === 'low' ? 'More responsive' : 
                         option === 'med' ? 'Balanced' : 'More stable'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Jump Cap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Jump Cap: {Math.round(settings.dailyJumpCap * 100)}%
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.05"
                    value={settings.dailyJumpCap}
                    onChange={(e) => setSettings({...settings, dailyJumpCap: parseFloat(e.target.value)})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center text-gray-400">
                    <Info className="w-4 h-4 mr-1" />
                    <span className="text-xs">Max daily progress increase</span>
                  </div>
                </div>
              </div>

              {/* RAG Top-K */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RAG Top-K: {settings.ragTopK} snippets
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="10"
                    max="20"
                    step="1"
                    value={settings.ragTopK}
                    onChange={(e) => setSettings({...settings, ragTopK: parseInt(e.target.value)})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center text-gray-400">
                    <Info className="w-4 h-4 mr-1" />
                    <span className="text-xs">Standup snippets to retrieve</span>
                  </div>
                </div>
              </div>

              {/* Triggers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assessment Triggers
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.triggersOnSubmit}
                      onChange={(e) => setSettings({...settings, triggersOnSubmit: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Trigger on standup submit</span>
                    <div className="ml-2 flex items-center text-gray-400">
                      <Info className="w-3 h-3 mr-1" />
                      <span className="text-xs">Assess progress when standup is submitted</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.triggersNightly}
                      onChange={(e) => setSettings({...settings, triggersNightly: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Trigger nightly batch</span>
                    <div className="ml-2 flex items-center text-gray-400">
                      <Info className="w-3 h-3 mr-1" />
                      <span className="text-xs">Run batch processing every morning</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Info className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Reset to Defaults
                </button>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;
