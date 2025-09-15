import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const forecastData = [
  { month: 'Jan 2024', actual: 2400000, forecast: 2350000, confidence: { upper: 2500000, lower: 2200000 } },
  { month: 'Feb 2024', actual: 2600000, forecast: 2580000, confidence: { upper: 2750000, lower: 2420000 } },
  { month: 'Mar 2024', actual: 2800000, forecast: 2820000, confidence: { upper: 3000000, lower: 2640000 } },
  { month: 'Apr 2024', actual: null, forecast: 3100000, confidence: { upper: 3350000, lower: 2850000 } },
  { month: 'May 2024', actual: null, forecast: 3350000, confidence: { upper: 3650000, lower: 3050000 } },
  { month: 'Jun 2024', actual: null, forecast: 3600000, confidence: { upper: 3950000, lower: 3250000 } },
  { month: 'Jul 2024', actual: null, forecast: 3800000, confidence: { upper: 4200000, lower: 3400000 } },
  { month: 'Aug 2024', actual: null, forecast: 4000000, confidence: { upper: 4450000, lower: 3550000 } }
];

const kpiData = [
  { title: 'Projected Completion', value: 'Aug 2024', change: '+2 weeks', status: 'warning' },
  { title: 'Budget Forecast', value: '£28.4M', change: '+£1.2M', status: 'warning' },
  { title: 'Resource Efficiency', value: '87%', change: '+3%', status: 'positive' },
  { title: 'Risk Score', value: 'Medium', change: 'Stable', status: 'neutral' }
];

export function ForecastChart() {
  const formatCurrency = (value: number) => {
    return `£${(value / 1000000).toFixed(1)}M`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
            <p className="text-sm text-gray-600 font-medium">{kpi.title}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            <p className={`text-sm mt-1 px-2 py-1 rounded-full inline-block ${getStatusColor(kpi.status)}`}>
              {kpi.change}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Programme Spend Forecast</h3>
          <p className="text-sm text-gray-600 mt-1">
            Projected spend with confidence intervals based on historical data and current trends
          </p>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
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
              
              {/* Confidence interval */}
              <Area
                type="monotone"
                dataKey="confidence.upper"
                stroke="none"
                fill="url(#confidenceGradient)"
                name="Confidence Interval"
              />
              <Area
                type="monotone"
                dataKey="confidence.lower"
                stroke="none"
                fill="#ffffff"
              />
              
              {/* Actual spend line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={3}
                name="Actual Spend"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                connectNulls={false}
              />
              
              {/* Forecast line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#3b82f6"
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Forecast"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-yellow-800 mb-3">Key Assumptions</h4>
          <ul className="space-y-2 text-sm text-yellow-700">
            <li>• Resource allocation remains consistent with Q1 levels</li>
            <li>• No major scope changes or new requirements</li>
            <li>• External vendor costs increase by 3% annually</li>
            <li>• Technology platform migration completed by May</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">Risk Factors</h4>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>• Potential resource constraints in Q3</li>
            <li>• Dependencies on external API integrations</li>
            <li>• Regulatory compliance requirements may change</li>
            <li>• Market conditions affecting vendor pricing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}