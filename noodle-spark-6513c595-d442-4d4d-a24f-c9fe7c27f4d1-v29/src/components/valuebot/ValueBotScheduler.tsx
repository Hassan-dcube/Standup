import React, { useState } from 'react';
import { Calendar, Clock, Edit, Trash2, Info, Users, Target } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { clsx } from 'clsx';

interface ScheduledValueSession {
  id: string;
  title: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  time: string;
  days?: string[];
  duration: number;
  active: boolean;
  participants: string[];
  programme: string;
}

export function ValueBotScheduler() {
  const [sessions, setSessions] = useState<ScheduledValueSession[]>([
    {
      id: '1',
      title: 'Weekly Engineering Value Assessment',
      frequency: 'weekly',
      time: '14:00',
      days: ['Friday'],
      duration: 5,
      active: true,
      participants: ['All Engineering Team'],
      programme: 'Digital Transformation'
    },
    {
      id: '2',
      title: 'Infrastructure Value Review',
      frequency: 'bi-weekly',
      time: '15:30',
      days: ['Monday'],
      duration: 4,
      active: true,
      participants: ['DevOps Team', 'Platform Engineering'],
      programme: 'Platform Modernization'
    }
  ]);
  
  const [editingSession, setEditingSession] = useState<ScheduledValueSession | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    frequency: 'weekly' as 'weekly' | 'bi-weekly' | 'monthly',
    time: '14:00',
    days: [] as string[],
    duration: 5,
    participants: [] as string[],
    programme: ''
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const programmes = ['Digital Transformation', 'Platform Modernization', 'Security & Compliance', 'Data Analytics'];
  const teams = ['All Engineering Team', 'Frontend Team', 'Backend Team', 'DevOps Team', 'QA Team', 'Platform Engineering'];

  const handleEditSession = () => {
    if (editingSession) {
      setSessions(sessions.map(s => 
        s.id === editingSession.id 
          ? { ...editingSession, ...formData }
          : s
      ));
      setEditingSession(null);
      setShowEditForm(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      frequency: 'weekly',
      time: '14:00',
      days: [],
      duration: 5,
      participants: [],
      programme: ''
    });
  };

  const openEditForm = (session: ScheduledValueSession) => {
    setFormData({
      title: session.title,
      frequency: session.frequency,
      time: session.time,
      days: session.days || [],
      duration: session.duration,
      participants: session.participants,
      programme: session.programme
    });
    setEditingSession(session);
    setShowEditForm(true);
  };

  const toggleSessionActive = (id: string) => {
    setSessions(sessions.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  const deleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const toggleParticipant = (participant: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(participant)
        ? prev.participants.filter(p => p !== participant)
        : [...prev.participants, participant]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Scheduled Trigger Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 Automated Value Assessment Triggers</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p className="font-medium">⏰ Scheduled sessions trigger automatically at configured times</p>
              <p>• Participants receive notifications 15 minutes before session</p>
              <p>• Sessions auto-expire after 24 hours if not completed</p>
              <p>• Results are automatically mapped to programme data structures</p>
              <p>• AI analysis runs immediately after session completion</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Value Assessments</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure automated value assessment sessions for different teams and programmes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{session.title}</h4>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="capitalize">{session.frequency}</span>
                    {session.frequency !== 'monthly' && session.days && (
                      <span className="ml-1">({session.days.join(', ')})</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{session.time} ({session.duration}min)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditForm(session)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">Programme:</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-blue-100">
                    <Target className="h-4 w-4 text-blue-700" />
                  </div>
                  <span className="text-sm font-medium">{session.programme}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Participants:</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-green-100">
                    <Users className="h-4 w-4 text-green-700" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {session.participants.map((participant, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex items-center">
                  <div className={clsx(
                    'w-3 h-3 rounded-full mr-2',
                    session.active ? 'bg-green-500' : 'bg-gray-400'
                  )}></div>
                  <span className={clsx(
                    'text-sm font-medium',
                    session.active ? 'text-green-700' : 'text-gray-500'
                  )}>
                    {session.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => toggleSessionActive(session.id)}
                  className={clsx(
                    'px-3 py-1 rounded text-xs font-medium',
                    session.active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  )}
                >
                  {session.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-green-800 mb-2">Integration Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
          <div>
            <p className="font-medium mb-1">Programme Mapping:</p>
            <p>• Automatic mapping to Programme → Phase → Component → Task Type</p>
            <p>• Real-time data integration with forecasting dashboards</p>
          </div>
          <div>
            <p className="font-medium mb-1">Business Intelligence:</p>
            <p>• AI-generated metrics and insights for leadership</p>
            <p>• Connects engineering work to measurable business outcomes</p>
          </div>
        </div>
      </div>

      <Dialog.Root open={showEditForm} onOpenChange={setShowEditForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-3xl z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-6">
              Edit Value Assessment Schedule
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
                  placeholder="Enter assessment title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
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

              {formData.frequency !== 'monthly' && (
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
                    Programme
                  </label>
                  <select
                    value={formData.programme}
                    onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Programme</option>
                    {programmes.map((programme) => (
                      <option key={programme} value={programme}>{programme}</option>
                    ))}
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
                    <option value={3}>3 minutes</option>
                    <option value={4}>4 minutes</option>
                    <option value={5}>5 minutes</option>
                    <option value={7}>7 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participants
                </label>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <label key={team} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.participants.includes(team)}
                        onChange={() => toggleParticipant(team)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{team}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Dialog.Close asChild>
                <button 
                  onClick={() => {
                    setEditingSession(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleEditSession}
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