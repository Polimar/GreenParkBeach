"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { BeachProvider } from "@/lib/beach-context";
import { LoginScreen } from "@/components/LoginScreen";
import { AppShell } from "@/components/AppShell";

function AppContent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppShell /> : <LoginScreen />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BeachProvider>
        <AppContent />
      </BeachProvider>
    </AuthProvider>
  );
}
