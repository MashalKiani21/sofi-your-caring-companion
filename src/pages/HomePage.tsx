import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, Bell, Phone, MapPin, HeartPulse, ShieldAlert, Settings, Mic, MicOff, LogOut
} from "lucide-react";
import { toast } from "sonner";

const HomePage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  const { user, signOut } = useAuth();
  const [wakeWordActive, setWakeWordActive] = useState(false);

  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({
    language,
    onResult: (text) => {
      handleVoiceCommand(text);
    },
  });

  const handleVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("companion") || lower.includes("chat") || lower.includes("بات")) {
      navigate("/companion");
    } else if (lower.includes("reminder") || lower.includes("یاد")) {
      navigate("/reminders");
    } else if (lower.includes("emergency") || lower.includes("ایمرجنسی")) {
      navigate("/emergency");
    } else if (lower.includes("health") || lower.includes("صحت")) {
      navigate("/health-dashboard");
    } else if (lower.includes("contact") || lower.includes("رابطے")) {
      navigate("/contacts");
    } else if (lower.includes("message") || lower.includes("پیغام")) {
      navigate("/messages");
    } else if (lower.includes("navigate") || lower.includes("نقشہ")) {
      navigate("/navigation");
    } else if (lower.includes("setting") || lower.includes("ترتیب")) {
      navigate("/settings");
    } else if (lower.includes("note") || lower.includes("نوٹ")) {
      navigate("/notes");
    } else {
      speak(t("Opening AI companion", "AI ساتھی کھول رہے ہیں"));
      navigate("/companion");
    }
  };

  // Simulate wake word — in production, use a library like Porcupine or Picovoice
  const toggleWakeWord = () => {
    setWakeWordActive(!wakeWordActive);
    if (!wakeWordActive) {
      speak(t("Hey SOFI mode activated. Say Hey SOFI to start.", "ہے سوفی موڈ فعال۔ ہے سوفی بولیں۔"));
      toast.success(t("Wake word active", "ویک ورڈ فعال"));
    } else {
      toast.info(t("Wake word disabled", "ویک ورڈ غیر فعال"));
    }
  };

  const features = [
    {
      label: t("AI Companion", "AI ساتھی"),
      icon: Bot,
      path: "/companion",
      color: "bg-primary/10 text-primary",
      borderColor: "border-primary/20",
    },
    {
      label: t("Reminders & Notes", "یاد دہانیاں اور نوٹس"),
      icon: Bell,
      path: "/reminders",
      color: "bg-[hsl(45_93%_47%/0.1)] text-[hsl(45_93%_47%)]",
      borderColor: "border-[hsl(45_93%_47%/0.2)]",
    },
    {
      label: t("Communication", "مواصلات"),
      icon: Phone,
      path: "/contacts",
      color: "bg-success/10 text-success",
      borderColor: "border-success/20",
    },
    {
      label: t("Navigation", "نقشہ جات"),
      icon: MapPin,
      path: "/navigation",
      color: "bg-[hsl(270_60%_55%/0.1)] text-[hsl(270_60%_55%)]",
      borderColor: "border-[hsl(270_60%_55%/0.2)]",
    },
    {
      label: t("Health Dashboard", "صحت ڈیش بورڈ"),
      icon: HeartPulse,
      path: "/health-dashboard",
      color: "bg-emergency/10 text-emergency",
      borderColor: "border-emergency/20",
    },
    {
      label: t("Emergency SOS", "ایمرجنسی SOS"),
      icon: ShieldAlert,
      path: "/emergency",
      color: "bg-emergency/15 text-emergency",
      borderColor: "border-emergency/30",
    },
    {
      label: t("Settings", "ترتیبات"),
      icon: Settings,
      path: "/settings",
      color: "bg-muted/10 text-muted-foreground",
      borderColor: "border-border",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("Hello", "السلام علیکم")} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("How can SOFI help you today?", "آج سوفی آپ کی کیسے مدد کر سکتی ہے؟")}
            </p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-2xl hover:bg-secondary transition-colors"
            aria-label={t("Logout", "لاگ آوٹ")}
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Wake word toggle */}
        <button
          onClick={toggleWakeWord}
          className={`mt-4 w-full py-3 px-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            wakeWordActive
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-secondary text-muted-foreground border border-border"
          }`}
        >
          <Mic className="w-4 h-4" />
          {wakeWordActive
            ? t("\"Hey SOFI\" is active", "\"ہے سوفی\" فعال ہے")
            : t("Enable \"Hey SOFI\"", "\"ہے سوفی\" فعال کریں")}
          {/* TODO: Integrate real wake-word detection library (e.g. Picovoice Porcupine) */}
        </button>
      </header>

      {/* Feature Grid */}
      <div className="flex-1 px-5 pb-28 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {features.map((feat, i) => (
            <motion.button
              key={feat.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                speak(feat.label);
                navigate(feat.path);
              }}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 ${feat.borderColor} bg-card shadow-card min-h-[140px] hover:scale-[1.02] active:scale-[0.98] transition-transform`}
              aria-label={feat.label}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${feat.color}`}>
                <feat.icon className="w-7 h-7" />
              </div>
              <span className="text-sm font-semibold text-foreground text-center leading-tight">
                {feat.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Caregiver link */}
        <button
          onClick={() => navigate("/caregiver")}
          className="w-full mt-4 py-4 px-5 rounded-2xl bg-secondary border border-border text-foreground font-medium text-left flex items-center justify-between"
        >
          <span>{t("Caregiver Dashboard", "نگہداشت کنندہ ڈیش بورڈ")}</span>
          <span className="text-muted-foreground">→</span>
        </button>
      </div>

      {/* Floating Voice Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => isListening ? stopListening() : startListening()}
          disabled={!isSupported}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isListening
              ? "bg-emergency text-emergency-foreground animate-pulse scale-110"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          } disabled:opacity-30`}
          aria-label={isListening ? t("Stop listening", "سننا بند کریں") : t("Voice command", "آواز کمانڈ")}
        >
          {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>
        {isListening && (
          <p className="text-xs text-center mt-2 text-emergency font-medium animate-pulse">
            {t("Listening...", "سن رہی ہے...")}
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
