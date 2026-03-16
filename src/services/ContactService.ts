/**
 * ContactService - Manages contacts with database and native device integration points.
 * 
 * Native integration points (Capacitor plugins required):
 * - @capacitor-community/contacts: Access device contacts
 * - @capacitor/call-number: Make phone calls
 */

import { supabase } from "@/integrations/supabase/client";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  user_id: string;
}

export const ContactService = {
  /** Fetch emergency contacts from database */
  async getContacts(userId: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    if (error) throw error;
    return data || [];
  },

  /** Add a new contact */
  async addContact(userId: string, contact: Omit<Contact, "id" | "user_id">): Promise<Contact> {
    const { data, error } = await supabase
      .from("emergency_contacts")
      .insert({ ...contact, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Update an existing contact */
  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    const { data, error } = await supabase
      .from("emergency_contacts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Delete a contact */
  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  /** Search contacts by name or phone */
  searchContacts(contacts: Contact[], query: string): Contact[] {
    const lower = query.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.phone.includes(query)
    );
  },

  /** Find contacts matching a name (for disambiguation) */
  findByName(contacts: Contact[], name: string): Contact[] {
    const lower = name.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(lower));
  },

  /**
   * PLACEHOLDER: Make a phone call
   * In Capacitor, use: import { CallNumber } from '@capacitor-community/call-number';
   * await CallNumber.call({ number: phone, bypassAppChooser: false });
   */
  async makeCall(phone: string): Promise<void> {
    // Web fallback: open tel: link
    window.open(`tel:${phone}`, "_self");
    console.log(`[ContactService] Call initiated to: ${phone}`);
    // TODO: Replace with Capacitor CallNumber plugin for native calls
  },

  /**
   * PLACEHOLDER: Import contacts from device
   * In Capacitor, use: import { Contacts } from '@capacitor-community/contacts';
   * const result = await Contacts.getContacts({ projection: { name: true, phones: true } });
   */
  async importDeviceContacts(): Promise<Contact[]> {
    console.log("[ContactService] Device contact import - requires Capacitor plugin");
    // TODO: Implement with @capacitor-community/contacts
    return [];
  },
};
