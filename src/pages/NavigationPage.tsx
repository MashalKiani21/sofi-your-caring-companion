import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { useVoiceContext } from "@/contexts/VoiceContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Search, Navigation, Clock, Volume2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface NavHistoryItem {
  id: string;
  destination_name: string;
  destination_address: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

const NavigationPage = () => {
  const nav = useNavigate();
  const { t, speak, language } = useAccessibility();
  const { user } = useAuth();
  usePageAnnounce("Navigation", "نقشہ جات");

  const [destination, setDestination] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [routeSummary, setRouteSummary] = useState<{ distance: string; duration: string } | null>(null);
  const [recentDestinations, setRecentDestinations] = useState<NavHistoryItem[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const { registerPageHandler, isListening } = useVoiceContext();

  // Load navigation history from DB
  useEffect(() => {
    if (user) {
      supabase
        .from("navigation_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) setRecentDestinations(data as NavHistoryItem[]);
        });
    }
  }, [user]);

  useEffect(() => {
    const unregister = registerPageHandler((text: string) => {
      const dest = text.replace(/(?:navigate|go|directions|take me)\s+(?:to|for)?\s*/i, "").trim();
      if (dest) {
        setDestination(dest);
        speak(t(`Searching for ${dest}`, `${dest} تلاش کر رہے ہیں`));
      }
      return true;
    });
    return unregister;
  }, [registerPageHandler, speak, t]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {
          setCurrentLocation([31.5204, 74.3587]);
          speak(t("Could not get your location. Using default.", "آپ کا مقام نہیں مل سکا۔"));
        }
      );
    } else {
      setCurrentLocation([31.5204, 74.3587]);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !currentLocation || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { center: currentLocation, zoom: 14, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const currentIcon = L.divIcon({
      html: '<div style="width:20px;height:20px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 8px rgba(37,99,235,0.5);"></div>',
      iconSize: [20, 20], iconAnchor: [10, 10], className: "",
    });
    L.marker(currentLocation, { icon: currentIcon }).addTo(map).bindPopup(t("You are here", "آپ یہاں ہیں"));
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [currentLocation]);

  const geocode = async (query: string): Promise<{ coords: [number, number]; address: string } | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) return { coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)], address: data[0].display_name };
      return null;
    } catch { return null; }
  };

  const getRoute = async (from: [number, number], to: [number, number]) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`);
      const data = await res.json();
      return data.code === "Ok" && data.routes.length > 0 ? data.routes[0] : null;
    } catch { return null; }
  };

  const formatDistance = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const formatDuration = (s: number) => { const mins = Math.round(s / 60); return mins >= 60 ? `${Math.floor(mins / 60)} hr ${mins % 60} min` : `${mins} min`; };

  const maneuverToText = (maneuver: any): string => {
    const type = maneuver?.type || "";
    const modifier = maneuver?.modifier || "";
    const directions: Record<string, string> = {
      "turn-left": t("Turn left", "بائیں مڑیں"), "turn-right": t("Turn right", "دائیں مڑیں"),
      "continue-": t("Continue straight", "سیدھا جاری رکھیں"), "depart-": t("Start driving", "چلنا شروع کریں"),
      "arrive-": t("You have arrived", "آپ پہنچ گئے"), "roundabout-": t("Enter roundabout", "گول چکر میں داخل ہوں"),
    };
    return directions[`${type}-${modifier}`] || directions[`${type}-`] || `${type} ${modifier}`.trim();
  };

  const saveToHistory = async (name: string, address: string, coords: [number, number]) => {
    if (!user) return;
    await supabase.from("navigation_history").insert({
      user_id: user.id,
      destination_name: name,
      destination_address: address,
      lat: coords[0],
      lng: coords[1],
    });
    const { data } = await supabase.from("navigation_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    if (data) setRecentDestinations(data as NavHistoryItem[]);
  };

  const handleSearch = async () => {
    if (!destination.trim() || !currentLocation) return;
    speak(t(`Finding route to ${destination}`, `${destination} تک راستہ تلاش کر رہے ہیں`));

    // Check recent first
    const recent = recentDestinations.find(d => d.destination_name.toLowerCase() === destination.toLowerCase());
    let destCoords: [number, number] | null = recent ? [recent.lat, recent.lng] : null;
    let destAddress = recent?.destination_address || "";

    if (!destCoords) {
      const result = await geocode(destination);
      if (!result) {
        speak(t("Could not find that location.", "وہ مقام نہیں مل سکا۔"));
        toast.error(t("Location not found", "مقام نہیں ملا"));
        return;
      }
      destCoords = result.coords;
      destAddress = result.address;
    }

    const route = await getRoute(currentLocation, destCoords);
    if (!route) {
      speak(t("Could not find a route.", "راستہ نہیں مل سکا۔"));
      toast.error(t("Route not found", "راستہ نہیں ملا"));
      return;
    }

    // Save to history
    await saveToHistory(destination, destAddress, destCoords);

    // Draw route
    if (routeLayerRef.current && mapInstanceRef.current) {
      routeLayerRef.current.clearLayers();
      const routeLine = L.geoJSON(route.geometry, { style: { color: "#2563EB", weight: 5, opacity: 0.8 } });
      routeLayerRef.current.addLayer(routeLine);
      const destIcon = L.divIcon({
        html: '<div style="width:24px;height:24px;border-radius:50%;background:#DC2626;border:3px solid #fff;box-shadow:0 0 8px rgba(220,38,38,0.5);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:50%;background:#fff;"></div></div>',
        iconSize: [24, 24], iconAnchor: [12, 12], className: "",
      });
      L.marker(destCoords, { icon: destIcon }).addTo(routeLayerRef.current);
      mapInstanceRef.current.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    }

    const leg = route.legs[0];
    const steps = leg.steps.map((s: any) => ({
      instruction: maneuverToText(s.maneuver),
      streetName: s.name || "",
      distance: formatDistance(s.distance),
      duration: formatDuration(s.duration),
    }));

    setRouteSteps(steps);
    setRouteSummary({ distance: formatDistance(route.distance), duration: formatDuration(route.duration) });
    setCurrentStepIndex(0);
    setIsNavigating(true);

    speak(t(
      `Route found. ${formatDistance(route.distance)} away, about ${formatDuration(route.duration)}. ${steps[0]?.instruction || ""}.`,
      `راستہ مل گیا۔ ${formatDistance(route.distance)} دور۔ ${steps[0]?.instruction || ""}۔`
    ));
  };

  const announceStep = (i: number) => {
    const step = routeSteps[i];
    if (!step) return;
    speak(step.streetName ? `${step.instruction} ${t("on", "پر")} ${step.streetName}. ${step.distance}.` : `${step.instruction}. ${step.distance}.`);
  };

  const nextStep = () => {
    const next = currentStepIndex + 1;
    if (next < routeSteps.length) { setCurrentStepIndex(next); announceStep(next); }
    else { speak(t("You have arrived!", "آپ پہنچ گئے!")); setIsNavigating(false); }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) { setCurrentStepIndex(currentStepIndex - 1); announceStep(currentStepIndex - 1); }
  };

  const stopNavigation = () => {
    setIsNavigating(false); setRouteSteps([]); setRouteSummary(null);
    routeLayerRef.current?.clearLayers();
    speak(t("Navigation stopped.", "نیویگیشن رک گئی۔"));
  };

  const deleteHistory = async (id: string) => {
    await supabase.from("navigation_history").delete().eq("id", id);
    setRecentDestinations(r => r.filter(x => x.id !== id));
  };

  const currentStepData = routeSteps[currentStepIndex];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20" role="main">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => { stopNavigation(); nav("/home"); }} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("Navigation", "نقشہ جات")}</h1>
        {isNavigating && routeSummary && (
          <span className="ml-auto text-xs text-muted-foreground">{routeSummary.distance} · {routeSummary.duration}</span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("Where do you want to go?", "آپ کہاں جانا چاہتے ہیں؟")}
              className="w-full min-h-touch pl-12 pr-4 rounded-2xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir={language === "ur" ? "rtl" : "ltr"} />
          </div>
          {isListening && <span className="text-xs text-primary font-medium self-center">{t("Speak...", "بولیں...")}</span>}
        </div>

        {destination.trim() && !isNavigating && (
          <button onClick={handleSearch} className="w-full min-h-touch rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
            <Navigation className="w-5 h-5" /> {t("Get Directions", "راستہ دکھائیں")}
          </button>
        )}

        <div ref={mapRef} className="w-full aspect-[4/3] rounded-3xl overflow-hidden border border-border z-0" />

        {isNavigating && currentStepData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3" aria-live="polite">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t(`Step ${currentStepIndex + 1} of ${routeSteps.length}`, `مرحلہ ${currentStepIndex + 1} از ${routeSteps.length}`)}
              </span>
              <button onClick={() => announceStep(currentStepIndex)} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
                <Volume2 className="w-5 h-5 text-primary" />
              </button>
            </div>
            <div>
              <p className="text-foreground font-semibold text-lg">{currentStepData.instruction}</p>
              {currentStepData.streetName && <p className="text-sm text-muted-foreground mt-1">{t("on", "پر")} {currentStepData.streetName}</p>}
              <p className="text-sm text-muted-foreground mt-1">{currentStepData.distance} · {currentStepData.duration}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={prevStep} disabled={currentStepIndex === 0} className="flex-1 min-h-touch rounded-2xl border border-border font-semibold text-foreground flex items-center justify-center disabled:opacity-30">
                {t("Previous", "پچھلا")}
              </button>
              <button onClick={nextStep} className="flex-1 min-h-touch rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center">
                {currentStepIndex === routeSteps.length - 1 ? t("Finish", "مکمل") : t("Next", "اگلا")}
              </button>
            </div>
            <button onClick={stopNavigation} className="w-full min-h-touch rounded-2xl border border-emergency text-emergency font-semibold flex items-center justify-center">
              {t("Stop Navigation", "نیویگیشن بند کریں")}
            </button>
          </motion.div>
        )}

        {!isNavigating && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {t("Recent", "حالیہ")}
            </h2>
            <div className="space-y-2">
              {recentDestinations.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("No recent destinations", "کوئی حالیہ منزل نہیں")}</p>
              )}
              {recentDestinations.map((dest, i) => (
                <motion.div key={dest.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                  <button onClick={() => { setDestination(dest.destination_name); speak(dest.destination_name); }}
                    className="flex-1 flex items-center gap-3 text-left">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{dest.destination_name}</p>
                      {dest.destination_address && <p className="text-xs text-muted-foreground truncate">{dest.destination_address}</p>}
                    </div>
                  </button>
                  <button onClick={() => deleteHistory(dest.id)} className="p-2 rounded-lg hover:bg-destructive/10 shrink-0">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationPage;
