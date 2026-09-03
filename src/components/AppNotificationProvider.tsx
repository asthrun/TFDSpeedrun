"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AppNotificationType =
  | "success"
  | "error"
  | "info"
  | "warning";

export type AppNotification = {
  type: AppNotificationType;
  title: string;
  message: string;
  autoDismissMs?: number;
};

type AppNotificationContextValue = {
  notification: AppNotification | null;
  showNotification: (notification: AppNotification) => void;
  dismissNotification: () => void;
};

const AppNotificationContext =
  createContext<AppNotificationContextValue | null>(null);

export function AppNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notification, setNotification] =
    useState<AppNotification | null>(null);

  const timeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const dismissNotification = useCallback(() => {
    clearDismissTimeout();
    setNotification(null);
  }, [clearDismissTimeout]);

  const showNotification = useCallback(
    (nextNotification: AppNotification) => {
      clearDismissTimeout();
      setNotification(nextNotification);

      if (nextNotification.autoDismissMs) {
        timeoutRef.current = setTimeout(() => {
          setNotification(null);
          timeoutRef.current = null;
        }, nextNotification.autoDismissMs);
      }
    },
    [clearDismissTimeout]
  );

  return (
    <AppNotificationContext.Provider
      value={{
        notification,
        showNotification,
        dismissNotification,
      }}
    >
      {children}
    </AppNotificationContext.Provider>
  );
}

export function useAppNotification() {
  const context = useContext(AppNotificationContext);

  if (!context) {
    throw new Error(
      "useAppNotification must be used inside AppNotificationProvider."
    );
  }

  return context;
}