import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Camera, 
  MapPin, 
  Calendar as CalendarIcon,
  Users,
  Target,
  Settings,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CampaignData {
  name: string;
  description: string;
  type: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  targetAudience: string;
  budget: number;
  locations: CampaignLocation[];
  teams: string[];
  objectives: string[];
  kpis: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
}

interface CampaignLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photo?: string;
  verified: boolean;
  capturedAt: Date;
}

const CAMPAIGN_TYPES = [
  "Brand Awareness",
  "Product Launch",
  "Customer Acquisition",
  "Market Research",
  "Event Promotion",
  "Lead Generation"
];

const TARGET_AUDIENCES = [
  "Young Adults (18-30)",
  "Professionals (25-45)",
  "Families",
  "Students",
  "Seniors (50+)",
  "Small Business Owners",
  "General Public"
];

export default function CampaignSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Video and canvas refs for photo capture
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Campaign form state
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: "",
    description: "",
    type: "",
    startDate: undefined,
    endDate: undefined,
    targetAudience: "",
    budget: 0,
    locations: [],
    teams: [],
    objectives: [],
    kpis: [],
    status: 'draft'
  });

  // Location capture state
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);

  // Form helpers
  const [newObjective, setNewObjective] = useState("");
  const [newKpi, setNewKpi] = useState("");

  // Get current user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied");
        }
      );
    }
  }, []);

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 400, 
          height: 300,
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
    }
  };

  // Capture photo with location data
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && currentLocation) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 400, 300);

        // Add location and timestamp overlay
        const date = new Date().toLocaleString();
        context.font = "16px Arial";
        context.fillStyle = "white";
        context.strokeStyle = "black";
        context.lineWidth = 2;
        
        // Create background for text
        context.fillStyle = "rgba(0, 0, 0, 0.7)";
        context.fillRect(5, 5, 390, 75);
        
        // Add text
        context.fillStyle = "white";
        context.fillText(`Lat: ${currentLocation.lat.toFixed(6)}`, 10, 25);
        context.fillText(`Lng: ${currentLocation.lng.toFixed(6)}`, 10, 45);
        context.fillText(`Date: ${date}`, 10, 65);
        context.font = "24px Arial";
        context.fillText("FIELDFORCE PRO", 250, 290);

        setCapturedImage(canvasRef.current.toDataURL("image/png"));
        stopCamera();
      }
    }
  };

  // Add location to campaign
  const addLocationToCampaign = () => {
    if (!capturedImage || !currentLocation || !locationName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please capture a photo and enter location details.",
        variant: "destructive",
      });
      return;
    }

    const newLocation: CampaignLocation = {
      id: Date.now().toString(),
      name: locationName,
      address: locationAddress || `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`,
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      photo: capturedImage,
      verified: true,
      capturedAt: new Date()
    };

    setCampaignData(prev => ({
      ...prev,
      locations: [...prev.locations, newLocation]
    }));

    // Reset form
    setLocationName("");
    setLocationAddress("");
    setCapturedImage(null);
    setShowLocationDialog(false);

    toast({
      title: "Location Added",
      description: "Campaign location has been successfully added.",
    });
  };

  // Remove location from campaign
  const removeLocation = (locationId: string) => {
    setCampaignData(prev => ({
      ...prev,
      locations: prev.locations.filter(loc => loc.id !== locationId)
    }));
  };

  // Add objective
  const addObjective = () => {
    if (newObjective.trim()) {
      setCampaignData(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective.trim()]
      }));
      setNewObjective("");
    }
  };

  // Add KPI
  const addKpi = () => {
    if (newKpi.trim()) {
      setCampaignData(prev => ({
        ...prev,
        kpis: [...prev.kpis, newKpi.trim()]
      }));
      setNewKpi("");
    }
  };

  // Save campaign mutation
  const saveCampaignMutation = useMutation({
    mutationFn: async (data: CampaignData) => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to save campaign');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Saved",
        description: "Campaign has been successfully saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save campaign. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSaveCampaign = () => {
    if (!campaignData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a campaign name.",
        variant: "destructive",
      });
      return;
    }

    saveCampaignMutation.mutate(campaignData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Campaign Setup</h1>
                <p className="text-gray-600 mt-2">Create and configure marketing campaigns</p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/campaigns")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCampaign}
                  disabled={saveCampaignMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveCampaignMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="basic-info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="objectives">Objectives & KPIs</TabsTrigger>
              <TabsTrigger value="teams">Teams & Budget</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic-info">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Campaign Name */}
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input
                        id="campaign-name"
                        value={campaignData.name}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter campaign name"
                        className="mt-2"
                      />
                    </div>

                    {/* Campaign Type */}
                    <div>
                      <Label>Campaign Type</Label>
                      <Select
                        value={campaignData.type}
                        onValueChange={(value) => setCampaignData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select campaign type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAMPAIGN_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Start Date */}
                    <div>
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full mt-2 justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {campaignData.startDate ? format(campaignData.startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={campaignData.startDate}
                            onSelect={(date) => setCampaignData(prev => ({ ...prev, startDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* End Date */}
                    <div>
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full mt-2 justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {campaignData.endDate ? format(campaignData.endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={campaignData.endDate}
                            onSelect={(date) => setCampaignData(prev => ({ ...prev, endDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Target Audience */}
                    <div className="md:col-span-2">
                      <Label>Target Audience</Label>
                      <Select
                        value={campaignData.targetAudience}
                        onValueChange={(value) => setCampaignData(prev => ({ ...prev, targetAudience: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select target audience" />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_AUDIENCES.map(audience => (
                            <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Campaign Description</Label>
                    <Textarea
                      id="description"
                      value={campaignData.description}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your campaign objectives and strategy"
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="locations">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Campaign Locations</CardTitle>
                    <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Location
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Campaign Location</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Location Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="location-name">Location Name</Label>
                              <Input
                                id="location-name"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                placeholder="e.g., Shopping Mall Entrance"
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label htmlFor="location-address">Address (Optional)</Label>
                              <Input
                                id="location-address"
                                value={locationAddress}
                                onChange={(e) => setLocationAddress(e.target.value)}
                                placeholder="Enter full address"
                                className="mt-2"
                              />
                            </div>
                          </div>

                          {/* Camera Section */}
                          <div>
                            <Label>Location Photo</Label>
                            <div className="mt-2 space-y-4">
                              {!capturedImage ? (
                                <div className="relative">
                                  <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full max-w-md mx-auto rounded-lg border"
                                    style={{ display: isStreamActive ? 'block' : 'none' }}
                                  />
                                  
                                  {!isStreamActive && (
                                    <div className="w-full max-w-md mx-auto h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                      <div className="text-center">
                                        <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-500">Start camera to capture location photo</p>
                                      </div>
                                    </div>
                                  )}

                                  <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={300}
                                    style={{ display: 'none' }}
                                  />

                                  <div className="flex justify-center gap-4 mt-4">
                                    {!isStreamActive ? (
                                      <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                                        <Camera className="w-4 h-4 mr-2" />
                                        Start Camera
                                      </Button>
                                    ) : (
                                      <>
                                        <Button 
                                          onClick={capturePhoto}
                                          className="bg-green-600 hover:bg-green-700"
                                          disabled={!currentLocation}
                                        >
                                          <Camera className="w-4 h-4 mr-2" />
                                          Capture Photo
                                        </Button>
                                        <Button onClick={stopCamera} variant="outline">
                                          Cancel
                                        </Button>
                                      </>
                                    )}
                                  </div>

                                  {!currentLocation && (
                                    <div className="flex items-center gap-2 text-amber-600 mt-2">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="text-sm">Location access required for photo capture</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center">
                                  <img
                                    src={capturedImage}
                                    alt="Captured location"
                                    className="max-w-md mx-auto rounded-lg border"
                                  />
                                  <div className="flex justify-center gap-4 mt-4">
                                    <Button
                                      onClick={addLocationToCampaign}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Add Location
                                    </Button>
                                    <Button
                                      onClick={() => setCapturedImage(null)}
                                      variant="outline"
                                    >
                                      Retake Photo
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {campaignData.locations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No locations added yet</p>
                      <p className="text-sm">Add locations where your campaign will be active</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {campaignData.locations.map((location) => (
                        <Card key={location.id} className="relative">
                          <CardContent className="p-4">
                            {location.photo && (
                              <img
                                src={location.photo}
                                alt={location.name}
                                className="w-full h-32 object-cover rounded-lg mb-3"
                              />
                            )}
                            <h3 className="font-semibold">{location.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />
                                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeLocation(location.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Objectives & KPIs Tab */}
            <TabsContent value="objectives">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Objectives */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Objectives</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        placeholder="Enter campaign objective"
                        onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                      />
                      <Button onClick={addObjective} disabled={!newObjective.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {campaignData.objectives.map((objective, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>{objective}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCampaignData(prev => ({
                              ...prev,
                              objectives: prev.objectives.filter((_, i) => i !== index)
                            }))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {campaignData.objectives.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No objectives added yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* KPIs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Performance Indicators</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newKpi}
                        onChange={(e) => setNewKpi(e.target.value)}
                        placeholder="Enter KPI (e.g., 1000 leads generated)"
                        onKeyPress={(e) => e.key === 'Enter' && addKpi()}
                      />
                      <Button onClick={addKpi} disabled={!newKpi.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {campaignData.kpis.map((kpi, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>{kpi}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCampaignData(prev => ({
                              ...prev,
                              kpis: prev.kpis.filter((_, i) => i !== index)
                            }))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {campaignData.kpis.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No KPIs added yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Teams & Budget Tab */}
            <TabsContent value="teams">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="budget">Total Budget ($)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={campaignData.budget}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                        placeholder="Enter campaign budget"
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={campaignData.status}
                      onValueChange={(value: 'draft' | 'active' | 'paused' | 'completed') => 
                        setCampaignData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}