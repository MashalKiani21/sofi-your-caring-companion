import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import {
  ArrowLeft, Globe, Type, Sun, Moon, Volume2, Mic, MicOff, LogOut, User, Shield, Navigation
} from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const navigate = useNavigate();
  const {
    t, language, setLanguage, fontSize, setFontSize, highContrast, setHighContrast,
    voiceSpeed, setVoiceSpeed, voiceGender, setVoiceGender, speak, disabilityType, mode, setMode
  } = useAccessibility();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [privacyMode, setPrivacyMode] = useState(false);

  usePageAnnounce("Settings", "ترتیبات");

  const handleLogout = async () => {
    await signOut();
    toast.success(t("Logged out", "لاگ آوٹ ہو گئے"));
    navigate("/");
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(!privacyMode);
    toast.info(privacyMode
      ? t("Microphone enabled", "مائیکروفون فعال")
      : t("Microphone disabled for privacy", "رازداری کے لیے مائیکروفون بند"));
  };

  const ToggleSwitch = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-14 h-8 rounded-full transition-colors relative ${active ? "bg-primary" : "bg-border"}`}
      role="switch"
      aria-checked={active}
    >
      <div className={`w-6 h-6 rounded-full bg-primary-foreground absolute top-1 transition-all ${active ? "left-7" : "left-1"}`} />
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/home")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("Settings", "ترتیبات")}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Theme: Light/Dark */}
        <div className="p-4 rounded-2xl bg-card shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            <div>
              <p className="font-semibold text-foreground">{t("Appearance", "ظاہری شکل")}</p>
              <p className="text-xs text-muted-foreground">{theme === "dark" ? t("Dark Mode", "ڈارک موڈ") : t("Light Mode", "لائٹ موڈ")}</p>
            </div>
          </div>
          <ToggleSwitch active={theme === "dark"} onToggle={toggleTheme} />
        </div>

        {/* Language */}
        <div className="p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-primary" />
            <p className="font-semibold text-foreground">{t("Language", "زبان")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "ur"] as const).map(lang => (
              <button
                key={lang}
                onClick={() => { setLanguage(lang); speak(lang === "ur" ? "اردو منتخب" : "English selected"); }}
                className={`min-h-touch rounded-xl font-medium transition-colors ${
                  language === lang ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                {lang === "en" ? "English" : "اردو"}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <Type className="w-5 h-5 text-primary" />
            <p className="font-semibold text-foreground">{t("Text Size", "متن کا سائز")}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["normal", "large", "extra-large"] as const).map(size => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`min-h-touch rounded-xl text-sm font-medium transition-colors ${
                  fontSize === size ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast */}
        <div className="p-4 rounded-2xl bg-card shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-primary" />
            <p className="font-semibold text-foreground">{t("High Contrast", "زیادہ کنٹراسٹ")}</p>
          </div>
          <ToggleSwitch active={highContrast} onToggle={() => setHighContrast(!highContrast)} />
        </div>

        {/* Voice Speed */}
        <div className="p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <Volume2 className="w-5 h-5 text-primary" />
            <p className="font-semibold text-foreground">{t("Voice Speed", "آواز کی رفتار")}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["slow", "normal", "fast"] as const).map(speed => (
              <button
                key={speed}
                onClick={() => { setVoiceSpeed(speed); speak(t(`Speed: ${speed}`, speed === "slow" ? "آہستہ" : speed === "fast" ? "تیز" : "عام")); }}
                className={`min-h-touch rounded-xl text-sm font-medium capitalize transition-colors ${
                  voiceSpeed === speed ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                {t(speed, speed === "slow" ? "آہستہ" : speed === "fast" ? "تیز" : "عام")}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Gender */}
        <div className="p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <User className="w-5 h-5 text-primary" />
            <p className="font-semibold text-foreground">{t("Assistant Voice", "معاون کی آواز")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["female", "male"] as const).map(g => (
              <button
                key={g}
                onClick={() => { setVoiceGender(g); speak(t(`${g} voice selected`, g === "female" ? "خاتون آواز منتخب" : "مرد آواز منتخب")); }}
                className={`min-h-touch rounded-xl text-sm font-medium capitalize transition-colors ${
                  voiceGender === g ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                {t(g, g === "female" ? "خاتون" : "مرد")}
              </button>
            ))}
          </div>
        </div>

        {/* Voice-only Navigation */}
        <div className="p-4 rounded-2xl bg-card shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">{t("Voice-Only Mode", "صرف آواز موڈ")}</p>
              <p className="text-xs text-muted-foreground">{t("Navigate entirely by voice", "مکمل آواز سے چلائیں")}</p>
            </div>
          </div>
          <ToggleSwitch
            active={mode === "voice-only"}
            onToggle={() => setMode(mode === "voice-only" ? "standard" : "voice-only")}
          />
        </div>

        {/* Privacy Mode */}
        <div className="p-4 rounded-2xl bg-card shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            {privacyMode ? <MicOff className="w-5 h-5 text-emergency" /> : <Mic className="w-5 h-5 text-primary" />}
            <div>
              <p className="font-semibold text-foreground">{t("Privacy Mode", "رازداری موڈ")}</p>
              <p className="text-xs text-muted-foreground">{t("Disable microphone temporarily", "مائیکروفون عارضی طور پر بند")}</p>
            </div>
          </div>
          <ToggleSwitch active={privacyMode} onToggle={togglePrivacyMode} />
        </div>

        {/* Profile */}
        <div className="p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <p className="font-semibold text-foreground">{t("Profile", "پروفائل")}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("Disability:", "معذوری:")} <span className="capitalize text-foreground">{disabilityType}</span></span>
          </div>
          <button onClick={() => navigate("/profile-setup")} className="mt-3 text-sm text-primary font-medium hover:underline">
            {t("Update profile →", "پروفائل اپ ڈیٹ کریں →")}
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full min-h-touch p-4 rounded-2xl bg-destructive/10 text-destructive font-semibold flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-5 h-5" /> {t("Logout", "لاگ آوٹ")}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
