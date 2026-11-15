import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { hasAnalyticsConsent } from "@/lib/analytics";
import { trackVerifiedPurchase, type VerifiedPurchase } from "@/lib/purchase-analytics";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

export function useCheckoutPurchase(userId: string | undefined, sessionId: string | null, subscriptionActive: boolean) {
  const [consented, setConsented] = useState(hasAnalyticsConsent);
  useEffect(() => {
    const updateConsent = () => setConsented(hasAnalyticsConsent());
    window.addEventListener("cuidde-cookie-consent", updateConsent);
    return () => window.removeEventListener("cuidde-cookie-consent", updateConsent);
  }, []);
  const { data } = useQuery({
    queryKey: queryKeys.checkoutPurchase(userId ?? "", sessionId ?? ""),
    enabled: !!userId && !!sessionId && subscriptionActive && consented,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("checkout-analytics", { body: { session_id: sessionId } });
      if (error || data?.error) throw new Error("Purchase verification unavailable");
      return data as { purchase: VerifiedPurchase | null };
    },
    retry: 1,
    staleTime: Infinity,
  });
  useEffect(() => {
    if (consented && data?.purchase) trackVerifiedPurchase(data.purchase);
  }, [consented, data]);
}
