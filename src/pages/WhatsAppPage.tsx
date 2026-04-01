import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { ContactService, type Contact } from "@/services/ContactService";
import { WhatsAppService } from "@/services/WhatsAppService";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { useVoiceContext } from "@/contexts/VoiceContext";
import { ArrowLeft, MessageCircle, Phone, Search, Send, Volume2, FileText } from "lucide-react";
import { MessagingService } from "@/services/MessagingService";
import { motion } from "framer-motion";
import { toast } from "sonner";

const WhatsAppPage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  const { user } = useAuth();
  const { registerPageHandler, isListening } = useVoiceContext();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [incomingVoiceText, setIncomingVoiceText] = useState("");

  usePageAnnounce("WhatsApp", "واٹس ایپ");

  // Register page-specific voice handler
  useEffect(() => {
    const unregister = registerPageHandler((text: string) => {
      if (selectedContact) {
        // If a contact is selected, voice goes to message
        const composed = MessagingService.composeFromVoice(text);
        setMessage(composed);
        if (disabilityType === "hearing") {
          setIncomingVoiceText(composed);
          toast.info(t("Voice transcribed ✓", "آواز ٹیکسٹ میں ✓"));
        }
      } else {
        // Otherwise search contacts
        setSearch(text);
        speak(t(`Searching for ${text}`, `${text} تلاش کر رہے ہیں`));
      }
      return true;
    });
    return unregister;
  }, [registerPageHandler, selectedContact, disabilityType, speak, t]);

  useEffect(() => {
    if (user) loadContacts();
  }, [user]);

  const loadContacts = async () => {
    try {
      const data = await ContactService.getContacts(user!.id);
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = ContactService.searchContacts(contacts, search);

  const handleSendMessage = () => {
    if (!selectedContact || !message.trim()) return;
    WhatsAppService.sendMessage(
      WhatsAppService.formatPhone(selectedContact.phone),
      message
    );
    speak(t(`Sending WhatsApp message to ${selectedContact.name}`, `${selectedContact.name} کو واٹس ایپ پیغام بھیج رہے ہیں`));
    toast.success(t("Opening WhatsApp...", "واٹس ایپ کھول رہے ہیں..."));
    setMessage("");
  };

  const handleCall = (contact: Contact) => {
    WhatsAppService.initiateCall(WhatsAppService.formatPhone(contact.phone));
    speak(t(`Opening WhatsApp call for ${contact.name}`, `${contact.name} کے لیے واٹس ایپ کال`));
  };

  const handleOpenChat = (contact: Contact) => {
    WhatsAppService.openChat(WhatsAppService.formatPhone(contact.phone));
    speak(t(`Opening WhatsApp chat with ${contact.name}`, `${contact.name} کے ساتھ واٹس ایپ چیٹ`));
  };

  const readTextAloud = (text: string) => {
    MessagingService.readAloudForVisuallyImpaired(text, language as "en" | "ur");
    toast.info(t("Reading message aloud...", "پیغام پڑھ رہے ہیں..."));
  };

  if (selectedContact) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSelectedContact(null)} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{selectedContact.name}</p>
            <p className="text-xs text-success">
              {isListening ? t("Speak your message!", "اپنا پیغام بولیں!") : t("WhatsApp", "واٹس ایپ")}
            </p>
          </div>
          <button
            onClick={() => handleCall(selectedContact)}
            className="min-h-touch min-w-touch rounded-xl bg-success/10 flex items-center justify-center"
            aria-label={t("WhatsApp Call", "واٹس ایپ کال")}
          >
            <Phone className="w-5 h-5 text-success" />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <MessageCircle className="w-16 h-16 text-success/30" />
          <p className="text-muted-foreground text-center">
            {t("Speak or type your message below.", "نیچے بولیں یا پیغام لکھیں۔")}
          </p>

          {disabilityType === "hearing" && (
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-sm text-center text-primary">
              <FileText className="w-4 h-4 inline mr-1" />
              {t("Voice notes will be auto-transcribed", "وائس نوٹس خود بخود ٹیکسٹ میں تبدیل ہوں گے")}
            </div>
          )}
          {disabilityType === "visual" && (
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-sm text-center text-primary">
              <Volume2 className="w-4 h-4 inline mr-1" />
              {t("Messages will be read aloud", "پیغامات پڑھ کر سنائے جائیں گے")}
            </div>
          )}

          {incomingVoiceText && disabilityType === "hearing" && (
            <div className="w-full p-4 rounded-2xl bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">{t("Voice transcription:", "آواز کی نقل:")}</p>
              <p className="text-foreground">{incomingVoiceText}</p>
            </div>
          )}

          <button
            onClick={() => handleOpenChat(selectedContact)}
            className="min-h-touch px-6 rounded-2xl bg-success text-success-foreground font-semibold"
          >
            {t("Open Chat in WhatsApp", "واٹس ایپ میں چیٹ کھولیں")}
          </button>

          {disabilityType === "visual" && message && (
            <button
              onClick={() => readTextAloud(message)}
              className="min-h-touch px-6 rounded-2xl bg-primary/10 text-primary font-medium flex items-center gap-2"
            >
              <Volume2 className="w-5 h-5" />
              {t("Read message aloud", "پیغام سنائیں")}
            </button>
          )}
        </div>

        <div className="border-t border-border px-4 py-3 bg-card">
          <div className="flex items-center gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("Speak or type a message...", "بولیں یا پیغام لکھیں...")}
              className="flex-1 min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir={language === "ur" ? "rtl" : "ltr"}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="min-h-touch min-w-touch rounded-2xl bg-success text-success-foreground flex items-center justify-center disabled:opacity-50"
              aria-label={t("Send via WhatsApp", "واٹس ایپ سے بھیجیں")}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/home")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("WhatsApp", "واٹس ایپ")}</h1>
          <p className="text-xs text-muted-foreground">
            {isListening ? t("Say a contact name!", "رابطے کا نام بولیں!") : t("Send messages & calls", "پیغامات اور کالز")}
          </p>
        </div>
      </header>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search or speak a name...", "تلاش یا نام بولیں...")}
            className="w-full min-h-touch pl-11 pr-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {t("No contacts found. Add contacts first.", "کوئی رابطہ نہیں ملا۔ پہلے رابطے شامل کریں۔")}
          </p>
        ) : (
          filtered.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4 rounded-2xl bg-card shadow-card flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedContact(contact)}
                  className="min-h-touch min-w-touch rounded-xl bg-success/10 flex items-center justify-center"
                  aria-label={`Message ${contact.name} on WhatsApp`}
                >
                  <Send className="w-5 h-5 text-success" />
                </button>
                <button
                  onClick={() => handleCall(contact)}
                  className="min-h-touch min-w-touch rounded-xl bg-primary/10 flex items-center justify-center"
                  aria-label={`Call ${contact.name} on WhatsApp`}
                >
                  <Phone className="w-5 h-5 text-primary" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default WhatsAppPage;
