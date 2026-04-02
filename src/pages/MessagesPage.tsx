import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceContext } from "@/contexts/VoiceContext";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { ContactService, type Contact } from "@/services/ContactService";
import { MessagingService } from "@/services/MessagingService";
import { ArrowLeft, Send, Search, Phone, User, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const MessagesPage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  const { user } = useAuth();
  const { registerPageHandler, isListening } = useVoiceContext();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);

  usePageAnnounce("Messages", "پیغامات");

  useEffect(() => {
    if (user) {
      ContactService.getContacts(user.id).then(data => {
        setContacts(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user]);

  // Voice handler: "message Ahmed hello" or just search
  useEffect(() => {
    const unregister = registerPageHandler((text: string) => {
      const msgMatch = text.match(/(?:message|text|send|پیغام|بھیجو)\s+(?:to\s+)?(\w+)\s*(.*)/i);
      if (msgMatch) {
        const name = msgMatch[1].trim();
        const content = msgMatch[2]?.trim() || "";
        const matches = ContactService.findByName(contacts, name);
        if (matches.length === 1) {
          setActiveContact(matches[0]);
          if (content) {
            setMessageText(MessagingService.composeFromVoice(content));
            speak(t(`Message ready for ${matches[0].name}`, `${matches[0].name} کے لیے پیغام تیار`));
          } else {
            speak(t(`Opened chat with ${matches[0].name}. Speak your message.`, `${matches[0].name} کے ساتھ چیٹ کھلی۔ پیغام بولیں۔`));
          }
        } else {
          speak(t(`Contact not found: ${name}`, `رابطہ نہیں ملا: ${name}`));
        }
        return true;
      }
      // If in active chat, treat as message content
      if (activeContact) {
        setMessageText(prev => prev ? prev + " " + MessagingService.composeFromVoice(text) : MessagingService.composeFromVoice(text));
        speak(t("Added to message.", "پیغام میں شامل۔"));
        return true;
      }
      setSearch(text);
      speak(t(`Searching for ${text}`, `${text} تلاش کر رہے ہیں`));
      return true;
    });
    return unregister;
  }, [registerPageHandler, contacts, activeContact, speak, t]);

  const sendMessage = () => {
    if (!activeContact || !messageText.trim()) return;
    speak(t(`Sending message to ${activeContact.name}`, `${activeContact.name} کو پیغام بھیج رہے ہیں`));
    MessagingService.sendSMS(activeContact.phone, messageText);
    toast.success(t("Message sent!", "پیغام بھیج دیا!"));
    setMessageText("");
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  if (activeContact) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setActiveContact(null)} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{activeContact.name}</p>
            <p className="text-xs text-muted-foreground">{activeContact.phone} · {activeContact.relationship}</p>
          </div>
          <button onClick={() => { speak(t(`Calling ${activeContact.name}`, `${activeContact.name} کو کال`)); ContactService.makeCall(activeContact.phone); }}
            className="min-h-touch min-w-touch rounded-xl bg-success/10 flex items-center justify-center">
            <Phone className="w-5 h-5 text-success" />
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isListening
                ? t("Speak your message — it'll appear below!", "اپنا پیغام بولیں — نیچے ظاہر ہوگا!")
                : t("Type or speak your message", "پیغام ٹائپ کریں یا بولیں")}
            </p>
          </div>
        </div>

        <div className="border-t border-border px-4 py-3 bg-card">
          <div className="flex items-center gap-2">
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={t("Type or speak a message...", "پیغام لکھیں یا بولیں...")}
              className="flex-1 min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir={language === "ur" ? "rtl" : "ltr"}
            />
            <button onClick={sendMessage} disabled={!messageText.trim()}
              className="min-h-touch min-w-touch rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
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
          <h1 className="text-xl font-bold text-foreground">{t("Messages", "پیغامات")}</h1>
          <p className="text-sm text-muted-foreground">
            {isListening ? t("Say \"Message Ahmed hello\"", "بولیں \"احمد کو ہیلو بھیجو\"") : t("Voice-enabled", "آواز فعال")}
          </p>
        </div>
      </header>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search contacts to message...", "پیغام بھیجنے کے لیے رابطے تلاش کریں...")}
            className="w-full min-h-touch pl-11 pr-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("No contacts. Add contacts first.", "کوئی رابطہ نہیں۔ پہلے رابطے شامل کریں۔")}</p>
          </div>
        ) : (
          filtered.map((contact, i) => (
            <motion.button
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => {
                setActiveContact(contact);
                speak(t(`Chat with ${contact.name}`, `${contact.name} کے ساتھ چیٹ`));
              }}
              className="w-full p-4 rounded-2xl bg-card shadow-card flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
              </div>
              <p className="text-xs text-muted-foreground">{contact.relationship}</p>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
