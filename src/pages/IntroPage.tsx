import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mic, Eye, Hand, Globe, Volume2 } from "lucide-react";
import introBg from "@/assets/intro-bg.jpg";

const slides = [
  {
    titleEn: "Welcome to SOFI",
    titleUr: "سوفی میں خوش آمدید",
    descEn: "Your AI-powered companion designed for everyone — especially those who need it most.",
    descUr: "آپ کا AI ساتھی جو سب کے لیے بنایا گیا ہے — خاص طور پر ان کے لیے جنہیں سب سے زیادہ ضرورت ہے۔",
    icon: <Globe className="w-16 h-16 text-primary" />,
    color: "from-primary/20 to-primary/5",
    voiceEn: "Welcome to SOFI, your smart accessibility companion.",
    voiceUr: "سوفی میں خوش آمدید، آپ کا ذہین ساتھی۔",
  },
  {
    titleEn: "Voice-First Experience",
    titleUr: "آواز سے چلنے والی ایپ",
    descEn: "Control everything with your voice in English or Urdu. Say \"Hey SOFI\" to begin.",
    descUr: "انگریزی یا اردو میں اپنی آواز سے سب کچھ کنٹرول کریں۔ \"ہے سوفی\" بولیں۔",
    icon: <Mic className="w-16 h-16 text-success" />,
    color: "from-success/20 to-success/5",
    voiceEn: "Control everything with your voice. Say Hey SOFI to begin.",
    voiceUr: "آواز سے سب کچھ کنٹرول کریں۔ ہے سوفی بولیں۔",
  },
  {
    titleEn: "Accessible for Everyone",
    titleUr: "سب کے لیے قابل رسائی",
    descEn: "Customized for visual, hearing, motor, speech, and cognitive disabilities.",
    descUr: "بصری، سماعت، جسمانی، تقریر اور ذہنی معذوری کے لیے حسب ضرورت۔",
    icon: <Eye className="w-16 h-16 text-primary" />,
    color: "from-primary/20 to-primary/5",
    voiceEn: "Customized for all disability types. The app adapts to you.",
    voiceUr: "ہر قسم کی معذوری کے لیے۔ ایپ آپ کے مطابق ڈھل جائے گی۔",
  },
  {
    titleEn: "Your Safety Companion",
    titleUr: "آپ کا حفاظتی ساتھی",
    descEn: "Emergency SOS, health tracking, reminders, calls, and messages — all by voice.",
    descUr: "ایمرجنسی SOS، صحت، یاد دہانیاں، کالز — سب آواز سے۔",
    icon: <Hand className="w-16 h-16 text-emergency" />,
    color: "from-emergency/20 to-emergency/5",
    voiceEn: "Emergency help, health tracking, reminders, and calls. All by voice.",
    voiceUr: "ایمرجنسی مدد، صحت، یاد دہانیاں اور کالز۔ سب آواز سے۔",
  },
];

const IntroPage = () => {
  const [current, setCurrent] = useState(0);
  const [isNarrating, setIsNarrating] = useState(false);
  const navigate = useNavigate();

  const slide = slides[current];

  // Auto-narrate each slide
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u1 = new SpeechSynthesisUtterance(slide.voiceEn);
      u1.lang = "en-US";
      u1.rate = 0.9;
      u1.onstart = () => setIsNarrating(true);

      const u2 = new SpeechSynthesisUtterance(slide.voiceUr);
      u2.lang = "ur-PK";
      u2.rate = 0.9;
      u2.onend = () => setIsNarrating(false);

      u1.onend = () => window.speechSynthesis.speak(u2);
      window.speechSynthesis.speak(u1);
    }
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [current]);

  const next = () => {
    window.speechSynthesis?.cancel();
    if (current < slides.length - 1) setCurrent(current + 1);
    else navigate("/auth");
  };

  const skip = () => {
    window.speechSynthesis?.cancel();
    navigate("/auth");
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background image */}
      <img
        src={introBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-40 dark:opacity-20"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

      {/* Skip button */}
      <div className="relative z-10 flex justify-end p-4">
        <button
          onClick={skip}
          className="text-sm font-medium text-muted-foreground hover:text-foreground min-h-touch min-w-touch flex items-center justify-center rounded-2xl hover:bg-card/50 transition-colors"
          aria-label="Skip introduction"
        >
          Skip / چھوڑیں
        </button>
      </div>

      {/* Slide content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            {/* Icon with gradient backdrop */}
            <div className={`w-36 h-36 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center mb-8 shadow-lg`}>
              {slide.icon}
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">{slide.titleEn}</h1>
            <p className="text-xl font-urdu text-foreground/80 mb-6" dir="rtl">{slide.titleUr}</p>
            <p className="text-base text-muted-foreground mb-2 leading-relaxed">{slide.descEn}</p>
            <p className="text-base font-urdu text-muted-foreground leading-relaxed" dir="rtl">{slide.descUr}</p>

            {/* Narration indicator */}
            {isNarrating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 flex items-center gap-2 text-primary"
              >
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">Speaking...</span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots + Next */}
      <div className="relative z-10 p-6 pb-8 flex flex-col items-center gap-5">
        <div className="flex gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { window.speechSynthesis?.cancel(); setCurrent(i); }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-primary w-8" : "bg-border w-2.5 hover:bg-muted-foreground"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-full max-w-xs min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-lg"
          aria-label={current < slides.length - 1 ? "Next slide" : "Get started"}
        >
          {current < slides.length - 1 ? (
            <>Next / اگلا <ArrowRight className="w-5 h-5" /></>
          ) : (
            <>Get Started / شروع کریں <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
