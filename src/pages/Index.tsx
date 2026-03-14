import { useState, useCallback } from "react";
import type { SofiState, TranscriptEntry } from "@/types/sofi";
import StatusBar from "@/components/sofi/StatusBar";
import ActionPulse from "@/components/sofi/ActionPulse";
import TranscriptDisplay from "@/components/sofi/TranscriptDisplay";
import QuickActions from "@/components/sofi/QuickActions";
import EmergencyOverlay from "@/components/sofi/EmergencyOverlay";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const demoTranscripts: TranscriptEntry[] = [
  {
    id: "1",
    english: "Remind me to take my medicine at 8 PM.",
    urdu: "رات 8 بجے دوا لینے کی یاد دہانی۔",
    type: "user",
    timestamp: new Date(),
  },
  {
    id: "2",
    english: "I've set your reminder for 8 PM.",
    urdu: "میں نے رات 8 بجے کی یاد دہانی لگا دی ہے۔",
    type: "sofi",
    timestamp: new Date(),
  },
];

const Index = () => {
  const [state, setState] = useState<SofiState>("idle");
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [emergency, setEmergency] = useState(false);
  const navigate = useNavigate();

  const simulateInteraction = useCallback(() => {
    if (state !== "idle") return;

    setState("listening");
    setTimeout(() => {
      setTranscripts([demoTranscripts[0]]);
      setState("thinking");
    }, 2000);
    setTimeout(() => {
      setTranscripts(demoTranscripts);
      setState("speaking");
    }, 3500);
    setTimeout(() => {
      setState("success");
    }, 5500);
    setTimeout(() => {
      setState("idle");
    }, 7500);
  }, [state]);

  const triggerEmergency = useCallback(() => {
    setEmergency(true);
    setState("emergency");
  }, []);

  const cancelEmergency = useCallback(() => {
    setEmergency(false);
    setState("idle");
  }, []);

  const confirmEmergency = useCallback(() => {
    // In production: trigger SMS/calls to contacts
    setEmergency(false);
    setState("idle");
  }, []);

  const bgClass =
    state === "listening"
      ? "bg-listening"
      : state === "emergency"
      ? "bg-emergency/5"
      : "bg-background";

  return (
    <>
      <EmergencyOverlay
        active={emergency}
        onCancel={cancelEmergency}
        onConfirm={confirmEmergency}
      />

      <motion.div
        className={`flex flex-col min-h-screen transition-colors duration-150 ${bgClass}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <StatusBar state={state} userName="Amina" />

        {/* Caregiver link */}
        <div className="px-6 pb-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs font-medium text-primary underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-ring rounded"
          >
            Open Caregiver Dashboard →
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-10 px-6">
          {/* Transcript area - top 40% English, bottom 40% Urdu */}
          <TranscriptDisplay entries={transcripts} />

          {/* Center action pulse */}
          <ActionPulse state={state} onTap={simulateInteraction} />
        </div>

        {/* Quick actions */}
        <div className="pb-8 pt-4">
          <QuickActions
            onEmergency={triggerEmergency}
            onSleep={() => setState("idle")}
          />
        </div>
      </motion.div>
    </>
  );
};

export default Index;
