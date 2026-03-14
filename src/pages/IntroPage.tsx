import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mic, Eye, Hand, Globe } from "lucide-react";

const slides = [
  {
    titleEn: "Welcome to SOFI",
    titleUr: "سوفی میں خوش آمدید",
    descEn: "Your AI-powered companion designed for everyone — especially those who need it most.",
    descUr: "آپ کا AI ساتھی جو سب کے لیے بنایا گیا ہے — خاص طور پر ان کے لیے جنہیں سب سے زیادہ ضرورت ہے۔",
    icon: <Globe className="w-16 h-16 text-primary" />,
    color: "bg-primary/5",
  },
  {
    titleEn: "Voice-First Experience",
    titleUr: "آواز سے چلنے والی ایپ",
    descEn: "Control everything with your voice in English or Urdu. No need to touch the screen.",
    descUr: "انگریزی یا اردو میں اپنی آواز سے سب کچھ کنٹرول کریں۔ اسکرین چھونے کی ضرورت نہیں۔",
    icon: <Mic className="w-16 h-16 text-success" />,
    color: "bg-success/5",
  },
  {
    titleEn: "Accessible for Everyone",
    titleUr: "سب کے لیے قابل رسائی",
    descEn: "Customized for visual, hearing, motor, speech, and cognitive disabilities.",
    descUr: "بصری، سماعت، جسمانی، تقریر اور ذہنی معذوری کے لیے حسب ضرورت۔",
    icon: <Eye className="w-16 h-16 text-primary" />,
    color: "bg-primary/5",
  },
  {
    titleEn: "Your Health Companion",
    titleUr: "آپ کا صحت ساتھی",
    descEn: "Track health, set reminders, call for help, and stay connected with caregivers.",
    descUr: "صحت ٹریک کریں، یاد دہانیاں لگائیں، مدد کے لیے کال کریں۔",
    icon: <Hand className="w-16 h-16 text-emergency" />,
    color: "bg-emergency/5",
  },
];

const IntroPage = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else navigate("/auth");
  };

  const skip = () => navigate("/auth");

  const slide = slides[current];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={skip}
          className="text-sm font-medium text-muted-foreground hover:text-foreground min-h-touch min-w-touch flex items-center justify-center"
          aria-label="Skip introduction"
        >
          Skip / چھوڑیں
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            <div className={`w-32 h-32 rounded-full ${slide.color} flex items-center justify-center mb-8`}>
              {slide.icon}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{slide.titleEn}</h1>
            <p className="text-2xl font-urdu text-muted-foreground mb-6" dir="rtl">{slide.titleUr}</p>
            <p className="text-base text-muted-foreground mb-2">{slide.descEn}</p>
            <p className="text-base font-urdu text-muted-foreground" dir="rtl">{slide.descUr}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots + Next */}
      <div className="p-8 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-full max-w-xs min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
