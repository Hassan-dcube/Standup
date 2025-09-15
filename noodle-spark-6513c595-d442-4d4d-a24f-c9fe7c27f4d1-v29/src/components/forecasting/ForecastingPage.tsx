import React, { useState, useEffect } from 'react';
import { ResourcePlanning } from './ResourcePlanning';
import { ScenarioAnalysis } from './ScenarioAnalysis';
import { TrendingUp, Calendar, Users, DollarSign, Zap, RefreshCw, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export function ForecastingPage() {
  const [activeTab, setActiveTab] = useState<'forecast' | 'resources' | 'scenarios'>('forecast');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const [forecastAccuracy, setForecastAccuracy] = useState(92);

  const tabs = [
    { id: 'forecast', name: 'Real-time Forecast', icon: TrendingUp },
    { id: 'resources', name: 'Resource Planning', icon: Users },
    { id: 'scenarios', name: 'Scenario Analysis', icon: Calendar }
  ];

  useEffect(() => {
    if (autoUpdate) {
      const interval = setInterval(() => {
        simulateUpdate();
      }, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoUpdate]);

  const simulateUpdate = async () => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setForecastAccuracy(prev => Math.max(85, Math.min(98, prev + (Math.random() - 0.5) * 2)));
    setIsUpdating(false);
  };

  const manualUpdate = () => {
    simulateUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Link 
              to="/projects" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Projects"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Programme Forecasting</h1>
              <p className="text-gray-600 mt-1">
                AI-powered predictive analytics with real-time scope and timeline adjustments.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAutoUpdate(!autoUpdate)}
                className={clsx(
                  'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  autoUpdate
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Zap className={clsx('h-4 w-4 mr-2', autoUpdate && 'animate-pulse')} />
                Auto-Update {autoUpdate ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={manualUpdate}
                disabled={isUpdating}
                className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
              >
                <RefreshCw className={clsx('h-4 w-4 mr-2', isUpdating && 'animate-spin')} />
                Refresh
              </button>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Forecast Accuracy</p>
              <p className="text-lg font-semibold text-green-600">{forecastAccuracy.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {autoUpdate && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Zap className="h-4 w-4 text-blue-600 mr-2 animate-pulse" />
              <span className="text-sm text-blue-800">
                Real-time monitoring active - Forecast updates automatically when scope or timeline changes are detected
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
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
          {activeTab === 'forecast' && (
            <div className="text-center py-8 text-gray-500">
              <p>Forecast charts will be available here.</p>
            </div>
          )}
          {activeTab === 'resources' && <ResourcePlanning />}
          {activeTab === 'scenarios' && <ScenarioAnalysis />}
        </div>
      </div>
    </div>
  );
}