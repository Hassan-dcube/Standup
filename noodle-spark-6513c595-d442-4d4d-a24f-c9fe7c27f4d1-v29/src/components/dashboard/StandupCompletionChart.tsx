import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const completionData = [
  { week: 'Week 1', completionRate: 85, target: 90, participants: 12 },
  { week: 'Week 2', completionRate: 78, target: 90, participants: 14 },
  { week: 'Week 3', completionRate: 92, target: 90, participants: 13 },
  { week: 'Week 4', completionRate: 88, target: 90, participants: 15 },
  { week: 'Week 5', completionRate: 94, target: 90, participants: 14 },
  { week: 'Week 6', completionRate: 91, target: 90, participants: 16 },
  { week: 'Week 7', completionRate: 87, target: 90, participants: 15 },
  { week: 'Week 8', completionRate: 96, target: 90, participants: 17 }
];

export function StandupCompletionChart() {
  const currentRate = completionData[completionData.length - 1].completionRate;
  const previousRate = completionData[completionData.length - 2].completionRate;
  const trend = currentRate - previousRate;
  const averageRate = Math.round(completionData.reduce((sum, item) => sum + item.completionRate, 0) / completionData.length);
  
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };
  
  const getTrendColor = () => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Standup Completion Trends</h3>
          <div className="flex items-center space-x-2 text-sm">
            {getTrendIcon()}
            <span className={`font-medium ${getTrendColor()}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Weekly completion rates with trend analysis and target comparison
        </p>
      </div>
      
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={completionData}>
            <defs>
              <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="week" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              domain={[70, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value, name) => {
                if (name === 'completionRate') return [`${value}%`, 'Completion Rate'];
                if (name === 'target') return [`${value}%`, 'Target'];
                if (name === 'participants') return [value, 'Participants'];
                return [value, name];
              }}
            />
            <Area
              type="monotone"
              dataKey="completionRate"
              stroke="#3b82f6"
              fill="url(#completionGradient)"
              strokeWidth={3}
              name="completionRate"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={2}
              name="target"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-blue-600 font-medium">Current Rate</p>
          <p className="text-2xl font-bold text-blue-700">{currentRate}%</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-green-600 font-medium">Average Rate</p>
          <p className="text-2xl font-bold text-green-700">{averageRate}%</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-orange-600 font-medium">Target</p>
          <p className="text-2xl font-bold text-orange-700">90%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-purple-600 font-medium">Weekly Trend</p>
          <div className="flex items-center">
            <p className={`text-2xl font-bold ${getTrendColor()}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </p>
            <div className="ml-2">
              {getTrendIcon()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Completion Rate</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-1 bg-orange-500 mr-2"></div>
              <span className="text-gray-600">Target (90%)</span>
            </div>
          </div>
          <div className="text-gray-500">
            Last 8 weeks
          </div>
        </div>
      </div>
    </div>
  );
}