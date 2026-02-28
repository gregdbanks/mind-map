import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';

export const CollabJoin: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      // Redirect to login, then back here
      navigate(`/login?redirect=/collab/join/${token}`);
      return;
    }

    if (!token) {
      setStatus('error');
      setError('Invalid invite link');
      return;
    }

    const acceptInvite = async () => {
      try {
        const result = await apiClient.acceptCollabInvite(token);
        setStatus('success');
        // Redirect to the map
        setTimeout(() => {
          navigate(`/map/${result.invite.map_id}`);
        }, 1500);
      } catch (err: unknown) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to accept invite');
      }
    };

    acceptInvite();
  }, [token, isAuthenticated, authLoading, navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#1a1a2e',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        {status === 'loading' && <p>Accepting invite...</p>}
        {status === 'success' && <p>Invite accepted! Redirecting to map...</p>}
        {status === 'error' && (
          <>
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: 16,
                padding: '8px 20px',
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};
