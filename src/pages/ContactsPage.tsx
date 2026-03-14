import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { ArrowLeft, Phone, MessageSquare, Search, Plus, User } from "lucide-react";
import { motion } from "framer-motion";

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

const mockContacts: Contact[] = [
  { id: "1", name: "Ahmed (Son)", phone: "+92 300 1234567", relationship: "Son" },
  { id: "2", name: "Dr. Fatima", phone: "+92 321 7654321", relationship: "Doctor" },
  { id: "3", name: "Khalid (Neighbor)", phone: "+92 333 9876543", relationship: "Neighbor" },
  { id: "4", name: "Sara (Daughter)", phone: "+92 312 4567890", relationship: "Daughter" },
  { id: "5", name: "Rescue 1122", phone: "1122", relationship: "Emergency" },
];

const ContactsPage = () => {
  const navigate = useNavigate();
  const { t } = useAccessibility();
  const [search, setSearch] = useState("");
  const filtered = mockContacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/companion")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("Contacts", "رابطے")}</h1>
        </div>
        <button className="min-h-touch min-w-touch flex items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search contacts...", "رابطے تلاش کریں...")}
            className="w-full min-h-touch pl-11 pr-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {filtered.map((contact, i) => (
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
            <div className="flex gap-2">
              <button className="min-h-touch min-w-touch rounded-xl bg-success/10 flex items-center justify-center" aria-label={`Call ${contact.name}`}>
                <Phone className="w-5 h-5 text-success" />
              </button>
              <button className="min-h-touch min-w-touch rounded-xl bg-primary/10 flex items-center justify-center" aria-label={`Message ${contact.name}`}>
                <MessageSquare className="w-5 h-5 text-primary" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ContactsPage;
