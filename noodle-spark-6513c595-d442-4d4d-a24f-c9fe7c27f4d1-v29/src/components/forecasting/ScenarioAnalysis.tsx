import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as Tabs from '@radix-ui/react-tabs';

const scenarioData = {
  optimistic: [
    { month: 'Apr', budget: 3000000, timeline: 95, resources: 28 },
    { month: 'May', budget: 3200000, timeline: 90, resources: 30 },
    { month: 'Jun', budget: 3400000, timeline: 85, resources: 32 },
    { month: 'Jul', budget: 3600000, timeline: 75, resources: 34 },
    { month: 'Aug', budget: 3750000, timeline: 60, resources: 35 }
  ],
  realistic: [
    { month: 'Apr', budget: 3100000, timeline: 90, resources: 25 },
    { month: 'May', budget: 3350000, timeline: 82, resources: 27 },
    { month: 'Jun', budget: 3600000, timeline: 74, resources: 29 },
    { month: 'Jul', budget: 3850000, timeline: 60, resources: 30 },
    { month: 'Aug', budget: 4000000, timeline: 45, resources: 28 }
  ],
  pessimistic: [
    { month: 'Apr', budget: 3200000, timeline: 85, resources: 22 },
    { month: 'May', budget: 3500000, timeline: 75, resources: 23 },
    { month: 'Jun', budget: 3850000, timeline: 65, resources: 25 },
    { month: 'Jul', budget: 4150000, timeline: 50, resources: 26 },
    { month: 'Aug', budget: 4400000, timeline: 30, resources: 24 }
  ]
};

const combinedData = scenarioData.realistic.map((item, index) => ({
  month: item.month,
  optimistic_budget: scenarioData.optimistic[index].budget,
  realistic_budget: item.budget,
  pessimistic_budget: scenarioData.pessimistic[index].budget,
  optimistic_timeline: scenarioData.optimistic[index].timeline,
  realistic_timeline: item.timeline,
  pessimistic_timeline: scenarioData.pessimistic[index].timeline
}));

const scenarios = [
  {
    id: 'optimistic',
    name: 'Optimistic Scenario',
    description: 'All conditions favorable, no major blockers',
    probability: '20%',
    completion: 'July 2024',
    budget: '£3.75M',
    confidence: 'High',
    color: '#10b981'
  },
  {
    id: 'realistic',
    name: 'Realistic Scenario',
    description: 'Expected performance with normal challenges',
    probability: '60%',
    completion: 'August 2024',
    budget: '£4.0M',
    confidence: 'Medium',
    color: '#3b82f6'
  },
  {
    id: 'pessimistic',
    name: 'Pessimistic Scenario',
    description: 'Significant challenges and resource constraints',
    probability: '20%',
    completion: 'September 2024',
    budget: '£4.4M',
    confidence: 'Low',
    color: '#f59e0b'
  }
];

export function ScenarioAnalysis() {
  const [activeMetric, setActiveMetric] = useState<'budget' | 'timeline'>('budget');

  const formatCurrency = (value: number) => {
    return `£${(value / 1000000).toFixed(1)}M`;
  };

  const formatTimeline = (value: number) => {
    return `${value}%`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{scenario.name}</h4>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: scenario.color }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Probability:</span>
                <span className="font-medium">{scenario.probability}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completion:</span>
                <span className="font-medium">{scenario.completion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Budget:</span>
                <span className="font-medium">{scenario.budget}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Confidence:</span>
                <span className={`font-medium ${
                  scenario.confidence === 'High' ? 'text-green-600' :
                  scenario.confidence === 'Medium' ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {scenario.confidence}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Tabs.Root value={activeMetric} onValueChange={(value) => setActiveMetric(value as any)}>
        <Tabs.List className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Tabs.Trigger 
            value="budget"
            className="flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600"
          >
            Budget Scenarios
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="timeline"
            className="flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600"
          >
            Timeline Scenarios
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="budget" className="mt-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Projection by Scenario</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={formatCurrency} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="optimistic_budget" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Optimistic"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="realistic_budget" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Realistic"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pessimistic_budget" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    name="Pessimistic"
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="timeline" className="mt-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Progress by Scenario</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={formatTimeline} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}% Complete`, '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="optimistic_timeline" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Optimistic"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="realistic_timeline" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Realistic"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pessimistic_timeline" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    name="Pessimistic"
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Monte Carlo Analysis Results</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">August 15</p>
            <p className="text-sm text-gray-600 mt-1">Most Likely Completion</p>
            <p className="text-xs text-gray-500 mt-1">Based on 10,000 simulations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">£3.9M</p>
            <p className="text-sm text-gray-600 mt-1">Expected Final Budget</p>
            <p className="text-xs text-gray-500 mt-1">95% confidence interval: £3.6M - £4.3M</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">73%</p>
            <p className="text-sm text-gray-600 mt-1">Success Probability</p>
            <p className="text-xs text-gray-500 mt-1">On-time and within budget</p>
          </div>
        </div>
      </div>
    </div>
  );
}