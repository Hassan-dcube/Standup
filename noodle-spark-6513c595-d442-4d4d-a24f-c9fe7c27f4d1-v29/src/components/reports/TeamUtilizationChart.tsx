import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { team: 'Frontend', utilized: 85, capacity: 100, overtime: 5 },
  { team: 'Backend', utilized: 92, capacity: 100, overtime: 12 },
  { team: 'DevOps', utilized: 78, capacity: 100, overtime: 2 },
  { team: 'QA', utilized: 88, capacity: 100, overtime: 8 },
  { team: 'Design', utilized: 75, capacity: 100, overtime: 0 }
];

export function TeamUtilizationChart() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Team Utilization</h3>
        <p className="text-sm text-gray-600 mt-1">
          Current team capacity utilization and overtime hours
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="team" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="utilized" 
              fill="#3b82f6" 
              name="Utilized (%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="overtime" 
              fill="#f59e0b" 
              name="Overtime (%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-blue-600 font-medium">Avg Utilization</p>
          <p className="text-xl font-bold text-blue-700">83.6%</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-orange-600 font-medium">Avg Overtime</p>
          <p className="text-xl font-bold text-orange-700">5.4%</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-green-600 font-medium">Teams at Capacity</p>
          <p className="text-xl font-bold text-green-700">3/5</p>
        </div>
      </div>
    </div>
  );
}