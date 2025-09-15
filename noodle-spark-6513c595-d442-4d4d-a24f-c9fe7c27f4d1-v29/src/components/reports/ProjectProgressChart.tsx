import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Completed', value: 45, color: '#10b981' },
  { name: 'In Progress', value: 30, color: '#3b82f6' },
  { name: 'On Hold', value: 15, color: '#f59e0b' },
  { name: 'Not Started', value: 10, color: '#6b7280' }
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'];

export function ProjectProgressChart() {
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Project Status Overview</h3>
        <p className="text-sm text-gray-600 mt-1">
          Distribution of projects by current status
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-3 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-green-600 font-medium">Completion Rate</p>
          <p className="text-xl font-bold text-green-700">75%</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-blue-600 font-medium">Active Projects</p>
          <p className="text-xl font-bold text-blue-700">18</p>
        </div>
      </div>
    </div>
  );
}