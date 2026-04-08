import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CareRoutine, VitalSignsData, MoodStatus, FeedingStatus, HydrationLevel, CareType, CareShift } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Labels duplicados localmente para evitar importar lucide-react via labels.ts ──

const pdfCareTypeLabels: Record<CareType, string> = {
  hygiene: "Higiene pessoal",
  medication: "Medicamentos",
  feeding: "Alimentação e Hidratação",
  mobility: "Mobilização",
  appointments: "Consultas",
  monitoring: "Monitoramento",
  other: "Outros",
};

const pdfShiftLabels: Record<CareShift, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
};

const pdfFeedingLabels: Record<FeedingStatus, string> = {
  full: "Comeu tudo",
  partial: "Comeu pouco",
  refused: "Recusou",
};

const pdfHydrationLabels: Record<HydrationLevel, string> = {
  under200: "< 200ml",
  "200to500": "200–500ml",
  "500to1000": "500ml–1L",
  over1000: "> 1L",
};

const pdfMoodLabels: Record<MoodStatus, string> = {
  agitated: "Agitado",
  calm: "Calmo",
  sleepy: "Sonolento",
  anxious: "Ansioso",
  communicative: "Comunicativo",
  cheerful: "Bem-disposto",
};

function parseObsForPdf(obs: string | null): { otherDescription: string | null; cleanObs: string | null } {
  if (!obs) return { otherDescription: null, cleanObs: null };
  const match = obs.match(/^\[Outros\]\s*([^\n]+)/);
  const otherDescription = match ? match[1] : null;
  const cleanObs = obs.replace(/^\[Outros\]\s*[^\n]+\n?/, "").trim() || null;
  return { otherDescription, cleanObs };
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return "";
  }
}

// ── Types ──

interface PeriodSummary {
  totalRecords: number;
  medicationRate: number | null;
  feedingBreakdown: Record<string, number>;
  moodBreakdown: Record<string, number>;
  predominantMood: string | null;
  occurrences: number;
  avgSystolic: number | null;
  avgDiastolic: number | null;
  avgHeartRate: number | null;
  avgTemperature: number | null;
  avgGlucose: number | null;
  avgSpO2: number | null;
}

interface CareReportPDFProps {
  elderlyName: string;
  elderlyAge?: number;
  elderlyConditions: string[];
  caregiverName: string;
  periodLabel: string;
  routines: CareRoutine[];
  summary: PeriodSummary;
}

// ── Styles ──

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#e5e5e5", paddingBottom: 12 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#666" },
  meta: { fontSize: 9, color: "#888", marginTop: 6 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 8, color: "#333" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  summaryItem: { width: "30%", marginBottom: 6, marginRight: 12 },
  summaryLabel: { fontSize: 8, color: "#888", marginBottom: 2 },
  summaryValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  dayHeader: { backgroundColor: "#f5f5f5", padding: 6, borderRadius: 3, marginTop: 12, marginBottom: 6 },
  dayHeaderText: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#555" },
  record: { paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: "#e0e0e0", marginBottom: 8, paddingBottom: 4 },
  recordShift: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  row: { flexDirection: "row", flexWrap: "wrap", marginBottom: 2 },
  tag: { backgroundColor: "#f0f0f0", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2, fontSize: 8, marginRight: 6, marginBottom: 2 },
  medLine: { flexDirection: "row", marginBottom: 1 },
  medCheck: { fontSize: 9, marginRight: 4 },
  medName: { fontSize: 9 },
  vitalRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  vitalTag: { backgroundColor: "#eef6ff", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2, fontSize: 8, marginRight: 6, marginBottom: 2 },
  occurrence: { backgroundColor: "#fff7ed", padding: 6, borderRadius: 3, marginTop: 3, borderWidth: 1, borderColor: "#fed7aa" },
  occurrenceTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#c2410c", marginBottom: 2 },
  occurrenceText: { fontSize: 8, color: "#9a3412" },
  obs: { fontSize: 8, color: "#777", fontStyle: "italic", marginTop: 2 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 7, color: "#aaa", borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
});

