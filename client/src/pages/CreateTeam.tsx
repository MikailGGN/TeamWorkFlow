import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
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
  UserPlus, 
  Calendar,
  Check,
  X,
  Users,
  Target,
  UserCheck
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertTeam, Profile, CanvasserRegistration } from "@shared/schema";
import { EnhancedCamera } from '@/components/EnhancedCamera';


interface TeamFormData {
  name: string;
  description: string;
  category: string;
  activityType: string;
  channels: string[];
  kitId: string;
}




export default function CreateTeam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Team creation state
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    description: "",
    category: "",
    activityType: "",
    channels: [],
    kitId: ""
  });

  // KIT ID management state
  const [kitIds, setKitIds] = useState<string[]>([]);
  const [newKitId, setNewKitId] = useState<string>("");
  const [showKitDialog, setShowKitDialog] = useState(false);



  // Canvasser registration state
  const [canvasserForm, setCanvasserForm] = useState<CanvasserRegistration>({
    fullName: "",
    email: "",
    phone: "",
    nin: "",
    smartCashAccount: "",
    location: undefined,
    photo: undefined,
    teamId: ""
  });

  const [selectedCanvassers, setSelectedCanvassers] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCanvasserDialog, setShowCanvasserDialog] = useState(false);
  const [storedCanvassersCount, setStoredCanvassersCount] = useState(0);

  // Update stored canvassers count on component mount and form submissions
  useEffect(() => {
    const updateCount = () => {
      const stored = getStoredCanvassers();
      const pending = stored.filter((c: any) => c.status === 'pending').length;
      setStoredCanvassersCount(pending);
    };
    
    updateCount();
    const interval = setInterval(updateCount, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

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



  // Get current location for team
  const getTeamLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setTeamLocation(location);
            resolve(location);
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  // Fetch existing canvassers
  const { data: canvassers = [], isLoading: canvassersLoading } = useQuery({
    queryKey: ["/api/profiles/canvassers"],
    enabled: false // We'll implement this API later
  });

  // Fetch current user profile to get FAE email
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  // Fetch teams created by current FAE in the last week for canvasser registration
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams/my-recent"],
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
      teamId: ""
    });
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.activityType || formData.channels.length === 0 || !formData.kitId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including activity type, channels, and kit ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current location for team creation
      const location = await getTeamLocation();
      
      // Generate unique team ID
      const generatedTeamId = generateTeamId(formData.name, location);
      
      // Prepare team data for submission
      const teamData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        activityType: formData.activityType,
        channels: formData.channels.join(', '), // Convert array to comma-separated string for storage
        kitId: formData.kitId,
        teamId: generatedTeamId,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        },
        date: new Date()
      };

      createTeamMutation.mutate(teamData);
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Unable to get location. Please allow location access and try again.",
        variant: "destructive",
      });
    }
  };

  // LocalStorage functions for canvasser management
  const saveCanvasserToStorage = (canvasserData: any) => {
    const existingCanvassers = JSON.parse(localStorage.getItem('capturedCanvassers') || '[]');
    const updatedCanvassers = [...existingCanvassers, canvasserData];
    localStorage.setItem('capturedCanvassers', JSON.stringify(updatedCanvassers));
  };

  const getStoredCanvassers = () => {
    return JSON.parse(localStorage.getItem('capturedCanvassers') || '[]');
  };

  const handleCanvasserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!canvasserForm.fullName || !canvasserForm.phone || !canvasserForm.nin) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Full Name, Phone Number, and NIN).",
        variant: "destructive",
      });
      return;
    }

    // Validate NIN format (exactly 11 digits)
    if (canvasserForm.nin.length !== 11 || !/^\d{11}$/.test(canvasserForm.nin)) {
      toast({
        title: "Invalid NIN",
        description: "National ID Number must be exactly 11 digits.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format (must have 11 digits)
    const phoneDigits = canvasserForm.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be 11 digits in format 0000-000-0000.",
        variant: "destructive",
      });
      return;
    }

    const registrationData = {
      ...canvasserForm,
      id: `canvasser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      faeEmail: (currentUser as any)?.email || 'unknown@fae.com', // Include FAE email
      teamName: 'Pending Assignment', // No team selected yet
      teamId: '', // Will be assigned during approval

      photo: photoPreview || undefined
    };

    // Save to localStorage as "captured canvasser"
    saveCanvasserToStorage(registrationData);
    
    toast({
      title: "Canvasser Registered",
      description: `${canvasserForm.fullName} has been registered and is pending approval.`,
    });

    // Reset form
    resetCanvasserForm();
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



  const handleCanvasserInputChange = (field: keyof CanvasserRegistration, value: string) => {
    let processedValue = value;
    
    // Format phone number as 0000-000-0000
    if (field === 'phone') {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      
      // Apply formatting with dashes
      if (digits.length <= 4) {
        processedValue = digits;
      } else if (digits.length <= 7) {
        processedValue = `${digits.slice(0, 4)}-${digits.slice(4)}`;
      } else if (digits.length <= 11) {
        processedValue = `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
      } else {
        // Limit to 11 digits max
        const limitedDigits = digits.slice(0, 11);
        processedValue = `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4, 7)}-${limitedDigits.slice(7)}`;
      }
    }
    
    // Format NIN to allow only 11 digits
    if (field === 'nin') {
      // Remove all non-digits and limit to 11 digits
      processedValue = value.replace(/\D/g, '').slice(0, 11);
    }
    
    setCanvasserForm(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // KIT ID management handlers
  const handleAddKitId = () => {
    if (!newKitId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid KIT ID.",
        variant: "destructive",
      });
      return;
    }

    if (kitIds.includes(newKitId.trim())) {
      toast({
        title: "Duplicate KIT ID",
        description: "This KIT ID has already been added.",
        variant: "destructive",
      });
      return;
    }

    setKitIds(prev => [...prev, newKitId.trim()]);
    setNewKitId("");
    toast({
      title: "KIT ID Added",
      description: `KIT ID ${newKitId.trim()} has been added successfully.`,
    });
  };

  const handleRemoveKitId = (kitIdToRemove: string) => {
    setKitIds(prev => prev.filter(id => id !== kitIdToRemove));
    toast({
      title: "KIT ID Removed",
      description: `KIT ID ${kitIdToRemove} has been removed.`,
    });
  };

  const validateKitIdFormat = (kitId: string) => {
    // KIT ID format validation (e.g., alphanumeric, specific length)
    const kitIdRegex = /^[A-Z0-9]{6,12}$/;
    return kitIdRegex.test(kitId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Management Center</h1>
                    <p className="text-gray-600">Create teams and register canvassers for field operations</p>
                  </div>
                </div>
                <div className="text-center">
                  <Link href="/canvasser-approval">
                    <Button variant="outline" className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Pending Approvals
                      {storedCanvassersCount > 0 && (
                        <Badge variant="destructive" className="ml-1">
                          {storedCanvassersCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
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

                    <div>
                      <Label htmlFor="kitId" className="text-sm font-medium text-gray-700">
                        Kit ID *
                      </Label>
                      <Input
                        id="kitId"
                        type="text"
                        value={formData.kitId}
                        onChange={(e) => handleInputChange("kitId", e.target.value)}
                        placeholder="Enter kit ID (e.g., KIT001, KIT002)"
                        className="mt-1"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Unique identifier for the kit canvassers will use daily
                      </p>
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

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Team Location & ID Generation
                      </Label>
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await getTeamLocation();
                              toast({
                                title: "Location Captured",
                                description: "Team location has been captured successfully.",
                              });
                            } catch (error) {
                              toast({
                                title: "Location Error",
                                description: "Unable to get location. Please enable location access.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Target className="w-4 h-4" />
                          Set Team Goal
                        </Button>
                        {teamLocation && formData.name && (
                          <Badge variant="secondary" className="text-xs">
                            ID: {generateTeamId(formData.name, teamLocation)}
                          </Badge>
                        )}
                      </div>
                      {teamLocation && (
                        <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Location Captured</h4>
                          <p className="text-xs text-blue-700">
                            {teamLocation.lat.toFixed(6)}, {teamLocation.lng.toFixed(6)}
                          </p>
                          {formData.name && (
                            <p className="text-xs text-blue-700 mt-1">
                              Generated Team ID: <strong>{generateTeamId(formData.name, teamLocation)}</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* KIT ID Management Section */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Equipment KIT IDs
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Add and manage equipment KIT IDs for this team
                      </p>
                      
                      <div className="mt-3 space-y-3">
                        {/* Add KIT ID Input */}
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={newKitId}
                            onChange={(e) => setNewKitId(e.target.value.toUpperCase())}
                            placeholder="Enter KIT ID (e.g., KIT123456)"
                            className="flex-1"
                            maxLength={12}
                          />
                          <Button
                            type="button"
                            onClick={handleAddKitId}
                            disabled={!newKitId.trim() || !validateKitIdFormat(newKitId)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add KIT ID
                          </Button>
                        </div>

                        {/* KIT ID Format Guide */}
                        <div className="text-xs text-gray-500">
                          Format: 6-12 characters (letters and numbers only)
                        </div>

                        {/* Current KIT IDs List */}
                        {kitIds.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">
                              Current KIT IDs ({kitIds.length}):
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {kitIds.map((kitId, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                      {kitId}
                                    </Badge>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveKitId(kitId)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {kitIds.length === 0 && (
                          <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No KIT IDs added yet</p>
                            <p className="text-xs">Add equipment KIT IDs to assign to team members</p>
                          </div>
                        )}

                        {/* KIT ID Usage Instructions */}
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">KIT ID Guidelines</h4>
                          <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Each KIT ID represents physical equipment assigned to team</li>
                            <li>• KIT IDs can be distributed among team canvassers</li>
                            <li>• Track equipment usage and accountability through KIT IDs</li>
                            <li>• Ensure KIT IDs are unique and properly formatted</li>
                          </ul>
                        </div>
                      </div>
                    </div>
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
                          placeholder="0000-000-0000"
                          className="mt-1"
                          required
                          maxLength={13}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Format: 0000-000-0000 (11 digits)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="nin" className="text-sm font-medium text-gray-700">
                          National ID Number (NIN) *
                        </Label>
                        <Input
                          id="nin"
                          type="text"
                          value={canvasserForm.nin}
                          onChange={(e) => handleCanvasserInputChange("nin", e.target.value)}
                          placeholder="Enter 11-digit NIN"
                          className="mt-1"
                          required
                          maxLength={11}
                          pattern="[0-9]{11}"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Must be exactly 11 digits (numbers only)
                        </p>
                        {canvasserForm.nin && canvasserForm.nin.length < 11 && (
                          <p className="text-xs text-red-600 mt-1">
                            NIN must be 11 digits ({canvasserForm.nin.length}/11)
                          </p>
                        )}
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

                      <div>
                        <Label htmlFor="faeEmail" className="text-sm font-medium text-gray-700">
                          Field Area Executive (FAE)
                        </Label>
                        <Input
                          id="faeEmail"
                          type="email"
                          value={(currentUser as any)?.email || 'Loading...'}
                          readOnly
                          className="mt-1 bg-gray-50 text-gray-700"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This canvasser will be registered under your supervision
                        </p>
                      </div>

                      {/* Enhanced Photo Capture */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700">Profile Photo with GPS Verification</Label>
                        
                        {photoPreview ? (
                          <div className="flex items-center gap-4">
                            <img src={photoPreview} alt="Canvasser Photo" className="w-20 h-20 rounded-lg object-cover border-2 border-green-200" />
                            <div className="flex flex-col gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <Check className="w-3 h-3 mr-1" />
                                Photo Captured with GPS
                              </Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPhotoPreview(null);
                                  setCanvasserForm(prev => ({ ...prev, photo: undefined }));
                                }}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Retake Photo
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <EnhancedCamera
                              onPhotoCapture={(photoBlob: any) => {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  const photoDataUrl = e.target?.result as string;
                                  setPhotoPreview(photoDataUrl);
                                  setCanvasserForm(prev => ({ ...prev, photo: photoDataUrl }));
                                };
                                reader.readAsDataURL(photoBlob);
                              }}
                            />
                            <div className="mt-2 text-center">
                              <p className="text-sm text-gray-600">
                                Take a professional photo with GPS coordinates and MDNL watermark
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Photo will include location verification and timestamp
                              </p>
                            </div>
                          </div>
                        )}
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
              ) : (canvassers as any[]).length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No canvassers registered yet</p>
                  <p className="text-sm text-gray-400">Use the registration form above to add canvassers</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(canvassers as any[]).map((canvasser: any) => (
                    <Card key={canvasser.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {canvasser.photo ? (
                            <img src={canvasser.photo || ''} alt={canvasser.fullName || ''} className="w-10 h-10 rounded-full object-cover" />
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