import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { DISABILITY_OPTIONS, type DisabilityType, type AccessibilityMode } from "@/types/app";
import { motion, AnimatePresence } from "framer-motion";
import { 
  EyeOff, EarOff, Accessibility, MicOff, Brain, Heart, User, 
  ArrowRight, ArrowLeft, Check, Volume2, Type, Sun
} from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  "eye-off": EyeOff,
  "ear-off": EarOff,
  "accessibility": Accessibility,
  "mic-off": MicOff,
  "brain": Brain,
  "heart": Heart,
  "user": User,
};

const ProfileSetup = () => {
  const [step, setStep] = useState(0);
  const [selectedDisability, setSelectedDisability] = useState<DisabilityType | null>(null);
  const navigate = useNavigate();
  const { t, speak, setDisabilityType, setMode, setFontSize, setHighContrast, language } = useAccessibility();

  const selectDisability = (type: DisabilityType) => {
    setSelectedDisability(type);
    const option = DISABILITY_OPTIONS.find(o => o.type === type);
    if (option) {
      speak(language === "ur" ? option.label.ur : option.label.en);
    }
  };

  const finishSetup = () => {
    if (!selectedDisability) {
      toast.error(t("Please select an option", "براہ کرم ایک آپشن منتخب کریں"));
      return;
    }

    setDisabilityType(selectedDisability);

    // Auto-set accessibility mode
    const modeMap: Record<DisabilityType, AccessibilityMode> = {
      visual: "voice-only",
      hearing: "visual-only",
      motor: "voice-only",
      speech: "visual-only",
      cognitive: "touch-assist",
      multiple: "full-assist",
      none: "standard",
    };
    setMode(modeMap[selectedDisability]);

    // Auto-adjust settings
    if (selectedDisability === "visual" || selectedDisability === "cognitive") {
      setFontSize("extra-large");
      setHighContrast(true);
    } else if (selectedDisability === "motor") {
      setFontSize("large");
    }

    speak(t(
      "Profile setup complete! Taking you to your companion.",
      "پروفائل سیٹ اپ مکمل! آپ کے ساتھی کی طرف لے جا رہے ہیں۔"
    ));
    toast.success(t("Profile setup complete!", "پروفائل سیٹ اپ مکمل!"));
    navigate("/companion");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-4 gap-3">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate("/auth")}
          className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{t("Profile Setup", "پروفائل سیٹ اپ")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Step", "مرحلہ")} {step + 1} / 2
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((step + 1) / 2) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">{t("How can SOFI help you?", "سوفی آپ کی کیسے مدد کر سکتی ہے؟")}</h2>
                <p className="text-muted-foreground mt-2">{t("Select your condition so we can customize your experience", "اپنی حالت منتخب کریں تاکہ ہم آپ کا تجربہ بہتر بنائیں")}</p>
              </div>

              <div className="grid gap-3">
                {DISABILITY_OPTIONS.map((option) => {
                  const Icon = iconMap[option.icon] || User;
                  const isSelected = selectedDisability === option.type;
                  return (
                    <button
                      key={option.type}
                      onClick={() => selectDisability(option.type)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 min-h-touch ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 bg-card"
                      }`}
                      aria-label={`${option.label.en} - ${option.description.en}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{option.label.en}</p>
                        <p className="text-sm font-urdu text-muted-foreground" dir="rtl">{option.label.ur}</p>
                        <p className="text-xs text-muted-foreground mt-1">{language === "ur" ? option.description.ur : option.description.en}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">{t("Accessibility Preferences", "رسائی کی ترجیحات")}</h2>
                <p className="text-muted-foreground mt-2">{t("We've pre-configured settings for you. Adjust as needed.", "ہم نے آپ کے لیے سیٹنگز پہلے سے بنا دی ہیں۔")}</p>
              </div>

              {/* Preview cards */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-card shadow-card">
                  <div className="flex items-center gap-3 mb-3">
                    <Volume2 className="w-5 h-5 text-primary" />
                    <p className="font-semibold text-foreground">{t("Voice Control", "آواز کنٹرول")}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedDisability === "visual" || selectedDisability === "motor"
                      ? t("Voice control is enabled for hands-free navigation.", "آواز کنٹرول فعال ہے۔")
                      : t("Voice control available. Tap the mic to use.", "آواز کنٹرول دستیاب ہے۔")}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card shadow-card">
                  <div className="flex items-center gap-3 mb-3">
                    <Type className="w-5 h-5 text-primary" />
                    <p className="font-semibold text-foreground">{t("Text Size", "متن کا سائز")}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedDisability === "visual" || selectedDisability === "cognitive"
                      ? t("Extra large text enabled for better readability.", "بہتر پڑھنے کے لیے بہت بڑا متن۔")
                      : t("Standard text size. Can be changed in settings.", "معیاری سائز۔ سیٹنگز میں تبدیل کریں۔")}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card shadow-card">
                  <div className="flex items-center gap-3 mb-3">
                    <Sun className="w-5 h-5 text-primary" />
                    <p className="font-semibold text-foreground">{t("High Contrast", "زیادہ کنٹراسٹ")}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedDisability === "visual"
                      ? t("High contrast mode enabled.", "زیادہ کنٹراسٹ موڈ فعال ہے۔")
                      : t("Normal contrast. Can be toggled in settings.", "نارمل کنٹراسٹ۔ سیٹنگز میں تبدیل کریں۔")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="p-6">
        <button
          onClick={() => step === 0 ? setStep(1) : finishSetup()}
          disabled={step === 0 && !selectedDisability}
          className="w-full min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {step === 0
            ? <>{t("Continue", "جاری رکھیں")} <ArrowRight className="w-5 h-5" /></>
            : <>{t("Start Using SOFI", "سوفی استعمال شروع کریں")} <Check className="w-5 h-5" /></>
          }
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;
