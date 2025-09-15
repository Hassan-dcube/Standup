import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { month: 'Jan', budgeted: 500000, actual: 485000, forecast: 490000 },
  { month: 'Feb', budgeted: 520000, actual: 512000, forecast: 515000 },
  { month: 'Mar', budgeted: 480000, actual: 495000, forecast: 488000 },
  { month: 'Apr', budgeted: 550000, actual: 535000, forecast: 540000 },
  { month: 'May', budgeted: 530000, actual: 525000, forecast: 528000 },
  { month: 'Jun', budgeted: 580000, actual: 575000, forecast: 578000 }
];

export function BudgetAnalysisChart() {
  const formatCurrency = (value: number) => {
    return `£${(value / 1000).toFixed(0)}K`;
  };

  const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
  const variance = ((totalActual - totalBudgeted) / totalBudgeted) * 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Budget Analysis</h3>
        <p className="text-sm text-gray-600 mt-1">
          Comparison of budgeted vs actual spending with forecasts
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="budgetedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [formatCurrency(value), '']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="budgeted"
              stroke="#3b82f6"
              fill="url(#budgetedGradient)"
              name="Budgeted"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              fill="url(#actualGradient)"
              name="Actual"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#f59e0b"
              strokeDasharray="5 5"
              name="Forecast"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-blue-600 font-medium">Total Budgeted</p>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-green-600 font-medium">Total Actual</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalActual)}</p>
        </div>
        <div className={`rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md ${variance >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className={`text-sm font-medium ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            Budget Variance
          </p>
          <p className={`text-xl font-bold ${variance >= 0 ? 'text-red-700' : 'text-green-700'}`}>
            {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-orange-600 font-medium">Projected EOY</p>
          <p className="text-xl font-bold text-orange-700">£6.4M</p>
        </div>
      </div>
    </div>
  );
}