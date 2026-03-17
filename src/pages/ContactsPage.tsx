import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { ContactService, type Contact } from "@/services/ContactService";
import { MessagingService } from "@/services/MessagingService";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { ArrowLeft, Phone, MessageSquare, Search, Plus, User, Trash2, X, Mic, MicOff } from "lucide-react";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const ContactsPage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRelation, setNewRelation] = useState("");

  usePageAnnounce("Contacts", "رابطے");

  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({
    language,
    onResult: (text) => {
      // Voice search: if user says "call ahmed" we search for ahmed
      const callMatch = text.match(/(?:call|کال)\s+(.+)/i);
      if (callMatch) {
        const name = callMatch[1].trim();
        const matches = ContactService.findByName(contacts, name);
        if (matches.length === 1) {
          speak(t(`Calling ${matches[0].name}`, `${matches[0].name} کو کال کر رہے ہیں`));
          ContactService.makeCall(matches[0].phone);
        } else if (matches.length > 1) {
          const details = matches.map((c, i) => `${i + 1}. ${c.name} (${c.relationship})`).join(", ");
          speak(t(
            `Multiple contacts found: ${details}. Which one?`,
            `کئی رابطے ملے: ${details}۔ کون سا؟`
          ));
          toast.info(t(`Multiple matches: ${details}`, `کئی رابطے: ${details}`), { duration: 6000 });
        } else {
          speak(t(`No contact named ${name} found`, `${name} نام کا کوئی رابطہ نہیں ملا`));
        }
      } else {
        setSearch(text);
      }
    },
  });

  useEffect(() => {
    if (user) loadContacts();
  }, [user]);

  const loadContacts = async () => {
    try {
      const data = await ContactService.getContacts(user!.id);
      setContacts(data);
    } catch (err) {
      toast.error(t("Failed to load contacts", "رابطے لوڈ نہیں ہوئے"));
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!newName || !newPhone || !user) return;
    try {
      await ContactService.addContact(user.id, { name: newName, phone: newPhone, relationship: newRelation || "Other" });
      await loadContacts();
      setNewName(""); setNewPhone(""); setNewRelation(""); setShowAdd(false);
      speak(t("Contact added!", "رابطہ شامل!"));
      toast.success(t("Contact added", "رابطہ شامل"));
    } catch (err) {
      toast.error(t("Failed to add contact", "رابطہ شامل نہیں ہوا"));
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await ContactService.deleteContact(id);
      setContacts((c) => c.filter((x) => x.id !== id));
      toast.success(t("Contact deleted", "رابطہ حذف"));
    } catch (err) {
      toast.error(t("Delete failed", "حذف ناکام"));
    }
  };

  const handleCall = (contact: Contact) => {
    speak(t(`Calling ${contact.name}`, `${contact.name} کو کال کر رہے ہیں`));
    /**
     * PLACEHOLDER: Phone call execution
     * In Capacitor, use: import { CallNumber } from '@capacitor-community/call-number';
     * await CallNumber.call({ number: contact.phone, bypassAppChooser: false });
     * 
     * The web fallback opens a tel: link which works on mobile browsers.
     */
    ContactService.makeCall(contact.phone);
  };

  const handleMessage = (contact: Contact) => {
    speak(t(`Messaging ${contact.name}`, `${contact.name} کو پیغام`));
    /**
     * PLACEHOLDER: SMS sending
     * In Capacitor, use: import { SMS } from '@capacitor-community/sms';
     * await SMS.send({ numbers: [contact.phone], text: '' });
     * 
     * Web fallback opens sms: link.
     */
    MessagingService.sendSMS(contact.phone, "");
  };

  const filtered = ContactService.searchContacts(contacts, search);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("Contacts", "رابطے")}</h1>
        </div>
        <div className="flex gap-2">
          {/**
            * PLACEHOLDER: Import device contacts
            * In Capacitor, use: import { Contacts } from '@capacitor-community/contacts';
            * const result = await Contacts.getContacts({ projection: { name: true, phones: true } });
            * This would allow syncing phone contacts into the SOFI app.
            */}
          <button onClick={() => setShowAdd(!showAdd)} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl bg-primary text-primary-foreground">
            {showAdd ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="px-4 py-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search or say \"Call Ahmed\"...", "تلاش کریں یا بولیں \"احمد کو کال کرو\"...")}
              className="w-full min-h-touch pl-11 pr-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => isListening ? stopListening() : startListening()}
            disabled={!isSupported}
            className={`min-h-touch min-w-touch rounded-2xl flex items-center justify-center transition-colors ${
              isListening ? "bg-emergency text-emergency-foreground animate-pulse" : "bg-secondary text-foreground"
            } disabled:opacity-30`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="p-4 rounded-2xl bg-card shadow-card space-y-3 mb-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("Name", "نام")}
                className="w-full min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder={t("Phone number", "فون نمبر")} type="tel"
                className="w-full min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <input value={newRelation} onChange={(e) => setNewRelation(e.target.value)} placeholder={t("Relationship (Son, Doctor...)", "رشتہ (بیٹا، ڈاکٹر...)")}
                className="w-full min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={addContact} disabled={!newName || !newPhone} className="w-full min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold disabled:opacity-50">
                {t("Add Contact", "رابطہ شامل کریں")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{search ? t("No contacts match", "کوئی رابطہ نہیں ملا") : t("No contacts yet", "ابھی کوئی رابطہ نہیں")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("Tap + to add a contact", "+ دبا کر رابطہ شامل کریں")}</p>
          </div>
        ) : (
          filtered.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4 rounded-2xl bg-card shadow-card flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
                <p className="text-xs text-muted-foreground">{contact.relationship}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => handleCall(contact)} className="min-h-touch min-w-touch rounded-xl bg-success/10 flex items-center justify-center" aria-label={`Call ${contact.name}`}>
                  <Phone className="w-5 h-5 text-success" />
                </button>
                <button onClick={() => handleMessage(contact)} className="min-h-touch min-w-touch rounded-xl bg-primary/10 flex items-center justify-center" aria-label={`Message ${contact.name}`}>
                  <MessageSquare className="w-5 h-5 text-primary" />
                </button>
                <button onClick={() => deleteContact(contact.id)} className="min-h-touch min-w-touch rounded-xl hover:bg-destructive/10 flex items-center justify-center" aria-label={`Delete ${contact.name}`}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactsPage;
