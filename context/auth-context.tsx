"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type AuthState = "disconnected" | "connecting" | "verifying" | "connected";

interface AuthContextType {
  authState: AuthState;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("disconnected");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setAuthState("connecting");

    // Simulate MetaMask connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setAuthState("verifying");

    // Simulate signature verification
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate a mock wallet address
    const mockAddress =
      "0x" +
      Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

    setWalletAddress(mockAddress);
    setAuthState("connected");
  }, []);

  const disconnect = useCallback(() => {
    setAuthState("disconnected");
    setWalletAddress(null);
  }, []);

  return (
    <AuthContext.Provider value={{ authState, walletAddress, connectWallet, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
