/**
 * ReminderService - Reminder and alarm management with database persistence.
 * 
 * Native integration points (Capacitor plugins required):
 * - @capacitor-community/local-notifications: Schedule device notifications
 * - Device alarm clock: No direct API; use notifications as fallback
 */

import { supabase } from "@/integrations/supabase/client";

export interface ReminderData {
  id: string;
  title: string;
  title_urdu?: string | null;
  description?: string | null;
  reminder_time: string;
  recurring: string;
  completed: boolean;
  user_id: string;
  created_at: string;
}

export const ReminderService = {
  /** Fetch all reminders for a user */
  async getReminders(userId: string): Promise<ReminderData[]> {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .order("reminder_time");
    if (error) throw error;
    return data || [];
  },

  /** Create a new reminder */
  async createReminder(userId: string, reminder: {
    title: string;
    title_urdu?: string;
    description?: string;
    reminder_time: string;
    recurring?: string;
  }): Promise<ReminderData> {
    const { data, error } = await supabase
      .from("reminders")
      .insert({
        ...reminder,
        user_id: userId,
        recurring: reminder.recurring || "once",
        completed: false,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Toggle reminder completion */
  async toggleComplete(id: string, completed: boolean): Promise<void> {
    const { error } = await supabase
      .from("reminders")
      .update({ completed })
      .eq("id", id);
    if (error) throw error;
  },

  /** Delete a reminder */
  async deleteReminder(id: string): Promise<void> {
    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  /** Update a reminder */
  async updateReminder(id: string, updates: Partial<ReminderData>): Promise<void> {
    const { error } = await supabase
      .from("reminders")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  /** Parse voice command for reminder creation */
  parseVoiceReminder(text: string): { title: string; time: string } | null {
    // English patterns
    const enPattern = /remind (?:me )?(?:to )?(.+?)(?:at|by|in) (.+)/i;
    const enMatch = text.match(enPattern);
    if (enMatch) {
      return { title: enMatch[1].trim(), time: enMatch[2].trim() };
    }

    // Urdu patterns
    const urPattern = /یاد دہانی (.+?) (وقت|بجے) (.+)/;
    const urMatch = text.match(urPattern);
    if (urMatch) {
      return { title: urMatch[1].trim(), time: urMatch[3].trim() };
    }

    return null;
  },

  /**
   * PLACEHOLDER: Schedule a local notification for the reminder
   * In Capacitor, use:
   * import { LocalNotifications } from '@capacitor/local-notifications';
   * await LocalNotifications.schedule({
   *   notifications: [{
   *     title: reminder.title,
   *     body: reminder.description || '',
   *     id: hashCode(reminder.id),
   *     schedule: { at: new Date(reminder.reminder_time) },
   *     sound: 'alarm.wav',
   *   }]
   * });
   */
  async scheduleNotification(reminder: ReminderData): Promise<void> {
    console.log(`[ReminderService] Notification scheduled for: ${reminder.title} at ${reminder.reminder_time}`);
    // TODO: Implement with @capacitor/local-notifications
  },
};
