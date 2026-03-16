/**
 * WhatsAppService - WhatsApp integration for messaging and calls.
 * 
 * Native integration points:
 * - Deep links work on both web and mobile via wa.me URLs
 * - For Capacitor: use @capacitor/app-launcher or direct URL scheme
 */

export const WhatsAppService = {
  /** Open a WhatsApp chat with a phone number */
  openChat(phone: string, message?: string): void {
    const cleanPhone = phone.replace(/[^0-9+]/g, "").replace(/^\+/, "");
    const url = message
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${cleanPhone}`;
    window.open(url, "_blank");
    // In Capacitor, this will open WhatsApp app if installed
    console.log(`[WhatsAppService] Opening WhatsApp chat with: ${phone}`);
  },

  /** Send a pre-composed WhatsApp message */
  sendMessage(phone: string, message: string): void {
    this.openChat(phone, message);
  },

  /**
   * Initiate a WhatsApp voice call
   * Note: WhatsApp doesn't support direct call initiation via URL scheme.
   * This opens the chat; user taps the call button.
   */
  initiateCall(phone: string): void {
    this.openChat(phone);
    console.log("[WhatsAppService] WhatsApp call - user must tap call button in chat");
    // TODO: In Capacitor, explore @capacitor/app-launcher for direct WhatsApp call intent
  },

  /** Check if WhatsApp is likely available (web heuristic) */
  isAvailable(): boolean {
    // On mobile web/Capacitor, WhatsApp links will open the app
    // On desktop, it opens web.whatsapp.com
    return true;
  },

  /** Format phone for WhatsApp (remove spaces, dashes, ensure country code) */
  formatPhone(phone: string): string {
    let clean = phone.replace(/[^0-9+]/g, "");
    // Pakistani numbers: convert 03XX to +923XX
    if (clean.startsWith("03")) {
      clean = "+92" + clean.substring(1);
    }
    return clean.replace(/^\+/, "");
  },
};
