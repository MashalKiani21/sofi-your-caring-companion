/**
 * useVoiceConfirmation - Voice-based yes/no confirmation for critical actions.
 * Speaks a prompt, listens for "yes"/"no"/"haan"/"nahi", then resolves.
 */
import { useCallback, useRef } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export const useVoiceConfirmation = () => {
  const { speak, language, t } = useAccessibility();
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const recognitionRef = useRef<any>(null);

  const confirm = useCallback(
    (promptEn: string, promptUr: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const prompt = t(promptEn, promptUr);
        speak(prompt);

        const isSupported =
          "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
        if (!isSupported) {
          // Fallback to browser confirm
          setTimeout(() => {
            resolve(window.confirm(prompt));
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
              speak(t("Confirmed.", "تصدیق ہو گئی۔"));
              resolveRef.current?.(true);
            } else if (noWords.some((w) => text.includes(w))) {
              speak(t("Cancelled.", "منسوخ۔"));
              resolveRef.current?.(false);
            } else {
              speak(t("Sorry, say yes or no.", "معذرت، ہاں یا نہیں بولیں۔"));
              resolveRef.current?.(false);
            }
            resolveRef.current = null;
          };

          recognition.onerror = () => {
            resolveRef.current?.(false);
            resolveRef.current = null;
          };

          recognition.onend = () => {
            if (resolveRef.current) {
              resolveRef.current(false);
              resolveRef.current = null;
            }
          };

          try {
            recognition.start();
          } catch {
            resolve(false);
          }
        };

        // Give TTS time to speak
        setTimeout(startListening, 1500);

        // Auto-timeout after 8 seconds
        setTimeout(() => {
          if (resolveRef.current) {
            try { recognitionRef.current?.abort(); } catch {}
            speak(t("No response. Cancelled.", "کوئی جواب نہیں۔ منسوخ۔"));
            resolveRef.current(false);
            resolveRef.current = null;
          }
        }, 8000);
      });
    },
    [speak, language, t]
  );

  return { confirm };
};
