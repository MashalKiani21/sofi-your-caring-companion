/**
 * VoiceCommandTutorial - Plays on first login to teach all voice commands.
 * Shows bilingual cards with auto-narration, can be dismissed or replayed from Settings.
 */
import { useState, useEffect, useCallback } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Volume2, Mic } from "lucide-react";

interface TutorialStep {
  titleEn: string;
  titleUr: string;
  commands: { en: string; ur: string }[];
  icon: string;
}

const STEPS: TutorialStep[] = [
  {
    titleEn: "Navigation Commands",
    titleUr: "نیویگیشن کمانڈز",
    icon: "🧭",
    commands: [
      { en: "\"Open reminders\" — go to reminders", ur: "\"یاد دہانیاں کھولو\" — یاد دہانیاں" },
      { en: "\"Go to contacts\" — open contacts", ur: "\"رابطے کھولو\" — رابطے کھولیں" },
      { en: "\"Open messages\" — messaging page", ur: "\"پیغامات کھولو\" — پیغامات" },
      { en: "\"Open notes\" — go to notes", ur: "\"نوٹس کھولو\" — نوٹس" },
    ],
  },
  {
    titleEn: "Calling & Messaging",
    titleUr: "کال اور پیغامات",
    icon: "📞",
    commands: [
      { en: "\"Call Ahmed\" — call a contact", ur: "\"احمد کو کال کرو\" — رابطے کو کال" },
      { en: "\"Message Ahmed hello\" — send SMS", ur: "\"احمد کو ہیلو بھیجو\" — SMS بھیجیں" },
    ],
  },
  {
    titleEn: "Reminders & Notes",
    titleUr: "یاد دہانیاں اور نوٹس",
    icon: "🔔",
    commands: [
      { en: "\"Remind me to take medicine\" — new reminder", ur: "\"دوائی کی یاد دلاؤ\" — نئی یاد دہانی" },
      { en: "In Notes: speak and it auto-types", ur: "نوٹس میں: بولیں اور خودکار ٹائپ ہوگا" },
    ],
  },
  {
    titleEn: "Emergency & Navigation",
    titleUr: "ایمرجنسی اور نقشے",
    icon: "🆘",
    commands: [
      { en: "\"Emergency\" or \"Help\" — instant SOS", ur: "\"ایمرجنسی\" یا \"مدد\" — فوری SOS" },
      { en: "\"Navigate to hospital\" — map directions", ur: "\"ہسپتال لے چلو\" — نقشے کی ہدایات" },
    ],
  },
  {
    titleEn: "You're Ready!",
    titleUr: "آپ تیار ہیں!",
    icon: "✅",
    commands: [
      { en: "SOFI is always listening — just speak!", ur: "سوفی ہمیشہ سن رہی ہے — بس بولیں!" },
      { en: "Tap the mic icon to check status", ur: "مائیک آئیکن ٹیپ کریں" },
    ],
  },
];

const STORAGE_KEY = "sofi_tutorial_completed";

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
    const cmds = s.commands.map(c => language === "ur" ? c.ur : c.en).join(". ");
    speak(`${title}. ${cmds}`);
  }, [step, visible, language]);

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

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-label={t("Voice Command Tutorial", "آواز کمانڈ ٹیوٹوریل")}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-muted-foreground">
                {step + 1} / {STEPS.length}
              </span>
            </div>
            <button
              onClick={close}
              className="min-h-touch min-w-touch flex items-center justify-center rounded-full hover:bg-secondary"
              aria-label={t("Skip tutorial", "ٹیوٹوریل چھوڑیں")}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pb-3">
            <div className="text-center mb-4">
              <span className="text-4xl" aria-hidden="true">{current.icon}</span>
              <h2 className="text-xl font-bold text-foreground mt-2">
                {language === "ur" ? current.titleUr : current.titleEn}
              </h2>
            </div>

            <div className="space-y-2.5">
              {current.commands.map((cmd, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/50 border border-border"
                >
                  <Volume2 className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="text-sm">
                    <p className="text-foreground font-medium">{cmd.en}</p>
                    <p className="text-muted-foreground text-xs mt-0.5" dir="rtl">{cmd.ur}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-5 pb-2">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 px-5 pb-5 pt-2">
            <button
              onClick={prev}
              disabled={step === 0}
              className="flex-1 min-h-touch rounded-2xl border border-border bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-1 disabled:opacity-30"
              aria-label={t("Previous", "پچھلا")}
            >
              <ChevronLeft className="w-4 h-4" />
              {t("Back", "واپس")}
            </button>
            <button
              onClick={next}
              className="flex-1 min-h-touch rounded-2xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-1"
              aria-label={step < STEPS.length - 1 ? t("Next", "اگلا") : t("Get Started", "شروع کریں")}
            >
              {step < STEPS.length - 1 ? t("Next", "اگلا") : t("Get Started", "شروع کریں")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceCommandTutorial;
