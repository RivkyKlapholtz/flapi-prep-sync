import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RequestDetailProps {
  request: {
    id: string;
    endpoint: string;
    method: string;
    headers: any;
    body: any;
    prod_response: any;
    prep_response: any;
    status: string;
    diff_status: string | null;
    error_message: string | null;
    created_at: string;
    processed_at: string | null;
    processing_duration_ms: number | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RequestDetail = ({ request, open, onOpenChange }: RequestDetailProps) => {
  if (!request) return null;

  const formatJson = (data: any) => {
    if (!data) return "No data";
    return JSON.stringify(data, null, 2);
  };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getMethodColor(request.method)} variant="outline">
              {request.method}
            </Badge>
            <StatusBadge status={request.status} diffStatus={request.diff_status} />
          </div>
          <DialogTitle className="font-mono text-lg break-all mt-2">
            {request.endpoint}
          </DialogTitle>
          <DialogDescription>
            נוצר: {new Date(request.created_at).toLocaleString("he-IL")}
            {request.processing_duration_ms && ` • ${request.processing_duration_ms}ms`}
          </DialogDescription>
        </DialogHeader>

        {request.error_message && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-mono text-xs">
              {request.error_message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="comparison" className="flex-1">
              השוואה
            </TabsTrigger>
            <TabsTrigger value="request" className="flex-1">
              בקשה
            </TabsTrigger>
            <TabsTrigger value="prod" className="flex-1">
              Production
            </TabsTrigger>
            <TabsTrigger value="prep" className="flex-1">
              Prep
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm">Production Response</h3>
                <ScrollArea className="h-[500px] rounded-md border bg-code-bg p-4">
                  <pre className="text-xs font-mono text-code-text">
                    {formatJson(request.prod_response)}
                  </pre>
                </ScrollArea>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm">Prep Response</h3>
                <ScrollArea className="h-[500px] rounded-md border bg-code-bg p-4">
                  <pre className="text-xs font-mono text-code-text">
                    {formatJson(request.prep_response)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="request" className="mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm">Headers</h3>
                <ScrollArea className="h-[200px] rounded-md border bg-code-bg p-4">
                  <pre className="text-xs font-mono text-code-text">
                    {formatJson(request.headers)}
                  </pre>
                </ScrollArea>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm">Body</h3>
                <ScrollArea className="h-[300px] rounded-md border bg-code-bg p-4">
                  <pre className="text-xs font-mono text-code-text">
                    {formatJson(request.body)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prod" className="mt-4">
            <ScrollArea className="h-[500px] rounded-md border bg-code-bg p-4">
              <pre className="text-xs font-mono text-code-text">
                {formatJson(request.prod_response)}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="prep" className="mt-4">
            <ScrollArea className="h-[500px] rounded-md border bg-code-bg p-4">
              <pre className="text-xs font-mono text-code-text">
                {formatJson(request.prep_response)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
