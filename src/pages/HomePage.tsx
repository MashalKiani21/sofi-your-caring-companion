import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceContext } from "@/contexts/VoiceContext";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, Bell, Phone, MapPin, HeartPulse, ShieldAlert, Settings, LogOut,
  MessageCircle, FileText, MessageSquare, Keyboard
} from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  const { user, signOut } = useAuth();
  const { isListening } = useVoiceContext();
  const [showTextInput, setShowTextInput] = useState(false);
  const [textCommand, setTextCommand] = useState("");

  usePageAnnounce("Home", "ہوم");

  // Text command fallback - uses VoiceService via global context
  const handleTextCommand = () => {
    if (textCommand.trim()) {
      // The global voice context handles intent parsing
      // For text, we import VoiceService directly
      import("@/services/VoiceService").then(({ VoiceService }) => {
        const intent = VoiceService.parseIntent(textCommand.trim());
        const confirmation = VoiceService.getConfirmation(intent, language);
        speak(confirmation);
        switch (intent.type) {
          case "navigate": navigate(intent.page); break;
          case "call": navigate("/contacts"); break;
          case "message": navigate("/messages"); break;
          case "whatsapp": navigate("/whatsapp"); break;
          case "reminder": navigate("/reminders"); break;
          case "emergency": navigate("/emergency"); break;
          default: navigate("/companion"); break;
        }
      });
      setTextCommand("");
      setShowTextInput(false);
    }
  };

  const features = [
    { label: t("AI Companion", "AI ساتھی"), sublabel: t("Chat & Voice", "چیٹ اور آواز"), icon: Bot, path: "/companion", bg: "bg-primary/10", iconColor: "text-primary", border: "border-primary/20" },
    { label: t("Contacts", "رابطے"), sublabel: t("Call & Message", "کال اور پیغام"), icon: Phone, path: "/contacts", bg: "bg-success/10", iconColor: "text-success", border: "border-success/20" },
    { label: t("Messages", "پیغامات"), sublabel: t("SMS & Text", "SMS اور ٹیکسٹ"), icon: MessageSquare, path: "/messages", bg: "bg-primary/10", iconColor: "text-primary", border: "border-primary/20" },
    { label: t("WhatsApp", "واٹس ایپ"), sublabel: t("Chat & Call", "چیٹ اور کال"), icon: MessageCircle, path: "/whatsapp", bg: "bg-success/10", iconColor: "text-success", border: "border-success/20" },
    { label: t("Reminders", "یاد دہانیاں"), sublabel: t("Alarms & Tasks", "الارم اور کام"), icon: Bell, path: "/reminders", bg: "bg-accent", iconColor: "text-foreground", border: "border-border" },
    { label: t("Notes", "نوٹس"), sublabel: t("Voice & Text", "آواز اور ٹیکسٹ"), icon: FileText, path: "/notes", bg: "bg-accent", iconColor: "text-foreground", border: "border-border" },
    { label: t("Health", "صحت"), sublabel: t("Dashboard", "ڈیش بورڈ"), icon: HeartPulse, path: "/health-dashboard", bg: "bg-emergency/10", iconColor: "text-emergency", border: "border-emergency/20" },
    { label: t("Emergency", "ایمرجنسی"), sublabel: "SOS", icon: ShieldAlert, path: "/emergency", bg: "bg-emergency/15", iconColor: "text-emergency", border: "border-emergency/30" },
    { label: t("Navigation", "نقشہ جات"), sublabel: t("Maps", "نقشے"), icon: MapPin, path: "/navigation", bg: "bg-secondary", iconColor: "text-foreground", border: "border-border" },
    { label: t("Settings", "ترتیبات"), sublabel: t("Customize", "ترمیم"), icon: Settings, path: "/settings", bg: "bg-secondary", iconColor: "text-muted-foreground", border: "border-border" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24" role="main" aria-label="SOFI Home Dashboard">
      {/* Header */}
      <header className="px-5 pt-6 pb-2" role="banner">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("Hello", "السلام علیکم")} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isListening
                ? t("I'm listening — just speak!", "میں سن رہی ہوں — بس بولیں!")
                : t("How can SOFI help you?", "سوفی آپ کی کیسے مدد کرے؟")
              }
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

        {/* Text command toggle */}
        <div className="flex gap-2 mt-3" role="toolbar" aria-label="Input controls">
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="flex-1 py-3 px-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 bg-secondary text-muted-foreground border border-border transition-colors"
            aria-expanded={showTextInput}
            aria-label={t("Type a command instead of speaking", "بولنے کی بجائے کمانڈ ٹائپ کریں")}
          >
            <Keyboard className="w-4 h-4" />
            {t("Type Command", "کمانڈ ٹائپ کریں")}
          </button>
        </div>

        {/* Text command input */}
        {showTextInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 flex gap-2"
            role="search"
            aria-label="Text command input"
          >
            <input
              value={textCommand}
              onChange={(e) => setTextCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextCommand()}
              placeholder={t("Type: \"Call Ahmed\", \"Open notes\"...", "لکھیں: \"احمد کو کال کرو\"...")}
              className="flex-1 min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              dir={language === "ur" ? "rtl" : "ltr"}
              autoFocus
              aria-label="Type a voice command"
            />
            <button
              onClick={handleTextCommand}
              className="min-h-touch px-5 rounded-2xl bg-primary text-primary-foreground font-medium text-sm"
              aria-label="Execute command"
            >
              {t("Go", "چلو")}
            </button>
          </motion.div>
        )}
      </header>

      {/* Feature Grid */}
      <nav className="flex-1 px-4 overflow-y-auto" aria-label="SOFI Features">
        <div className="grid grid-cols-2 gap-3" role="list">
          {features.map((feat, i) => (
            <motion.button
              key={feat.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => {
                if (disabilityType === "visual") speak(feat.label);
                navigate(feat.path);
              }}
              className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-3xl border-2 ${feat.border} bg-card shadow-card min-h-[120px] hover:scale-[1.02] active:scale-[0.97] transition-all`}
              aria-label={`${feat.label} — ${feat.sublabel}`}
              role="listitem"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${feat.bg}`} aria-hidden="true">
                <feat.icon className={`w-7 h-7 ${feat.iconColor}`} />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-foreground block leading-tight">
                  {feat.label}
                </span>
                <span className="text-[11px] text-muted-foreground">{feat.sublabel}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Caregiver link */}
        <button
          onClick={() => navigate("/caregiver")}
          className="w-full mt-4 mb-4 py-4 px-5 rounded-2xl bg-card border-2 border-border text-foreground font-medium text-left flex items-center justify-between shadow-card hover:bg-secondary/50 transition-colors"
          aria-label={t("Open Caregiver Dashboard", "نگہداشت کنندہ ڈیش بورڈ کھولیں")}
        >
          <span>{t("Caregiver Dashboard", "نگہداشت کنندہ ڈیش بورڈ")}</span>
          <span className="text-muted-foreground" aria-hidden="true">→</span>
        </button>
      </nav>
    </div>
  );
};

export default HomePage;
