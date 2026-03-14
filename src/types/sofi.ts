export type SofiState = "idle" | "listening" | "thinking" | "speaking" | "success" | "emergency";

export interface TranscriptEntry {
  id: string;
  english: string;
  urdu: string;
  type: "user" | "sofi";
  timestamp: Date;
}

export interface Reminder {
  id: string;
  title: string;
  titleUrdu: string;
  time: string;
  recurring: "once" | "daily" | "weekly" | "monthly";
  completed: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface ActivityEvent {
  id: string;
  type: "command" | "reminder" | "emergency" | "check-in";
  description: string;
  timestamp: Date;
  status: "completed" | "pending" | "missed" | "active";
}
