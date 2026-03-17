/**
 * usePageAnnounce - Announces page name aloud for visually impaired users
 * when navigating between pages. Uses the AccessibilityContext's speak function.
 */
import { useEffect } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export const usePageAnnounce = (pageNameEn: string, pageNameUr: string) => {
  const { t, speak, disabilityType } = useAccessibility();

  useEffect(() => {
    // Auto-read page name for visually impaired users or voice-only mode
    if (disabilityType === "visual" || disabilityType === "multiple") {
      const announcement = t(
        `Now on ${pageNameEn} page`,
        `اب ${pageNameUr} صفحے پر ہیں`
      );
      // Small delay to let the page render first
      const timer = setTimeout(() => speak(announcement), 300);
      return () => clearTimeout(timer);
    }
  }, [pageNameEn]); // Only run on mount / page change
};
