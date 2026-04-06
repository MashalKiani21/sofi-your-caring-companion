/**
 * VoiceDiagnosticsPanel - Expandable debug panel showing mic status,
 * recognition language, confidence, and last transcript.
 */
import { useState, useEffect } from "react";
import { useVoiceContext } from "@/contexts/VoiceContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp, Mic, MicOff, Languages, Gauge } from "lucide-react";

const VoiceDiagnosticsPanel = () => {
  const { isListening, transcript, interimText, confidence, isPaused } = useVoiceContext();
  const { t, language } = useAccessibility();
  const [expanded, setExpanded] = useState(false);
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then(status => {
        setMicPermission(status.state as any);
        status.onchange = () => setMicPermission(status.state as any);
      }).catch(() => setMicPermission("unknown"));
    }
  }, []);

  const micColor = micPermission === "granted" ? "text-success" : micPermission === "denied" ? "text-destructive" : "text-muted-foreground";
  const confidencePct = Math.round(confidence * 100);

  return (
    <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 min-h-touch"
        aria-expanded={expanded}
        aria-label={t("Voice Diagnostics", "آواز کی تشخیص")}
      >
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">{t("Voice Diagnostics", "آواز کی تشخیص")}</p>
            <p className="text-xs text-muted-foreground">
              {isListening ? t("Active", "فعال") : isPaused ? t("Paused", "رکا ہوا") : t("Inactive", "غیر فعال")}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Mic Permission */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2">
                  {micPermission === "granted" ? <Mic className={`w-4 h-4 ${micColor}`} /> : <MicOff className={`w-4 h-4 ${micColor}`} />}
                  <span className="text-sm text-foreground">{t("Microphone", "مائیکروفون")}</span>
                </div>
                <span className={`text-xs font-medium capitalize ${micColor}`}>
                  {micPermission === "granted" ? t("Allowed", "اجازت") : micPermission === "denied" ? t("Denied", "منع") : micPermission === "prompt" ? t("Not Asked", "نہیں پوچھا") : t("Unknown", "نامعلوم")}
                </span>
              </div>

              {/* Recognition Language */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{t("Language", "زبان")}</span>
                </div>
                <span className="text-xs font-medium text-foreground">
                  {language === "ur" ? "Urdu (ur-PK)" : "English (en-US)"}
                </span>
              </div>

              {/* Listening Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2">
                  <Mic className={`w-4 h-4 ${isListening ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm text-foreground">{t("Status", "حالت")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isListening ? "bg-success animate-pulse" : isPaused ? "bg-destructive" : "bg-muted-foreground"}`} />
                  <span className="text-xs font-medium text-foreground">
                    {isListening ? t("Listening", "سن رہی ہے") : isPaused ? t("Paused", "رکا ہوا") : t("Stopped", "بند")}
                  </span>
                </div>
              </div>

              {/* Confidence */}
              <div className="p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{t("Confidence", "اعتماد")}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">{confidencePct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${confidencePct >= 70 ? "bg-success" : confidencePct >= 40 ? "bg-primary" : "bg-destructive"}`}
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>

              {/* Last Transcript */}
              <div className="p-3 rounded-xl bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">{t("Last heard", "آخری سنا گیا")}</p>
                <p className="text-sm text-foreground font-medium min-h-[1.5rem]">
                  {interimText ? (
                    <span className="italic text-muted-foreground">🎙️ {interimText}...</span>
                  ) : transcript ? (
                    <>"{transcript}"</>
                  ) : (
                    <span className="text-muted-foreground italic">{t("Nothing yet", "ابھی تک کچھ نہیں")}</span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceDiagnosticsPanel;
