import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import StarRating from "@/components/shared/StarRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCaregivers, mockReviews } from "@/data/mockData";

const CaregiverReviews = () => {
  const currentUser = mockCaregivers[0];
  const userReviews = mockReviews.filter((r) => r.caregiverId === currentUser.id);
  const total = userReviews.length;

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => {
    const count = userReviews.filter((r) => Math.round(r.rating) === rating).length;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return { rating, count, percentage };
  });

  const averageRating = total > 0 ? currentUser.rating : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="caregiver" userName={currentUser.name} userPhoto={currentUser.photo} />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Avaliações"
          description="Veja o que as famílias dizem sobre você"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Rating Summary */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              {total > 0 ? (
                <>
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
                      Baseado em {total} avaliações
                    </p>
                  </div>
                  <div className="space-y-2.5 md:space-y-3">
                    {ratingCounts.map(({ rating, count, percentage }) => (
                      <div key={rating} className="flex items-center gap-2 md:gap-3">
                        <span className="text-xs md:text-sm text-muted-foreground w-3">{rating}</span>
                        <div
                          className="flex-1 h-2 bg-muted rounded-full overflow-hidden"
                          aria-label={`Distribuição de ${rating} estrelas`}
                        >
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
                </>
              ) : (
                <div className="text-center py-8 md:py-10">
                  <p className="text-xl md:text-2xl font-semibold text-foreground">Sem avaliações ainda</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2">
                    Assim que você concluir atendimentos, as famílias poderão avaliar e seus comentários aparecerão aqui.
                  </p>
                  <div className="mt-5 md:mt-6 p-3 md:p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      Dica: perfis completos e com rotina/atendimentos registrados tendem a receber mais solicitações —
                      e, com isso, mais avaliações.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews List */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Todas as avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              {total > 0 ? (
                <div className="space-y-4 md:space-y-6">
                  {userReviews.map((review) => (
                    <div
                      key={review.id}
                      className="pb-4 md:pb-6 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3 md:gap-4">
                        <img
                          src={review.familyPhoto}
                          alt={review.familyName}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1 gap-2">
                            <h4 className="text-sm md:text-base font-medium text-foreground">
                              {review.familyName}
                            </h4>
                            <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap shrink-0">
                              {new Date(review.date).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <StarRating
                            rating={review.rating}
                            size="sm"
                            showValue={false}
                            className="mb-1.5 md:mb-2"
                          />
                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                            {review.comment}
                          </p>
                        </div>
                      </div>
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
      </main>
    </div>
  );
};

export default CaregiverReviews;
