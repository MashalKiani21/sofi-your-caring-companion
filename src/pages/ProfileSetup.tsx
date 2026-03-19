import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { DISABILITY_OPTIONS, type DisabilityType, type AccessibilityMode } from "@/types/app";
import { motion, AnimatePresence } from "framer-motion";
import { 
  EyeOff, EarOff, Accessibility, MicOff, Brain, Heart, User, 
  ArrowRight, ArrowLeft, Check, Mic
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconMap: Record<string, any> = {
  "eye-off": EyeOff,
  "ear-off": EarOff,
  "accessibility": Accessibility,
  "mic-off": MicOff,
  "brain": Brain,
  "heart": Heart,
  "user": User,
};

const TOTAL_STEPS = 3;

const ProfileSetup = () => {
  const [step, setStep] = useState(0);
  const [selectedDisability, setSelectedDisability] = useState<DisabilityType | null>(null);
  const [medicalInfo, setMedicalInfo] = useState("");
  const [notifications, setNotifications] = useState("all");
  const navigate = useNavigate();
  const { t, speak, setDisabilityType, setMode, setFontSize, setHighContrast, language } = useAccessibility();

  // Voice-guided: announce the page on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(
        t(
          "Profile setup. Tell us about your needs so SOFI can adapt to you. Select your condition from the list, or say the option name.",
          "پروفائل سیٹ اپ۔ اپنی ضروریات بتائیں تاکہ سوفی آپ کے مطابق ڈھل سکے۔ فہرست سے اپنی حالت منتخب کریں۔"
        )
      );
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Announce step changes
  useEffect(() => {
    if (step === 1) {
      speak(
        t(
          "Step 2. Enter your name and personal details.",
          "مرحلہ 2۔ اپنا نام اور ذاتی تفصیلات درج کریں۔"
        )
      );
    } else if (step === 2) {
      speak(
        t(
          "Step 3. Medical information. You can optionally enter your conditions, medications, and allergies. Then choose your notification preferences and complete setup.",
          "مرحلہ 3۔ طبی معلومات۔ آپ اختیاری طور پر اپنی حالت، ادویات اور الرجی درج کر سکتے ہیں۔"
        )
      );
    }
  }, [step]);

  const selectDisability = (type: DisabilityType) => {
    setSelectedDisability(type);
    const option = DISABILITY_OPTIONS.find(o => o.type === type);
    if (option) {
      speak(language === "ur" ? option.label.ur : option.label.en);
    }
  };

  const applyAccessibilitySettings = () => {
    if (!selectedDisability) return;
    setDisabilityType(selectedDisability);

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

    if (selectedDisability === "visual" || selectedDisability === "cognitive") {
      setFontSize("extra-large");
      setHighContrast(true);
    } else if (selectedDisability === "motor") {
      setFontSize("large");
    }
  };

  const finishSetup = () => {
    applyAccessibilitySettings();
    speak(t(
      "Profile setup complete! Taking you to your home screen.",
      "پروفائل سیٹ اپ مکمل! آپ کی ہوم اسکرین کی طرف لے جا رہے ہیں۔"
    ));
    toast.success(t("Profile setup complete!", "پروفائل سیٹ اپ مکمل!"));
    navigate("/home");
  };

  const handleNext = () => {
    if (step === 0 && !selectedDisability) {
      toast.error(t("Please select an option", "براہ کرم ایک آپشن منتخب کریں"));
      speak(t("Please select your condition first.", "براہ کرم پہلے اپنی حالت منتخب کریں۔"));
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      finishSetup();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background" role="main" aria-label="Profile setup">
      {/* Header */}
      <header className="flex items-center p-4 gap-3" role="banner">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
          <Mic className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{t("Set Up Your Profile", "اپنا پروفائل بنائیں")}</h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t("Step", "مرحلہ")} {step + 1} {t("of", "از")} {TOTAL_STEPS}
          </p>
        </div>
      </header>

      {/* Progress bar - segmented like the image */}
      <div className="px-6 flex gap-2" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-300 ${i <= step ? "bg-primary w-full" : "w-0"}`}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Disability selection */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
              role="region"
              aria-label="Select your condition"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-foreground">{t("How can SOFI help you?", "سوفی آپ کی کیسے مدد کر سکتی ہے؟")}</h2>
                <p className="text-muted-foreground mt-1">{t("Select your condition so we can customize your experience", "اپنی حالت منتخب کریں تاکہ ہم آپ کا تجربہ بہتر بنائیں")}</p>
              </div>

              <div className="grid gap-3" role="radiogroup" aria-label="Disability type selection">
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
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${option.label.en} — ${option.description.en}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`} aria-hidden="true">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{option.label.en}</p>
                        <p className="text-sm font-urdu text-muted-foreground" dir="rtl">{option.label.ur}</p>
                        <p className="text-xs text-muted-foreground mt-1">{language === "ur" ? option.description.ur : option.description.en}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-1" aria-hidden="true">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Personal Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
              role="region"
              aria-label="Personal information"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-foreground">{t("Personal Info", "ذاتی معلومات")}</h2>
                <p className="text-muted-foreground mt-1">{t("Tell us a bit about yourself", "ہمیں اپنے بارے میں بتائیں")}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">{t("Full Name", "پورا نام")}</label>
                  <input
                    type="text"
                    placeholder={t("Enter your name", "اپنا نام درج کریں")}
                    className="w-full min-h-touch px-4 rounded-2xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    dir={language === "ur" ? "rtl" : "ltr"}
                    aria-label={t("Full name", "پورا نام")}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">{t("Age", "عمر")}</label>
                  <input
                    type="number"
                    placeholder={t("Your age", "آپ کی عمر")}
                    className="w-full min-h-touch px-4 rounded-2xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={t("Age", "عمر")}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">{t("Blood Type (optional)", "خون کی قسم (اختیاری)")}</label>
                  <Select>
                    <SelectTrigger className="min-h-touch rounded-2xl" aria-label={t("Blood type", "خون کی قسم")}>
                      <SelectValue placeholder={t("Select blood type", "خون کی قسم منتخب کریں")} />
                    </SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Medical Info (from image reference) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
              role="region"
              aria-label="Medical information"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-foreground">{t("Medical Info", "طبی معلومات")}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    {t("Medical Information (optional)", "طبی معلومات (اختیاری)")}
                  </label>
                  <Textarea
                    value={medicalInfo}
                    onChange={(e) => setMedicalInfo(e.target.value)}
                    placeholder={t("Conditions, medications, allergies...", "بیماریاں، ادویات، الرجی...")}
                    className="min-h-[120px] rounded-2xl border-primary/30 focus:border-primary"
                    dir={language === "ur" ? "rtl" : "ltr"}
                    aria-label={t("Medical information", "طبی معلومات")}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    {t("Notifications", "اطلاعات")}
                  </label>
                  <Select value={notifications} onValueChange={setNotifications}>
                    <SelectTrigger className="min-h-touch rounded-2xl" aria-label={t("Notification preference", "اطلاعات کی ترجیح")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All Notifications", "تمام اطلاعات")}</SelectItem>
                      <SelectItem value="important">{t("Important Only", "صرف اہم")}</SelectItem>
                      <SelectItem value="none">{t("None", "کوئی نہیں")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      <div className="p-6 flex items-center gap-3" role="contentinfo">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="min-h-touch min-w-touch rounded-2xl border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label={t("Go back", "واپس جائیں")}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={step === 0 && !selectedDisability}
          className="flex-1 min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={step === TOTAL_STEPS - 1 ? t("Complete setup", "سیٹ اپ مکمل کریں") : t("Continue", "جاری رکھیں")}
        >
          {step === TOTAL_STEPS - 1
            ? <>{t("Complete Setup", "سیٹ اپ مکمل کریں")} 🌿</>
            : <>{t("Continue", "جاری رکھیں")} <ArrowRight className="w-5 h-5" /></>
          }
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;
