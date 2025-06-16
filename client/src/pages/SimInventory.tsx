import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Smartphone, Plus, Search, Filter, Download, Edit, 
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SimCard {
  id: string;
  simNumber: string;
  phoneNumber: string;
  carrier: string;
  status: 'available' | 'assigned' | 'damaged' | 'lost';
  assignedTo?: string;
  assignedDate?: string;
  teamId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SimCardFormData {
  simNumber: string;
  phoneNumber: string;
  carrier: string;
  status: 'available' | 'assigned' | 'damaged' | 'lost';
  assignedTo?: string;
  teamId?: string;
  notes?: string;
}

export function SimInventory() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<SimCard | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState<SimCardFormData>({
    simNumber: "",
    phoneNumber: "",
    carrier: "",
    status: "available",
    assignedTo: "",
    teamId: "",
    notes: ""
  });

  // Fetch SIM cards
  const { data: simCards = [], isLoading } = useQuery({
    queryKey: ["/api/sim-cards"],
    queryFn: () => apiRequest("/api/sim-cards"),
  });

  // Fetch teams for assignment
  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: () => apiRequest("/api/teams"),
  });

  // Fetch profiles for assignment
  const { data: profiles = [] } = useQuery({
    queryKey: ["/api/profiles"],
    queryFn: () => apiRequest("/api/profiles"),
  });

  // Create/Update SIM card mutation
  const simCardMutation = useMutation({
    mutationFn: (data: { method: string; url: string; body?: any }) =>
      apiRequest(data.url, { method: data.method, body: data.body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      toast({
        title: "Success",
        description: editingCard ? "SIM card updated successfully" : "SIM card added successfully",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save SIM card",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      simNumber: "",
      phoneNumber: "",
      carrier: "",
      status: "available",
      assignedTo: "",
      teamId: "",
      notes: ""
    });
    setIsAddingCard(false);
    setEditingCard(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.simNumber || !formData.phoneNumber || !formData.carrier) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const method = editingCard ? "PUT" : "POST";
    const url = editingCard ? `/api/sim-cards/${editingCard.id}` : "/api/sim-cards";
    
    simCardMutation.mutate({
      method,
      url,
      body: formData
    });
  };

  const startEdit = (card: SimCard) => {
    setEditingCard(card);
    setFormData({
      simNumber: card.simNumber,
      phoneNumber: card.phoneNumber,
      carrier: card.carrier,
      status: card.status,
      assignedTo: card.assignedTo || "",
      teamId: card.teamId || "",
      notes: card.notes || ""
    });
    setIsAddingCard(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; color: string }> = {
      available: { variant: "secondary", icon: CheckCircle, color: "text-green-600" },
      assigned: { variant: "default", icon: Clock, color: "text-blue-600" },
      damaged: { variant: "destructive", icon: AlertTriangle, color: "text-red-600" },
      lost: { variant: "destructive", icon: XCircle, color: "text-red-600" }
    };
    
    const config = variants[status] || variants.available;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredCards = simCards.filter((card: SimCard) => {
    const matchesSearch = 
      card.simNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || card.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return simCards.reduce((acc: any, card: SimCard) => {
      acc[card.status] = (acc[card.status] || 0) + 1;
      return acc;
    }, {});
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SIM Card Inventory</h1>
                  <p className="text-sm text-gray-600">Manage equipment and track assignments</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsAddingCard(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add SIM Card
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total SIM Cards</p>
                  <p className="text-2xl font-bold">{simCards.length}</p>
                </div>
                <Smartphone className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.available || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-blue-600">{statusCounts.assigned || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Issues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(statusCounts.damaged || 0) + (statusCounts.lost || 0)}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Form */}
        {isAddingCard && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingCard ? "Edit SIM Card" : "Add New SIM Card"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="simNumber">SIM Number *</Label>
                  <Input
                    id="simNumber"
                    value={formData.simNumber}
                    onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
                    placeholder="Enter SIM number"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="carrier">Carrier *</Label>
                  <Select
                    value={formData.carrier}
                    onValueChange={(value) => setFormData({ ...formData, carrier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MTN">MTN</SelectItem>
                      <SelectItem value="Airtel">Airtel</SelectItem>
                      <SelectItem value="9mobile">9mobile</SelectItem>
                      <SelectItem value="Glo">Glo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.status === "assigned" && (
                  <>
                    <div>
                      <Label htmlFor="assignedTo">Assigned To</Label>
                      <Select
                        value={formData.assignedTo}
                        onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select canvasser" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile: any) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="teamId">Team</Label>
                      <Select
                        value={formData.teamId}
                        onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team: any) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes or comments"
                    rows={3}
                  />
                </div>
                
                <div className="md:col-span-2 flex gap-2">
                  <Button
                    type="submit"
                    disabled={simCardMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {simCardMutation.isPending ? "Saving..." : editingCard ? "Update SIM Card" : "Add SIM Card"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by SIM number, phone number, or carrier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SIM Cards Table */}
        <Card>
          <CardHeader>
            <CardTitle>SIM Card Inventory ({filteredCards.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading SIM cards...</div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Smartphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No SIM cards found</p>
                <p className="text-sm">Add your first SIM card to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SIM Number</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card: SimCard) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.simNumber}</TableCell>
                      <TableCell>{card.phoneNumber}</TableCell>
                      <TableCell>{card.carrier}</TableCell>
                      <TableCell>{getStatusBadge(card.status)}</TableCell>
                      <TableCell>
                        {card.assignedTo ? (
                          <span className="text-sm text-gray-600">
                            {profiles.find((p: any) => p.id === card.assignedTo)?.full_name || card.assignedTo}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {card.teamId ? (
                          <span className="text-sm text-gray-600">
                            {teams.find((t: any) => t.id.toString() === card.teamId)?.name || card.teamId}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(card)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}