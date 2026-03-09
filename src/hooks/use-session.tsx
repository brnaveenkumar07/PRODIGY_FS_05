"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  refetch: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refetch: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const json = await res.json();
        setUser(json.data ? { id: json.data.id, name: json.data.name, email: json.data.email } : null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, refetch: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
