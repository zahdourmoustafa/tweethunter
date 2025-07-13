/**
 * Session Hook
 * Simple hook to get current user session
 */

'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@/lib/auth';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you'd fetch the session from better-auth
    // For now, we'll create a mock session based on localStorage or similar
    const fetchSession = async () => {
      try {
        // This would be replaced with actual better-auth session fetching
        const mockSession: Session = {
          user: {
            id: 'user-1',
            name: 'Your Name',
            email: 'user@example.com',
            emailVerified: false,
            image: '/default-avatar.png',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: 'session-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            token: 'mock-token',
            ipAddress: '127.0.0.1',
            userAgent: 'Mock User Agent',
          },
        };
        
        setSession(mockSession);
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  return {
    data: session,
    loading,
  };
}
