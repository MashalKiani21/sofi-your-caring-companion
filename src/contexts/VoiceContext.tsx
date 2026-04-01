/**
 * VoiceContext - Global always-on voice controller.
 * Continuously listens for voice commands across all pages.
 * Pages can register page-specific handlers via useVoiceContext.
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
  /** Register a page-specific voice handler. Returns unregister fn. */
  registerPageHandler: (handler: (text: string) => boolean) => () => void;
  /** Manually trigger listening restart (e.g. after an action) */
  restartListening: () => void;
  /** Pause global listening (e.g. when page needs exclusive mic) */
  pauseGlobal: () => void;
  /** Resume global listening */
  resumeGlobal: () => void;
  isPaused: boolean;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export const useVoiceContext = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoiceContext must be inside VoiceProvider");
  return ctx;
};

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const recognitionRef = useRef<any>(null);
  const pageHandlersRef = useRef<Set<(text: string) => boolean>>(new Set());
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t, speak, disabilityType } = useAccessibility();
  const { user } = useAuth();

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Don't auto-listen on intro/auth pages
  const silentPages = ["/", "/auth", "/reset-password"];
  const shouldListen = isSupported && !isPaused && !silentPages.includes(location.pathname);

  const startRecognition = useCallback(() => {
    if (!isSupported || isPaused || silentPages.includes(location.pathname)) return;

    // Clean up existing
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = language === "ur" ? "ur-PK" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = false; // Only final results to avoid noise

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      if (finalText.trim()) {
        handleVoiceInput(finalText.trim());
      }
    };

    recognition.onerror = (event: any) => {
      // "no-speech" and "aborted" are normal - just restart
      if (event.error === "no-speech" || event.error === "aborted") {
        // Restart after brief pause
        scheduleRestart(1000);
        return;
      }
      console.warn("Voice recognition error:", event.error);
      setIsListening(false);
      scheduleRestart(2000);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart for continuous listening
      if (!isPaused && !silentPages.includes(location.pathname)) {
        scheduleRestart(500);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      // Already started
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
    setTranscript(text);

    // First, let page-specific handlers try to handle it
    for (const handler of pageHandlersRef.current) {
      if (handler(text)) return; // Page handled it
    }

    // Global intent parsing
    const intent = VoiceService.parseIntent(text);
    const confirmation = VoiceService.getConfirmation(intent, language);

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
              const details = matches.map((c, i) => `${i + 1}. ${c.name} (${c.relationship})`).join(", ");
              speak(t(`Multiple contacts: ${details}. Say the number.`, `کئی رابطے: ${details}۔ نمبر بتائیں۔`));
            } else {
              speak(t(`No contact named ${intent.contactName}`, `${intent.contactName} نام کا رابطہ نہیں ملا`));
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

      case "whatsapp":
        speak(confirmation);
        navigate("/whatsapp");
        break;

      case "reminder":
        speak(confirmation);
        navigate("/reminders");
        break;

      case "unknown":
        // Send to AI companion for unknown commands
        speak(t("Let me help you with that", "میں آپ کی مدد کرتی ہوں"));
        navigate("/companion");
        break;
    }
  }, [language, user, navigate, speak, t]);

  // Start/stop recognition based on page and pause state
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

  // Cleanup on unmount
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
      isListening, transcript, registerPageHandler,
      restartListening, pauseGlobal, resumeGlobal, isPaused,
    }}>
      {children}
    </VoiceContext.Provider>
  );
};
