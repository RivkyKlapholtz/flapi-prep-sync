import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface RequestCardProps {
  request: {
    id: string;
    endpoint: string;
    method: string;
    status: string;
    diff_status: string | null;
    created_at: string;
    processing_duration_ms: number | null;
  };
  onClick: () => void;
}

export const RequestCard = ({ request, onClick }: RequestCardProps) => {
  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-primary/10 text-primary border-primary/20",
      POST: "bg-success/10 text-success border-success/20",
      PUT: "bg-warning/10 text-warning border-warning/20",
      DELETE: "bg-destructive/10 text-destructive border-destructive/20",
      PATCH: "bg-accent/10 text-accent border-accent/20",
    };
    return colors[method] || "bg-muted text-muted-foreground";
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getMethodColor(request.method)} variant="outline">
                {request.method}
              </Badge>
              <StatusBadge status={request.status} diffStatus={request.diff_status} />
            </div>
            <CardTitle className="text-base font-mono break-all">
              {request.endpoint}
            </CardTitle>
            <CardDescription className="mt-2 text-xs">
              {formatDistanceToNow(new Date(request.created_at), {
                addSuffix: true,
                locale: he,
              })}
              {request.processing_duration_ms && (
                <span className="mr-2">
                  • {request.processing_duration_ms}ms
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
