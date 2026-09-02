"use client";

import { useEffect } from "react";

const COMPANION_BRIDGE_URL = "ws://127.0.0.1:38471";

export default function CompanionPairingClient() {
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

    websocket.onopen = () => {
      websocket.send(pairingCode);
    };

    websocket.onmessage = (event) => {
      if (event.data === "pairing_ok") {
        console.log("TFDSpeedrun Companion connected.");
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

      if (typeof event.data === "string" && companionIntents.has(event.data)) {
        console.log(`Companion intent received: ${event.data}`);
        return;
      }

      console.warn("Unknown Companion message ignored.");
    };

    websocket.onerror = () => {
      console.error("Could not connect to TFDSpeedrun Companion.");
    };

    websocket.onclose = () => {
      console.log("TFDSpeedrun Companion disconnected.");
    };

    return () => {
      websocket.close();
    };
  }, []);

  return null;
}