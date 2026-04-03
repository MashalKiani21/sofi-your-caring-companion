/**
 * GlobalVoiceIndicator - Shows live transcript + mic state.
 * Displays interim text so users can SEE what the mic is hearing in real-time.
 */
import { useVoiceContext } from "@/contexts/VoiceContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const GlobalVoiceIndicator = () => {
  const { isListening, transcript, interimText, confidence, isPaused, pauseGlobal, resumeGlobal } = useVoiceContext();
  const { t } = useAccessibility();
  const location = useLocation();

  const hiddenRoutes = ["/", "/auth", "/reset-password", "/profile-setup"];
  if (hiddenRoutes.includes(location.pathname)) return null;

  const displayText = interimText || transcript;

  return (
    <>
      {/* Floating mic indicator */}
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
        aria-label={isListening ? t("SOFI is listening", "سوفی سن رہی ہے") : t("Voice paused", "آواز رکی ہے")}
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

      {/* Live transcript display - shows interim + final text */}
      <AnimatePresence>
        {displayText && isListening && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-12 left-4 right-4 z-50 p-3 rounded-2xl bg-card border border-primary/20 shadow-lg"
            role="status"
            aria-live="assertive"
          >
            <p className={`text-xs font-medium text-center ${interimText ? "text-muted-foreground italic" : "text-primary"}`}>
              {interimText ? (
                <>🎙️ {interimText}...</>
              ) : (
                <>✅ "{transcript}"</>
              )}
            </p>
            {confidence > 0 && !interimText && (
              <div className="mt-1 flex justify-center">
                <span className="text-[9px] text-muted-foreground">
                  {t(`Confidence: ${Math.round(confidence * 100)}%`, `اعتماد: ${Math.round(confidence * 100)}%`)}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalVoiceIndicator;
