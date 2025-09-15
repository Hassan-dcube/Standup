import React, { useState } from 'react';
import { Calendar, Clock, Edit, Trash2, Info } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { clsx } from 'clsx';

interface ScheduledStandup {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  time: string;
  days?: string[];
  platform: 'zoom' | 'teams';
  duration: number;
  active: boolean;
}

export function StandupScheduler() {
  const [standups, setStandups] = useState<ScheduledStandup[]>([
    {
      id: '1',
      title: 'Daily Engineering Standup',
      frequency: 'daily',
      time: '09:00',
      platform: 'zoom',
      duration: 3,
      active: true
    },
    {
      id: '2',
      title: 'Weekly Team Sync',
      frequency: 'weekly',
      time: '14:00',
      days: ['Monday'],
      platform: 'teams',
      duration: 5,
      active: true
    }
  ]);
  
  const [editingStandup, setEditingStandup] = useState<ScheduledStandup | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    frequency: 'daily' as 'daily' | 'weekly',
    time: '09:00',
    days: [] as string[],
    platform: 'zoom' as 'zoom' | 'teams',
    duration: 3
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const handleEditStandup = () => {
    if (editingStandup) {
      setStandups(standups.map(s => 
        s.id === editingStandup.id 
          ? { ...editingStandup, ...formData }
          : s
      ));
      setEditingStandup(null);
      setShowEditForm(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      frequency: 'daily',
      time: '09:00',
      days: [],
      platform: 'zoom',
      duration: 3
    });
  };

  const openEditForm = (standup: ScheduledStandup) => {
    setFormData({
      title: standup.title,
      frequency: standup.frequency,
      time: standup.time,
      days: standup.days || [],
      platform: standup.platform,
      duration: standup.duration
    });
    setEditingStandup(standup);
    setShowEditForm(true);
  };

  const toggleStandupActive = (id: string) => {
    setStandups(standups.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  const deleteStandup = (id: string) => {
    setStandups(standups.filter(s => s.id !== id));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Standups</h3>
          <p className="text-sm text-gray-600 mt-1">
            View and manage existing standup schedules. Participants are managed automatically by the Standup Bot.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {standups.map((standup) => (
          <div key={standup.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{standup.title}</h4>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="capitalize">{standup.frequency}</span>
                    {standup.frequency === 'weekly' && standup.days && (
                      <span className="ml-1">({standup.days.join(', ')})</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{standup.time} ({standup.duration}min)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditForm(standup)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteStandup(standup.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">Platform:</p>
                <div className="flex items-center">
                  <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center mr-3',
                    standup.platform === 'zoom' ? 'bg-blue-100' : 'bg-purple-100'
                  )}>
                    <span className={clsx(
                      'text-xs font-medium',
                      standup.platform === 'zoom' ? 'text-blue-700' : 'text-purple-700'
                    )}>
                      {standup.platform === 'zoom' ? 'Z' : 'T'}
                    </span>
                  </div>
                  <span className="text-sm font-medium capitalize">{standup.platform}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex items-center">
                  <div className={clsx(
                    'w-3 h-3 rounded-full mr-2',
                    standup.active ? 'bg-green-500' : 'bg-gray-400'
                  )}></div>
                  <span className={clsx(
                    'text-sm font-medium',
                    standup.active ? 'text-green-700' : 'text-gray-500'
                  )}>
                    {standup.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => toggleStandupActive(standup.id)}
                  className={clsx(
                    'px-3 py-1 rounded text-xs font-medium',
                    standup.active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  )}
                >
                  {standup.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Automated Management</h4>
        <p className="text-sm text-blue-700">
          Standup participants are automatically managed by the Standup Bot. Team members can join scheduled standups using the bot interface, and attendance is tracked automatically.
        </p>
      </div>

      <Dialog.Root open={showEditForm} onOpenChange={setShowEditForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-6">
              Edit Standup Schedule
            </Dialog.Title>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter standup title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'daily' | 'weekly' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={clsx(
                          'px-3 py-2 rounded-lg text-sm font-medium',
                          formData.days.includes(day)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as 'zoom' | 'teams' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={2}>2 minutes</option>
                    <option value={3}>3 minutes</option>
                    <option value={4}>4 minutes</option>
                    <option value={5}>5 minutes</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Dialog.Close asChild>
                <button 
                  onClick={() => {
                    setEditingStandup(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleEditStandup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Schedule
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}