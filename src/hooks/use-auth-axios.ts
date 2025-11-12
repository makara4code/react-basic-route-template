/**
 * Custom Auth Hook using Axios
 * Alternative to Better Auth's useSession hook
 */

import { useState, useEffect } from "react";
import authService, { type Session } from "@/services/auth.service";

export function useAuthAxios() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    const result = await authService.getSession();

    if (result.data) {
      setSession(result.data);
      setError(null);
    } else if (result.error) {
      setSession(null);
      setError(result.error.message);
    }

    setLoading(false);
  };

  return {
    session,
    user: session?.user,
    isAuthenticated: !!session,
    loading,
    error,
    refetch: checkSession,
  };
}
