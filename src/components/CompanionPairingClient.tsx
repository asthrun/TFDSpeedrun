"use client";

import { useEffect, useRef } from "react";

const COMPANION_BRIDGE_URL = "ws://127.0.0.1:38471";

type CompanionShortcuts = {
  startSplitFinish: string | null;
  pauseResume: string | null;
  undoSplit: string | null;
  skipSplit: string | null;
  reset: string | null;
};

type Props = {
  shortcuts: CompanionShortcuts;
};

function sendShortcutConfiguration(
  websocket: WebSocket,
  shortcuts: CompanionShortcuts
) {
  websocket.send(
    JSON.stringify({
      type: "configure_shortcuts",
      shortcuts: {
        start_split_finish: shortcuts.startSplitFinish,
        pause_resume: shortcuts.pauseResume,
        undo_split: shortcuts.undoSplit,
        skip_split: shortcuts.skipSplit,
        reset: shortcuts.reset,
      },
    })
  );
}

export default function CompanionPairingClient({
  shortcuts,
}: Props) {
  const websocketRef = useRef<WebSocket | null>(null);
  const pairedRef = useRef(false);
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
  shortcutsRef.current = shortcuts;

  const websocket = websocketRef.current;

    if (
      !pairedRef.current ||
      !websocket ||
      websocket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    sendShortcutConfiguration(websocket, shortcuts);

    console.log(
      "Updated shortcut configuration sent to TFDSpeedrun Companion."
    );
  }, [
    shortcuts.startSplitFinish,
    shortcuts.pauseResume,
    shortcuts.undoSplit,
    shortcuts.skipSplit,
    shortcuts.reset,
  ]);

  useEffect(() => {
    const hash = window.location.hash;

    if (!hash.startsWith("#companion_pair=")) {
      return;
    }

    const pairingCode = new URLSearchParams(
      hash.slice(1)
    ).get("companion_pair");

    // Remove the pairing secret from the visible URL immediately.
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );

    if (!pairingCode) {
      console.error("Companion pairing code is missing.");
      return;
    }

    const websocket = new WebSocket(COMPANION_BRIDGE_URL);
    websocketRef.current = websocket;

    websocket.onopen = () => {
      websocket.send(pairingCode);
    };

    websocket.onmessage = (event) => {
      if (event.data === "pairing_ok") {
        pairedRef.current = true;

        console.log("TFDSpeedrun Companion connected.");

        sendShortcutConfiguration(
          websocket,
          shortcutsRef.current
        );

        console.log(
          "Initial shortcut configuration sent to TFDSpeedrun Companion."
        );

        return;
      }

      if (event.data === "pairing_rejected") {
        console.error("TFDSpeedrun Companion pairing rejected.");
        websocket.close();
        return;
      }

      const companionIntents = new Set([
        "start_split_finish",
        "pause_resume",
        "undo_split",
        "skip_split",
        "reset",
      ]);

      if (
        typeof event.data === "string" &&
        companionIntents.has(event.data)
      ) {
        console.log(`Companion intent received: ${event.data}`);

        window.dispatchEvent(
          new CustomEvent("tfdspeedrun:companion-intent", {
            detail: event.data,
          })
        );

        return;
      }

      console.warn("Unknown Companion message ignored.");
    };

    websocket.onerror = () => {
      console.error("Could not connect to TFDSpeedrun Companion.");
    };

    websocket.onclose = () => {
      pairedRef.current = false;

      if (websocketRef.current === websocket) {
        websocketRef.current = null;
      }

      console.log("TFDSpeedrun Companion disconnected.");
    };

    return () => {
      pairedRef.current = false;

      if (websocketRef.current === websocket) {
        websocketRef.current = null;
      }

      websocket.close();
    };
  }, []);

  return null;
}