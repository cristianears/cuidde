import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { geocodeAddress, geocodeByCity } from "@/lib/geocode";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";
import type { FamilyJobCareType, FamilyJobPost } from "@/types/database";

export type FamilyJobPostPayload = {
  is_active: boolean;
  use_profile_address: boolean;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  care_type: FamilyJobCareType | null;
  schedule_days: string[];
  schedule_periods: string[];
  specific_schedule: string;
  activities: string[];
  requirements: string[];
  notes: string;
};

export function useFamilyJobPost() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.familyJobPost(user?.id ?? ""),
    queryFn: async (): Promise<FamilyJobPost | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("family_job_posts")
        .select("*")
        .eq("family_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as FamilyJobPost | null;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useUpdateFamilyJobPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FamilyJobPostPayload) => {
      if (!user) throw new Error("Não autenticado");

      const state = payload.state.trim().toUpperCase().slice(0, 2);
      const cep = payload.cep.replace(/\D/g, "");

      const { error } = await supabase
        .from("family_job_posts")
        .upsert({
          family_id: user.id,
          is_active: payload.is_active,
          use_profile_address: payload.use_profile_address,
          cep: cep || null,
          street: payload.street.trim() || null,
          number: payload.number.trim() || null,
          complement: payload.complement.trim() || null,
          neighborhood: payload.neighborhood.trim() || null,
          city: payload.city.trim() || null,
          state: state || null,
          care_type: payload.care_type,
          schedule_days: payload.schedule_days,
          schedule_periods: payload.schedule_periods,
          specific_schedule: payload.specific_schedule.trim() || null,
          activities: payload.activities,
          requirements: payload.requirements,
          notes: payload.notes.trim() || null,
        });

      if (error) throw error;

      try {
        let geo = cep ? await geocodeAddress({ cep }) : null;
        if (!geo && payload.city.trim() && state) {
          geo = await geocodeByCity(payload.city.trim(), state);
        }
        if (geo) {
          await supabase
            .from("family_job_posts")
            .update({ lat: geo.lat, lng: geo.lng })
            .eq("family_id", user.id);
        }
      } catch {
        // Geocodificação é best-effort e não deve bloquear o cadastro da necessidade.
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.familyJobPost(user!.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.familyMatches(user!.id, 3) });
      toast.success("Necessidade de cuidado salva.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar necessidade de cuidado.");
    },
  });
}
