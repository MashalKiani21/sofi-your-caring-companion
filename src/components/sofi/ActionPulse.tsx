import { motion, AnimatePresence } from "framer-motion";
import type { SofiState } from "@/types/sofi";

interface ActionPulseProps {
  state: SofiState;
  onTap: () => void;
}

const stateConfig: Record<SofiState, { color: string; label: string; labelUrdu: string }> = {
  idle: { color: "bg-muted/30", label: "Tap or say \"Hey SOFI\"", labelUrdu: "\"ہے صوفی\" کہیں" },
  listening: { color: "bg-primary/20", label: "Listening…", labelUrdu: "…سن رہی ہوں" },
  thinking: { color: "bg-primary/30", label: "Thinking…", labelUrdu: "…سوچ رہی ہوں" },
  speaking: { color: "bg-success/20", label: "Speaking…", labelUrdu: "…بول رہی ہوں" },
  success: { color: "bg-success/20", label: "Done", labelUrdu: "ہو گیا" },
  emergency: { color: "bg-emergency/20", label: "EMERGENCY", labelUrdu: "ایمرجنسی" },
};

const ActionPulse = ({ state, onTap }: ActionPulseProps) => {
  const config = stateConfig[state];
  const isActive = state === "listening" || state === "thinking";

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <button
        onClick={onTap}
        className="relative flex items-center justify-center min-h-touch min-w-touch focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
        aria-label={config.label}
      >
        {/* Pulse rings */}
        {isActive && (
          <>
            <span className="absolute w-24 h-24 rounded-full bg-primary/30 animate-pulse-ring" />
            <span className="absolute w-24 h-24 rounded-full bg-primary/20 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
          </>
        )}

        {/* Core circle */}
        <motion.div
          className={`relative z-10 w-24 h-24 rounded-full ${config.color} flex items-center justify-center transition-colors duration-150`}
          animate={
            state === "speaking"
              ? { scale: [1, 1.05, 1] }
              : state === "emergency"
              ? { scale: [1, 1.08, 1] }
              : { scale: 1 }
          }
          transition={
            state === "speaking" || state === "emergency"
              ? { repeat: Infinity, duration: 0.8 }
              : { duration: 0.2 }
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ ease: [0.25, 0.1, 0.25, 1], duration: 0.2 }}
              className="w-12 h-12 rounded-full"
              style={{
                background:
                  state === "emergency"
                    ? "hsl(var(--emergency))"
                    : state === "success"
                    ? "hsl(var(--success))"
                    : "hsl(var(--primary))",
              }}
            />
          </AnimatePresence>
        </motion.div>
      </button>

      {/* State label */}
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold tracking-tight text-foreground">{config.label}</p>
        <p className="text-lg font-urdu text-muted-foreground">{config.labelUrdu}</p>
      </div>
    </div>
  );
};

export default ActionPulse;
