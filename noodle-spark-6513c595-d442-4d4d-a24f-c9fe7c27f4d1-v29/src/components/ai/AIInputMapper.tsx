import React, { useState } from 'react';
import { Bot, Zap, Clock, Target, CheckCircle, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface MappingResult {
  confidence: number;
  programme: string;
  phase: string;
  component: string;
  type: string;
  suggestions: string[];
}

export function AIInputMapper() {
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<MappingResult | null>(null);
  const [history, setHistory] = useState<Array<{ input: string; result: MappingResult }>>([]);

  const processInput = async () => {
    if (!input.trim()) return;
    
    setProcessing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResult: MappingResult = {
      confidence: 0.92,
      programme: 'Digital Transformation',
      phase: 'Implementation',
      component: 'Frontend Development',
      type: 'Feature Development',
      suggestions: [
        'Consider linking to existing API integration tasks',
        'Similar work logged in previous sprint',
        'Estimated effort aligns with sprint capacity'
      ]
    };
    
    setResult(mockResult);
    setHistory(prev => [{ input, result: mockResult }, ...prev.slice(0, 4)]);
    setProcessing(false);
  };

  const applyMapping = () => {
    setInput('');
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Input Mapper</h3>
            <p className="text-sm text-gray-600">Describe your work in natural language</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: 'Worked on the user dashboard, fixed login bugs and added new charts'"
              className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          
          <button
            onClick={processInput}
            disabled={!input.trim() || processing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Map to Programme Data
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">Mapping Complete</span>
              </div>
              <div className="text-sm text-green-700">
                {(result.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Programme</p>
                <p className="font-medium text-gray-900">{result.programme}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phase</p>
                <p className="font-medium text-gray-900">{result.phase}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Component</p>
                <p className="font-medium text-gray-900">{result.component}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium text-gray-900">{result.type}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">AI Suggestions</p>
              <ul className="space-y-1">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <ArrowRight className="h-3 w-3 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={applyMapping}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Apply Mapping to Timesheet
            </button>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Mappings</h4>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">'{item.input}'</p>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span>{item.result.programme}</span>
                  <span>•</span>
                  <span>{item.result.component}</span>
                  <span>•</span>
                  <span>{(item.result.confidence * 100).toFixed(0)}% match</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}