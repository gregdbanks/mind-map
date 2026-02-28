import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';

export const TeamSettings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadTeam = async () => {
      try {
        const status = await apiClient.getPlanStatus();
        if (status.plan !== 'teams') {
          setError('You are not on a Teams plan');
          setLoading(false);
          return;
        }
        // For now, team info comes from the user's team
        // This is a simplified view
        setLoading(false);
      } catch {
        setError('Failed to load team');
        setLoading(false);
      }
    };

    loadTeam();
  }, [isAuthenticated, authLoading, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '40px 20px',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 24px 0' }}>
          Team Settings
        </h1>

        {loading && <p>Loading...</p>}
        {error && (
          <div style={{
            padding: 16,
            background: '#fef2f2',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <p style={{ color: '#666', fontSize: 14 }}>
              Team management is available. Use the Invite button in the map editor to invite collaborators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
