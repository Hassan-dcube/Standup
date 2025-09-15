import React from 'react';
import { Chatbot } from './Chatbot';

export function ChatbotPage() {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-600 mt-2">
          Get intelligent insights from your standup data and team progress
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)]">
        <Chatbot />
      </div>
    </div>
  );
}
