import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { useVoiceContext } from "@/contexts/VoiceContext";
import { ArrowLeft, MapPin, Search, Navigation, Clock, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const NavigationPage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  usePageAnnounce("Navigation", "نقشہ جات");

  const [destination, setDestination] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [routeSummary, setRouteSummary] = useState<{ distance: string; duration: string } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [recentDestinations] = useState([
    { name: t("City Hospital", "شہر ہسپتال"), address: "Main Boulevard, Lahore", coords: [31.5204, 74.3587] as [number, number] },
    { name: t("Central Pharmacy", "مرکزی فارمیسی"), address: "Mall Road, Lahore", coords: [31.5497, 74.3436] as [number, number] },
    { name: t("Home", "گھر"), address: "House 42, Block C, DHA", coords: [31.4697, 74.4078] as [number, number] },
  ]);

  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({
    language,
    onResult: (text) => {
      setDestination(text);
      speak(t(`Searching for ${text}`, `${text} تلاش کر رہے ہیں`));
    },
  });

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {
          setCurrentLocation([31.5204, 74.3587]); // Lahore fallback
          speak(t("Could not get your location. Using default.", "آپ کا مقام نہیں مل سکا۔ ڈیفالٹ استعمال ہو رہا ہے۔"));
        }
      );
    } else {
      setCurrentLocation([31.5204, 74.3587]);
    }
  }, []);

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || !currentLocation || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: currentLocation,
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Current location marker
    const currentIcon = L.divIcon({
      html: '<div style="width:20px;height:20px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 8px rgba(37,99,235,0.5);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      className: "",
    });

    L.marker(currentLocation, { icon: currentIcon })
      .addTo(map)
      .bindPopup(t("You are here", "آپ یہاں ہیں"));

    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Fix Leaflet resize issue
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [currentLocation]);

  // Geocode destination text to coordinates using Nominatim
  const geocode = async (query: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch {
      return null;
    }
  };

  // Get route using OSRM (free routing engine)
  const getRoute = async (from: [number, number], to: [number, number]) => {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`
      );
      const data = await res.json();
      if (data.code === "Ok" && data.routes.length > 0) {
        return data.routes[0];
      }
      return null;
    } catch {
      return null;
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
    return `${mins} min`;
  };

  const maneuverToText = (maneuver: any): string => {
    const type = maneuver?.type || "";
    const modifier = maneuver?.modifier || "";
    const name = maneuver?.exit ? `exit ${maneuver.exit}` : "";

    const directions: Record<string, string> = {
      "turn-left": t("Turn left", "بائیں مڑیں"),
      "turn-right": t("Turn right", "دائیں مڑیں"),
      "turn-slight left": t("Slight left", "ہلکا بایاں"),
      "turn-slight right": t("Slight right", "ہلکا دایاں"),
      "turn-sharp left": t("Sharp left", "تیز بایاں"),
      "turn-sharp right": t("Sharp right", "تیز دایاں"),
      "continue-": t("Continue straight", "سیدھا جاری رکھیں"),
      "depart-": t("Start driving", "چلنا شروع کریں"),
      "arrive-": t("You have arrived", "آپ پہنچ گئے"),
      "roundabout-": t("Enter roundabout", "گول چکر میں داخل ہوں"),
      "merge-": t("Merge", "شامل ہوں"),
      "fork-left": t("Keep left at fork", "کانٹے پر بائیں رہیں"),
      "fork-right": t("Keep right at fork", "کانٹے پر دائیں رہیں"),
    };

    const key = `${type}-${modifier}`;
    return directions[key] || directions[`${type}-`] || `${type} ${modifier}`.trim();
  };

  const handleSearch = async () => {
    if (!destination.trim() || !currentLocation) return;

    speak(t(`Finding route to ${destination}`, `${destination} تک راستہ تلاش کر رہے ہیں`));

    // Check recent destinations first
    const recent = recentDestinations.find(
      (d) => d.name.toLowerCase() === destination.toLowerCase()
    );
    const destCoords = recent?.coords || (await geocode(destination));

    if (!destCoords) {
      speak(t("Could not find that location. Try again.", "وہ مقام نہیں مل سکا۔ دوبارہ کوشش کریں۔"));
      toast.error(t("Location not found", "مقام نہیں ملا"));
      return;
    }

    const route = await getRoute(currentLocation, destCoords);
    if (!route) {
      speak(t("Could not find a route. Try a different destination.", "راستہ نہیں مل سکا۔ مختلف منزل آزمائیں۔"));
      toast.error(t("Route not found", "راستہ نہیں ملا"));
      return;
    }

    // Draw route on map
    if (routeLayerRef.current && mapInstanceRef.current) {
      routeLayerRef.current.clearLayers();

      const routeLine = L.geoJSON(route.geometry, {
        style: { color: "#2563EB", weight: 5, opacity: 0.8 },
      });
      routeLayerRef.current.addLayer(routeLine);

      // Destination marker
      const destIcon = L.divIcon({
        html: '<div style="width:24px;height:24px;border-radius:50%;background:#DC2626;border:3px solid #fff;box-shadow:0 0 8px rgba(220,38,38,0.5);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:50%;background:#fff;"></div></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: "",
      });
      L.marker(destCoords, { icon: destIcon }).addTo(routeLayerRef.current);

      mapInstanceRef.current.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    }

    // Parse steps
    const leg = route.legs[0];
    const steps = leg.steps.map((s: any) => ({
      instruction: maneuverToText(s.maneuver),
      streetName: s.name || "",
      distance: formatDistance(s.distance),
      duration: formatDuration(s.duration),
      rawDistance: s.distance,
    }));

    setRouteSteps(steps);
    setRouteSummary({
      distance: formatDistance(route.distance),
      duration: formatDuration(route.duration),
    });
    setCurrentStepIndex(0);
    setIsNavigating(true);

    // Announce route
    const announcement = t(
      `Route found. ${formatDistance(route.distance)} away, about ${formatDuration(route.duration)}. ${steps[0]?.instruction || ""} on ${steps[0]?.streetName || "the road"}.`,
      `راستہ مل گیا۔ ${formatDistance(route.distance)} دور، تقریباً ${formatDuration(route.duration)}۔ ${steps[0]?.instruction || ""}۔`
    );
    speak(announcement);
  };

  const announceStep = (index: number) => {
    const step = routeSteps[index];
    if (!step) return;
    const text = step.streetName
      ? `${step.instruction} ${t("on", "پر")} ${step.streetName}. ${step.distance}.`
      : `${step.instruction}. ${step.distance}.`;
    speak(text);
  };

  const nextStep = () => {
    const next = currentStepIndex + 1;
    if (next < routeSteps.length) {
      setCurrentStepIndex(next);
      announceStep(next);
    } else {
      speak(t("You have arrived at your destination!", "آپ اپنی منزل پر پہنچ گئے ہیں!"));
      setIsNavigating(false);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      announceStep(prev);
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setRouteSteps([]);
    setRouteSummary(null);
    routeLayerRef.current?.clearLayers();
    speak(t("Navigation stopped.", "نیویگیشن رک گئی۔"));
  };

  const currentStepData = routeSteps[currentStepIndex];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20" role="main" aria-label={t("Navigation page", "نقشہ جات صفحہ")}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border" role="banner">
        <button
          onClick={() => { stopNavigation(); navigate("/home"); }}
          className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary"
          aria-label={t("Go back to home", "ہوم پر واپس جائیں")}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("Navigation", "نقشہ جات")}</h1>
        {isNavigating && routeSummary && (
          <span className="ml-auto text-xs text-muted-foreground">
            {routeSummary.distance} · {routeSummary.duration}
          </span>
        )}
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
              aria-label={t("Destination search", "منزل تلاش کریں")}
            />
          </div>
          <button
            onClick={() => (isListening ? stopListening() : startListening())}
            disabled={!isSupported}
            className={`min-h-touch min-w-touch rounded-2xl flex items-center justify-center transition-colors ${
              isListening ? "bg-emergency text-emergency-foreground animate-pulse" : "bg-secondary text-foreground"
            } disabled:opacity-30`}
            aria-label={t("Voice search", "آواز تلاش")}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {destination.trim() && !isNavigating && (
          <button
            onClick={handleSearch}
            className="w-full min-h-touch rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
            aria-label={t("Get directions", "راستہ دکھائیں")}
          >
            <Navigation className="w-5 h-5" />
            {t("Get Directions", "راستہ دکھائیں")}
          </button>
        )}

        {/* Map */}
        <div
          ref={mapRef}
          className="w-full aspect-[4/3] rounded-3xl overflow-hidden border border-border z-0"
          aria-label={t("Interactive map", "انٹرایکٹو نقشہ")}
        />

        {/* Turn-by-turn panel */}
        {isNavigating && currentStepData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3"
            role="region"
            aria-label={t("Turn by turn directions", "موڑ بہ موڑ ہدایات")}
            aria-live="polite"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t(`Step ${currentStepIndex + 1} of ${routeSteps.length}`, `مرحلہ ${currentStepIndex + 1} از ${routeSteps.length}`)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => announceStep(currentStepIndex)}
                  className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary"
                  aria-label={t("Repeat instruction", "ہدایت دہرائیں")}
                >
                  <Volume2 className="w-5 h-5 text-primary" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-foreground font-semibold text-lg">{currentStepData.instruction}</p>
              {currentStepData.streetName && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t("on", "پر")} {currentStepData.streetName}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {currentStepData.distance} · {currentStepData.duration}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex-1 min-h-touch rounded-2xl border border-border font-semibold text-foreground flex items-center justify-center disabled:opacity-30"
                aria-label={t("Previous step", "پچھلا مرحلہ")}
              >
                {t("Previous", "پچھلا")}
              </button>
              <button
                onClick={nextStep}
                className="flex-1 min-h-touch rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center"
                aria-label={currentStepIndex === routeSteps.length - 1 ? t("Finish", "مکمل") : t("Next step", "اگلا مرحلہ")}
              >
                {currentStepIndex === routeSteps.length - 1 ? t("Finish", "مکمل") : t("Next", "اگلا")}
              </button>
            </div>

            <button
              onClick={stopNavigation}
              className="w-full min-h-touch rounded-2xl border border-emergency text-emergency font-semibold flex items-center justify-center"
              aria-label={t("Stop navigation", "نیویگیشن بند کریں")}
            >
              {t("Stop Navigation", "نیویگیشن بند کریں")}
            </button>
          </motion.div>
        )}

        {/* Recent Destinations */}
        {!isNavigating && (
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
                  aria-label={`${dest.name}, ${dest.address}`}
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
        )}
      </div>
    </div>
  );
};

export default NavigationPage;
