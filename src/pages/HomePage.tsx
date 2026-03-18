import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { VoiceService } from "@/services/VoiceService";
import { ContactService } from "@/services/ContactService";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, Bell, Phone, MapPin, HeartPulse, ShieldAlert, Settings, Mic, MicOff, LogOut,
  MessageCircle, FileText, MessageSquare, Keyboard
} from "lucide-react";
import { toast } from "sonner";

const HomePage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  const { user, signOut } = useAuth();
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textCommand, setTextCommand] = useState("");

  usePageAnnounce("Home", "ہوم");

  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({
    language,
    onResult: (text) => handleVoiceCommand(text),
  });

  const handleVoiceCommand = async (text: string) => {
    const intent = VoiceService.parseIntent(text);
    const confirmation = VoiceService.getConfirmation(intent, language);
    setVoiceFeedback(confirmation);
    speak(confirmation);

    switch (intent.type) {
      case "navigate":
        navigate(intent.page);
        break;
      case "call": {
        if (user) {
          try {
            const contacts = await ContactService.getContacts(user.id);
            const matches = ContactService.findByName(contacts, intent.contactName);
            if (matches.length === 1) {
              ContactService.makeCall(matches[0].phone);
            } else if (matches.length > 1) {
              const details = matches.map((c, i) => `${i + 1}. ${c.name} (${c.relationship}) - ${c.phone}`).join("\n");
              const msg = t(
                `I found ${matches.length} contacts named "${intent.contactName}":\n${details}\nPlease say the number or full name with relationship.`,
                `"${intent.contactName}" نام کے ${matches.length} رابطے ملے:\n${details}\nبراہ کرم نمبر یا پورا نام بتائیں۔`
              );
              speak(msg);
              toast.info(msg, { duration: 8000 });
            } else {
              const msg = t(`No contact named "${intent.contactName}" found.`, `"${intent.contactName}" نام کا کوئی رابطہ نہیں ملا۔`);
              speak(msg);
              toast.error(msg);
            }
          } catch {
            navigate("/contacts");
          }
        }
        break;
      }
      case "message":
        navigate("/messages");
        break;
      case "whatsapp":
        navigate("/whatsapp");
        break;
      case "reminder":
        navigate("/reminders");
        break;
      case "emergency":
        navigate("/emergency");
        break;
      default:
        navigate("/companion");
        break;
    }

    setTimeout(() => setVoiceFeedback(""), 4000);
  };

  const handleTextCommand = () => {
    if (textCommand.trim()) {
      handleVoiceCommand(textCommand.trim());
      setTextCommand("");
      setShowTextInput(false);
    }
  };

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
              {t("How can SOFI help you?", "سوفی آپ کی کیسے مدد کرے؟")}
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

        {/* Wake word + text command toggle */}
        <div className="flex gap-2 mt-3" role="toolbar" aria-label="Voice controls">
          <button
            onClick={toggleWakeWord}
            className={`flex-1 py-3 px-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              wakeWordActive
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary text-muted-foreground border border-border"
            }`}
            aria-pressed={wakeWordActive}
            aria-label={wakeWordActive ? "Hey SOFI wake word is active" : "Activate Hey SOFI wake word"}
          >
            <Mic className="w-4 h-4" />
            {wakeWordActive ? t("\"Hey SOFI\" ON", "\"ہے سوفی\" فعال") : t("\"Hey SOFI\"", "\"ہے سوفی\"")}
          </button>
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="min-h-touch min-w-touch rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t("Type a command instead of speaking", "بولنے کی بجائے کمانڈ ٹائپ کریں")}
            aria-expanded={showTextInput}
          >
            <Keyboard className="w-5 h-5" />
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
              placeholder={t("Type command: \"Call Ahmed\", \"Open notes\"...", "کمانڈ لکھیں: \"احمد کو کال کرو\"...")}
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

      {/* Voice feedback - announced to screen readers */}
      {voiceFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mb-2 p-3 rounded-2xl bg-primary/10 border border-primary/20 text-sm text-primary font-medium text-center"
          role="status"
          aria-live="assertive"
        >
          {voiceFeedback}
        </motion.div>
      )}

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

      {/* Big Central Mic Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
        {isListening && (
          <>
            <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full bg-emergency/20 animate-pulse-ring" aria-hidden="true" />
            <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full bg-emergency/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} aria-hidden="true" />
          </>
        )}
        <button
          onClick={() => isListening ? stopListening() : startListening()}
          disabled={!isSupported}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${
            isListening
              ? "bg-emergency text-emergency-foreground scale-110"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-2xl"
          } disabled:opacity-30`}
          aria-label={isListening ? t("Stop listening", "سننا بند کریں") : t("Press to give a voice command", "آواز کمانڈ دینے کے لیے دبائیں")}
          aria-live="polite"
        >
          {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
        </button>
        {isListening && (
          <p className="text-xs text-center mt-2 text-emergency font-semibold animate-pulse" aria-live="assertive">
            {t("Listening...", "سن رہی ہے...")}
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
