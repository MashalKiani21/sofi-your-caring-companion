/// <reference types="google.maps" />
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { ArrowLeft, MapPin, Mic, MicOff, Search, Navigation, Clock, Volume2, LocateFixed } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const NavigationPage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  usePageAnnounce("Navigation", "نقشہ جات");

  const [destination, setDestination] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

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

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    if (document.getElementById("google-maps-script")) return;

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      // cleanup not needed for script tags
    };
  }, []);

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to Lahore
          setCurrentLocation({ lat: 31.5204, lng: 74.3587 });
          speak(t("Could not get your location. Using default location.", "آپ کا مقام نہیں مل سکا۔ ڈیفالٹ مقام استعمال ہو رہا ہے۔"));
        }
      );
    }
  }, []);

  // Init map when location is available
  useEffect(() => {
    if (currentLocation && window.google?.maps && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
  }, [currentLocation]);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps || !currentLocation) return;

    const map = new google.maps.Map(mapRef.current, {
      center: currentLocation,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "simplified" }] },
      ],
    });

    mapInstanceRef.current = map;

    // Add current location marker
    new google.maps.Marker({
      position: currentLocation,
      map,
      title: t("You are here", "آپ یہاں ہیں"),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#2563EB",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
    });

    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: { strokeColor: "#2563EB", strokeWeight: 5 },
    });
  }, [currentLocation]);

  const handleSearch = useCallback(() => {
    if (!destination.trim()) return;
    if (!GOOGLE_MAPS_API_KEY) {
      speak(t(
        "Google Maps is not configured. Please add your API key.",
        "Google Maps ترتیب نہیں دیا گیا۔ براہ کرم اپنی API کلید شامل کریں۔"
      ));
      toast.error(t("Google Maps API key not configured", "Google Maps API کلید ترتیب نہیں دی گئی"));
      return;
    }

    if (!window.google?.maps || !currentLocation) {
      speak(t("Map is still loading. Please wait.", "نقشہ ابھی لوڈ ہو رہا ہے۔ براہ کرم انتظار کریں۔"));
      return;
    }

    speak(t(`Finding route to ${destination}`, `${destination} تک راستہ تلاش کر رہے ہیں`));

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setIsNavigating(true);
          setCurrentStepIndex(0);
          directionsRendererRef.current?.setDirections(result);

          const route = result.routes[0];
          if (route?.legs[0]) {
            const leg = route.legs[0];
            const announcement = t(
              `Route found. ${leg.distance?.text} away, about ${leg.duration?.text}. ${leg.steps[0]?.instructions?.replace(/<[^>]*>/g, "") || ""}`,
              `راستہ مل گیا۔ ${leg.distance?.text} دور، تقریباً ${leg.duration?.text}۔`
            );
            speak(announcement);
          }
        } else {
          speak(t("Could not find a route. Try a different destination.", "راستہ نہیں مل سکا۔ مختلف منزل آزمائیں۔"));
          toast.error(t("Route not found", "راستہ نہیں ملا"));
        }
      }
    );
  }, [destination, currentLocation, speak, t]);

  // Voice-guided turn-by-turn: announce next step
  const announceStep = (index: number) => {
    if (!directions?.routes[0]?.legs[0]?.steps[index]) return;
    const step = directions.routes[0].legs[0].steps[index];
    const instruction = step.instructions?.replace(/<[^>]*>/g, "") || "";
    const distance = step.distance?.text || "";
    speak(t(
      `${instruction}. ${distance}.`,
      `${instruction}. ${distance}.`
    ));
  };

  const nextStep = () => {
    const steps = directions?.routes[0]?.legs[0]?.steps;
    if (!steps) return;
    const next = currentStepIndex + 1;
    if (next < steps.length) {
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

  const currentStep = directions?.routes[0]?.legs[0]?.steps[currentStepIndex];
  const totalSteps = directions?.routes[0]?.legs[0]?.steps?.length || 0;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20" role="main" aria-label={t("Navigation page", "نقشہ جات صفحہ")}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border" role="banner">
        <button
          onClick={() => { setIsNavigating(false); navigate("/home"); }}
          className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary"
          aria-label={t("Go back to home", "ہوم پر واپس جائیں")}
        >
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
              aria-label={t("Destination search", "منزل تلاش کریں")}
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
        {GOOGLE_MAPS_API_KEY ? (
          <div
            ref={mapRef}
            className="w-full aspect-[4/3] rounded-3xl overflow-hidden border border-border"
            aria-label={t("Interactive map", "انٹرایکٹو نقشہ")}
          />
        ) : (
          <div className="w-full aspect-[4/3] rounded-3xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
            <MapPin className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm text-center px-8">
              {t("Add your Google Maps API key to enable the map", "نقشہ فعال کرنے کے لیے اپنی Google Maps API کلید شامل کریں")}
            </p>
          </div>
        )}

        {/* Turn-by-turn directions panel */}
        {isNavigating && currentStep && (
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
                {t(`Step ${currentStepIndex + 1} of ${totalSteps}`, `مرحلہ ${currentStepIndex + 1} از ${totalSteps}`)}
              </span>
              <button
                onClick={() => announceStep(currentStepIndex)}
                className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary"
                aria-label={t("Repeat current instruction", "موجودہ ہدایت دہرائیں")}
              >
                <Volume2 className="w-5 h-5 text-primary" />
              </button>
            </div>

            <p
              className="text-foreground font-semibold"
              dangerouslySetInnerHTML={{ __html: currentStep.instructions || "" }}
            />
            <p className="text-sm text-muted-foreground">
              {currentStep.distance?.text} · {currentStep.duration?.text}
            </p>

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
                aria-label={t("Next step", "اگلا مرحلہ")}
              >
                {currentStepIndex === totalSteps - 1 ? t("Finish", "مکمل") : t("Next", "اگلا")}
              </button>
            </div>
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
