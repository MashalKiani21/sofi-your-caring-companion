/**
 * GlobalVoiceIndicator - Shows a persistent mic indicator when voice is active.
 * Appears as a small floating badge so the user knows SOFI is always listening.
 */
import { useVoiceContext } from "@/contexts/VoiceContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const GlobalVoiceIndicator = () => {
  const { isListening, transcript, isPaused, pauseGlobal, resumeGlobal } = useVoiceContext();
  const { t } = useAccessibility();
  const location = useLocation();

  // Don't show on intro/auth pages
  const hiddenRoutes = ["/", "/auth", "/reset-password", "/profile-setup"];
  if (hiddenRoutes.includes(location.pathname)) return null;

  return (
    <>
      {/* Floating mic indicator - top right */}
      <motion.button
        onClick={() => isPaused ? resumeGlobal() : pauseGlobal()}
        className={`fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg transition-colors ${
          isListening
            ? "bg-primary text-primary-foreground"
            : isPaused
            ? "bg-muted text-muted-foreground"
            : "bg-secondary text-foreground"
        }`}
        animate={isListening ? { scale: [1, 1.05, 1] } : {}}
        transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
        aria-label={isListening ? t("SOFI is listening. Tap to pause.", "سوفی سن رہی ہے۔ روکنے کے لیے دبائیں۔") : t("Voice paused. Tap to resume.", "آواز رکی ہے۔ شروع کرنے کے لیے دبائیں۔")}
        aria-live="polite"
      >
        {isListening ? (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold">{t("Listening", "سن رہی ہے")}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" aria-hidden="true" />
          </>
        ) : isPaused ? (
          <>
            <MicOff className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold">{t("Paused", "رکا ہوا")}</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold">{t("Ready", "تیار")}</span>
          </>
        )}
      </motion.button>

      {/* Transcript flash */}
      <AnimatePresence>
        {transcript && isListening && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-12 left-4 right-4 z-50 p-2.5 rounded-2xl bg-card border border-primary/20 shadow-lg text-center"
            role="status"
            aria-live="assertive"
          >
            <p className="text-xs font-medium text-primary">"{transcript}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalVoiceIndicator;
