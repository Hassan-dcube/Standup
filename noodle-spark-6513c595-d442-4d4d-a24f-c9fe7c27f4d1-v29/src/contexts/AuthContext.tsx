import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'employee' | 'manager' | 'programme-manager';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    } else if (storedUser) {
      // User exists but no token - generate one for demo purposes
      const user = JSON.parse(storedUser);
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const now = Math.floor(Date.now() / 1000);
      const payload = btoa(JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role === 'manager' ? 'MANAGER' : user.role === 'programme-manager' ? 'PROGRAMME_MANAGER' : 'STUDENT',
        iat: now,
        exp: now + (24 * 60 * 60) // 24 hours from now
      }));
      const signature = btoa('mock-signature');
      const mockToken = `${header}.${payload}.${signature}`;
      localStorage.setItem('token', mockToken);
      setUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate login with demo users
    const demoUsers: User[] = [
      { id: '1', name: 'Fawad', email: 'fawad@company.com', role: 'employee', department: 'Engineering' },
      { id: '2', name: 'Hira', email: 'hira@company.com', role: 'employee', department: 'Engineering' },
      { id: '3', name: 'Assad', email: 'assad@company.com', role: 'employee', department: 'PMO' },
      { id: '4', name: 'Saad', email: 'saad@company.com', role: 'employee', department: 'Engineering' },
      { id: 'hassan-manager', name: 'Hassan', email: 'hassan@company.com', role: 'manager', department: 'Management' }
    ];

    const foundUser = demoUsers.find(u => u.email === email);
    if (foundUser && password === 'demo123') {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(foundUser));
      
      // Generate a mock JWT token for demo purposes
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const now = Math.floor(Date.now() / 1000);
      const payload = btoa(JSON.stringify({
        sub: foundUser.id,
        email: foundUser.email,
        role: foundUser.role === 'manager' ? 'MANAGER' : foundUser.role === 'programme-manager' ? 'PROGRAMME_MANAGER' : 'STUDENT',
        iat: now,
        exp: now + (24 * 60 * 60) // 24 hours from now
      }));
      const signature = btoa('mock-signature');
      const mockToken = `${header}.${payload}.${signature}`;
      localStorage.setItem('token', mockToken);
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};