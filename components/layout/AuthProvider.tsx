"use client";

import { useEffect } from "react";
import { useUserStore } from "@/stores/userStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchSession = useUserStore((s) => s.fetchSession);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return <>{children}</>;
}
