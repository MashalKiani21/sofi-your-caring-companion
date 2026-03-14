// Core application types for SOFI accessibility app

export type DisabilityType = 
  | "visual" 
  | "hearing" 
  | "motor" 
  | "speech" 
  | "cognitive" 
  | "multiple" 
  | "none";

export type AccessibilityMode = 
  | "voice-only"      // For visually impaired
  | "visual-only"     // For hearing/speech impaired
  | "touch-assist"    // For motor impaired
  | "full-assist"     // For multiple disabilities
  | "standard";       // Normal mode

export type Language = "en" | "ur";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  disability_type: DisabilityType;
  accessibility_mode: AccessibilityMode;
  preferred_language: Language;
  voice_speed: "slow" | "normal" | "fast";
  voice_gender: "male" | "female";
  font_size: "normal" | "large" | "extra-large";
  high_contrast: boolean;
  emergency_contacts: EmergencyContact[];
  medical_info?: MedicalInfo;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface MedicalInfo {
  conditions: string[];
  allergies: string[];
  medications: string[];
  blood_type?: string;
  doctor_name?: string;
  doctor_phone?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  content_urdu?: string;
  type: "text" | "voice";
  timestamp: Date;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  title_urdu?: string;
  description?: string;
  time: string;
  recurring: "once" | "daily" | "weekly" | "monthly";
  completed: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  type: "heart_rate" | "blood_pressure" | "steps" | "sleep" | "mood" | "pain_level" | "medication";
  value: string;
  unit: string;
  recorded_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  category: "command" | "navigation" | "reminder" | "health" | "emergency" | "communication";
  timestamp: string;
}

// Bilingual text helper
export interface BilingualText {
  en: string;
  ur: string;
}

export const DISABILITY_OPTIONS: { type: DisabilityType; label: BilingualText; description: BilingualText; icon: string }[] = [
  {
    type: "visual",
    label: { en: "Visual Impairment", ur: "بصری معذوری" },
    description: { en: "Blindness or low vision. App will use voice-first navigation.", ur: "نابینا پن یا کم بینائی۔ ایپ آواز سے چلے گی۔" },
    icon: "eye-off",
  },
  {
    type: "hearing",
    label: { en: "Hearing Impairment", ur: "سماعت کی معذوری" },
    description: { en: "Deaf or hard of hearing. Visual cues and text-based interaction.", ur: "بہرا پن۔ بصری اشارے اور ٹیکسٹ۔" },
    icon: "ear-off",
  },
  {
    type: "motor",
    label: { en: "Motor Disability", ur: "جسمانی معذوری" },
    description: { en: "Limited mobility. Voice commands and large touch targets.", ur: "محدود حرکت۔ آواز کے احکامات۔" },
    icon: "accessibility",
  },
  {
    type: "speech",
    label: { en: "Speech Impairment", ur: "تقریر کی معذوری" },
    description: { en: "Difficulty speaking. Text-based commands with quick actions.", ur: "بولنے میں مشکل۔ ٹیکسٹ کمانڈز۔" },
    icon: "mic-off",
  },
  {
    type: "cognitive",
    label: { en: "Cognitive Disability", ur: "ذہنی معذوری" },
    description: { en: "Learning or cognitive challenges. Simplified interface.", ur: "سیکھنے کی مشکلات۔ آسان انٹرفیس۔" },
    icon: "brain",
  },
  {
    type: "multiple",
    label: { en: "Multiple Disabilities", ur: "متعدد معذوری" },
    description: { en: "Combination of disabilities. Fully customized experience.", ur: "متعدد معذوریاں۔ مکمل حسب ضرورت۔" },
    icon: "heart",
  },
  {
    type: "none",
    label: { en: "No Disability", ur: "کوئی معذوری نہیں" },
    description: { en: "Standard mode with all accessibility options available.", ur: "معیاری موڈ تمام سہولیات دستیاب۔" },
    icon: "user",
  },
];
