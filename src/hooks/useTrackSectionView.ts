import { useEffect, useRef } from "react";
import { hasAnalyticsConsent, trackEvent, type AnalyticsParams } from "@/lib/analytics";

export function useTrackSectionView(event: string, params: AnalyticsParams) {
  const targetRef = useRef<HTMLHeadingElement>(null);
  const latest = useRef({ event, params });
  latest.current = { event, params };

  useEffect(() => {
    const target = targetRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    let visible = false;
    let tracked = false;
    const recordView = () => {
      if (tracked || !visible || document.visibilityState === "hidden" || !hasAnalyticsConsent()) return;
      tracked = trackEvent(latest.current.event, latest.current.params);
      if (tracked) observer.disconnect();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      recordView();
    }, { threshold: 0.5 });
    observer.observe(target);
    window.addEventListener("cuidde-cookie-consent", recordView);
    document.addEventListener("visibilitychange", recordView);
    return () => {
      observer.disconnect();
      window.removeEventListener("cuidde-cookie-consent", recordView);
      document.removeEventListener("visibilitychange", recordView);
    };
  }, []);

  return targetRef;
}
