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

interface TeamFormData {
  name: string;
  description: string;
  category: string;
  activityType: string;
  channels: string[];
}
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
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    description: "",
    category: "",
    activityType: "",
    channels: []
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

  // Activity type and channel mapping
  const activityChannels = {
    MEGA: [
      "Market Storms",
      "Higher Institution", 
      "Mobile Activation-RIG Bus/Tricycle"
    ],
    MIDI: [
      "Community/Densely populated Neighbourhood",
      "Motor Park"
    ],
    MINI: [
      "Parasol Activation",
      "Door2Door /HORECA",
      "Worship Centre"
    ]
  };

  // Handle activity type change
  const handleActivityTypeChange = (activityType: string) => {
    setFormData(prev => ({
      ...prev,
      activityType,
      channels: [] // Reset channels when activity type changes
    }));
  };

  // Handle channel selection
  const handleChannelToggle = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Team Management Center</h1>
                  <p className="text-gray-600">Create teams and register canvassers for field operations</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="create-team" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create-team" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Create Team
                </TabsTrigger>
                <TabsTrigger value="register-canvasser" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Register Canvasser
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create-team" className="p-6">
                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Team Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter team name"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Describe the team's purpose and goals"
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                        Category *
                      </Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select team category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="field-operations">Field Operations</SelectItem>
                          <SelectItem value="canvassing">Canvassing</SelectItem>
                          <SelectItem value="survey">Survey Team</SelectItem>
                          <SelectItem value="data-collection">Data Collection</SelectItem>
                          <SelectItem value="outreach">Community Outreach</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="activityType" className="text-sm font-medium text-gray-700">
                        Activity Type *
                      </Label>
                      <Select value={formData.activityType} onValueChange={handleActivityTypeChange}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select activity type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEGA">MEGA</SelectItem>
                          <SelectItem value="MIDI">MIDI</SelectItem>
                          <SelectItem value="MINI">MINI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.activityType && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Channels *
                        </Label>
                        <div className="mt-2 space-y-3">
                          {activityChannels[formData.activityType as keyof typeof activityChannels]?.map((channel) => (
                            <div key={channel} className="flex items-center space-x-2">
                              <Checkbox
                                id={channel}
                                checked={formData.channels.includes(channel)}
                                onCheckedChange={() => handleChannelToggle(channel)}
                              />
                              <Label
                                htmlFor={channel}
                                className="text-sm text-gray-700 cursor-pointer"
                              >
                                {channel}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {formData.channels.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {formData.channels.map((channel) => (
                              <Badge key={channel} variant="secondary" className="text-xs">
                                {channel}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/teams")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTeamMutation.isPending}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register-canvasser" className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Registration Form */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Canvasser Registration</h3>
                    <form onSubmit={handleCanvasserSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                          Full Name *
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={canvasserForm.fullName}
                          onChange={(e) => handleCanvasserInputChange("fullName", e.target.value)}
                          placeholder="Enter full name"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={canvasserForm.email}
                          onChange={(e) => handleCanvasserInputChange("email", e.target.value)}
                          placeholder="Enter email address"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={canvasserForm.phone}
                          onChange={(e) => handleCanvasserInputChange("phone", e.target.value)}
                          placeholder="Enter phone number"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="nin" className="text-sm font-medium text-gray-700">
                          National ID Number *
                        </Label>
                        <Input
                          id="nin"
                          type="text"
                          value={canvasserForm.nin}
                          onChange={(e) => handleCanvasserInputChange("nin", e.target.value)}
                          placeholder="Enter NIN"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="smartCash" className="text-sm font-medium text-gray-700">
                          SmartCash Account
                        </Label>
                        <Input
                          id="smartCash"
                          type="text"
                          value={canvasserForm.smartCashAccount}
                          onChange={(e) => handleCanvasserInputChange("smartCashAccount", e.target.value)}
                          placeholder="Enter SmartCash account"
                          className="mt-1"
                        />
                      </div>

                      {/* Photo Upload */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Profile Photo</Label>
                        <div className="mt-2 flex items-center gap-4">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                              <Camera className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            {photoPreview ? "Change Photo" : "Add Photo"}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Location Section */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Location</Label>
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={getCurrentLocation}
                            className="flex items-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            Use Current Location
                          </Button>
                          {mapPosition && (
                            <Badge variant="secondary">
                              {mapPosition[0].toFixed(4)}, {mapPosition[1].toFixed(4)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetCanvasserForm}
                        >
                          Reset
                        </Button>
                        <Button
                          type="submit"
                          disabled={registerCanvasser.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {registerCanvasser.isPending ? "Registering..." : "Register Canvasser"}
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Map */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Location</h3>
                    <div className="h-96 rounded-lg overflow-hidden border">
                      <MapContainer
                        center={[9.0820, 8.6753]} // Nigeria center coordinates
                        zoom={6}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                        />
                        <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                      </MapContainer>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Click on the map to select a location or use "Use Current Location" button
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Existing Canvassers Section */}
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Registered Canvassers</h2>
              <p className="text-gray-600">Manage and approve canvasser registrations</p>
            </div>
            <div className="p-6">
              {canvassersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading canvassers...</p>
                </div>
              ) : canvassers.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No canvassers registered yet</p>
                  <p className="text-sm text-gray-400">Use the registration form above to add canvassers</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {canvassers.map((canvasser: Profile) => (
                    <Card key={canvasser.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {canvasser.photo ? (
                            <img src={canvasser.photo} alt={canvasser.fullName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <UserPlus className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{canvasser.fullName}</h4>
                            <p className="text-sm text-gray-500">{canvasser.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={canvasser.status === 'approved' ? 'default' : canvasser.status === 'pending' ? 'secondary' : 'destructive'}>
                            {canvasser.status}
                          </Badge>
                          {canvasser.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 px-2">
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2">
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}