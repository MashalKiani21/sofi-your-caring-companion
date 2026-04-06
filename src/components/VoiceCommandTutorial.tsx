/**
 * VoiceCommandTutorial - Compact, dismissible tutorial for first login.
 * Auto-dismisses after timeout, swipeable on mobile, replayable from Settings.
 */
import { useState, useEffect, useCallback } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Volume2, Mic } from "lucide-react";

interface TutorialStep {
  titleEn: string;
  titleUr: string;
  commands: { en: string; ur: string }[];
  icon: string;
}

const STEPS: TutorialStep[] = [
  {
    titleEn: "Navigation",
    titleUr: "نیویگیشن",
    icon: "🧭",
    commands: [
      { en: "\"Open reminders\" — go to reminders", ur: "\"یاد دہانیاں کھولو\" — یاد دہانیاں" },
      { en: "\"Go to contacts\" — open contacts", ur: "\"رابطے کھولو\" — رابطے کھولیں" },
    ],
  },
  {
    titleEn: "Calls & Messages",
    titleUr: "کال اور پیغامات",
    icon: "📞",
    commands: [
      { en: "\"Call Ahmed\" — call a contact", ur: "\"احمد کو کال کرو\" — رابطے کو کال" },
      { en: "\"Message Ahmed hello\" — send SMS", ur: "\"احمد کو ہیلو بھیجو\" — SMS بھیجیں" },
    ],
  },
  {
    titleEn: "Emergency & Help",
    titleUr: "ایمرجنسی اور مدد",
    icon: "🆘",
    commands: [
      { en: "\"Emergency\" or \"Help\" — instant SOS", ur: "\"ایمرجنسی\" یا \"مدد\" — فوری SOS" },
      { en: "\"Navigate to hospital\" — directions", ur: "\"ہسپتال لے چلو\" — ہدایات" },
    ],
  },
];

const STORAGE_KEY = "sofi_tutorial_completed";
const AUTO_DISMISS_MS = 30000; // 30s auto-dismiss

interface Props {
  forceShow?: boolean;
  onClose?: () => void;
}

const VoiceCommandTutorial = ({ forceShow = false, onClose }: Props) => {
  const { t, speak, language } = useAccessibility();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setStep(0);
      return;
    }
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, [forceShow]);

  // Auto-narrate current step
  useEffect(() => {
    if (!visible) return;
    const s = STEPS[step];
    const title = language === "ur" ? s.titleUr : s.titleEn;
    speak(title);
  }, [step, visible, language]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => close(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  const close = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
    onClose?.();
  }, [onClose]);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -50) next();
    else if (info.offset.x > 50) prev();
    else if (info.offset.y > 80) close();
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-3"
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        role="dialog"
        aria-modal="true"
        aria-label={t("Voice Command Tutorial", "آواز کمانڈ ٹیوٹوریل")}
      >
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden border border-border mb-16 sm:mb-4 touch-pan-y"
        >
          {/* Drag handle for mobile */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-1">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">
                {step + 1}/{STEPS.length}
              </span>
            </div>
            <button
              onClick={close}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-secondary"
              aria-label={t("Skip tutorial", "ٹیوٹوریل چھوڑیں")}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pb-2">
            <div className="text-center mb-3">
              <span className="text-3xl" aria-hidden="true">{current.icon}</span>
              <h2 className="text-lg font-bold text-foreground mt-1">
                {language === "ur" ? current.titleUr : current.titleEn}
              </h2>
            </div>

            <div className="space-y-2">
              {current.commands.map((cmd, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/50 border border-border">
                  <Volume2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="text-xs">
                    <p className="text-foreground font-medium">{cmd.en}</p>
                    <p className="text-muted-foreground mt-0.5" dir="rtl">{cmd.ur}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Swipe hint on mobile */}
            <p className="text-center text-[10px] text-muted-foreground mt-2 sm:hidden">
              {t("Swipe left/right or drag down to dismiss", "بائیں/دائیں سوائپ یا نیچے کھینچیں")}
            </p>
          </div>

          {/* Progress + Nav */}
          <div className="px-4 pb-1">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>

          <div className="flex gap-2 px-4 pb-4 pt-2">
            <button
              onClick={prev}
              disabled={step === 0}
              className="flex-1 min-h-[44px] rounded-xl border border-border bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-1 disabled:opacity-30"
              aria-label={t("Previous", "پچھلا")}
            >
              <ChevronLeft className="w-4 h-4" />
              {t("Back", "واپس")}
            </button>
            <button
              onClick={next}
              className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-1"
              aria-label={step < STEPS.length - 1 ? t("Next", "اگلا") : t("Get Started", "شروع کریں")}
            >
              {step < STEPS.length - 1 ? t("Next", "اگلا") : t("Start", "شروع")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceCommandTutorial;

export const resetTutorial = () => localStorage.removeItem(STORAGE_KEY);
