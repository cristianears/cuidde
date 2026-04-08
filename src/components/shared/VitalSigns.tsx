import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Heart,
  Thermometer,
  Droplets,
  Wind,
  Activity,
  AlertTriangle,
} from "lucide-react";
import type { VitalSignsData } from "@/types/database";

interface VitalSignsProps {
  isDiabetic: boolean;
  value: VitalSignsData;
  onChange: (data: VitalSignsData) => void;
}

interface VitalRange {
  min: number;
  max: number;
}

const RANGES: Record<string, VitalRange> = {
  systolic: { min: 60, max: 250 },
  diastolic: { min: 40, max: 150 },
  temperature: { min: 34, max: 42 },
  glucose: { min: 20, max: 600 },
  heartRate: { min: 30, max: 200 },
  oxygenSaturation: { min: 50, max: 100 },
};

function isOutOfRange(key: string, val: number | undefined): boolean {
  if (val === undefined || val === null || isNaN(val)) return false;
  const range = RANGES[key];
  if (!range) return false;
  return val < range.min || val > range.max;
}

function parseDecimal(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const normalized = raw.replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? undefined : num;
}

const VitalSigns = ({ isDiabetic, value, onChange }: VitalSignsProps) => {
  const update = useCallback(
    (patch: Partial<VitalSignsData>) => {
      onChange({ ...value, ...patch });
    },
    [value, onChange]
  );

  const systolic = value.bloodPressure?.systolic;
  const diastolic = value.bloodPressure?.diastolic;

  const systolicOOR = isOutOfRange("systolic", systolic);
  const diastolicOOR = isOutOfRange("diastolic", diastolic);
  const temperatureOOR = isOutOfRange("temperature", value.temperature);
  const glucoseOOR = isOutOfRange("glucose", value.glucose);
  const heartRateOOR = isOutOfRange("heartRate", value.heartRate);
  const spO2OOR = isOutOfRange("oxygenSaturation", value.oxygenSaturation);

  const inputClass = (outOfRange: boolean) =>
    cn(
      "text-sm h-10",
      outOfRange && "border-red-400 focus-visible:ring-red-400"
    );

  const warningIcon = (outOfRange: boolean) =>
    outOfRange ? (
      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
    ) : null;

  return (
    <div className="space-y-4">
      {/* Pressao arterial — linha inteira */}
      <div>
        <Label className="text-sm font-medium flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Pressao arterial
          {(systolicOOR || diastolicOOR) && warningIcon(true)}
        </Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              inputMode="numeric"
              placeholder="120"
              value={systolic ?? ""}
              onChange={(e) => {
                const v = parseDecimal(e.target.value);
                update({
                  bloodPressure:
                    v !== undefined || diastolic !== undefined
                      ? { systolic: v as number, diastolic: diastolic as number }
                      : undefined,
                });
              }}
              className={inputClass(systolicOOR)}
            />
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Sistolica (mmHg)
            </span>
          </div>
          <span className="text-lg font-medium text-muted-foreground pb-4">/</span>
          <div className="flex-1">
            <Input
              inputMode="numeric"
              placeholder="80"
              value={diastolic ?? ""}
              onChange={(e) => {
                const v = parseDecimal(e.target.value);
                update({
                  bloodPressure:
                    v !== undefined || systolic !== undefined
                      ? { systolic: systolic as number, diastolic: v as number }
                      : undefined,
                });
              }}
              className={inputClass(diastolicOOR)}
            />
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Diastolica (mmHg)
            </span>
          </div>
        </div>
        {(systolicOOR || diastolicOOR) && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Valor fora do intervalo esperado
            {systolicOOR && ` (sistolica: ${RANGES.systolic.min}-${RANGES.systolic.max})`}
            {diastolicOOR && ` (diastolica: ${RANGES.diastolic.min}-${RANGES.diastolic.max})`}
          </p>
        )}
      </div>

      {/* Grid 2 colunas para campos individuais */}
      <div className="grid grid-cols-2 gap-4">
        {/* Temperatura */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-orange-500" />
            Temperatura
            {warningIcon(temperatureOOR)}
          </Label>
          <div className="relative">
            <Input
              inputMode="decimal"
              placeholder="36,5"
              value={value.temperature ?? ""}
              onChange={(e) => update({ temperature: parseDecimal(e.target.value) })}
              className={cn(inputClass(temperatureOOR), "pr-8")}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              °C
            </span>
          </div>
          {temperatureOOR && (
            <p className="text-xs text-red-500 mt-1">
              Esperado: {RANGES.temperature.min}–{RANGES.temperature.max} °C
            </p>
          )}
        </div>

        {/* Frequencia cardiaca */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-red-500" />
            Freq. cardiaca
            {warningIcon(heartRateOOR)}
          </Label>
          <div className="relative">
            <Input
              inputMode="numeric"
              placeholder="72"
              value={value.heartRate ?? ""}
              onChange={(e) => update({ heartRate: parseDecimal(e.target.value) })}
              className={cn(inputClass(heartRateOOR), "pr-12")}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              bpm
            </span>
          </div>
          {heartRateOOR && (
            <p className="text-xs text-red-500 mt-1">
              Esperado: {RANGES.heartRate.min}–{RANGES.heartRate.max} bpm
            </p>
          )}
        </div>

        {/* Saturacao de oxigenio */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-sky-500" />
            SpO₂
            {warningIcon(spO2OOR)}
          </Label>
          <div className="relative">
            <Input
              inputMode="numeric"
              placeholder="97"
              value={value.oxygenSaturation ?? ""}
              onChange={(e) => update({ oxygenSaturation: parseDecimal(e.target.value) })}
              className={cn(inputClass(spO2OOR), "pr-8")}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              %
            </span>
          </div>
          {spO2OOR && (
            <p className="text-xs text-red-500 mt-1">
              Esperado: {RANGES.oxygenSaturation.min}–{RANGES.oxygenSaturation.max}%
            </p>
          )}
        </div>

        {/* Glicemia — apenas se isDiabetic */}
        {isDiabetic && (
          <div>
            <Label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-purple-500" />
              Glicemia
              {warningIcon(glucoseOOR)}
            </Label>
            <div className="relative">
              <Input
                inputMode="numeric"
                placeholder="95"
                value={value.glucose ?? ""}
                onChange={(e) => update({ glucose: parseDecimal(e.target.value) })}
                className={cn(inputClass(glucoseOOR), "pr-14")}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                mg/dL
              </span>
            </div>
            {glucoseOOR && (
              <p className="text-xs text-red-500 mt-1">
                Esperado: {RANGES.glucose.min}–{RANGES.glucose.max} mg/dL
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalSigns;
