import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RequestCard } from "@/components/RequestCard";
import { RequestDetail } from "@/components/RequestDetail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הבקשות",
        variant: "destructive",
      });
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data || []);
      setFilteredRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        (payload) => {
          console.log("Realtime update:", payload);
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter((req) =>
        req.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    if (diffFilter !== "all") {
      filtered = filtered.filter((req) => req.diff_status === diffFilter);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, diffFilter, requests]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">FLAPI Response Comparator</h1>
            <Button onClick={fetchRequests} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? "animate-spin" : ""}`} />
              רענן
            </Button>
          </div>
          <p className="text-muted-foreground">
            השוואת תגובות API בין Production ל-Prep
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי endpoint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="pending">ממתין</SelectItem>
              <SelectItem value="processing">מעבד</SelectItem>
              <SelectItem value="completed">הושלם</SelectItem>
              <SelectItem value="error">שגיאה</SelectItem>
            </SelectContent>
          </Select>
          <Select value={diffFilter} onValueChange={setDiffFilter}>
            <SelectTrigger>
              <SelectValue placeholder="תוצאת השוואה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל התוצאות</SelectItem>
              <SelectItem value="identical">זהה</SelectItem>
              <SelectItem value="different">שונה</SelectItem>
              <SelectItem value="error">שגיאה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">סה"כ בקשות</p>
            <p className="text-2xl font-bold">{requests.length}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">זהות</p>
            <p className="text-2xl font-bold text-success">
              {requests.filter((r) => r.diff_status === "identical").length}
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">שונות</p>
            <p className="text-2xl font-bold text-warning">
              {requests.filter((r) => r.diff_status === "different").length}
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">שגיאות</p>
            <p className="text-2xl font-bold text-destructive">
              {requests.filter((r) => r.status === "error" || r.diff_status === "error").length}
            </p>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">טוען...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              אין בקשות להצגה
            </div>
          ) : (
            filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onClick={() => setSelectedRequest(request)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <RequestDetail
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      />
    </div>
  );
};

export default Index;
