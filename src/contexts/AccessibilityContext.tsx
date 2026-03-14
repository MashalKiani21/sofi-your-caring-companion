import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { AccessibilityMode, Language, DisabilityType } from "@/types/app";

interface AccessibilityContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  mode: AccessibilityMode;
  setMode: (mode: AccessibilityMode) => void;
  fontSize: "normal" | "large" | "extra-large";
  setFontSize: (size: "normal" | "large" | "extra-large") => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  voiceSpeed: "slow" | "normal" | "fast";
  setVoiceSpeed: (s: "slow" | "normal" | "fast") => void;
  voiceGender: "male" | "female";
  setVoiceGender: (g: "male" | "female") => void;
  disabilityType: DisabilityType;
  setDisabilityType: (d: DisabilityType) => void;
  t: (en: string, ur: string) => string;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be inside AccessibilityProvider");
  return ctx;
};

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => 
    (localStorage.getItem("sofi-lang") as Language) || "en"
  );
  const [mode, setMode] = useState<AccessibilityMode>(() =>
    (localStorage.getItem("sofi-mode") as AccessibilityMode) || "standard"
  );
  const [fontSize, setFontSize] = useState<"normal" | "large" | "extra-large">(() =>
    (localStorage.getItem("sofi-font") as any) || "normal"
  );
  const [highContrast, setHighContrast] = useState(() =>
    localStorage.getItem("sofi-contrast") === "true"
  );
  const [voiceSpeed, setVoiceSpeed] = useState<"slow" | "normal" | "fast">(() =>
    (localStorage.getItem("sofi-voice-speed") as any) || "normal"
  );
  const [voiceGender, setVoiceGender] = useState<"male" | "female">(() =>
    (localStorage.getItem("sofi-voice-gender") as any) || "female"
  );
  const [disabilityType, setDisabilityType] = useState<DisabilityType>(() =>
    (localStorage.getItem("sofi-disability") as DisabilityType) || "none"
  );

  // Persist settings
  useEffect(() => {
    localStorage.setItem("sofi-lang", language);
    localStorage.setItem("sofi-mode", mode);
    localStorage.setItem("sofi-font", fontSize);
    localStorage.setItem("sofi-contrast", String(highContrast));
    localStorage.setItem("sofi-voice-speed", voiceSpeed);
    localStorage.setItem("sofi-voice-gender", voiceGender);
    localStorage.setItem("sofi-disability", disabilityType);
  }, [language, mode, fontSize, highContrast, voiceSpeed, voiceGender, disabilityType]);

  // Apply font size to root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-base", "text-lg", "text-xl");
    if (fontSize === "large") root.style.fontSize = "20px";
    else if (fontSize === "extra-large") root.style.fontSize = "24px";
    else root.style.fontSize = "16px";
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  const t = useCallback((en: string, ur: string) => language === "ur" ? ur : en, [language]);

  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "ur" ? "ur-PK" : "en-US";
      utterance.rate = voiceSpeed === "slow" ? 0.7 : voiceSpeed === "fast" ? 1.3 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [language, voiceSpeed]);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return (
    <AccessibilityContext.Provider value={{
      language, setLanguage, mode, setMode, fontSize, setFontSize,
      highContrast, setHighContrast, voiceSpeed, setVoiceSpeed,
      voiceGender, setVoiceGender, disabilityType, setDisabilityType,
      t, speak, stopSpeaking,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};
