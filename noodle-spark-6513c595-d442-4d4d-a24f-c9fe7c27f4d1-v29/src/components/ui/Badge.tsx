import React from 'react';
import { AlertTriangle, Clock, Info } from 'lucide-react';

interface BadgeProps {
  type: 'risk' | 'stale' | 'info';
  children: React.ReactNode;
  tooltip?: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ type, children, tooltip, className = '' }) => {
  const getBadgeStyles = () => {
    switch (type) {
      case 'risk':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'stale':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="w-3 h-3 mr-1" />;
      case 'stale':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'info':
        return <Info className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBadgeStyles()} ${className}`}
      title={tooltip}
    >
      {getIcon()}
      {children}
    </div>
  );
};

export default Badge;
