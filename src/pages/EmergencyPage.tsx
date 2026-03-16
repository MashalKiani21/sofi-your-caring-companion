import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldAlert, Phone, MapPin, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface EmergencyContactItem {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

const EmergencyPage = () => {
  const navigate = useNavigate();
  const { t, speak } = useAccessibility();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContactItem[]>([]);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [alertsSent, setAlertsSent] = useState<string[]>([]);
  const [location, setLocation] = useState<string>("Fetching location...");

  useEffect(() => {
    if (user) fetchContacts();
    // Try to get location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => setLocation(t("Location unavailable", "مقام دستیاب نہیں"))
      );
    } else {
      setLocation(t("GPS not supported", "GPS دستیاب نہیں"));
    }
  }, [user]);

  const fetchContacts = async () => {
    const { data } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user!.id)
      .limit(5);
    if (data) setContacts(data);
  };

  const triggerSOS = () => {
    setIsEmergencyActive(true);
    setCountdown(5);
    speak(t("Emergency activated. Sending alerts in 5 seconds. Tap cancel to abort.", "ایمرجنسی فعال۔ 5 سیکنڈ میں الرٹ بھیجے جائیں گے۔ منسوخ کرنے کے لیے ٹیپ کریں۔"));
  };

  useEffect(() => {
    if (!isEmergencyActive || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isEmergencyActive, countdown]);

  useEffect(() => {
    if (isEmergencyActive && countdown === 0) {
      sendAlerts();
    }
  }, [countdown, isEmergencyActive]);

  const sendAlerts = async () => {
    speak(t("Sending emergency alerts now!", "ایمرجنسی الرٹ بھیج رہے ہیں!"));

    // Log emergency event
    if (user) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "Emergency SOS triggered",
        category: "emergency",
        metadata: { location, contacts_notified: contacts.length },
      });
    }

    // Simulate sending alerts to each contact
    for (const contact of contacts) {
      await new Promise(r => setTimeout(r, 500));
      setAlertsSent(prev => [...prev, contact.id]);
      // TODO: Integrate with SMS API (Twilio) or Capacitor SMS plugin
      // to actually send: `sms.send({ to: contact.phone, message: "Emergency! Location: " + location })`
    }

    toast.success(t("All emergency contacts notified!", "تمام ایمرجنسی رابطوں کو مطلع کر دیا گیا!"));
  };

  const cancelEmergency = () => {
    setIsEmergencyActive(false);
    setCountdown(5);
    setAlertsSent([]);
    speak(t("Emergency cancelled.", "ایمرجنسی منسوخ۔"));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/home")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("Emergency SOS", "ایمرجنسی SOS")}</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <AnimatePresence mode="wait">
          {!isEmergencyActive ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 w-full">
              <p className="text-center text-muted-foreground max-w-xs">
                {t("Press the SOS button to alert your emergency contacts with your location.", "SOS بٹن دبائیں تاکہ آپ کے ایمرجنسی رابطوں کو آپ کے مقام کے ساتھ مطلع کیا جائے۔")}
              </p>

              <button
                onClick={triggerSOS}
                className="w-40 h-40 rounded-full bg-emergency text-emergency-foreground flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                aria-label="Activate SOS"
              >
                <div className="flex flex-col items-center gap-2">
                  <ShieldAlert className="w-14 h-14" />
                  <span className="text-2xl font-bold">SOS</span>
                </div>
              </button>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>

              {/* Emergency contacts list */}
              <div className="w-full max-w-sm space-y-2">
                <p className="text-sm font-semibold text-foreground">{t("Emergency Contacts", "ایمرجنسی رابطے")} ({contacts.length}/5)</p>
                {contacts.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("No contacts added. Go to Contacts to add.", "کوئی رابطہ نہیں۔ رابطے میں جا کر شامل کریں۔")}</p>
                )}
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="active" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6 w-full">
              {countdown > 0 ? (
                <>
                  <div className="w-32 h-32 rounded-full bg-emergency/20 flex items-center justify-center animate-pulse">
                    <span className="text-6xl font-bold text-emergency">{countdown}</span>
                  </div>
                  <p className="text-lg font-semibold text-emergency text-center">
                    {t("Sending alerts in...", "الرٹ بھیجے جائیں گے...")}
                  </p>
                  <button
                    onClick={cancelEmergency}
                    className="min-h-touch px-8 py-3 rounded-2xl bg-secondary text-foreground font-semibold flex items-center gap-2"
                  >
                    <X className="w-5 h-5" /> {t("Cancel", "منسوخ")}
                  </button>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-16 h-16 text-emergency" />
                  <p className="text-lg font-bold text-emergency">{t("Emergency Active", "ایمرجنسی فعال")}</p>
                  <div className="w-full max-w-sm space-y-2">
                    {contacts.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                        {alertsSent.includes(c.id) ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground animate-spin" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {alertsSent.includes(c.id) ? t("Notified", "مطلع") : t("Sending...", "بھیج رہے...")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={cancelEmergency}
                    className="mt-4 min-h-touch px-8 py-3 rounded-2xl bg-card border border-border text-foreground font-semibold"
                  >
                    {t("End Emergency", "ایمرجنسی ختم")}
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmergencyPage;
