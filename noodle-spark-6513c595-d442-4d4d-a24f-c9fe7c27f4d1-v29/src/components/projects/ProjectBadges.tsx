import React, { useState, useEffect } from 'react';
import Badge from '../ui/Badge';

interface ProjectBadgesData {
  isAtRisk: boolean;
  isStale: boolean;
  riskReason?: string;
  staleReason?: string;
}

interface ProjectBadgesProps {
  projectId: string;
  className?: string;
}

const ProjectBadges: React.FC<ProjectBadgesProps> = ({ projectId, className = '' }) => {
  const [badges, setBadges] = useState<ProjectBadgesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBadges();
  }, [projectId]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/badges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch badges');
      }
    } catch (err) {
      setError('Network error while fetching badges');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-full h-6 w-16"></div>
      </div>
    );
  }

  if (error || !badges) {
    return null; // Don't show anything if there's an error
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {badges.isAtRisk && (
        <Badge 
          type="risk" 
          tooltip={badges.riskReason}
        >
          At Risk
        </Badge>
      )}
      
      {badges.isStale && (
        <Badge 
          type="stale" 
          tooltip={badges.staleReason}
        >
          Stale
        </Badge>
      )}
    </div>
  );
};

export default ProjectBadges;
