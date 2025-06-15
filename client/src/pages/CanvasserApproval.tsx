import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageSquare, MessageCircle, CheckCircle, XCircle, Eye, MapPin, Calendar, Users, IdCard } from "lucide-react";

interface StoredCanvasser {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  nin: string;
  smartCashAccount?: string;
  teamId: string;
  teamName?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  photo?: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function CanvasserApproval() {
  const [storedCanvassers, setStoredCanvassers] = useState<StoredCanvasser[]>([]);
  const [selectedCanvasser, setSelectedCanvasser] = useState<StoredCanvasser | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { toast } = useToast();

  // Load canvassers from localStorage
  useEffect(() => {
    const loadStoredCanvassers = () => {
      const stored = JSON.parse(localStorage.getItem('capturedCanvassers') || '[]');
      setStoredCanvassers(stored);
    };

    loadStoredCanvassers();
    // Refresh every 30 seconds to pick up new registrations
    const interval = setInterval(loadStoredCanvassers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync approved canvasser to database
  const syncCanvasserToDatabase = async (canvasser: StoredCanvasser) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/canvassers/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(canvasser)
      });

      if (!response.ok) {
        throw new Error('Failed to sync canvasser to database');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Database sync error:', error);
      throw error;
    }
  };

  // Update canvasser status in localStorage and sync to database
  const updateCanvasserStatus = async (canvasserId: string, status: 'approved' | 'rejected') => {
    const canvasser = storedCanvassers.find(c => c.id === canvasserId);
    if (!canvasser) return;

    try {
      // If approving, sync to database first
      if (status === 'approved') {
        await syncCanvasserToDatabase(canvasser);
        toast({
          title: "Canvasser Approved & Synced",
          description: `${canvasser.fullName} has been approved and added to the database.`,
        });
      }

      // Update localStorage
      const updated = storedCanvassers.map(c =>
        c.id === canvasserId 
          ? { ...c, status, approvedAt: Date.now() }
          : c
      );
      
      setStoredCanvassers(updated);
      localStorage.setItem('capturedCanvassers', JSON.stringify(updated));
      
      if (status === 'rejected') {
        toast({
          title: "Canvasser Rejected",
          description: `${canvasser.fullName} has been rejected.`,
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to sync canvasser to database. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Communication functions
  const initiateCall = (phone: string, name: string) => {
    // Trigger phone call
    window.open(`tel:${phone}`, '_self');
    toast({
      title: "Call Initiated",
      description: `Calling ${name} at ${phone}`,
    });
  };

  const initiateSMS = (phone: string, name: string) => {
    const message = `Hello ${name}, your canvasser registration has been reviewed. Please contact your team lead for next steps.`;
    window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_self');
    toast({
      title: "SMS Initiated",
      description: `SMS sent to ${name} at ${phone}`,
    });
  };

  const initiateWhatsApp = (phone: string, name: string) => {
    const message = `Hello ${name}, your canvasser registration has been reviewed. Please contact your team lead for next steps.`;
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    toast({
      title: "WhatsApp Initiated",
      description: `WhatsApp message sent to ${name}`,
    });
  };

  const pendingCanvassers = storedCanvassers.filter(c => c.status === 'pending');
  const approvedCanvassers = storedCanvassers.filter(c => c.status === 'approved');
  const rejectedCanvassers = storedCanvassers.filter(c => c.status === 'rejected');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Canvasser Approval Dashboard</h1>
          <p className="text-gray-600 mt-2">Review and approve canvasser registrations</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingCanvassers.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCanvassers.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{rejectedCanvassers.length}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{storedCanvassers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Canvassers - Priority Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Pending Approvals ({pendingCanvassers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingCanvassers.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No pending approvals</p>
                <p className="text-gray-400 text-sm">All canvassers have been reviewed</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingCanvassers.map((canvasser) => (
                  <Card key={canvasser.id} className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={canvasser.photo} />
                          <AvatarFallback>{canvasser.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{canvasser.fullName}</h3>
                          <p className="text-sm text-gray-600">{canvasser.teamName}</p>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 mt-1">
                            Pending
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {canvasser.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <IdCard className="w-4 h-4" />
                          NIN: {canvasser.nin}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(canvasser.timestamp)}
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => initiateCall(canvasser.phone, canvasser.fullName)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => initiateSMS(canvasser.phone, canvasser.fullName)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => initiateWhatsApp(canvasser.phone, canvasser.fullName)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => setSelectedCanvasser(canvasser)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Canvasser Details</DialogTitle>
                            </DialogHeader>
                            {selectedCanvasser && (
                              <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <Avatar className="w-20 h-20">
                                    <AvatarImage src={selectedCanvasser.photo} />
                                    <AvatarFallback className="text-lg">
                                      {selectedCanvasser.fullName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="text-xl font-semibold">{selectedCanvasser.fullName}</h3>
                                    <p className="text-gray-600">{selectedCanvasser.teamName}</p>
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 mt-1">
                                      {selectedCanvasser.status}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Phone</label>
                                    <p className="text-gray-900">{selectedCanvasser.phone}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                    <p className="text-gray-900">{selectedCanvasser.email || 'Not provided'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">NIN</label>
                                    <p className="text-gray-900">{selectedCanvasser.nin}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">SmartCash</label>
                                    <p className="text-gray-900">{selectedCanvasser.smartCashAccount || 'Not provided'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Registration Date</label>
                                    <p className="text-gray-900">{formatDate(selectedCanvasser.timestamp)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Team</label>
                                    <p className="text-gray-900">{selectedCanvasser.teamName}</p>
                                  </div>
                                </div>

                                {selectedCanvasser.location && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      Location
                                    </label>
                                    <p className="text-gray-900">{selectedCanvasser.location.address}</p>
                                    <p className="text-sm text-gray-600">
                                      {selectedCanvasser.location.lat.toFixed(6)}, {selectedCanvasser.location.lng.toFixed(6)}
                                    </p>
                                  </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                  <Button
                                    onClick={() => initiateCall(selectedCanvasser.phone, selectedCanvasser.fullName)}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    <Phone className="w-4 h-4 mr-2" />
                                    Call
                                  </Button>
                                  <Button
                                    onClick={() => initiateSMS(selectedCanvasser.phone, selectedCanvasser.fullName)}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    SMS
                                  </Button>
                                  <Button
                                    onClick={() => initiateWhatsApp(selectedCanvasser.phone, selectedCanvasser.fullName)}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    WhatsApp
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => updateCanvasserStatus(canvasser.id, 'approved')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => updateCanvasserStatus(canvasser.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Canvassers */}
        {approvedCanvassers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Approved Canvassers ({approvedCanvassers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {approvedCanvassers.map((canvasser) => (
                  <Card key={canvasser.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={canvasser.photo} />
                          <AvatarFallback>{canvasser.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900">{canvasser.fullName}</h4>
                          <p className="text-sm text-gray-600">{canvasser.teamName}</p>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                            Approved
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}