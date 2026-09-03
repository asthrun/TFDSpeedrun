"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type CompanionStatus = "disconnected" | "connected";

type CompanionStatusContextValue = {
  status: CompanionStatus;
  setStatus: (status: CompanionStatus) => void;
};

const CompanionStatusContext =
  createContext<CompanionStatusContextValue | null>(null);

export function CompanionStatusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] =
    useState<CompanionStatus>("disconnected");

  return (
    <CompanionStatusContext.Provider
      value={{ status, setStatus }}
    >
      {children}
    </CompanionStatusContext.Provider>
  );
}

export function useCompanionStatus() {
  const context = useContext(CompanionStatusContext);

  if (!context) {
    throw new Error(
      "useCompanionStatus must be used inside CompanionStatusProvider."
    );
  }

  return context;
}