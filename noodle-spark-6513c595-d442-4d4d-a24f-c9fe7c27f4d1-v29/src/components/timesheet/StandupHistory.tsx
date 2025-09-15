import React, { useState } from 'react';
import { Calendar, Clock, Download, Play, Eye, Bot, CheckCircle, XCircle, User } from 'lucide-react';
import { clsx } from 'clsx';

interface StandupRecord {
  id: string;
  date: string;
  status: 'attended' | 'missed';
  employeeName: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  hoursSpent?: number;
  aiSummary?: string;
  keyPoints?: string[];
  blockers?: string[];
  recording?: string;
  summarySharedWithManager: boolean;
  managerSeenStatus: 'seen' | 'not_seen';
}

export function StandupHistory() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'attended' | 'missed'>('all');
  const [selectedMonth, setSelectedMonth] = useState('2025-08');
  const [selectedRecord, setSelectedRecord] = useState<StandupRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const standupRecords: StandupRecord[] = [
    {
      id: '1',
      date: '2025-08-15',
      status: 'attended',
      employeeName: 'Fawad',
      startTime: '09:00',
      endTime: '09:03',
      duration: 3,
      hoursSpent: 8,
      recording: 'recording-001.mp4',
      aiSummary: 'Fawad completed API integration for user authentication module. Made good progress on database schema updates. Planning to start frontend integration next.',
      keyPoints: [
        'Completed user authentication API endpoints',
        'Updated database schema for new user roles',
        'Reviewed security protocols with team lead'
      ],
      blockers: [],
      summarySharedWithManager: true,
      managerSeenStatus: 'seen'
    },
    {
      id: '2',
      date: '2025-08-14',
      status: 'attended',
      employeeName: 'Hira',
      startTime: '09:00',
      endTime: '09:04',
      duration: 4,
      hoursSpent: 7.5,
      recording: 'recording-002.mp4',
      aiSummary: 'Hira focused on dashboard UI components development. Completed 70% of the main dashboard layout and implemented responsive design patterns.',
      keyPoints: [
        'Dashboard layout 70% complete',
        'Implemented responsive design for mobile',
        'Created reusable component library'
      ],
      blockers: [
        'Waiting for design assets from UX team'
      ],
      summarySharedWithManager: true,
      managerSeenStatus: 'not_seen'
    },
    {
      id: '3',
      date: '2025-08-13',
      status: 'missed',
      employeeName: 'Assad',
      hoursSpent: 0,
      aiSummary: 'Assad was unavailable for standup due to client meeting. No update provided.',
      summarySharedWithManager: false,
      managerSeenStatus: 'not_seen'
    },
    {
      id: '4',
      date: '2025-08-12',
      status: 'attended',
      employeeName: 'Saad',
      startTime: '09:00',
      endTime: '09:03',
      duration: 3,
      hoursSpent: 8,
      recording: 'recording-004.mp4',
      aiSummary: 'Saad worked on DevOps infrastructure setup. Completed staging environment configuration and prepared deployment scripts for weekend release.',
      keyPoints: [
        'Staging environment setup completed',
        'Deployment scripts prepared and tested',
        'Monitoring tools configured'
      ],
      blockers: [
        'Waiting for SSL certificates from IT team'
      ],
      summarySharedWithManager: true,
      managerSeenStatus: 'seen'
    },
    {
      id: '5',
      date: '2025-08-09',
      status: 'attended',
      employeeName: 'Zara',
      startTime: '09:15',
      endTime: '09:20',
      duration: 5,
      hoursSpent: 6,
      recording: 'recording-005.mp4',
      aiSummary: 'Zara completed onboarding tasks and started working on documentation updates. Getting familiar with team processes and coding standards.',
      keyPoints: [
        'Completed new employee onboarding',
        'Updated project documentation',
        'Set up development environment'
      ],
      blockers: [],
      summarySharedWithManager: true,
      managerSeenStatus: 'seen'
    }
  ];

  const filteredRecords = standupRecords.filter(record => {
    if (selectedFilter === 'all') return true;
    return record.status === selectedFilter;
  }).filter(record => record.date.startsWith(selectedMonth));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attended': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'missed': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAttendanceRate = () => {
    const attendedStandups = filteredRecords.filter(r => r.status === 'attended');
    if (filteredRecords.length === 0) return 0;
    return Math.round((attendedStandups.length / filteredRecords.length) * 100);
  };

  const openDetails = (record: StandupRecord) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Individual Standup History</h3>
          <p className="text-sm text-gray-600">AI-generated summaries and individual standup tracking</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="2025-08">August 2025</option>
            <option value="2025-07">July 2025</option>
            <option value="2025-06">June 2025</option>
          </select>
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Attended</p>
          <p className="text-2xl font-bold text-green-700">
            {filteredRecords.filter(r => r.status === 'attended').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Missed</p>
          <p className="text-2xl font-bold text-red-700">
            {filteredRecords.filter(r => r.status === 'missed').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Attendance Rate</p>
          <p className="text-2xl font-bold text-blue-700">{getAttendanceRate()}%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Avg Duration</p>
          <p className="text-2xl font-bold text-purple-700">
            {Math.round(filteredRecords.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / filteredRecords.filter(r => r.duration).length) || 0}min
          </p>
        </div>
      </div>

      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        {['all', 'attended', 'missed'].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter as any)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              selectedFilter === filter
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <div key={record.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {record.employeeName} - {formatDate(record.date)}
                  </h4>
                  <div className="flex items-center">
                    {getStatusIcon(record.status)}
                  </div>
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(record.status)
                  )}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  {record.duration && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{record.duration} min</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    <span>{record.employeeName}</span>
                  </div>
                  {record.hoursSpent !== undefined && (
                    <div className="flex items-center">
                      <span className="text-blue-600">Hours: {record.hoursSpent}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className={clsx(
                      'text-xs px-2 py-1 rounded-full',
                      record.managerSeenStatus === 'seen' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    )}>
                      Manager {record.managerSeenStatus === 'seen' ? 'Seen' : 'Not Seen'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {record.status === 'attended' && record.recording && (
                  <button className="flex items-center px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-sm">
                    <Play className="h-4 w-4 mr-1" />
                    Recording
                  </button>
                )}
                <button 
                  onClick={() => openDetails(record)}
                  className="flex items-center px-3 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </button>
              </div>
            </div>
            
            {record.aiSummary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <Bot className="h-4 w-4 text-blue-600 mr-2" />
                  <h5 className="text-sm font-medium text-blue-900">AI Summary</h5>
                </div>
                <p className="text-sm text-blue-800">{record.aiSummary}</p>
              </div>
            )}
            
            {record.keyPoints && record.keyPoints.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Key Accomplishments</h5>
                <ul className="space-y-1">
                  {record.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {record.blockers && record.blockers.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Blockers</h5>
                <ul className="space-y-1">
                  {record.blockers.map((blocker, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {blocker}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <span className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  record.summarySharedWithManager ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                )}>
                  {record.summarySharedWithManager ? 'Shared with Manager' : 'Not Shared'}
                </span>
              </div>
              {record.startTime && record.endTime && (
                <div className="text-sm text-gray-600">
                  {record.startTime} - {record.endTime}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No standups found</h3>
          <p className="text-gray-600">No standup sessions match your current filters.</p>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Standup Details - {selectedRecord.employeeName}
                </h3>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Date</h4>
                    <p className="text-gray-600">{formatDate(selectedRecord.date)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Employee</h4>
                    <p className="text-gray-600">{selectedRecord.employeeName}</p>
                  </div>
                  {selectedRecord.startTime && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Start Time</h4>
                      <p className="text-gray-600">{selectedRecord.startTime}</p>
                    </div>
                  )}
                  {selectedRecord.endTime && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">End Time</h4>
                      <p className="text-gray-600">{selectedRecord.endTime}</p>
                    </div>
                  )}
                  {selectedRecord.duration && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
                      <p className="text-gray-600">{selectedRecord.duration} minutes</p>
                    </div>
                  )}
                  {selectedRecord.hoursSpent !== undefined && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Hours Spent</h4>
                      <p className="text-gray-600">{selectedRecord.hoursSpent} hours</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Shared with Manager</h4>
                    <p className={clsx(
                      'font-medium',
                      selectedRecord.summarySharedWithManager ? 'text-green-600' : 'text-gray-600'
                    )}>
                      {selectedRecord.summarySharedWithManager ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Manager Status</h4>
                    <p className={clsx(
                      'font-medium',
                      selectedRecord.managerSeenStatus === 'seen' ? 'text-green-600' : 'text-yellow-600'
                    )}>
                      {selectedRecord.managerSeenStatus === 'seen' ? 'Seen' : 'Not Seen'}
                    </p>
                  </div>
                </div>
                
                {selectedRecord.aiSummary && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">AI Summary</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">{selectedRecord.aiSummary}</p>
                    </div>
                  </div>
                )}
                
                {selectedRecord.keyPoints && selectedRecord.keyPoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Accomplishments</h4>
                    <ul className="space-y-2">
                      {selectedRecord.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-sm text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedRecord.blockers && selectedRecord.blockers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Blockers</h4>
                    <ul className="space-y-2">
                      {selectedRecord.blockers.map((blocker, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-sm text-red-700">{blocker}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}