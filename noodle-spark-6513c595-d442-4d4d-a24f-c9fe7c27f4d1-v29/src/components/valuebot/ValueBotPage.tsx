import React, { useState } from 'react';
import { ValueBot } from './ValueBot';
import { ValueBotHistory } from './ValueBotHistory';
import { ValueBotScheduler } from './ValueBotScheduler';
import { TrendingUp, Calendar, History, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export function ValueBotPage() {
  const [activeTab, setActiveTab] = useState<'bot' | 'scheduler' | 'history'>('bot');

  const tabs = [
    { id: 'bot', name: 'Value Bot', icon: TrendingUp },
    { id: 'scheduler', name: 'Schedule', icon: Calendar },
    { id: 'history', name: 'History', icon: History }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Link 
              to="/dashboard" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Value Assessment Bot</h1>
              <p className="text-gray-600 mt-1">
                AI-powered business value analysis and engineering contribution mapping.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Next Session</p>
              <p className="text-lg font-semibold text-blue-600">Friday 2:00 PM</p>
            </div>
            <div className="h-12 w-px bg-gray-300"></div>
            <div className="text-right">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-lg font-semibold text-green-600">3/4 Completed</p>
            </div>
          </div>
        </div>
      </div>

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
          {activeTab === 'bot' && <ValueBot />}
          {activeTab === 'scheduler' && <ValueBotScheduler />}
          {activeTab === 'history' && <ValueBotHistory />}
        </div>
      </div>
    </div>
  );
}