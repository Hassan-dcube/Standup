import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';
import { TrendingUp, Target, AlertTriangle, CheckCircle, Calendar, Users } from 'lucide-react';
import { clsx } from 'clsx';

const accuracyData = [
  { month: 'Jan', actual: 87, forecast: 85, variance: 2 },
  { month: 'Feb', actual: 91, forecast: 88, variance: 3 },
  { month: 'Mar', actual: 89, forecast: 92, variance: -3 },
  { month: 'Apr', actual: 94, forecast: 90, variance: 4 },
  { month: 'May', actual: 88, forecast: 93, variance: -5 },
  { month: 'Jun', actual: 96, forecast: 94, variance: 2 }
];

const timesheetVsForecast = [
  { week: 'W1', timesheetHours: 320, forecastHours: 310, accuracy: 96.9 },
  { week: 'W2', timesheetHours: 335, forecastHours: 340, accuracy: 98.5 },
  { week: 'W3', timesheetHours: 298, forecastHours: 320, accuracy: 93.1 },
  { week: 'W4', timesheetHours: 342, forecastHours: 330, accuracy: 96.4 },
  { week: 'W5', timesheetHours: 315, forecastHours: 315, accuracy: 100 },
  { week: 'W6', timesheetHours: 328, forecastHours: 325, accuracy: 99.1 }
];

const improvementMetrics = [
  { title: 'Model Accuracy Trend', value: '+3.2%', status: 'positive', description: 'Last 30 days vs previous period' },
  { title: 'Variance Reduction', value: '18%', status: 'positive', description: 'Actual vs forecast gap narrowing' },
  { title: 'Prediction Confidence', value: '94.3%', status: 'positive', description: 'Average confidence score' },
  { title: 'Auto-corrections Made', value: '127', status: 'neutral', description: 'ML model adjustments this month' }
];

const learningInsights = [
  { insight: 'Frontend tasks consistently take 15% longer than estimated', impact: 'High', action: 'Adjust estimation models' },
  { insight: 'Team productivity peaks on Tuesday-Thursday', impact: 'Medium', action: 'Optimize sprint planning' },
  { insight: 'Project Alpha scope creep detected', impact: 'High', action: 'Stakeholder alignment needed' },
  { insight: 'QA phase duration varies by 40% between projects', impact: 'Medium', action: 'Standardize QA processes' }
];

export function ContinuousImprovementDashboard() {
  const [timeframe, setTimeframe] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('accuracy');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Continuous Improvement Analytics</h2>
            <p className="text-gray-600 mt-1">
              AI-driven insights comparing timesheet actuals vs forecasting model accuracy
            </p>
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="3months">Last 3 months</option>
            <option value="6months">Last 6 months</option>
            <option value="12months">Last 12 months</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {improvementMetrics.map((metric, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">{metric.title}</h4>
                <div className={clsx('w-2 h-2 rounded-full', getStatusColor(metric.status))}></div>
              </div>
              <p className={clsx('text-2xl font-bold mb-1', getStatusColor(metric.status))}>
                {metric.value}
              </p>
              <p className="text-xs text-gray-600">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast vs Actual Accuracy</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accuracyData}>
                <defs>
                  <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  fill="url(#accuracyGradient)"
                  name="Actual Performance"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  name="Forecast"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Timesheet vs Forecast Hours</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timesheetVsForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="timesheetHours" fill="#10b981" name="Timesheet Actual" />
                <Bar dataKey="forecastHours" fill="#3b82f6" name="Forecast" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Learning Insights</h3>
        <div className="space-y-4">
          {learningInsights.map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">{item.insight}</p>
                  <p className="text-sm text-gray-600">{item.action}</p>
                </div>
                <div className="ml-4">
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getImpactColor(item.impact)
                  )}>
                    {item.impact} Impact
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="text-lg font-semibold text-blue-800">Model Performance Summary</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">96.2%</p>
            <p className="text-sm text-blue-600">Average Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">-2.3%</p>
            <p className="text-sm text-blue-600">Variance Reduction</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">47</p>
            <p className="text-sm text-blue-600">Model Improvements</p>
          </div>
        </div>
      </div>
    </div>
  );
}