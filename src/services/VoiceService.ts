/**
 * VoiceService - Voice command parsing, intent detection, and TTS.
 * Uses fuzzy matching and multiple keyword variants for robust recognition.
 */

export type VoiceIntent =
  | { type: "call"; contactName: string }
  | { type: "message"; contactName: string; content?: string }
  | { type: "reminder"; title: string; time?: string }
  | { type: "navigate"; page: string }
  | { type: "emergency" }
  | { type: "unknown"; text: string };

/** Simple word-level similarity (Dice coefficient) */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s: string) => {
    const set: string[] = [];
    for (let i = 0; i < s.length - 1; i++) set.push(s.substring(i, i + 2));
    return set;
  };
  const aBi = bigrams(a);
  const bBi = bigrams(b);
  let matches = 0;
  const bCopy = [...bBi];
  for (const bi of aBi) {
    const idx = bCopy.indexOf(bi);
    if (idx !== -1) { matches++; bCopy.splice(idx, 1); }
  }
  return (2 * matches) / (aBi.length + bBi.length);
}

/** Check if any word in text fuzzy-matches any keyword */
function fuzzyIncludes(text: string, keywords: string[], threshold = 0.6): boolean {
  const words = text.split(/\s+/);
  return keywords.some(kw => words.some(w => similarity(w, kw) >= threshold));
}

/** Extract text after a fuzzy-matched keyword */
function extractAfterKeyword(text: string, keywords: string[], threshold = 0.6): string | null {
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    if (keywords.some(kw => similarity(words[i], kw) >= threshold)) {
      const rest = words.slice(i + 1).join(" ").trim();
      // Remove filler words like "to", "the", "a"
      return rest.replace(/^(to|the|a|an|کو|کا|کی)\s+/i, "").trim() || null;
    }
  }
  return null;
}

// Keyword groups for robust matching
const EMERGENCY_KEYWORDS = ["emergency", "emergancy", "emrgency", "sos", "danger", "ایمرجنسی", "بچاؤ"];
const SOFT_EMERGENCY_KEYWORDS = ["help", "مدد"];
const CALL_KEYWORDS = ["call", "phone", "dial", "ring", "کال", "فون"];
const MESSAGE_KEYWORDS = ["send", "message", "text", "msg", "sms", "پیغام", "بھیجو", "میسج"];
const REMINDER_KEYWORDS = ["remind", "reminder", "alarm", "timer", "یاد", "یاددہانی", "الارم"];
const NAV_KEYWORDS: [string[], string][] = [
  [["companion", "chat", "talk", "ai", "بات", "ساتھی", "چیٹ"], "/companion"],
  [["reminder", "reminders", "alarm", "یاد", "یاددہانی"], "/reminders"],
  [["note", "notes", "نوٹ", "نوٹس"], "/notes"],
  [["health", "medical", "vitals", "صحت", "طبی"], "/health-dashboard"],
  [["contact", "contacts", "people", "رابطے", "لوگ"], "/contacts"],
  [["message", "messages", "inbox", "پیغام", "پیغامات"], "/messages"],
  [["navigate", "navigation", "map", "maps", "direction", "نقشہ", "سمت"], "/navigation"],
  [["setting", "settings", "preferences", "ترتیب", "سیٹنگ"], "/settings"],
  [["home", "dashboard", "main", "ہوم", "مین"], "/home"],
  [["emergency", "sos", "ایمرجنسی"], "/emergency"],
];
const OPEN_KEYWORDS = ["open", "go", "show", "take", "کھولو", "جاؤ", "دکھاؤ", "لے"];

export const VoiceService = {
  /** Parse voice transcript into a structured intent */
  parseIntent(text: string): VoiceIntent {
    const lower = text.toLowerCase().trim();
    const words = lower.split(/\s+/);

    // Emergency - check first, but avoid false positives from longer help phrases
    if (fuzzyIncludes(lower, EMERGENCY_KEYWORDS, 0.7)) {
      return { type: "emergency" };
    }
    if (words.length <= 3 && fuzzyIncludes(lower, SOFT_EMERGENCY_KEYWORDS, 0.75)) {
      return { type: "emergency" };
    }

    // Call someone
    const callTarget = extractAfterKeyword(lower, CALL_KEYWORDS, 0.7);
    if (callTarget) {
      return { type: "call", contactName: callTarget };
    }

    // Send message - check for "message [name] [content]" pattern
    const msgTarget = extractAfterKeyword(lower, MESSAGE_KEYWORDS, 0.65);
    if (msgTarget) {
      // Split into contact name and optional content
      const parts = msgTarget.split(/\s+(?:that|saying|say|کہ|بولو)\s+/i);
      return { type: "message", contactName: parts[0].trim(), content: parts[1]?.trim() };
    }

    // Reminder
    const reminderTarget = extractAfterKeyword(lower, REMINDER_KEYWORDS, 0.65);
    if (reminderTarget) {
      const timeParts = reminderTarget.split(/\s+(?:at|on|in|پر|بجے)\s+/i);
      return { type: "reminder", title: timeParts[0].trim(), time: timeParts[1]?.trim() };
    }

    // Navigation - "open [page]" or just page name
    const hasOpenWord = fuzzyIncludes(lower, OPEN_KEYWORDS, 0.7);
    const searchText = hasOpenWord
      ? extractAfterKeyword(lower, OPEN_KEYWORDS, 0.7) || lower
      : lower;

    for (const [keywords, page] of NAV_KEYWORDS) {
      if (fuzzyIncludes(searchText, keywords, 0.65)) {
        return { type: "navigate", page };
      }
    }

    // If just a page keyword alone without "open"
    if (!hasOpenWord) {
      for (const [keywords, page] of NAV_KEYWORDS) {
        if (fuzzyIncludes(lower, keywords, 0.7)) {
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
        case "reminder": return `یاد دہانی بنا رہے ہیں: ${intent.title}`;
        case "navigate": return `صفحہ کھول رہے ہیں...`;
        case "emergency": return `ایمرجنسی فعال کر رہے ہیں!`;
        default: return `AI ساتھی سے پوچھ رہے ہیں...`;
      }
    }
    switch (intent.type) {
      case "call": return `Calling ${intent.contactName}...`;
      case "message": return `Sending message to ${intent.contactName}...`;
      case "reminder": return `Creating reminder: ${intent.title}`;
      case "navigate": return `Opening page...`;
      case "emergency": return `Activating emergency!`;
      default: return `Asking AI companion...`;
    }
  },
};
