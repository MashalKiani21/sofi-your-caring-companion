/**
 * VoiceContext - Global always-on voice controller.
 * Uses interim results for live feedback and confidence filtering.
 */
import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { VoiceService, type VoiceIntent } from "@/services/VoiceService";
import { ContactService } from "@/services/ContactService";
import { toast } from "sonner";

interface VoiceContextType {
  isListening: boolean;
  transcript: string;
  interimText: string;
  confidence: number;
  registerPageHandler: (handler: (text: string) => boolean) => () => void;
  restartListening: () => void;
  pauseGlobal: () => void;
  resumeGlobal: () => void;
  isPaused: boolean;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export const useVoiceContext = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoiceContext must be inside VoiceProvider");
  return ctx;
};

const MIN_CONFIDENCE = 0.4; // Accept results above this threshold
const SILENCE_RESTART_MS = 500;

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const recognitionRef = useRef<any>(null);
  const pageHandlersRef = useRef<Set<(text: string) => boolean>>(new Set());
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t, speak, disabilityType } = useAccessibility();
  const { user } = useAuth();

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const silentPages = ["/", "/auth", "/reset-password"];
  const shouldListen = isSupported && !isPaused && !silentPages.includes(location.pathname);

  const startRecognition = useCallback(() => {
    if (!isSupported || isPaused || silentPages.includes(location.pathname)) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = language === "ur" ? "ur-PK" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true; // Show what's being heard in real-time
    recognition.maxAlternatives = 3; // Get multiple interpretations

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      let bestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const conf = result[0].confidence || 0;

        if (result.isFinal) {
          // Pick the best alternative above confidence threshold
          let bestTranscript = result[0].transcript;
          let bestConf = conf;

          for (let j = 1; j < result.length; j++) {
            if (result[j].confidence > bestConf) {
              bestTranscript = result[j].transcript;
              bestConf = result[j].confidence;
            }
          }

          if (bestConf >= MIN_CONFIDENCE || bestConf === 0) {
            // confidence=0 means browser doesn't report it - still accept
            finalText += bestTranscript;
            bestConfidence = Math.max(bestConfidence, bestConf);
          } else {
            console.log(`[Voice] Rejected low-confidence (${bestConf.toFixed(2)}): "${bestTranscript}"`);
          }
        } else {
          interim += result[0].transcript;
        }
      }

      // Show interim text so user sees what's being heard
      if (interim) {
        setInterimText(interim);
      }

      if (finalText.trim()) {
        setInterimText("");
        setConfidence(bestConfidence);
        handleVoiceInput(finalText.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        scheduleRestart(1000);
        return;
      }
      if (event.error === "not-allowed") {
        console.warn("[Voice] Microphone permission denied");
        toast.error(t("Microphone access denied. Please allow mic in browser settings.", 
          "مائکروفون کی اجازت نہیں۔ براؤزر سیٹنگز میں مائک کی اجازت دیں۔"));
        setIsListening(false);
        return;
      }
      console.warn("[Voice] Recognition error:", event.error);
      setIsListening(false);
      scheduleRestart(2000);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
      if (!isPaused && !silentPages.includes(location.pathname)) {
        scheduleRestart(SILENCE_RESTART_MS);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      scheduleRestart(1000);
    }
  }, [language, isPaused, location.pathname, isSupported]);

  const scheduleRestart = useCallback((delay: number) => {
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    restartTimeoutRef.current = setTimeout(() => {
      startRecognition();
    }, delay);
  }, [startRecognition]);

  const handleVoiceInput = useCallback(async (text: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    setTranscript(text);
    console.log(`[Voice] Heard: "${text}"`);

    try {
      // Let page-specific handlers try first
      for (const handler of pageHandlersRef.current) {
        if (handler(text)) return;
      }

      const intent = VoiceService.parseIntent(text);
      const confirmation = VoiceService.getConfirmation(intent, language);
      console.log(`[Voice] Intent: ${intent.type}`, intent);

      switch (intent.type) {
        case "navigate":
          speak(confirmation);
          toast.info(confirmation);
          navigate(intent.page);
          break;

        case "emergency":
          speak(confirmation);
          navigate("/emergency");
          break;

        case "call":
          if (user) {
            try {
              const contacts = await ContactService.getContacts(user.id);
              const matches = ContactService.findByName(contacts, intent.contactName);
              if (matches.length === 1) {
                speak(t(`Calling ${matches[0].name}`, `${matches[0].name} کو کال کر رہے ہیں`));
                ContactService.makeCall(matches[0].phone);
              } else if (matches.length > 1) {
                const details = matches.map((c, i) => `${i + 1}. ${c.name}`).join(", ");
                speak(t(`Multiple contacts: ${details}. Say the number.`, `کئی رابطے: ${details}۔ نمبر بتائیں۔`));
              } else {
                speak(t(`No contact named ${intent.contactName}`, `${intent.contactName} نام کا رابطہ نہیں ملا`));
                toast.warning(t(`Contact "${intent.contactName}" not found`, `رابطہ "${intent.contactName}" نہیں ملا`));
              }
            } catch {
              navigate("/contacts");
            }
          } else {
            speak(t("Please sign in first", "پہلے سائن ان کریں"));
          }
          break;

        case "message":
          speak(confirmation);
          navigate("/messages");
          break;

        case "reminder":
          speak(confirmation);
          navigate("/reminders");
          break;

        case "unknown":
          // Show what was heard so user can see
          toast.info(t(`I heard: "${text}"`, `میں نے سنا: "${text}"`));
          speak(t("Let me help you with that", "میں آپ کی مدد کرتی ہوں"));
          navigate("/companion");
          break;
      }
    } finally {
      processingRef.current = false;
    }
  }, [language, user, navigate, speak, t]);

  useEffect(() => {
    if (shouldListen) {
      startRecognition();
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    }
    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    };
  }, [shouldListen, startRecognition]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    };
  }, []);

  const registerPageHandler = useCallback((handler: (text: string) => boolean) => {
    pageHandlersRef.current.add(handler);
    return () => { pageHandlersRef.current.delete(handler); };
  }, []);

  const restartListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    scheduleRestart(300);
  }, [scheduleRestart]);

  const pauseGlobal = useCallback(() => {
    setIsPaused(true);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
  }, []);

  const resumeGlobal = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <VoiceContext.Provider value={{
      isListening, transcript, interimText, confidence,
      registerPageHandler, restartListening, pauseGlobal, resumeGlobal, isPaused,
    }}>
      {children}
    </VoiceContext.Provider>
  );
};
