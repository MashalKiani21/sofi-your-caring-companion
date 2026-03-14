import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { ArrowLeft, Send, Mic, Search } from "lucide-react";
import { motion } from "framer-motion";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  platform: "sms" | "whatsapp";
}

const mockConversations: Conversation[] = [
  { id: "1", name: "Ahmed (Son)", lastMessage: "Are you okay, Ammi?", time: "2 min", unread: 1, platform: "whatsapp" },
  { id: "2", name: "Dr. Fatima", lastMessage: "Your appointment is confirmed.", time: "1 hr", unread: 0, platform: "sms" },
  { id: "3", name: "Sara (Daughter)", lastMessage: "I'll visit tomorrow InshaAllah", time: "3 hr", unread: 2, platform: "whatsapp" },
  { id: "4", name: "Khalid", lastMessage: "Do you need anything from the store?", time: "5 hr", unread: 0, platform: "sms" },
];

const MessagesPage = () => {
  const navigate = useNavigate();
  const { t } = useAccessibility();
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  const filtered = mockConversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (activeChat) {
    const conv = mockConversations.find(c => c.id === activeChat);
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setActiveChat(null)} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="font-semibold text-foreground">{conv?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{conv?.platform}</p>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-muted-foreground text-center">
            {t("Messages will appear here when connected to your phone's messaging apps.", 
               "آپ کے فون کی میسجنگ ایپس سے جوڑنے پر پیغامات یہاں ظاہر ہوں گے۔")}
          </p>
        </div>

        <div className="border-t border-border px-4 py-3 bg-card">
          <div className="flex items-center gap-2">
            <button className="min-h-touch min-w-touch rounded-2xl bg-secondary text-foreground flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("Type a message...", "پیغام لکھیں...")}
              className="flex-1 min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="min-h-touch min-w-touch rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/companion")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("Messages", "پیغامات")}</h1>
      </header>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search messages...", "پیغامات تلاش کریں...")}
            className="w-full min-h-touch pl-11 pr-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {filtered.map((conv, i) => (
          <motion.button
            key={conv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setActiveChat(conv.id)}
            className="w-full p-4 rounded-2xl bg-card shadow-card flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
              <span className="text-lg font-bold text-primary">{conv.name[0]}</span>
              {conv.unread > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emergency text-emergency-foreground text-xs font-bold flex items-center justify-center">
                  {conv.unread}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className="font-semibold text-foreground truncate">{conv.name}</p>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{conv.time}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
            </div>
            <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              conv.platform === "whatsapp" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
            }`}>
              {conv.platform === "whatsapp" ? "WA" : "SMS"}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MessagesPage;
