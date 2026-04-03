import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceContext } from "@/contexts/VoiceContext";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, Bell, Phone, MapPin, HeartPulse, ShieldAlert, Settings, LogOut,
  FileText, MessageSquare, Keyboard
} from "lucide-react";
import VoiceCommandTutorial from "@/components/VoiceCommandTutorial";

const HomePage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  const { user, signOut } = useAuth();
  const { isListening } = useVoiceContext();
  const [showTextInput, setShowTextInput] = useState(false);
  const [textCommand, setTextCommand] = useState("");

  usePageAnnounce("Home", "ہوم");

  const handleTextCommand = () => {
    if (textCommand.trim()) {
      import("@/services/VoiceService").then(({ VoiceService }) => {
        const intent = VoiceService.parseIntent(textCommand.trim());
        const confirmation = VoiceService.getConfirmation(intent, language);
        speak(confirmation);
        switch (intent.type) {
          case "navigate": navigate(intent.page); break;
          case "call": navigate("/contacts"); break;
          case "message": navigate("/messages"); break;
          case "reminder": navigate("/reminders"); break;
          case "emergency": navigate("/emergency"); break;
          default: navigate("/companion"); break;
        }
      });
      setTextCommand("");
      setShowTextInput(false);
    }
  };

  // Personalized greeting based on disability
  const getGreeting = () => {
    switch (disabilityType) {
      case "visual":
        return t("SOFI is listening. Say a command anytime.", "سوفی سن رہی ہے۔ کسی بھی وقت کمانڈ بولیں۔");
      case "hearing":
        return t("Tap any feature below. Text commands available.", "نیچے کوئی فیچر ٹیپ کریں۔ ٹیکسٹ کمانڈ دستیاب ہے۔");
      case "motor":
        return t("Voice or large buttons — your choice!", "آواز یا بڑے بٹن — آپ کی مرضی!");
      case "cognitive":
        return t("Simple & clear. One step at a time.", "آسان اور واضح۔ ایک وقت میں ایک قدم۔");
      default:
        return isListening
          ? t("I'm listening — just speak!", "میں سن رہی ہوں — بس بولیں!")
          : t("How can SOFI help you?", "سوفی آپ کی کیسے مدد کرے؟");
    }
  };

  const features = [
    { label: t("AI Companion", "AI ساتھی"), sublabel: t("Chat & Voice", "چیٹ اور آواز"), icon: Bot, path: "/companion", bg: "bg-primary/10", iconColor: "text-primary", border: "border-primary/20" },
    { label: t("Contacts", "رابطے"), sublabel: t("Call & Message", "کال اور پیغام"), icon: Phone, path: "/contacts", bg: "bg-success/10", iconColor: "text-success", border: "border-success/20" },
    { label: t("Messages", "پیغامات"), sublabel: t("SMS & Text", "SMS اور ٹیکسٹ"), icon: MessageSquare, path: "/messages", bg: "bg-primary/10", iconColor: "text-primary", border: "border-primary/20" },
    { label: t("Reminders", "یاد دہانیاں"), sublabel: t("Alarms & Tasks", "الارم اور کام"), icon: Bell, path: "/reminders", bg: "bg-accent", iconColor: "text-foreground", border: "border-border" },
    { label: t("Notes", "نوٹس"), sublabel: t("Voice & Text", "آواز اور ٹیکسٹ"), icon: FileText, path: "/notes", bg: "bg-accent", iconColor: "text-foreground", border: "border-border" },
    { label: t("Health", "صحت"), sublabel: t("Dashboard", "ڈیش بورڈ"), icon: HeartPulse, path: "/health-dashboard", bg: "bg-emergency/10", iconColor: "text-emergency", border: "border-emergency/20" },
    { label: t("Emergency", "ایمرجنسی"), sublabel: "SOS", icon: ShieldAlert, path: "/emergency", bg: "bg-emergency/15", iconColor: "text-emergency", border: "border-emergency/30" },
    { label: t("Navigation", "نقشہ جات"), sublabel: t("Maps", "نقشے"), icon: MapPin, path: "/navigation", bg: "bg-secondary", iconColor: "text-foreground", border: "border-border" },
    { label: t("Settings", "ترتیبات"), sublabel: t("Customize", "ترمیم"), icon: Settings, path: "/settings", bg: "bg-secondary", iconColor: "text-muted-foreground", border: "border-border" },
  ];

  // For cognitive disability, show fewer features
  const displayFeatures = disabilityType === "cognitive"
    ? features.filter(f => ["/companion", "/contacts", "/emergency", "/reminders"].includes(f.path))
    : features;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24" role="main" aria-label="SOFI Home Dashboard">
      <VoiceCommandTutorial />
      <header className="px-5 pt-6 pb-2" role="banner">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("Hello", "السلام علیکم")} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{getGreeting()}</p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-2xl hover:bg-secondary transition-colors"
            aria-label={t("Logout", "لاگ آوٹ")}
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Text command toggle - always visible for hearing impaired, toggle for others */}
        {(disabilityType === "hearing" || showTextInput) ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 flex gap-2"
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
              autoFocus={disabilityType !== "hearing"}
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
        ) : (
          <div className="flex gap-2 mt-3" role="toolbar" aria-label="Input controls">
            <button
              onClick={() => setShowTextInput(true)}
              className="flex-1 py-3 px-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 bg-secondary text-muted-foreground border border-border transition-colors"
              aria-expanded={false}
              aria-label={t("Type a command instead of speaking", "بولنے کی بجائے کمانڈ ٹائپ کریں")}
            >
              <Keyboard className="w-4 h-4" />
              {t("Type Command", "کمانڈ ٹائپ کریں")}
            </button>
          </div>
        )}
      </header>

      <nav className="flex-1 px-4 overflow-y-auto" aria-label="SOFI Features">
        <div className={`grid ${disabilityType === "cognitive" ? "grid-cols-1 gap-4" : "grid-cols-2 gap-3"}`} role="list">
          {displayFeatures.map((feat, i) => (
            <motion.button
              key={feat.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => {
                if (disabilityType === "visual" || disabilityType === "multiple") speak(feat.label);
                navigate(feat.path);
              }}
              className={`flex ${disabilityType === "cognitive" ? "flex-row items-center gap-4 p-5" : "flex-col items-center justify-center gap-2.5 p-4"} rounded-3xl border-2 ${feat.border} bg-card shadow-card ${disabilityType === "cognitive" ? "min-h-[80px]" : "min-h-[120px]"} hover:scale-[1.02] active:scale-[0.97] transition-all`}
              aria-label={`${feat.label} — ${feat.sublabel}`}
              role="listitem"
            >
              <div className={`${disabilityType === "cognitive" ? "w-16 h-16" : "w-14 h-14"} rounded-2xl flex items-center justify-center ${feat.bg} shrink-0`} aria-hidden="true">
                <feat.icon className={`${disabilityType === "cognitive" ? "w-8 h-8" : "w-7 h-7"} ${feat.iconColor}`} />
              </div>
              <div className={disabilityType === "cognitive" ? "text-left" : "text-center"}>
                <span className={`${disabilityType === "cognitive" ? "text-lg" : "text-sm"} font-semibold text-foreground block leading-tight`}>
                  {feat.label}
                </span>
                <span className={`${disabilityType === "cognitive" ? "text-sm" : "text-[11px]"} text-muted-foreground`}>{feat.sublabel}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default HomePage;
