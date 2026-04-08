import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import StarRating from "@/components/shared/StarRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";
import { useReviews } from "@/hooks/useReviews";

const CRITERIA = [
  { key: "rating_pontualidade" as const, label: "Pontualidade" },
  { key: "rating_competencia" as const, label: "Competência" },
  { key: "rating_comunicacao" as const, label: "Comunicação" },
  { key: "rating_trato" as const, label: "Trato com o idoso" },
  { key: "rating_confianca" as const, label: "Confiança" },
] as const;

const CaregiverReviews = () => {
  const { user } = useAuth();
  const { data: profileData } = useCaregiverProfile();
  const { data: reviews, isLoading } = useReviews(user?.id);

  const total = reviews?.length ?? 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => {
    const count = (reviews ?? []).filter((r) => Math.ceil(r.rating) === star).length;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return { star, count, percentage };
  });

  const averageRating =
    total > 0
      ? (reviews ?? []).reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

  // Média por critério
  const criteriaAverages = CRITERIA.map(({ key, label }) => {
    const vals = (reviews ?? [])
      .map((r) => r[key])
      .filter((v): v is number => v !== null && v !== undefined);
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { key, label, avg };
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="caregiver"
        userName={profileData?.profiles.full_name ?? user?.email ?? ""}
        userPhoto={profileData?.photo_url ?? undefined}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Avaliações"
          description="Veja o que as famílias dizem sobre você"
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

            {/* Resumo */}
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                {total > 0 ? (
                  <>
                    {/* Nota geral */}
                    <div className="text-center mb-5 md:mb-6">
                      <p className="text-4xl md:text-5xl font-bold text-foreground">
                        {averageRating.toFixed(1)}
                      </p>
                      <StarRating
                        rating={averageRating}
                        size="lg"
                        showValue={false}
                        className="justify-center mt-2"
                      />
                      <p className="text-xs md:text-sm text-muted-foreground mt-2">
                        Baseado em {total} avaliação{total !== 1 ? "ões" : ""}
                      </p>
                    </div>

                    {/* Distribuição por estrela */}
                    <div className="space-y-2.5 md:space-y-3 mb-5">
                      {ratingCounts.map(({ star, count, percentage }) => (
                        <div key={star} className="flex items-center gap-2 md:gap-3">
                          <span className="text-xs md:text-sm text-muted-foreground w-3">{star}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs md:text-sm text-muted-foreground w-6 md:w-8 text-right">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Média por critério */}
                    <div className="border-t pt-4 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Por critério
                      </p>
                      {criteriaAverages.map(({ key, label, avg }) => (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium text-foreground">
                              {avg > 0 ? avg.toFixed(1) : "—"}
                            </span>
                          </div>
                          {avg > 0 && (
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${(avg / 5) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 md:py-10">
                    <p className="text-xl md:text-2xl font-semibold text-foreground">
                      Sem avaliações ainda
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">
                      Assim que você concluir atendimentos, as famílias poderão avaliar e seus comentários aparecerão aqui.
                    </p>
                    <div className="mt-5 md:mt-6 p-3 md:p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        Dica: perfis completos e com rotina/atendimentos registrados tendem a receber mais solicitações — e, com isso, mais avaliações.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de avaliações */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Todas as avaliações</CardTitle>
              </CardHeader>
              <CardContent>
                {total > 0 ? (
                  <div className="space-y-6">
                    {(reviews ?? []).map((review) => (
                      <div
                        key={review.id}
                        className="pb-6 border-b border-border last:border-0 last:pb-0 space-y-3"
                      >
                        {/* Cabeçalho: foto + nome + data + nota geral */}
                        <div className="flex items-start gap-3 md:gap-4">
                          {review.family_photo ? (
                            <img
                              src={review.family_photo}
                              alt={review.family_name ?? "Família"}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground font-semibold text-sm">
                              {(review.family_name ?? "F").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm md:text-base font-medium text-foreground">
                                {review.family_name ?? "Família"}
                              </h4>
                              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap shrink-0">
                                {new Date(review.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <StarRating rating={review.rating} size="sm" showValue />
                          </div>
                        </div>

                        {/* Critérios */}
                        {CRITERIA.some(({ key }) => review[key] != null) && (
                          <div className="pl-[3.25rem] grid grid-cols-2 gap-x-4 gap-y-2">
                            {CRITERIA.map(({ key, label }) =>
                              review[key] != null ? (
                                <div key={key} className="flex items-center justify-between text-xs gap-2">
                                  <span className="text-muted-foreground truncate">{label}</span>
                                  <StarRating rating={review[key]!} size="sm" showValue={false} />
                                </div>
                              ) : null
                            )}
                          </div>
                        )}

                        {/* Comentário */}
                        {review.comment && (
                          <p className="pl-[3.25rem] text-xs md:text-sm text-muted-foreground leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 md:py-12">
                    <p className="text-sm md:text-base text-muted-foreground">
                      Você ainda não recebeu avaliações
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">
                      As avaliações aparecerão aqui após seus atendimentos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
};

export default CaregiverReviews;
