/**
 * VoiceService - Voice command parsing, intent detection, and TTS.
 * Handles bilingual (English/Urdu) voice commands and routes them to appropriate actions.
 */

export type VoiceIntent =
  | { type: "call"; contactName: string }
  | { type: "message"; contactName: string; content?: string }
  | { type: "whatsapp"; contactName: string; content?: string }
  | { type: "reminder"; title: string; time?: string }
  | { type: "navigate"; page: string }
  | { type: "emergency" }
  | { type: "unknown"; text: string };

export const VoiceService = {
  /** Parse voice transcript into a structured intent */
  parseIntent(text: string): VoiceIntent {
    const lower = text.toLowerCase().trim();

    // Emergency
    if (
      lower.includes("emergency") || lower.includes("help") || lower.includes("sos") ||
      lower.includes("ایمرجنسی") || lower.includes("مدد")
    ) {
      return { type: "emergency" };
    }

    // Call
    const callMatch = lower.match(/(?:call|phone|dial|کال|فون)\s+(.+)/);
    if (callMatch) {
      return { type: "call", contactName: callMatch[1].trim() };
    }

    // WhatsApp
    const waMatch = lower.match(/(?:whatsapp|واٹس ایپ)\s+(?:message|msg|call|بھیجو|کال)?\s*(?:to|کو)?\s*(.+)/);
    if (waMatch) {
      return { type: "whatsapp", contactName: waMatch[1].trim() };
    }

    // Send message
    const msgMatch = lower.match(/(?:send|message|text|پیغام|بھیجو)\s+(?:to|کو)\s+(.+)/);
    if (msgMatch) {
      return { type: "message", contactName: msgMatch[1].trim() };
    }

    // Reminder
    const reminderMatch = lower.match(/(?:remind|reminder|set reminder|یاد دہانی|یاد)\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+at\s+(.+))?$/);
    if (reminderMatch) {
      return { type: "reminder", title: reminderMatch[1].trim(), time: reminderMatch[2]?.trim() };
    }

    // Navigation
    const navMap: Record<string, string> = {
      "companion": "/companion", "chat": "/companion", "بات": "/companion", "ساتھی": "/companion",
      "reminder": "/reminders", "یاد": "/reminders",
      "note": "/notes", "نوٹ": "/notes",
      "health": "/health-dashboard", "صحت": "/health-dashboard",
      "contact": "/contacts", "رابطے": "/contacts",
      "message": "/messages", "پیغام": "/messages",
      "whatsapp": "/whatsapp", "واٹس": "/whatsapp",
      "navigation": "/navigation", "نقشہ": "/navigation", "map": "/navigation",
      "setting": "/settings", "ترتیب": "/settings",
      "home": "/home", "ہوم": "/home",
      "caregiver": "/caregiver", "نگہداشت": "/caregiver",
    };

    for (const [keyword, page] of Object.entries(navMap)) {
      if (lower.includes(keyword)) {
        return { type: "navigate", page };
      }
    }

    // Open specific pages
    const openMatch = lower.match(/(?:open|go to|کھولو|جاؤ)\s+(.+)/);
    if (openMatch) {
      const target = openMatch[1].trim();
      for (const [keyword, page] of Object.entries(navMap)) {
        if (target.includes(keyword)) {
          return { type: "navigate", page };
        }
      }
    }

    return { type: "unknown", text };
  },

  /** Speak text using Web Speech API */
  speak(text: string, language: "en" | "ur" = "en", speed: "slow" | "normal" | "fast" = "normal"): void {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "ur" ? "ur-PK" : "en-US";
    utterance.rate = speed === "slow" ? 0.7 : speed === "fast" ? 1.3 : 1.0;
    window.speechSynthesis.speak(utterance);
  },

  /** Stop any ongoing speech */
  stopSpeaking(): void {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  },

  /** Generate confirmation message for an intent */
  getConfirmation(intent: VoiceIntent, language: "en" | "ur"): string {
    if (language === "ur") {
      switch (intent.type) {
        case "call": return `${intent.contactName} کو کال کر رہے ہیں...`;
        case "message": return `${intent.contactName} کو پیغام بھیج رہے ہیں...`;
        case "whatsapp": return `${intent.contactName} کو واٹس ایپ پر بھیج رہے ہیں...`;
        case "reminder": return `یاد دہانی بنا رہے ہیں: ${intent.title}`;
        case "navigate": return `صفحہ کھول رہے ہیں...`;
        case "emergency": return `ایمرجنسی فعال کر رہے ہیں!`;
        default: return `AI ساتھی سے پوچھ رہے ہیں...`;
      }
    }
    switch (intent.type) {
      case "call": return `Calling ${intent.contactName}...`;
      case "message": return `Sending message to ${intent.contactName}...`;
      case "whatsapp": return `Opening WhatsApp for ${intent.contactName}...`;
      case "reminder": return `Creating reminder: ${intent.title}`;
      case "navigate": return `Opening page...`;
      case "emergency": return `Activating emergency!`;
      default: return `Asking AI companion...`;
    }
  },
};
