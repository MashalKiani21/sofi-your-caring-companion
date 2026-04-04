/**
 * useVoiceConfirmation - Voice-based yes/no confirmation for critical actions.
 * Speaks a prompt, listens for "yes"/"no"/"haan"/"nahi", then resolves.
 */
import { useCallback, useRef } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useVoiceContext } from "@/contexts/VoiceContext";

export const useVoiceConfirmation = () => {
  const { speak, language, t } = useAccessibility();
  const { pauseGlobal, resumeGlobal } = useVoiceContext();
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const recognitionRef = useRef<any>(null);

  const confirm = useCallback(
    (promptEn: string, promptUr: string): Promise<boolean> => {
      return new Promise((resolve) => {
        pauseGlobal();
        const prompt = t(promptEn, promptUr);
        speak(prompt);

        const finalize = (confirmed: boolean, feedback?: string) => {
          const currentResolve = resolveRef.current;
          resolveRef.current = null;
          try { recognitionRef.current?.abort(); } catch {}
          recognitionRef.current = null;
          if (feedback) speak(feedback);
          (currentResolve || resolve)(confirmed);
          window.setTimeout(() => resumeGlobal(), 250);
        };

        const isSupported =
          "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
        if (!isSupported) {
          // Fallback to browser confirm
          setTimeout(() => {
            const confirmed = window.confirm(prompt);
            resumeGlobal();
            resolve(confirmed);
          }, 500);
          return;
        }

        resolveRef.current = resolve;

        // Wait for TTS to finish before listening
        const startListening = () => {
          const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;

          recognition.lang = language === "ur" ? "ur-PK" : "en-US";
          recognition.continuous = false;
          recognition.interimResults = false;

          recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript.toLowerCase().trim();
            const yesWords = ["yes", "yeah", "yep", "sure", "ok", "okay", "confirm", "ہاں", "جی", "جی ہاں", "ہا"];
            const noWords = ["no", "nope", "cancel", "stop", "نہیں", "نا", "رکو", "بند"];

            if (yesWords.some((w) => text.includes(w))) {
            finalize(true, t("Confirmed.", "تصدیق ہو گئی۔"));
            } else if (noWords.some((w) => text.includes(w))) {
            finalize(false, t("Cancelled.", "منسوخ۔"));
            } else {
            finalize(false, t("Sorry, say yes or no.", "معذرت، ہاں یا نہیں بولیں۔"));
            }
          };

          recognition.onerror = () => {
            finalize(false);
          };

          recognition.onend = () => {
            if (resolveRef.current) {
              finalize(false);
            }
          };

          try {
            recognition.start();
          } catch {
            finalize(false);
          }
        };

        // Give TTS time to speak
        setTimeout(startListening, 1500);

        // Auto-timeout after 8 seconds
        setTimeout(() => {
          if (resolveRef.current) {
            finalize(false, t("No response. Cancelled.", "کوئی جواب نہیں۔ منسوخ۔"));
          }
        }, 8000);
      });
    },
    [pauseGlobal, resumeGlobal, speak, language, t]
  );

  return { confirm };
};
