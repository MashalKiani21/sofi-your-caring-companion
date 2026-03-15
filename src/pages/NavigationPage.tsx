import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { ArrowLeft, MapPin, Mic, MicOff, Search, Navigation, Clock } from "lucide-react";
import { motion } from "framer-motion";

const NavigationPage = () => {
  const navigate = useNavigate();
  const { t, speak, language } = useAccessibility();
  const [destination, setDestination] = useState("");
  const [recentDestinations] = useState([
    { name: t("City Hospital", "شہر ہسپتال"), address: "Main Boulevard, Lahore" },
    { name: t("Central Pharmacy", "مرکزی فارمیسی"), address: "Mall Road, Lahore" },
    { name: t("Home", "گھر"), address: "House 42, Block C, DHA" },
  ]);

  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({
    language,
    onResult: (text) => {
      setDestination(text);
      speak(t(`Searching for ${text}`, `${text} تلاش کر رہے ہیں`));
    },
  });

  const handleSearch = () => {
    if (!destination.trim()) return;
    speak(t(`Finding route to ${destination}`, `${destination} تک راستہ تلاش کر رہے ہیں`));
    // TODO: Integrate with Google Maps API or Mapbox for real navigation
    // Use Capacitor Geolocation plugin for current location
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/home")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("Navigation", "نقشہ جات")}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("Where do you want to go?", "آپ کہاں جانا چاہتے ہیں؟")}
              className="w-full min-h-touch pl-12 pr-4 rounded-2xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir={language === "ur" ? "rtl" : "ltr"}
            />
          </div>
          <button
            onClick={() => isListening ? stopListening() : startListening()}
            disabled={!isSupported}
            className={`min-h-touch min-w-touch rounded-2xl flex items-center justify-center transition-colors ${
              isListening ? "bg-emergency text-emergency-foreground animate-pulse" : "bg-secondary text-foreground"
            } disabled:opacity-30`}
            aria-label={t("Voice search", "آواز تلاش")}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {destination.trim() && (
          <button
            onClick={handleSearch}
            className="w-full min-h-touch rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
          >
            <Navigation className="w-5 h-5" />
            {t("Get Directions", "راستہ دکھائیں")}
          </button>
        )}

        {/* Map Placeholder */}
        <div className="w-full aspect-[4/3] rounded-3xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
          <MapPin className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm text-center px-8">
            {t("Map will appear here when integrated with Google Maps or Mapbox API", "نقشہ یہاں دکھایا جائے گا جب Google Maps یا Mapbox API شامل کیا جائے گا")}
          </p>
          {/* TODO: Integrate Google Maps SDK or Mapbox GL JS */}
          {/* For Capacitor: use @capacitor/geolocation for current position */}
          {/* Example: import { Geolocation } from '@capacitor/geolocation'; */}
        </div>

        {/* Recent Destinations */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t("Recent", "حالیہ")}
          </h2>
          <div className="space-y-2">
            {recentDestinations.map((dest, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setDestination(dest.name);
                  speak(dest.name);
                }}
                className="w-full p-4 rounded-2xl bg-card border border-border text-left flex items-center gap-4 hover:bg-secondary/50 transition-colors"
              >
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{dest.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{dest.address}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationPage;
