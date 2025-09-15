import React, { useState } from 'react';
import { StandupBot } from './StandupBot';
import { StandupScheduler } from './StandupScheduler';
import { StandupHistory } from './StandupHistory';
import { StandupWeekCalendar } from './StandupWeekCalendar';
import { FloatingChatbot } from '../chatbot/FloatingChatbot';
import { Bot, Calendar, History, ArrowLeft, Clock, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function StandupPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bot' | 'scheduler' | 'history'>('bot');
  const [showWelcome, setShowWelcome] = useState(true);

  const tabs = [
    { id: 'bot', name: 'Standup Bot', icon: Bot },
    ...(user?.role === 'manager' ? [{ id: 'scheduler', name: 'Schedule', icon: Calendar }] : []),
    { id: 'history', name: 'History', icon: History }
  ];

  return (
    <div className="space-y-6">
      {/* Warm Welcome Note */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 relative">
          <button
            onClick={() => setShowWelcome(false)}
            className="absolute top-3 right-3 p-1 hover:bg-blue-100 rounded-full transition-colors"
            title="Close welcome message"
          >
            <X className="w-4 h-4 text-blue-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">
                Welcome back, {user?.name || 'Team Member'}!
              </h2>
              <p className="text-blue-700 mt-1">
                Ready to share your progress and keep the team connected? Let's make today productive together! 🚀
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            {user?.role === 'manager' && (
              <Link 
                to="/projects" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Projects"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Standup Management</h1>
              <p className="text-gray-600 mt-1">
                Automated standup meetings with Zoom/Teams integration for quick team check-ins.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Next Standup</p>
              <p className="text-lg font-semibold text-blue-600">Tomorrow 9:00 AM</p>
            </div>
            <div className="h-12 w-px bg-gray-300"></div>
            <div className="text-right">
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-lg font-semibold text-green-600">4/5 Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Calendar for Employees, Attendance Window for Managers */}
      {user?.role === 'employee' ? (
        <StandupWeekCalendar userId={user.id} />
      ) : (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">
                <span className="font-semibold">Important: Standup Attendance Window</span> 🕘 Standups must be attended between 9:00 AM - 11:00 AM daily
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'bot' && <StandupBot />}
          {activeTab === 'scheduler' && user?.role === 'manager' && <StandupScheduler />}
          {activeTab === 'history' && <StandupHistory />}
        </div>
      </div>
      
      {/* Floating AI Assistant */}
      <FloatingChatbot />
    </div>
  );
}