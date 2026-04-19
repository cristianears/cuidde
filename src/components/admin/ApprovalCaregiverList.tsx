import { MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Caregiver } from "@/data/mockData";

interface ApprovalCaregiverListProps {
  caregivers: Caregiver[];
  selectedId: string | null;
  onSelect: (caregiver: Caregiver) => void;
  tabLabel: string;
}

const ApprovalCaregiverList = ({
  caregivers,
  selectedId,
  onSelect,
  tabLabel,
}: ApprovalCaregiverListProps) => {
  if (caregivers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhuma aprovação {tabLabel.toLowerCase()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {tabLabel} ({caregivers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {caregivers.map((caregiver) => {
          const isSelected = selectedId === caregiver.id;
          return (
            <div
              key={caregiver.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors border cursor-pointer ${
                isSelected
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/30 border-transparent hover:bg-muted/60"
              }`}
              onClick={() => onSelect(caregiver)}
            >
              <img
                src={caregiver.photo}
                alt={caregiver.name}
                className="w-11 h-11 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {caregiver.name}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {caregiver.address.city}/{caregiver.address.state}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Envio: {new Date(caregiver.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export const ApprovalListSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-11 h-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      ))}
    </CardContent>
  </Card>
);

export default ApprovalCaregiverList;
