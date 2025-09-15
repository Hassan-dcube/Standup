import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Calendar, Sparkles, X, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface FloatingChatbotProps {
  className?: string;
}

export function FloatingChatbot({ className = '' }: FloatingChatbotProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your AI assistant for standup summaries. I can help you analyze team progress, generate summaries, and answer questions about your standup data. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          },
          includeStandupData: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response,
        timestamp: new Date(data.timestamp)
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateStandupSummary = async () => {
    const today = new Date().toISOString().split('T')[0];
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:4000/api/chatbot/standup-summary/${today}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      
      const summaryMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `📊 **Daily Standup Summary for ${today}**\n\n${data.summary}\n\n*Generated from ${data.totalEmployees} employee standup(s)*`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, summaryMessage]);
    } catch (error) {
      console.error('Error generating summary:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: 'I couldn\'t generate a standup summary right now. This might be because there are no standup submissions for today, or there was a technical issue.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Only show the AI assistant for managers
  if (!user || user.role !== 'manager') {
    return null;
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Chat Widget */}
      {isOpen && (
        <div className="mb-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-xs text-gray-500">Standup & Project Insights</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-xs ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`p-1.5 rounded ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="p-1.5 rounded bg-gray-100">
                    <Bot className="h-3 w-3 text-gray-600" />
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-gray-100">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex space-x-1 mb-2">
              <button
                onClick={generateStandupSummary}
                disabled={isLoading}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="h-3 w-3" />
                <span>Today's Summary</span>
              </button>
              <button
                onClick={() => setInputMessage("Summarize all the standups")}
                disabled={isLoading}
                className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-3 w-3" />
                <span>Summarize</span>
              </button>
            </div>

            {/* Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about standups..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>
    </div>
  );
}
