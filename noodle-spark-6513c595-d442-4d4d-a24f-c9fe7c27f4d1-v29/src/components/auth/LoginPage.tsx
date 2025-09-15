import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as Dialog from '@radix-ui/react-dialog';
import { Building2, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(email, password);
    if (!success) {
      setError('Invalid credentials');
    }
    setLoading(false);
  };

  const demoAccounts = [
    { email: 'fawad@company.com', role: 'Employee', department: 'Engineering' },
    { email: 'hira@company.com', role: 'Manager', department: 'Engineering' },
    { email: 'assad@company.com', role: 'Programme Manager', department: 'PMO' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Portal</h1>
          <p className="text-gray-600 mt-2">Standup & Programme Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Dialog.Root open={showDemo} onOpenChange={setShowDemo}>
            <Dialog.Trigger asChild>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Demo Accounts
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
              <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-md z-50">
                <Dialog.Title className="text-lg font-semibold mb-4">Demo Accounts</Dialog.Title>
                <div className="space-y-3">
                  {demoAccounts.map((account, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => {
                      setEmail(account.email);
                      setPassword('demo123');
                      setShowDemo(false);
                    }}>
                      <div className="font-medium text-gray-900">{account.email}</div>
                      <div className="text-sm text-gray-600">{account.role} - {account.department}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">Password for all demo accounts: demo123</p>
                <Dialog.Close asChild>
                  <button className="mt-4 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200">
                    Close
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </div>
  );
}