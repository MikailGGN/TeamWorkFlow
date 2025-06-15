import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Camera, 
  MapPin, 
  UserPlus, 
  Calendar,
  Check,
  X,
  Users,
  Target
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertTeam, Profile, CanvasserRegistration } from "@shared/schema";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler component
function LocationPicker({ position, setPosition }: { 
  position: [number, number] | null; 
  setPosition: (pos: [number, number] | null) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected location</Popup>
    </Marker>
  );
}

export default function CreateTeam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Team creation state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: ""
  });

  // Canvasser registration state
  const [canvasserForm, setCanvasserForm] = useState<CanvasserRegistration>({
    fullName: "",
    email: "",
    phone: "",
    nin: "",
    smartCashAccount: "",
    location: undefined,
    photo: undefined,
  });

  const [selectedCanvassers, setSelectedCanvassers] = useState<string[]>([]);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCanvasserDialog, setShowCanvasserDialog] = useState(false);

  // Fetch existing canvassers
  const { data: canvassers = [], isLoading: canvassersLoading } = useQuery({
    queryKey: ["/api/profiles/canvassers"],
    enabled: false // We'll implement this API later
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: InsertTeam) => {
      const response = await apiRequest("POST", "/api/teams", teamData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Team created successfully!",
        description: "Your new team has been created and you've been added as an admin.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create team",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const registerCanvasser = useMutation({
    mutationFn: async (canvasserData: CanvasserRegistration) => {
      const response = await apiRequest("POST", "/api/profiles/canvassers", canvasserData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/canvassers"] });
      toast({
        title: "Success",
        description: "Canvasser registered successfully",
      });
      setShowCanvasserDialog(false);
      resetCanvasserForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to register canvasser",
        variant: "destructive",
      });
    },
  });

  const resetCanvasserForm = () => {
    setCanvasserForm({
      fullName: "",
      email: "",
      phone: "",
      nin: "",
      smartCashAccount: "",
      location: undefined,
      photo: undefined,
    });
    setMapPosition(null);
    setPhotoPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createTeamMutation.mutate(formData);
  };

  const handleCanvasserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const registrationData: CanvasserRegistration = {
      ...canvasserForm,
      location: mapPosition ? {
        lat: mapPosition[0],
        lng: mapPosition[1],
        address: `${mapPosition[0].toFixed(6)}, ${mapPosition[1].toFixed(6)}`
      } : undefined
    };

    registerCanvasser.mutate(registrationData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        setCanvasserForm(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setMapPosition(pos);
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please click on the map to select.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
    }
  };

  const handleCanvasserInputChange = (field: keyof CanvasserRegistration, value: string) => {
    setCanvasserForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Create New Team</h1>
              <p className="text-slate-600 mt-2">Set up a new team and invite members to collaborate</p>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="block text-sm font-medium text-slate-700 mb-2">
                        Team Name *
                      </Label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter team name"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-slate-700 mb-2">
                        Team Category *
                      </Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={4}
                      placeholder="Describe the team's purpose and goals"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-slate-700 mb-2">
                      Team Members
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <Select defaultValue="member">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Note: Member invitation functionality will be implemented in a future update.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setLocation("/dashboard")}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTeamMutation.isPending}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
