import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  diffStatus?: string | null;
}

export const StatusBadge = ({ status, diffStatus }: StatusBadgeProps) => {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        ממתין
      </Badge>
    );
  }

  if (status === "processing") {
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3 animate-spin" />
        מעבד
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        שגיאה
      </Badge>
    );
  }

  // Completed status - show diff result
  if (diffStatus === "identical") {
    return (
      <Badge className="gap-1 bg-success text-success-foreground hover:bg-success/90">
        <CheckCircle2 className="h-3 w-3" />
        זהה
      </Badge>
    );
  }

  if (diffStatus === "different") {
    return (
      <Badge className="gap-1 bg-warning text-warning-foreground hover:bg-warning/90">
        <AlertCircle className="h-3 w-3" />
        שונה
      </Badge>
    );
  }

  if (diffStatus === "error") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        שגיאה בהשוואה
      </Badge>
    );
  }

  return null;
};
