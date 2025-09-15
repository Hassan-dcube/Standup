import React, { useState, useEffect } from 'react';
import { Video, Clock, ArrowLeft, ArrowRight, Check, Edit, Info } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { api } from '../../lib/api';

interface StandupAnswer {
  questionIndex: number;
  question: string;
  answer: string;
}

export function StandupBot() {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<StandupAnswer[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [standupHistory, setStandupHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [commentingOn, setCommentingOn] = useState<{sessionId: string, responseId: string, parentId?: string} | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Ensure we have a Supabase access token available for backend calls
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) localStorage.setItem('access_token', token);
    })();
  }, []);

  // Check if user has already submitted today
  const checkTodaySubmission = async () => {
    if (!user?.id) return;
    
    try {
      const response = await api(`/api/standups/user/${user.id}/today-check`);
      // Only disable if there's a COMPLETED standup today
      setHasSubmittedToday(response.hasCompletedStandupToday);
    } catch (error) {
      console.error('Failed to check today submission:', error);
      setHasSubmittedToday(false);
    }
  };

  // Fetch user's projects
  const fetchUserProjects = async () => {
    if (!user?.id) return;
    
    setLoadingProjects(true);
    try {
      const response = await api('/api/projects');
      setUserProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch standup history
  const fetchStandupHistory = async () => {
    if (!user?.id) return;
    
    setLoadingHistory(true);
    try {
      const response = await api(`/api/standups/user/${user.id}/history?limit=5`);
      setStandupHistory(response.standups || []);
    } catch (error) {
      console.error('Failed to fetch standup history:', error);
      setStandupHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch history and check today submission when component mounts
  useEffect(() => {
    fetchStandupHistory();
    checkTodaySubmission();
  }, [user?.id]);

  // Submit comment (for employee replies)
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
      
      // Refresh history to show new comment
      fetchStandupHistory();
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const defaultQuestions = [
    'What did you accomplish yesterday?',
    'What are you working on today?',
    'Are there any blockers or challenges?',
    'Do you need help with anything?'
  ];

  const startSession = async () => {
    try {
      console.log('Starting session...', { user: user?.id || 'demo-user' });
      setErrors([]);
      const res = await api('/api/standups/start', {
        method: 'POST',
        body: JSON.stringify({ orgId: 'demo-org', userId: user?.id || 'demo-user' }),
      });
      console.log('Session started successfully:', res);
      setSessionId(res.sessionId || res.id || res.session?.id || null);
      setSessionActive(true);
      setCurrentQuestion(0);
      setCurrentAnswer('');
      setAnswers([]);
      setShowReview(false);
      setSessionCompleted(false);
    } catch (e: any) {
      console.error('Failed to start session:', e);
      setErrors([`Failed to start session: ${e?.message || e}`]);
    }
  };

  const validateCurrentAnswer = () => {
    if (!currentAnswer.trim()) {
      setErrors(['Please provide an answer before continuing']);
      return false;
    }
    setErrors([]);
    return true;
  };

  const saveCurrentAnswer = async () => {
    if (!validateCurrentAnswer()) return false;

    const newAnswer: StandupAnswer = {
      questionIndex: currentQuestion,
      question: defaultQuestions[currentQuestion],
      answer: currentAnswer.trim()
    };

    setAnswers(prev => {
      const existing = prev.filter(a => a.questionIndex !== currentQuestion);
      return [...existing, newAnswer].sort((a, b) => a.questionIndex - b.questionIndex);
    });

    // Persist to backend if session exists
    if (sessionId) {
      try {
        await api(`/api/standups/${sessionId}/answer`, {
          method: 'POST',
          body: JSON.stringify({
            questionId: `q${currentQuestion + 1}`,
            answerText: newAnswer.answer,
          }),
        });
      } catch (e) {
        // Soft-fail: keep UI responsive but show a hint
        console.warn('Failed to save answer', e);
      }
    }

    return true;
  };

  const nextQuestion = () => {
    if (!saveCurrentAnswer()) return;

    if (currentQuestion < defaultQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      const existingAnswer = answers.find(a => a.questionIndex === currentQuestion + 1);
      setCurrentAnswer(existingAnswer?.answer || '');
    } else {
      // All questions completed, show project selection
      setShowProjectSelection(true);
      fetchUserProjects();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const existingAnswer = answers.find(a => a.questionIndex === currentQuestion - 1);
      setCurrentAnswer(existingAnswer?.answer || '');
    }
  };

  const goToQuestion = (index: number) => {
    saveCurrentAnswer();
    setCurrentQuestion(index);
    const existingAnswer = answers.find(a => a.questionIndex === index);
    setCurrentAnswer(existingAnswer?.answer || '');
    setShowReview(false);
  };

  const validateAllAnswers = () => {
    const validationErrors: string[] = [];
    
    defaultQuestions.forEach((question, index) => {
      const answer = answers.find(a => a.questionIndex === index);
      if (!answer || !answer.answer.trim()) {
        validationErrors.push(`Question ${index + 1} requires an answer`);
      }
    });

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const selectProject = async () => {
    if (!selectedProjectId) {
      setErrors(['Please select a project for your standup.']);
      return;
    }

    try {
      if (sessionId) {
        await api(`/api/standups/${sessionId}/project`, {
          method: 'PUT',
          body: JSON.stringify({ projectId: selectedProjectId })
        });
      }
      
      setShowProjectSelection(false);
      setShowReview(true);
      setErrors([]);
    } catch (error) {
      setErrors(['Failed to select project. Please try again.']);
    }
  };

  const submitStandup = async () => {
    if (!validateAllAnswers()) return;

    setIsSubmitting(true);
    
    try {
      if (sessionId) {
        await api(`/api/standups/${sessionId}/submit`, { method: 'POST' });
      }
      
      setSessionCompleted(true);
      setShowReview(false);
      setSessionActive(false);
      
      // Refresh history to show the new standup
      fetchStandupHistory();
    } catch (error) {
      setErrors(['Failed to submit standup. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const endSession = () => {
    setSessionActive(false);
    setShowReview(false);
    setCurrentQuestion(0);
    setCurrentAnswer('');
    setAnswers([]);
    setErrors([]);
    setSessionId(null);
  };

  if (sessionCompleted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Standup Completed!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing your daily standup. Your responses have been recorded and shared with your manager.
          </p>
          <button
            onClick={() => setSessionCompleted(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  if (showProjectSelection) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Project</h2>
          <p className="text-gray-600">
            Please select the project for which you're providing updates.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-red-800 font-medium mb-2">Please fix the following issues:</h4>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Project *
          </label>
          {loadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading projects...</span>
            </div>
          ) : (
            <div className="grid gap-3">
              {userProjects.map((project) => (
                <label
                  key={project.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProjectId === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="project"
                    value={project.id}
                    checked={selectedProjectId === project.id}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    )}
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedProjectId === project.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedProjectId === project.id && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => {
              setShowProjectSelection(false);
              setCurrentQuestion(defaultQuestions.length - 1);
            }}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Questions
          </button>
          <button
            onClick={selectProject}
            disabled={!selectedProjectId || loadingProjects}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Review
          </button>
        </div>
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Responses</h2>
          <p className="text-gray-600">
            Please review your answers before submitting your standup.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-red-800 font-medium mb-2">Please fix the following issues:</h4>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6 mb-8">
          {defaultQuestions.map((question, index) => {
            const answer = answers.find(a => a.questionIndex === index);
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900">
                    {index + 1}. {question}
                  </h4>
                  <button
                    onClick={() => goToQuestion(index)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                </div>
                <div className={`p-3 rounded border ${
                  answer?.answer.trim() 
                    ? 'bg-white border-gray-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {answer?.answer.trim() || (
                    <span className="text-red-600 italic">No answer provided</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => goToQuestion(currentQuestion)}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Continue Editing
          </button>
          <button
            onClick={submitStandup}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Standup'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (sessionActive) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Daily Standup</h2>
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {defaultQuestions.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / defaultQuestions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            {defaultQuestions[currentQuestion]}
          </h3>
          
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {errors[0]}
            </div>
          )}
          
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {currentAnswer.length}/500 characters
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
            
            <button
              onClick={endSession}
              className="px-4 py-2 bg-red-300 text-red-700 rounded-lg hover:bg-red-400"
            >
              Cancel
            </button>
          </div>
          
          <button
            onClick={nextQuestion}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {currentQuestion < defaultQuestions.length - 1 ? (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              'Review & Submit'
            )}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Progress</h4>
          <div className="flex space-x-2">
            {defaultQuestions.map((_, index) => {
              const hasAnswer = answers.some(a => a.questionIndex === index);
              const isCurrent = index === currentQuestion;
              
              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : hasAnswer
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Standup Bot</h2>
            <p className="text-gray-600 mt-1">
              Complete your daily standup by answering a few quick questions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="font-semibold text-gray-900">Quick Start</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Hi {user?.name}, this is your ScrumBot checking in for a quick update. This won't take more than 2–3 minutes.
            </p>
            <button
              onClick={startSession}
              disabled={hasSubmittedToday}
              className={`w-full py-2 px-4 rounded-lg transition-colors ${
                hasSubmittedToday 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {hasSubmittedToday ? 'Already Submitted Today' : 'Start Standup'}
            </button>
            {hasSubmittedToday && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <p className="text-sm text-green-700">
                    Great job! You've already completed your standup for today. Come back tomorrow for your next update.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Video className="h-6 w-6 text-gray-600 mr-3" />
              <h3 className="font-semibold text-gray-900">How it Works</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Answer 4 simple questions about your work</li>
              <li>• Review your responses before submitting</li>
              <li>• Your answers are automatically shared with your manager</li>
              <li>• Takes just a few minutes to complete</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Standups</h3>
        {loadingHistory ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading standup history...</p>
          </div>
        ) : standupHistory.length > 0 ? (
          <div className="space-y-4">
            {standupHistory.map((standup, index) => (
              <div key={standup.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(standup.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Completed at {new Date(standup.submittedAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="text-green-600">
                    <Check className="h-5 w-5" />
                  </div>
                </div>
                
                {/* Show manager comments if any */}
                {standup.responses.some((response: any) => response.managerComments.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Manager Feedback:</h4>
                    <div className="space-y-3">
                      {standup.responses.map((response: any) => 
                        response.managerComments.map((comment: any) => (
                          <div key={comment.id} className="space-y-2">
                            {/* Main comment */}
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                              <p className="text-xs text-blue-800">{comment.comment}</p>
                              <p className="text-xs text-blue-600 mt-1">
                                - {comment.manager.name} • {new Date(comment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            
                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="ml-4 space-y-2">
                                {comment.replies.map((reply: any) => (
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
                              onClick={() => setCommentingOn({ sessionId: standup.id, responseId: response.id, parentId: comment.id })}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Reply
                            </button>
                            
                            {/* Reply form */}
                            {commentingOn?.sessionId === standup.id && commentingOn?.responseId === response.id && commentingOn?.parentId === comment.id && (
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
                                    onClick={() => submitComment(standup.id, response.id, comment.id)}
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
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No standups completed yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete your first standup to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}