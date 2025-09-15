import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const resourceData = [
  { month: 'Apr', developers: 12, designers: 3, qa: 4, devops: 2, required: 21, available: 19 },
  { month: 'May', developers: 14, designers: 4, qa: 5, devops: 2, required: 25, available: 22 },
  { month: 'Jun', developers: 16, designers: 4, qa: 6, devops: 3, required: 29, available: 26 },
  { month: 'Jul', developers: 18, designers: 5, qa: 6, devops: 3, required: 32, available: 28 },
  { month: 'Aug', developers: 16, designers: 4, qa: 5, devops: 2, required: 27, available: 25 }
];

const skillsData = [
  { name: 'Frontend', current: 8, needed: 12, gap: 4 },
  { name: 'Backend', current: 10, needed: 14, gap: 4 },
  { name: 'DevOps', current: 3, needed: 5, gap: 2 },
  { name: 'QA', current: 6, needed: 8, gap: 2 },
  { name: 'Design', current: 4, needed: 6, gap: 2 },
  { name: 'Data', current: 2, needed: 4, gap: 2 }
];

const utilizationData = [
  { name: 'Billable', value: 75, color: '#10b981' },
  { name: 'Training', value: 10, color: '#3b82f6' },
  { name: 'Admin', value: 8, color: '#f59e0b' },
  { name: 'Available', value: 7, color: '#6b7280' }
];

export function ResourcePlanning() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-blue-600 font-medium">Total Resources</p>
          <p className="text-2xl font-bold text-blue-700">28</p>
          <p className="text-xs text-blue-600 mt-1">+3 from last month</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-orange-600 font-medium">Resource Gap</p>
          <p className="text-2xl font-bold text-orange-700">16</p>
          <p className="text-xs text-orange-600 mt-1">Positions to fill</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-green-600 font-medium">Utilization</p>
          <p className="text-2xl font-bold text-green-700">85%</p>
          <p className="text-xs text-green-600 mt-1">Above target (80%)</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md">
          <p className="text-sm text-purple-600 font-medium">Avg. Cost/Month</p>
          <p className="text-2xl font-bold text-purple-700">£8.5K</p>
          <p className="text-xs text-purple-600 mt-1">Per resource</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Demand vs Supply</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData}>
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
                <Bar dataKey="required" fill="#f59e0b" name="Required" />
                <Bar dataKey="available" fill="#10b981" name="Available" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Gap Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Skill Area</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Current</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Needed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Gap</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {skillsData.map((skill, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{skill.name}</td>
                  <td className="py-3 px-4 text-gray-600">{skill.current}</td>
                  <td className="py-3 px-4 text-gray-600">{skill.needed}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      skill.gap > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {skill.gap > 0 ? `+${skill.gap}` : skill.gap}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {skill.gap > 0 ? (
                      <span className="text-blue-600 text-sm">Hire {skill.gap} resources</span>
                    ) : (
                      <span className="text-green-600 text-sm">Sufficient</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">Recruitment Recommendations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-blue-800 mb-2">Priority Hires (Q2 2024)</h5>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• 2 Senior Frontend Developers</li>
              <li>• 1 DevOps Engineer</li>
              <li>• 2 QA Engineers</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 mb-2">Future Planning (Q3 2024)</h5>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• 2 Backend Developers</li>
              <li>• 1 UX Designer</li>
              <li>• 2 Data Engineers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}