// ── Helpers ──

function groupByDate(routines: CareRoutine[]): Record<string, CareRoutine[]> {
  const groups: Record<string, CareRoutine[]> = {};
  const shiftOrder = { morning: 0, afternoon: 1, night: 2 };
  routines.forEach((r) => {
    if (!groups[r.date]) groups[r.date] = [];
    groups[r.date].push(r);
  });
  Object.values(groups).forEach((arr) =>
    arr.sort((a, b) => (shiftOrder[a.shift as keyof typeof shiftOrder] ?? 9) - (shiftOrder[b.shift as keyof typeof shiftOrder] ?? 9))
  );
  return groups;
}

// ── Component ──

const CareReportPDF = ({
  elderlyName,
  elderlyAge,
  elderlyConditions,
  caregiverName,
  periodLabel,
  routines,
  summary,
}: CareReportPDFProps) => {
  const grouped = groupByDate(routines);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const generatedAt = format(new Date(), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatorio de Cuidados</Text>
          <Text style={styles.subtitle}>
            {elderlyName}{elderlyAge ? `, ${elderlyAge} anos` : ""}
          </Text>
          {elderlyConditions.length > 0 && (
            <Text style={styles.meta}>Condicoes: {elderlyConditions.join(", ")}</Text>
          )}
          <Text style={styles.meta}>
            Cuidador(a): {caregiverName} — Periodo: {periodLabel}
          </Text>
        </View>

        {/* Summary */}
        <Text style={styles.sectionTitle}>Resumo do Periodo</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Registros</Text>
            <Text style={styles.summaryValue}>{summary.totalRecords}</Text>
          </View>
          {summary.medicationRate !== null && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Medicamentos aplicados</Text>
              <Text style={styles.summaryValue}>{summary.medicationRate}%</Text>
            </View>
          )}
          {summary.predominantMood && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Humor predominante</Text>
              <Text style={styles.summaryValue}>
                {pdfMoodLabels[summary.predominantMood as MoodStatus] ?? summary.predominantMood}{" "}
                ({summary.moodBreakdown[summary.predominantMood]}x)
              </Text>
            </View>
          )}
          {summary.occurrences > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ocorrencias</Text>
              <Text style={styles.summaryValue}>{summary.occurrences}</Text>
            </View>
          )}
          {Object.keys(summary.feedingBreakdown).length > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Alimentacao</Text>
              <Text style={styles.summaryValue}>
                {Object.entries(summary.feedingBreakdown)
                  .map(([key, count]) => `${pdfFeedingLabels[key as FeedingStatus] ?? key}: ${count}x`)
                  .join(", ")}
              </Text>
            </View>
          )}
        </View>

        {/* Vital signs averages */}
        {(summary.avgSystolic !== null || summary.avgHeartRate !== null || summary.avgGlucose !== null) && (
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.summaryLabel}>Medias — Sinais Vitais</Text>
            <View style={styles.vitalRow}>
              {summary.avgSystolic !== null && (
                <Text style={styles.vitalTag}>PA: {summary.avgSystolic}/{summary.avgDiastolic}</Text>
              )}
              {summary.avgHeartRate !== null && (
                <Text style={styles.vitalTag}>FC: {summary.avgHeartRate} bpm</Text>
              )}
              {summary.avgTemperature !== null && (
                <Text style={styles.vitalTag}>Temp: {summary.avgTemperature} C</Text>
              )}
              {summary.avgSpO2 !== null && (
                <Text style={styles.vitalTag}>SpO2: {summary.avgSpO2}%</Text>
              )}
              {summary.avgGlucose !== null && (
                <Text style={styles.vitalTag}>Glicemia: {summary.avgGlucose}</Text>
              )}
            </View>
          </View>
        )}

        {/* Day-by-day records */}
        <Text style={styles.sectionTitle}>Registros Detalhados</Text>
        {sortedDates.map((date) => (
          <View key={date} wrap={false}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>
                {format(new Date(date + "T00:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </Text>
            </View>
            {grouped[date].map((routine) => {
              const { otherDescription, cleanObs } = parseObsForPdf(routine.observations);
              const vs = routine.vital_signs as VitalSignsData | null;

              return (
                <View key={routine.id} style={styles.record}>
                  <Text style={styles.recordShift}>
                    {pdfShiftLabels[routine.shift]} — {formatTime(routine.recorded_at)}
                  </Text>

                  {/* Care types */}
                  {routine.care_types?.length > 0 && (
                    <View style={styles.row}>
                      {routine.care_types.map((type) => {
                        const label = type === "other" && otherDescription
                          ? `Outros: ${otherDescription}`
                          : pdfCareTypeLabels[type] ?? type;
                        return <Text key={type} style={styles.tag}>{label}</Text>;
                      })}
                    </View>
                  )}

                  {/* Medications */}
                  {routine.medication_items?.length > 0 &&
                    routine.medication_items.map((med, idx) => (
                      <View key={idx} style={styles.medLine}>
                        <Text style={styles.medCheck}>{med.applied ? "v" : "o"}</Text>
                        <Text style={styles.medName}>
                          {med.name} ({med.time})
                          {med.applied && med.applied_at ? ` — ${formatTime(med.applied_at)}` : ""}
                        </Text>
                      </View>
                    ))}

                  {/* Well-being */}
                  <View style={styles.row}>
                    {routine.feeding_status && (
                      <Text style={styles.tag}>
                        {pdfFeedingLabels[routine.feeding_status] ?? routine.feeding_status}
                      </Text>
                    )}
                    {routine.hydration && (
                      <Text style={styles.tag}>
                        Agua: {pdfHydrationLabels[routine.hydration as HydrationLevel] ?? routine.hydration}
                      </Text>
                    )}
                    {routine.hygiene_done !== null && (
                      <Text style={styles.tag}>Banho: {routine.hygiene_done ? "Sim" : "Nao"}</Text>
                    )}
                    {routine.mood && (
                      <Text style={styles.tag}>
                        {pdfMoodLabels[routine.mood] ?? routine.mood}
                      </Text>
                    )}
                  </View>

                  {/* Vital signs */}
                  {vs && Object.keys(vs).filter((k) => k !== "recordedAt").length > 0 && (
                    <View style={styles.vitalRow}>
                      {vs.bloodPressure && (
                        <Text style={styles.vitalTag}>PA: {vs.bloodPressure.systolic}/{vs.bloodPressure.diastolic}</Text>
                      )}
                      {vs.temperature != null && (
                        <Text style={styles.vitalTag}>{vs.temperature} C</Text>
                      )}
                      {vs.heartRate != null && (
                        <Text style={styles.vitalTag}>{vs.heartRate} bpm</Text>
                      )}
                      {vs.oxygenSaturation != null && (
                        <Text style={styles.vitalTag}>SpO2: {vs.oxygenSaturation}%</Text>
                      )}
                      {vs.glucose != null && (
                        <Text style={styles.vitalTag}>Glicemia: {vs.glucose}</Text>
                      )}
                    </View>
                  )}

                  {/* Items running low */}
                  {routine.items_running_low?.length > 0 && (
                    <View style={styles.row}>
                      <Text style={styles.tag}>Em falta: {routine.items_running_low.join(", ")}</Text>
                    </View>
                  )}

                  {/* Occurrence */}
                  {routine.has_occurrence && routine.occurrence_description && (
                    <View style={styles.occurrence}>
                      <Text style={styles.occurrenceTitle}>Ocorrencia</Text>
                      <Text style={styles.occurrenceText}>{routine.occurrence_description}</Text>
                    </View>
                  )}

                  {/* Observations */}
                  {cleanObs && <Text style={styles.obs}>{cleanObs}</Text>}
                </View>
              );
            })}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Cuidde — Relatorio de Cuidados</Text>
          <Text>Gerado em {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default CareReportPDF;
