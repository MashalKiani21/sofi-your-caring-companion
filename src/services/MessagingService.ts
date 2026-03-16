/**
 * MessagingService - Handles SMS and in-app messaging.
 * 
 * Native integration points (Capacitor plugins required):
 * - @capacitor-community/sms: Send SMS messages
 * - @capacitor/share: Share content via native share sheet
 */

export interface Message {
  id: string;
  to: string;
  toName: string;
  content: string;
  timestamp: Date;
  status: "draft" | "sent" | "failed";
  type: "text" | "voice";
}

export const MessagingService = {
  /**
   * PLACEHOLDER: Send an SMS message
   * In Capacitor, use: import { SMS } from '@capacitor-community/sms';
   * await SMS.send({ numbers: [phone], text: message });
   */
  async sendSMS(phone: string, message: string): Promise<{ success: boolean }> {
    console.log(`[MessagingService] SMS to ${phone}: ${message}`);
    // Web fallback: open sms: link
    window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, "_self");
    // TODO: Replace with Capacitor SMS plugin
    return { success: true };
  },

  /** Compose a message from voice input */
  composeFromVoice(transcript: string): string {
    // Clean up common voice artifacts
    return transcript
      .replace(/\bperiod\b/gi, ".")
      .replace(/\bcomma\b/gi, ",")
      .replace(/\bquestion mark\b/gi, "?")
      .replace(/\bexclamation mark\b/gi, "!")
      .replace(/\bnew line\b/gi, "\n")
      .trim();
  },

  /** Convert voice note to text for hearing-impaired users */
  voiceToTextForHearingImpaired(transcript: string): string {
    return `🔊 Voice message transcription:\n"${transcript}"`;
  },

  /** Read text aloud for visually-impaired users */
  readAloudForVisuallyImpaired(text: string, language: "en" | "ur"): void {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "ur" ? "ur-PK" : "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  },

  /**
   * PLACEHOLDER: Share content via native share sheet
   * In Capacitor, use: import { Share } from '@capacitor/share';
   * await Share.share({ title, text, url });
   */
  async shareContent(title: string, text: string): Promise<void> {
    if (navigator.share) {
      await navigator.share({ title, text });
    } else {
      console.log("[MessagingService] Native share not available in web");
    }
  },
};
