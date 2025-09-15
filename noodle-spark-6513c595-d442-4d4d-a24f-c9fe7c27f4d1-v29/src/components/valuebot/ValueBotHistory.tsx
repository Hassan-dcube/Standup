import React, { useState } from 'react';
import { Calendar, Clock, Download, Eye, TrendingUp, CheckCircle, XCircle, Target, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface ValueSession {
  id: string;
  date: string;
  status: 'completed' | 'missed' | 'partial';
  duration?: number;
  businessValue: string;
  programme: string;
  phase: string;
  component: string;
  taskType: string;
  metrics: string[];
  insights: string[];
  managerReviewed: boolean;
}

export function ValueBotHistory() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'missed'>('all');
  const [selectedMonth, setSelectedMonth] = useState('2025-08');
  const [selectedSession, setSelectedSession] = useState<ValueSession | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const valueSessions: ValueSession[] = [
    {
      id: '1',
      date: '2025-08-16',
      status: 'completed',
      duration: 4,
      businessValue: 'High - Direct customer impact through performance improvements',
      programme: 'Digital Transformation',
      phase: 'Development',
      component: 'Frontend',
      taskType: 'Optimization',
      metrics: [
        'Page load time reduced by 35%',
        'User engagement increased by 18%',
        'Customer satisfaction score: 4.5/5'
      ],
      insights: [
        'Performance improvements directly correlate with user satisfaction',
        'Technical optimization delivers measurable business outcomes',
        'Work supports strategic digital transformation goals'
      ],
      managerReviewed: true
    },
    {
      id: '2',
      date: '2025-08-09',
      status: 'completed',
      duration: 3,
      businessValue: 'Medium - Infrastructure improvements enable future scaling',
      programme: 'Platform Modernization',
      phase: 'Development',
      component: 'Backend',
      taskType: 'Feature Development',
      metrics: [
        'API response time improved by 50ms',
        'System reliability increased to 99.8%',
        'Database query optimization: 60% faster'
      ],
      insights: [
        'Infrastructure improvements create foundation for business growth',
        'Technical debt reduction enables faster feature delivery',
        'System reliability directly impacts customer trust'
      ],
      managerReviewed: true
    },
    {
      id: '3',
      date: '2025-08-02',
      status: 'missed',
      businessValue: '',
      programme: '',
      phase: '',
      component: '',
      taskType: '',
      metrics: [],
      insights: [],
      managerReviewed: false
    },
    {
      id: '4',
      date: '2025-07-26',
      status: 'completed',
      duration: 5,
      businessValue: 'High - Security enhancement protects customer data',
      programme: 'Security & Compliance',
      phase: 'Implementation',
      component: 'Security',
      taskType: 'Security Enhancement',
      metrics: [
        'Security vulnerability score reduced by 40%',
        'Compliance audit score: 95%',
        'Zero security incidents this quarter'
      ],
      insights: [
        'Security improvements essential for customer trust and compliance',
        'Proactive security measures prevent costly incidents',
        'Compliance achievements enable business expansion opportunities'
      ],
      managerReviewed: true
    }
  ];

  const filteredSessions = valueSessions.filter(session => {
    if (selectedFilter === 'all') return true;
    return session.status === selectedFilter;
  }).filter(session => session.date.startsWith(selectedMonth));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'missed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'partial': return <Clock className="h-5 w-5 text-yellow-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getValueColor = (value: string) => {
    if (value.includes('High')) return 'text-green-700 bg-green-50';
    if (value.includes('Medium')) return 'text-blue-700 bg-blue-50';
    if (value.includes('Low')) return 'text-yellow-700 bg-yellow-50';
    return 'text-gray-700 bg-gray-50';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCompletionRate = () => {
    const completedSessions = filteredSessions.filter(s => s.status === 'completed');
    if (filteredSessions.length === 0) return 0;
    return Math.round((completedSessions.length / filteredSessions.length) * 100);
  };

  const openDetails = (session: ValueSession) => {
    setSelectedSession(session);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Value Assessment History</h3>
          <p className="text-sm text-gray-600">Business value analysis and programme mapping results</p>
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
        <div className="bg-green-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md">
          <p className="text-sm text-green-600 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-700">
            {filteredSessions.filter(s => s.status === 'completed').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md">
          <p className="text-sm text-red-600 font-medium">Missed</p>
          <p className="text-2xl font-bold text-red-700">
            {filteredSessions.filter(s => s.status === 'missed').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md">
          <p className="text-sm text-blue-600 font-medium">Completion Rate</p>
          <p className="text-2xl font-bold text-blue-700">{getCompletionRate()}%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md">
          <p className="text-sm text-purple-600 font-medium">Avg Duration</p>
          <p className="text-2xl font-bold text-purple-700">
            {Math.round(filteredSessions.filter(s => s.duration).reduce((sum, s) => sum + (s.duration || 0), 0) / filteredSessions.filter(s => s.duration).length) || 0}min
          </p>
        </div>
      </div>

      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        {['all', 'completed', 'missed'].map((filter) => (
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
        {filteredSessions.map((session) => (
          <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    Value Session - {formatDate(session.date)}
                  </h4>
                  <div className="flex items-center">
                    {getStatusIcon(session.status)}
                  </div>
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(session.status)
                  )}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  {session.duration && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{session.duration} min</span>
                    </div>
                  )}
                  {session.programme && (
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      <span>{session.programme}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className={clsx(
                      'text-xs px-2 py-1 rounded-full',
                      session.managerReviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    )}>
                      Manager {session.managerReviewed ? 'Reviewed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => openDetails(session)}
                  className="flex items-center px-3 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </button>
              </div>
            </div>
            
            {session.businessValue && (
              <div className={clsx(
                'border rounded-lg p-4 mb-4',
                getValueColor(session.businessValue)
              )}>
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <h5 className="text-sm font-medium">Business Value Assessment</h5>
                </div>
                <p className="text-sm">{session.businessValue}</p>
              </div>
            )}
            
            {session.metrics && session.metrics.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Key Metrics</h5>
                <ul className="space-y-1">
                  {session.metrics.slice(0, 2).map((metric, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {metric}
                    </li>
                  ))}
                  {session.metrics.length > 2 && (
                    <li className="text-sm text-gray-500 ml-5">
                      +{session.metrics.length - 2} more metrics
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                {session.component && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {session.component}
                  </span>
                )}
                {session.taskType && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {session.taskType}
                  </span>
                )}
              </div>
              {session.phase && (
                <div className="text-sm text-gray-600">
                  Phase: {session.phase}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No value sessions found</h3>
          <p className="text-gray-600">No value assessment sessions match your current filters.</p>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Value Session Details - {formatDate(selectedSession.date)}
                </h3>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Programme</h4>
                    <p className="text-gray-600">{selectedSession.programme || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Phase</h4>
                    <p className="text-gray-600">{selectedSession.phase || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Component</h4>
                    <p className="text-gray-600">{selectedSession.component || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Task Type</h4>
                    <p className="text-gray-600">{selectedSession.taskType || 'N/A'}</p>
                  </div>
                  {selectedSession.duration && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
                      <p className="text-gray-600">{selectedSession.duration} minutes</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Manager Review</h4>
                    <p className={clsx(
                      'font-medium',
                      selectedSession.managerReviewed ? 'text-green-600' : 'text-yellow-600'
                    )}>
                      {selectedSession.managerReviewed ? 'Reviewed' : 'Pending Review'}
                    </p>
                  </div>
                </div>
                
                {selectedSession.businessValue && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Business Value Assessment</h4>
                    <div className={clsx(
                      'border rounded-lg p-3',
                      getValueColor(selectedSession.businessValue)
                    )}>
                      <p className="text-sm">{selectedSession.businessValue}</p>
                    </div>
                  </div>
                )}
                
                {selectedSession.metrics && selectedSession.metrics.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Measurable Metrics</h4>
                    <ul className="space-y-2">
                      {selectedSession.metrics.map((metric, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-sm text-gray-700">{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedSession.insights && selectedSession.insights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">AI-Generated Insights</h4>
                    <ul className="space-y-2">
                      {selectedSession.insights.map((insight, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-sm text-gray-700">{insight}</span>
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