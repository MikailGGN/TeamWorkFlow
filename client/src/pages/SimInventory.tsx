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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Smartphone, Plus, Search, Filter, Download, Edit, 
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, PackagePlus, Package2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

type TabValue = 'collection' | 'allocation' | 'inventory';

interface CollectionData {
  date: string;
  quantity: number;
  source: string;
  source_details: string;
}

interface AllocationData {
  date: string;
  quantity: number;
  allocation_type: string;
  allocation_details: string;
}

interface SimCollection {
  id: number;
  date: string;
  quantity: number;
  source: string;
  source_details: string;
  useremail: string;
  created_at: string;
}

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

const SOURCE_OPTIONS = ['Vendor', 'Customer', 'Red Shop', 'ASM', 'MD'];
const ALLOCATION_OPTIONS = ['Return to Vendor', 'Sold to Customer', 'Transfer to Others'];

const defaultDate = () => new Date().toISOString().split('T')[0];

const initialCollection: CollectionData = { 
  date: defaultDate(), 
  quantity: 0, 
  source: '', 
  source_details: '' 
};

const initialAllocation: AllocationData = { 
  date: defaultDate(), 
  quantity: 0, 
  allocation_type: '', 
  allocation_details: '' 
};

export function SimInventory() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabValue>('collection');
  const [collectionData, setCollectionData] = useState<CollectionData>(initialCollection);
  const [allocationData, setAllocationData] = useState<AllocationData>(initialAllocation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Fetch SIM collection records
  const { data: simCollections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ["/api/sim-collection"],
    queryFn: () => apiRequest("/api/sim-collection"),
  });

  // Collection/Allocation mutation
  const simMutation = useMutation({
    mutationFn: (data: { method: string; url: string; body?: any }) =>
      apiRequest(data.url, { method: data.method, body: data.body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sim-collection"] });
      toast({
        title: "Success",
        description: activeTab === 'collection' ? "SIM collection recorded successfully" : "SIM allocation recorded successfully",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record SIM transaction",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    if (activeTab === 'collection') {
      setCollectionData(initialCollection);
    } else {
      setAllocationData(initialAllocation);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedValue = name === 'quantity' ? Math.max(0, parseInt(value) || 0) : value;

    if (activeTab === 'collection') {
      setCollectionData(prev => ({ ...prev, [name]: updatedValue }));
    } else {
      setAllocationData(prev => ({ ...prev, [name]: updatedValue }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (activeTab === 'collection') {
      setCollectionData(prev => ({ ...prev, [name]: value }));
    } else {
      setAllocationData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): string => {
    const data = activeTab === 'collection' ? collectionData : allocationData;
    
    if (!data.date) return 'Date is required';
    if (data.quantity <= 0) return 'Quantity must be greater than 0';
    
    if (activeTab === 'collection') {
      if (!(data as CollectionData).source) return 'Source is required';
      if (!(data as CollectionData).source_details.trim()) return 'Source details are required';
    } else {
      if (!(data as AllocationData).allocation_type) return 'Allocation type is required';
      if (!(data as AllocationData).allocation_details.trim()) return 'Allocation details are required';
    }
    
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = activeTab === 'collection'
        ? { ...collectionData, allocation_type: null, allocation_details: null }
        : { ...allocationData, source: null, source_details: null };

      simMutation.mutate({
        method: "POST",
        url: "/api/sim-collection",
        body: formData
      });
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionTypeBadge = (record: any) => {
    if (record.source) {
      return <Badge className="bg-green-100 text-green-800">Collection</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Allocation</Badge>;
    }
  };

  const filteredRecords = Array.isArray(simCollections) ? simCollections.filter((record: any) => {
    const matchesSearch = 
      record.source_details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.allocation_details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.allocation_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || record.date === dateFilter;
    
    return matchesSearch && matchesDate;
  }) : [];

  const getTotalBalance = () => {
    if (!Array.isArray(simCollections)) return 0;
    
    return simCollections.reduce((balance: number, record: any) => {
      if (record.source) {
        return balance + record.quantity; // Collection adds
      } else {
        return balance - record.quantity; // Allocation subtracts
      }
    }, 0);
  };

  const getCollectionTotal = () => {
    if (!Array.isArray(simCollections)) return 0;
    return simCollections
      .filter((record: any) => record.source)
      .reduce((total: number, record: any) => total + record.quantity, 0);
  };

  const getAllocationTotal = () => {
    if (!Array.isArray(simCollections)) return 0;
    return simCollections
      .filter((record: any) => record.allocation_type)
      .reduce((total: number, record: any) => total + record.quantity, 0);
  };

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
                  <h1 className="text-xl font-bold text-gray-900">SIM Card Management</h1>
                  <p className="text-sm text-gray-600">Track collection and allocation of SIM cards</p>
                </div>
              </div>
            </div>
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
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-2xl font-bold text-blue-600">{getTotalBalance()}</p>
                </div>
                <Smartphone className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Collected</p>
                  <p className="text-2xl font-bold text-green-600">{getCollectionTotal()}</p>
                </div>
                <PackagePlus className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Allocated</p>
                  <p className="text-2xl font-bold text-red-600">{getAllocationTotal()}</p>
                </div>
                <Package2 className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-purple-600">{Array.isArray(simCollections) ? simCollections.length : 0}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collection and Allocation Forms */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>SIM Card Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="collection">Collection</TabsTrigger>
                <TabsTrigger value="allocation">Allocation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="collection" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="collection-date">Collection Date *</Label>
                      <Input
                        id="collection-date"
                        type="date"
                        name="date"
                        value={collectionData.date}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="collection-quantity">Number of SIM Cards *</Label>
                      <Input
                        id="collection-quantity"
                        type="number"
                        name="quantity"
                        value={collectionData.quantity || ''}
                        onChange={handleInputChange}
                        min="1"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="collection-source">Source *</Label>
                    <Select
                      value={collectionData.source}
                      onValueChange={(value) => handleSelectChange('source', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="collection-details">Source Details *</Label>
                    <Textarea
                      id="collection-details"
                      name="source_details"
                      value={collectionData.source_details}
                      onChange={handleInputChange}
                      placeholder="Provide details about the source"
                      rows={3}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? "Recording..." : "Record Collection"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isSubmitting}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="allocation" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="allocation-date">Allocation Date *</Label>
                      <Input
                        id="allocation-date"
                        type="date"
                        name="date"
                        value={allocationData.date}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="allocation-quantity">Number of SIM Cards *</Label>
                      <Input
                        id="allocation-quantity"
                        type="number"
                        name="quantity"
                        value={allocationData.quantity || ''}
                        onChange={handleInputChange}
                        min="1"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="allocation-type">Allocation Type *</Label>
                    <Select
                      value={allocationData.allocation_type}
                      onValueChange={(value) => handleSelectChange('allocation_type', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select allocation type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOCATION_OPTIONS.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="allocation-details">Allocation Details *</Label>
                    <Textarea
                      id="allocation-details"
                      name="allocation_details"
                      value={allocationData.allocation_details}
                      onChange={handleInputChange}
                      placeholder="Provide details about the allocation"
                      rows={3}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isSubmitting ? "Recording..." : "Record Allocation"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isSubmitting}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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