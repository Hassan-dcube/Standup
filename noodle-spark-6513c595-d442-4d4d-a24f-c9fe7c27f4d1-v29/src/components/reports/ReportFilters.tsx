import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Calendar, Users, Briefcase } from 'lucide-react';

interface ReportFiltersProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  selectedTeam: string;
  onTeamChange: (value: string) => void;
  selectedProject: string;
  onProjectChange: (value: string) => void;
}

export function ReportFilters({
  dateRange,
  onDateRangeChange,
  selectedTeam,
  onTeamChange,
  selectedProject,
  onProjectChange
}: ReportFiltersProps) {
  const dateRangeOptions = [
    { value: 'last-7-days', label: 'Last 7 days' },
    { value: 'last-30-days', label: 'Last 30 days' },
    { value: 'last-90-days', label: 'Last 90 days' },
    { value: 'this-quarter', label: 'This quarter' },
    { value: 'last-quarter', label: 'Last quarter' },
    { value: 'this-year', label: 'This year' }
  ];

  const teamOptions = [
    { value: 'all', label: 'All Teams' },
    { value: 'frontend', label: 'Frontend Team' },
    { value: 'backend', label: 'Backend Team' },
    { value: 'devops', label: 'DevOps Team' },
    { value: 'qa', label: 'QA Team' },
    { value: 'design', label: 'Design Team' }
  ];

  const projectOptions = [
    { value: 'all', label: 'All Projects' },
    { value: 'project-alpha', label: 'Project Alpha' },
    { value: 'project-beta', label: 'Project Beta' },
    { value: 'project-gamma', label: 'Project Gamma' },
    { value: 'infrastructure', label: 'Infrastructure' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Date Range
          </label>
          <Select.Root value={dateRange} onValueChange={onDateRangeChange}>
            <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <Select.Viewport className="p-1">
                  {dateRangeOptions.map(option => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="px-3 py-2 text-sm text-gray-900 cursor-pointer hover:bg-gray-100 rounded outline-none"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline h-4 w-4 mr-1" />
            Team
          </label>
          <Select.Root value={selectedTeam} onValueChange={onTeamChange}>
            <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <Select.Viewport className="p-1">
                  {teamOptions.map(option => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="px-3 py-2 text-sm text-gray-900 cursor-pointer hover:bg-gray-100 rounded outline-none"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Briefcase className="inline h-4 w-4 mr-1" />
            Project
          </label>
          <Select.Root value={selectedProject} onValueChange={onProjectChange}>
            <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <Select.Viewport className="p-1">
                  {projectOptions.map(option => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="px-3 py-2 text-sm text-gray-900 cursor-pointer hover:bg-gray-100 rounded outline-none"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>
    </div>
  );
}