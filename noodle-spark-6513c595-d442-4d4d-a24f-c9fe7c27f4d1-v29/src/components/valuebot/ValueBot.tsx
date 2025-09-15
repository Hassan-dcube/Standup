import React, { useState } from 'react';
import { TrendingUp, Clock, ArrowLeft, ArrowRight, Check, Edit, Info, Zap, Calendar, Target } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface ValueAnswer {
  questionIndex: number;
  question: string;
  answer: string;
  suggestedMetrics?: string[];
}

interface MappedData {
  programme: string;
  phase: string;
  component: string;
  taskType: string;
  metrics: string[];
  insights: string[];
}

export function ValueBot() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<ValueAnswer[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [mappedData, setMappedData] = useState<MappedData | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [scheduledTrigger, setScheduledTrigger] = useState(false);

  const valueQuestions = [
    'What specific engineering work did you complete that delivers direct business value?',
    'How does this work impact customer experience or business metrics?',
    'What technical improvements or optimizations were achieved?',
    'Are there any blockers preventing you from delivering higher value work?',
    'What business outcomes or metrics can be measured from your contributions?'
  ];

  const startSession = (triggered = false) => {
    setScheduledTrigger(triggered);
    setSessionActive(true);
    setCurrentQuestion(0);
    setCurrentAnswer('');
    setAnswers([]);
    setShowReview(false);
    setSessionCompleted(false);
    setErrors([]);
    setMappedData(null);
  };

  const validateCurrentAnswer = () => {
    if (!currentAnswer.trim()) {
      setErrors(['Please provide an answer before continuing']);
      return false;
    }
    if (currentAnswer.trim().length < 10) {
      setErrors(['Please provide a more detailed answer (at least 10 characters)']);
      return false;
    }
    setErrors([]);
    return true;
  };

  const saveCurrentAnswer = () => {
    if (!validateCurrentAnswer()) return false;

    const newAnswer: ValueAnswer = {
      questionIndex: currentQuestion,
      question: valueQuestions[currentQuestion],
      answer: currentAnswer.trim()
    };

    setAnswers(prev => {
      const existing = prev.filter(a => a.questionIndex !== currentQuestion);
      return [...existing, newAnswer].sort((a, b) => a.questionIndex - b.questionIndex);
    });

    return true;
  };

  const nextQuestion = () => {
    if (!saveCurrentAnswer()) return;

    if (currentQuestion < valueQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      const existingAnswer = answers.find(a => a.questionIndex === currentQuestion + 1);
      setCurrentAnswer(existingAnswer?.answer || '');
    } else {
      setShowReview(true);
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

  const processWithAI = async (answersToProcess: ValueAnswer[]) => {
    setIsProcessingAI(true);
    
    try {
      const conversationHistory = answersToProcess
        .map(answer => `Q: ${answer.question}\nA: ${answer.answer}`)
        .join('\n\n');

      const systemPrompt = `You are an AI assistant specialized in analyzing engineering work for business value mapping. Your role is to:

1. Map engineering activities to business structure:
   - Programme: High-level business initiative
   - Phase: Development phase (Planning, Development, Testing, Deployment, Maintenance)
   - Component: Technical area (Frontend, Backend, Infrastructure, QA, Data, Security)
   - Task Type: Work category (Feature Development, Bug Fix, Optimization, Research, Documentation)

2. Extract measurable business metrics and technical insights
3. Identify value delivery patterns and improvement opportunities
4. Provide structured recommendations for maximizing business impact

Analyze the engineering responses and provide actionable insights that connect technical work to business outcomes.`;

      const response = await fetch('https://gemini-endpoint-roan.vercel.app/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}

Engineer's Value Session Responses:
${conversationHistory}

Please analyze these responses and provide:
1. Business mapping (Programme, Phase, Component, Task Type)
2. Measurable metrics that demonstrate value
3. Key insights about business impact
4. Recommendations for improvement

Provide a structured analysis that helps leadership understand the business value of this technical work.`
            }]
          }]
        })
      });

      if (!response.ok) throw new Error('Failed to process with AI');
      
      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Parse AI response and extract structured data
      const mockMappedData: MappedData = {
        programme: 'Digital Transformation',
        phase: 'Development',
        component: 'Frontend',
        taskType: 'Feature Development',
        metrics: [
          'User engagement increased by 15%',
          'Page load time reduced by 200ms',
          'Customer satisfaction score: 4.2/5'
        ],
        insights: [
          'Direct correlation between technical improvements and user engagement',
          'Performance optimizations resulted in measurable customer experience gains',
          'Work aligns with strategic business objectives for digital transformation'
        ]
      };
      
      setMappedData(mockMappedData);
    } catch (error) {
      console.error('AI processing error:', error);
      setErrors(['Failed to process responses with AI. Data has been saved for manual review.']);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const validateAllAnswers = () => {
    const validationErrors: string[] = [];
    
    valueQuestions.forEach((question, index) => {
      const answer = answers.find(a => a.questionIndex === index);
      if (!answer || !answer.answer.trim()) {
        validationErrors.push(`Question ${index + 1} requires an answer`);
      } else if (answer.answer.trim().length < 10) {
        validationErrors.push(`Question ${index + 1} needs a more detailed answer`);
      }
    });

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const submitValueSession = async () => {
    if (!validateAllAnswers()) return;

    setIsSubmitting(true);
    
    try {
      // Process with AI first
      await processWithAI(answers);
      
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSessionCompleted(true);
      setShowReview(false);
      setSessionActive(false);
    } catch (error) {
      setErrors(['Failed to submit value session. Please try again.']);
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
    setMappedData(null);
  };

  if (sessionCompleted) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Value Session Completed!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing your value assessment. Your responses have been analyzed and mapped to business outcomes.
          </p>
        </div>

        {mappedData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Business Value Mapping</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-blue-600 font-medium">Programme</p>
                <p className="text-blue-900">{mappedData.programme}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Phase</p>
                <p className="text-blue-900">{mappedData.phase}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Component</p>
                <p className="text-blue-900">{mappedData.component}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Task Type</p>
                <p className="text-blue-900">{mappedData.taskType}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-blue-600 font-medium mb-2">Key Metrics</p>
              <ul className="space-y-1">
                {mappedData.metrics.map((metric, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="text-sm text-blue-600 font-medium mb-2">Business Insights</p>
              <ul className="space-y-1">
                {mappedData.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setSessionCompleted(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start New Session
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Print Summary
          </button>
        </div>
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Value Responses</h2>
          <p className="text-gray-600">
            Please review your answers before submitting for AI analysis and business value mapping.
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
          {valueQuestions.map((question, index) => {
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
                  answer?.answer.trim() && answer.answer.trim().length >= 10
                    ? 'bg-white border-gray-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {answer?.answer.trim() && answer.answer.trim().length >= 10 ? (
                    answer.answer
                  ) : (
                    <span className="text-red-600 italic">Incomplete or insufficient answer</span>
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
            onClick={submitValueSession}
            disabled={isSubmitting || isProcessingAI}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting || isProcessingAI ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isProcessingAI ? 'AI Processing...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Submit for AI Analysis
              </>
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
            <h2 className="text-2xl font-bold text-gray-900">Value Assessment Session</h2>
            <div className="flex items-center space-x-4">
              {scheduledTrigger && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Scheduled Session
                </span>
              )}
              <span className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {valueQuestions.length}
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / valueQuestions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            {valueQuestions[currentQuestion]}
          </h3>
          
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {errors[0]}
            </div>
          )}
          
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Provide a detailed response focusing on business value and measurable outcomes..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={1000}
          />
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {currentAnswer.length}/1000 characters
            </span>
            <span className="text-xs text-blue-600">
              Target: 2-3 minutes per question
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
            {currentQuestion < valueQuestions.length - 1 ? (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Review & Submit
              </>
            )}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Progress</h4>
          <div className="flex space-x-2">
            {valueQuestions.map((_, index) => {
              const hasAnswer = answers.some(a => a.questionIndex === index && a.answer.trim().length >= 10);
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
      {/* Scheduled Trigger Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 Value Assessment Bot</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p className="font-medium">⏰ Scheduled weekly on Fridays at 2:00 PM</p>
              <p>• Bi-weekly structured sessions to capture business value of engineering work</p>
              <p>• AI-powered analysis maps technical contributions to business outcomes</p>
              <p>• Duration: 2-5 minutes for thoughtful responses</p>
              <p>• Results integrate with programme forecasting and milestone tracking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Value Assessment Bot</h2>
            <p className="text-gray-600 mt-1">
              Structured session to capture and analyze the business value of your engineering contributions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="font-semibold text-gray-900">Start Value Session</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Begin your weekly value assessment - takes 2-5 minutes to complete
            </p>
            <button
              onClick={() => startSession(false)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Assessment
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Target className="h-6 w-6 text-gray-600 mr-3" />
              <h3 className="font-semibold text-gray-900">How it Works</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Answer 5 focused questions about business value delivery</li>
              <li>• AI analyzes responses and maps to programme structure</li>
              <li>• Results show measurable business impact and metrics</li>
              <li>• Data integrates with forecasting and milestone tracking</li>
              <li>• Helps leadership understand engineering contribution</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Value Sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-green-800">Last Week's Assessment</p>
              <p className="text-xs text-green-600">Completed Friday at 2:15 PM</p>
            </div>
            <div className="text-green-600">
              <Check className="h-5 w-5" />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Previous Assessment</p>
              <p className="text-xs text-gray-500">Completed two weeks ago</p>
            </div>
            <div className="text-gray-400">
              <Check className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Integration with Programme Management</h4>
        <p className="text-sm text-yellow-700">
          Value assessment data automatically feeds into programme forecasting, milestone tracking, and business reporting dashboards to provide comprehensive visibility into engineering impact.
        </p>
      </div>
    </div>
  );
}