import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

interface StandupSummary {
  employeeName: string;
  startTime: string;
  endTime: string;
  duration: number;
  aiSummary: string;
  keyPoints: string[];
  blockers: string[];
}

interface StandupData {
  id: string;
  date: number;
  state: string;
  submittedAt: string;
  responses: Array<{
    id: string;
    questionId: string;
    answerText: string;
    managerComments?: Array<{
      id: string;
      comment: string;
      createdAt: string;
      manager: {
        name: string;
      };
      replies?: Array<{
        id: string;
        comment: string;
        createdAt: string;
        manager: {
          name: string;
        };
      }>;
    }>;
  }>;
  user: {
    id: string;
    name: string;
    email: string;
  };
  managerComments?: Array<{
    id: string;
    comment: string;
    createdAt: string;
    manager: {
      name: string;
    };
  }>;
  isSeen?: boolean;
  seenAt?: string;
}

export function CalendarView() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 1)); // September 2025
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showStandupSummary, setShowStandupSummary] = useState(false);
  const [selectedStandupData, setSelectedStandupData] = useState<StandupSummary | null>(null);
  const [selectedDayStandups, setSelectedDayStandups] = useState<StandupData[]>([]);
  const [newStandupDates, setNewStandupDates] = useState<Set<number>>(new Set());
  const [standupData, setStandupData] = useState<StandupData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [commentingOn, setCommentingOn] = useState<{sessionId: string, responseId: string} | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = new Date();

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Fetch standup data for the current month
  const fetchStandupData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      // For managers, use their own ID to get all team standups
      // For employees, use their own ID to get only their standups
      const response = await api(`/api/standups/calendar/${user.id}?month=${month}&year=${year}&requesterId=${user.id}`);
      setStandupData(response.standups || []);
      setIsManager(response.isManager || false);
    } catch (error) {
      console.error('Failed to fetch standup data:', error);
      setStandupData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle standup clicks from notifications
  const handleNotificationStandupClick = (standupId: string) => {
    const standup = standupData.find(s => s.id === standupId);
    if (standup) {
      // Find the date of this standup
      const standupDate = standup.date;
      
      // Set the current date to show the standup's month
      const standupDateObj = new Date(2025, 8, standupDate); // September 2025
      setCurrentDate(standupDateObj);
      
      // Trigger the standup click
      setSelectedDate(standupDate);
      handleStandupClick(standupDate);
    }
  };

  const isToday = (day: number) => {
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear();
  };

  // Get standup status from real data
  const getStandupStatus = (day: number) => {
    const standups = standupData.filter(s => s.date === day);
    if (standups.length === 0) return null;
    
    // For managers, show status based on all standups for that day
    if (isManager) {
      const submittedCount = standups.filter(s => s.state === 'SUBMITTED').length;
      const totalCount = standups.length;
      
      
      if (submittedCount === totalCount) {
        return 'attended'; // All standups submitted
      } else if (submittedCount > 0) {
        return 'partial'; // Some standups submitted
      } else {
        return 'missed'; // No standups submitted
      }
    } else {
      // For employees, show only their own standup
      const standup = standups[0]; // Should only be one for employees
      switch (standup.state) {
        case 'SUBMITTED': return 'attended';
        case 'DRAFT': return 'missed';
        default: return null;
      }
    }
  };

  const getStandupCount = (day: number) => {
    const standups = standupData.filter(s => s.date === day);
    return standups.length;
  };


  // Fetch standup data when month changes
  useEffect(() => {
    fetchStandupData();
  }, [currentDate, user?.id]);

  // Refresh data every 30 seconds to catch new standups
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStandupData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentDate, user?.id]);

  // Listen for standup clicks from notifications
  useEffect(() => {
    const handleStandupClickEvent = (event: CustomEvent) => {
      const { standupId } = event.detail;
      handleNotificationStandupClick(standupId);
    };

    window.addEventListener('standup-click', handleStandupClickEvent as EventListener);
    
    return () => {
      window.removeEventListener('standup-click', handleStandupClickEvent as EventListener);
    };
  }, [standupData]);

  const getStandupStatusColor = (status: string, isSeen?: boolean) => {
    if (isManager) {
      // Manager view: different colors for seen/unseen
      switch (status) {
        case 'attended': return isSeen ? 'bg-green-500' : 'bg-yellow-500'; // Yellow for unseen
        case 'partial': return isSeen ? 'bg-orange-500' : 'bg-yellow-500'; // Orange for partial, yellow if unseen
        case 'missed': return 'bg-red-500';
        default: return 'bg-gray-400';
      }
    } else {
      // Employee view: standard colors
    switch (status) {
      case 'attended': return 'bg-green-500';
      case 'missed': return 'bg-red-500';
      default: return 'bg-gray-400';
      }
    }
  };

  const getStandupDotClasses = (day: number, status: string, isSeen?: boolean) => {
    const baseClasses = 'absolute top-1 right-1 w-2 h-2 rounded-full cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md active:scale-110';
    const colorClasses = getStandupStatusColor(status, isSeen);
    const shadowClasses = status === 'attended' ? 'hover:shadow-green-300' : 'hover:shadow-red-300';
    
    let animationClasses = '';
    if (newStandupDates.has(day)) {
      animationClasses = 'calendar-dot-new';
    } else if (status === 'attended') {
      animationClasses = 'calendar-dot-pulse';
    }
    
    return clsx(baseClasses, colorClasses, shadowClasses, animationClasses);
  };

  const handleStandupClick = (day: number) => {
    const standups = standupData.filter(s => s.date === day);
    if (standups.length === 0) return;
    
    if (isManager && standups.length > 1) {
      // For managers with multiple standups, show all standups for that day
      setSelectedDayStandups(standups);
      setShowStandupSummary(true);
      
      // Mark all unseen standups as seen
      standups.forEach(standup => {
        if (!standup.isSeen && standup.state === 'SUBMITTED') {
          markAsSeen(standup.id);
        }
      });
    } else {
      // For employees or single standup, show individual standup
      const standup = standups[0];
      
      if (standup && standup.state === 'SUBMITTED') {
        // Create summary from real data
        const summary: StandupSummary = {
          employeeName: standup.user.name,
          startTime: new Date(standup.submittedAt).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          endTime: new Date(standup.submittedAt).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          duration: 3, // Default duration
          aiSummary: `Standup completed by ${standup.user.name}. ${standup.responses.length} questions answered.`,
          keyPoints: standup.responses.map(r => `Q${r.questionId}: ${r.answerText}`),
          blockers: standup.responses.filter(r => r.questionId === 'q3' && r.answerText.toLowerCase().includes('yes')).map(r => r.answerText)
        };
        setSelectedStandupData(summary);
        setShowStandupSummary(true);
        
        // If manager, mark as seen
        if (isManager && !standup.isSeen) {
          markAsSeen(standup.id);
        }
      }
    }
  };

  const markAsSeen = async (sessionId: string) => {
    try {
      await api(`/api/standups/${sessionId}/seen`, {
        method: 'POST',
        body: JSON.stringify({ managerId: user?.id })
      });
      // Refresh data
      fetchStandupData();
    } catch (error) {
      console.error('Failed to mark as seen:', error);
    }
  };

  const submitComment = async (sessionId: string, responseId: string, parentId?: string) => {
    if (!commentText.trim() || !user?.id) return;
    
    setSubmittingComment(true);
    try {
      await api(`/api/standups/${sessionId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ 
          userId: user.id,
          comment: commentText.trim(),
          responseId: responseId,
          parentId: parentId
        })
      });
      
      // Clear comment form
      setCommentText('');
      setCommentingOn(null);
      
      // Refresh data to show new comment
      fetchStandupData();
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={fetchStandupData}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh standup data"
            >
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button className="ml-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center">
              <Plus className="h-3 w-3 mr-1" />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="p-2 h-16"></div>
          ))}
          
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const standupStatusForDay = getStandupStatus(day);
            
            return (
              <div
                key={day}
                className={clsx(
                  'p-1 h-16 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors relative',
                  isToday(day) ? 'bg-blue-100 border-blue-300' : 'border-gray-200',
                  selectedDate === day ? 'ring-2 ring-blue-500' : ''
                )}
                onClick={() => {
                  // Always show standups for the clicked day
                  setSelectedDate(day);
                  handleStandupClick(day);
                }}
              >
                <div className={clsx(
                  'text-sm font-medium mb-1',
                  isToday(day) ? 'text-blue-700' : 'text-gray-900'
                )}>
                  {day}
                </div>
                
                {/* Standup status indicator with enhanced pulsing effects */}
                {standupStatusForDay && (
                  <div className="absolute top-1 right-1">
                    {isManager && getStandupCount(day) > 1 ? (
                      // Show count badge for multiple standups
                      <div 
                        className={clsx(
                          'w-4 h-4 rounded-full cursor-pointer transition-all duration-200 ease-in-out hover:scale-125 hover:shadow-md active:scale-110 flex items-center justify-center text-xs font-bold text-white',
                          getStandupStatusColor(standupStatusForDay, standupData.find(s => s.date === day)?.isSeen)
                        )}
                        title={`${getStandupCount(day)} standups - ${standupStatusForDay}${newStandupDates.has(day) ? ' (New!)' : ''}${isManager && !standupData.find(s => s.date === day)?.isSeen ? ' (Unseen)' : ''}`}
                      >
                        {getStandupCount(day)}
                      </div>
                    ) : (
                      // Show single dot for one standup
                      <div 
                        className={getStandupDotClasses(day, standupStatusForDay, standupData.find(s => s.date === day)?.isSeen)}
                        title={`Standup ${standupStatusForDay}${newStandupDates.has(day) ? ' (New!)' : ''}${isManager && !standupData.find(s => s.date === day)?.isSeen ? ' (Unseen)' : ''}`}
                  ></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Enhanced Legend */}
        <div className="mt-4 flex items-center space-x-6 text-xs text-gray-600">
          {isManager ? (
            <>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 transition-all duration-200 hover:scale-125 calendar-dot-pulse"></div>
                <span>All Standups Seen</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-1 transition-all duration-200 hover:scale-125"></div>
                <span>Some Standups Seen</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 transition-all duration-200 hover:scale-125"></div>
                <span>Standups Unseen</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1 transition-all duration-200 hover:scale-125"></div>
                <span>Standups Missed</span>
              </div>
              <div className="text-gray-500 text-xs italic">
                Numbers show count of standups per day. Click on any day to view standup details.
              </div>
            </>
          ) : (
            <>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 transition-all duration-200 hover:scale-125 calendar-dot-pulse"></div>
            <span>Standup Attended</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1 transition-all duration-200 hover:scale-125"></div>
            <span>Standup Missed</span>
          </div>
          <div className="text-gray-500 text-xs italic">
            Click on any day to view standup details
          </div>
            </>
          )}
        </div>
      </div>

      {/* Standup Summary Dialog */}
      <Dialog.Root open={showStandupSummary} onOpenChange={(open) => {
        setShowStandupSummary(open);
        if (!open) {
          setSelectedDayStandups([]);
          setSelectedStandupData(null);
          setCommentingOn(null);
          setCommentText('');
        }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-4xl z-50 max-h-[90vh] overflow-y-auto">
            {selectedDayStandups.length > 0 ? (
              // Multiple standups view for managers
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Team Standups - September {selectedDate}, 2025
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>
                
                <div className="space-y-6">
                  {selectedDayStandups
                    .sort((a, b) => {
                      // Sort by submittedAt in descending order (most recent first)
                      if (a.submittedAt && b.submittedAt) {
                        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
                      }
                      // If one doesn't have submittedAt, prioritize the one that does
                      if (a.submittedAt && !b.submittedAt) return -1;
                      if (!a.submittedAt && b.submittedAt) return 1;
                      // If neither has submittedAt, sort by user name
                      return a.user.name.localeCompare(b.user.name);
                    })
                    .map((standup, index) => (
                    <div key={standup.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{standup.user.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className={clsx(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              standup.state === 'SUBMITTED' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            )}>
                              {standup.state === 'SUBMITTED' ? 'Completed' : 'Draft'}
                            </span>
                            {standup.submittedAt && (
                              <span>Submitted: {new Date(standup.submittedAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              })}</span>
                            )}
                            {standup.isSeen && (
                              <span className="text-green-600">✓ Seen</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {standup.state === 'SUBMITTED' && standup.responses.length > 0 && (
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Standup Responses</h4>
                            <div className="space-y-3">
                              {standup.responses.map((response, responseIndex) => (
                                <div key={responseIndex} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex justify-between items-start mb-2">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">Q{response.questionId}:</span> {response.answerText}
                                    </p>
                                    {isManager && (
                                      <button
                                        onClick={() => setCommentingOn({ sessionId: standup.id, responseId: response.id })}
                                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                                      >
                                        Reply
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Show existing comments for this response */}
                                  {response.managerComments && response.managerComments.length > 0 && (
                                    <div className="mt-2 space-y-3">
                                      {response.managerComments.map((comment) => (
                                        <div key={comment.id} className="space-y-2">
                                          {/* Main comment */}
                                          <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <p className="text-xs text-blue-800">{comment.comment}</p>
                                                <p className="text-xs text-blue-600 mt-1">
                                                  - {comment.manager.name} • {new Date(comment.createdAt).toLocaleString()}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Replies */}
                                          {comment.replies && comment.replies.length > 0 && (
                                            <div className="ml-4 space-y-2">
                                              {comment.replies.map((reply) => (
                                                <div key={reply.id} className="space-y-2">
                                                  <div className="bg-gray-50 border-l-4 border-gray-400 p-2 rounded">
                                                    <p className="text-xs text-gray-800">{reply.comment}</p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                      - {reply.manager.name} • {new Date(reply.createdAt).toLocaleString()}
                                                    </p>
                                                  </div>
                                                  
                                                  {/* Manager can reply to employee replies */}
                                                  {isManager && (
                                                    <button
                                                      onClick={() => setCommentingOn({ sessionId: standup.id, responseId: response.id, parentId: comment.id })}
                                                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                                                    >
                                                      Reply
                                                    </button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Comment form */}
                                  {commentingOn?.sessionId === standup.id && commentingOn?.responseId === response.id && (
                                    <div className="mt-3 p-3 bg-white border rounded-lg">
                                      <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={commentingOn.parentId ? "Reply to comment..." : "Add a comment..."}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                                        rows={2}
                                      />
                                      <div className="flex justify-end space-x-2 mt-2">
                                        <button
                                          onClick={() => {
                                            setCommentingOn(null);
                                            setCommentText('');
                                          }}
                                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => submitComment(standup.id, response.id, commentingOn.parentId)}
                                          disabled={!commentText.trim() || submittingComment}
                                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          {submittingComment ? 'Posting...' : (commentingOn.parentId ? 'Reply' : 'Post Comment')}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      Close
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            ) : selectedStandupData ? (
              // Single standup view
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Standup Summary - {selectedStandupData.employeeName}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Start Time</h4>
                      <p className="text-gray-600">{selectedStandupData.startTime}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">End Time</h4>
                      <p className="text-gray-600">{selectedStandupData.endTime}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
                      <p className="text-gray-600">{selectedStandupData.duration} minutes</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Employee</h4>
                      <p className="text-gray-600">{selectedStandupData.employeeName}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">AI Summary</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">{selectedStandupData.aiSummary}</p>
                    </div>
                  </div>
                  
                  {selectedStandupData.keyPoints.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Accomplishments</h4>
                      <ul className="space-y-2">
                        {selectedStandupData.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span className="text-sm text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedStandupData.blockers.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Blockers</h4>
                      <ul className="space-y-2">
                        {selectedStandupData.blockers.map((blocker, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span className="text-sm text-red-700">{blocker}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Manager Comments Section - Only show for employees */}
                  {!isManager && selectedDayStandups.length === 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Manager Feedback</h4>
                      {(() => {
                        // Find the current standup data to get comments
                        const currentStandup = standupData.find(s => 
                          s.user.id === user?.id && 
                          s.date === selectedDate &&
                          s.state === 'SUBMITTED'
                        );
                        
                        if (!currentStandup || !currentStandup.responses.some(r => r.managerComments && r.managerComments.length > 0)) {
                          return (
                            <div className="text-center py-4 text-gray-500">
                              <p className="text-sm">No manager feedback yet</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-3">
                            {currentStandup.responses.map((response) => 
                              response.managerComments?.map((comment) => (
                                <div key={comment.id} className="space-y-2">
                                  {/* Main comment */}
                                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                                    <p className="text-sm text-blue-800">{comment.comment}</p>
                                    <p className="text-xs text-blue-600 mt-1">
                                      - {comment.manager.name} • {new Date(comment.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  
                                  {/* Replies */}
                                  {comment.replies && comment.replies.length > 0 && (
                                    <div className="ml-4 space-y-2">
                                      {comment.replies.map((reply) => (
                                        <div key={reply.id} className="bg-gray-50 border-l-4 border-gray-400 p-2 rounded">
                                          <p className="text-xs text-gray-800">{reply.comment}</p>
                                          <p className="text-xs text-gray-600 mt-1">
                                            - {reply.manager.name} • {new Date(reply.createdAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Reply button */}
                                  <button
                                    onClick={() => setCommentingOn({ sessionId: currentStandup.id, responseId: response.id, parentId: comment.id })}
                                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                                  >
                                    Reply
                                  </button>
                                  
                                  {/* Reply form */}
                                  {commentingOn?.sessionId === currentStandup.id && commentingOn?.responseId === response.id && commentingOn?.parentId === comment.id && (
                                    <div className="ml-4 p-3 bg-white border rounded-lg">
                                      <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Reply to manager..."
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                                        rows={2}
                                      />
                                      <div className="flex justify-end space-x-2 mt-2">
                                        <button
                                          onClick={() => {
                                            setCommentingOn(null);
                                            setCommentText('');
                                          }}
                                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => submitComment(currentStandup.id, response.id, comment.id)}
                                          disabled={!commentText.trim() || submittingComment}
                                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          {submittingComment ? 'Posting...' : 'Reply'}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      Close
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}