"use client";

import { useAppNotification } from "@/components/AppNotificationProvider";

export function AppNotificationBanner() {
  const {
    notification,
    dismissNotification,
  } = useAppNotification();

  if (!notification) {
    return null;
  }

  const styles = {
    success:
      "border-emerald-800 bg-emerald-950/60 text-emerald-100",
    error:
      "border-red-800 bg-red-950/60 text-red-100",
    warning:
      "border-amber-800 bg-amber-950/60 text-amber-100",
    info:
      "border-blue-800 bg-blue-950/60 text-blue-100",
  };

  const symbols = {
    success: "✓",
    error: "!",
    warning: "!",
    info: "i",
  };

  return (
    <div
      role={
        notification.type === "error"
          ? "alert"
          : "status"
      }
      className={`border-b px-4 py-3 ${styles[notification.type]}`}
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <span
          className="mt-0.5 font-semibold"
          aria-hidden="true"
        >
          {symbols[notification.type]}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">
            {notification.title}
          </div>

          <div className="mt-0.5 text-sm opacity-80">
            {notification.message}
          </div>
        </div>

        <button
          type="button"
          onClick={dismissNotification}
          className="shrink-0 px-2 text-lg leading-none opacity-60 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}