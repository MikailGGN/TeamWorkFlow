import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import L, { type LeafletEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import { v4 as uuidv4 } from 'uuid';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit, Save, MapPin, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Type definitions
interface Territory {
  id: string;
  name: string;
  description?: string;
  geojson: GeoJSON.Feature;
  color: string;
  teamId?: number;
  status: 'active' | 'inactive' | 'completed';
  assignedDate?: Date;
  completedDate?: Date;
  createdBy: number;
  createdAt?: Date;
}

interface TurfData {
  id: number;
  name: string;
  description?: string;
  geojson: any;
  color: string;
  teamId?: number;
  status: string;
  assignedDate?: Date;
  completedDate?: Date;
  createdBy: number;
  createdAt: Date;
}

interface MapComponentProps {
  territories: Territory[];
  onTerritoryCreated: (territory: Territory) => void;
  onTerritoryEdited: (territory: Territory) => void;
  onTerritoryDeleted: (territoryId: string) => void;
  selectedTerritory?: Territory | null;
  onTerritorySelect: (territory: Territory | null) => void;
}

// Configure Leaflet default icon
const configureLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Helper function to generate random colors
const getRandomColor = (): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const DEFAULT_CENTER: L.LatLngExpression = [6.5244, 3.3792]; // Lagos, Nigeria
const DEFAULT_ZOOM = 10;

const MapComponent: React.FC<MapComponentProps> = ({
  territories,
  onTerritoryCreated,
  onTerritoryEdited,
  onTerritoryDeleted,
  selectedTerritory,
  onTerritorySelect,
}) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const layerIdMap = useRef(new Map<L.Layer, string>()).current;
  const layerRefs = useRef(new Map<string, L.Layer>()).current;

  // Configure Leaflet icons on first render
  useEffect(configureLeafletIcons, []);

  // Add territory layers to the map
  useEffect(() => {
    const featureGroup = featureGroupRef.current;
    if (!featureGroup) return;

    // Clear existing layers and mapping
    featureGroup.clearLayers();
    layerIdMap.clear();
    layerRefs.clear();

    territories.forEach(territory => {
      const layer = L.geoJSON(territory.geojson, {
        style: {
          color: territory.color,
          weight: territory.id === selectedTerritory?.id ? 4 : 2,
          opacity: 0.8,
          fillOpacity: territory.status === 'completed' ? 0.6 : 0.3,
          dashArray: territory.status === 'inactive' ? '5, 5' : undefined,
        }
      });

      // Add click handler for territory selection
      layer.on('click', () => {
        onTerritorySelect(territory);
      });

      layerIdMap.set(layer, territory.id);
      layerRefs.set(territory.id, layer);
      layer.addTo(featureGroup);
    });
  }, [territories, selectedTerritory, onTerritorySelect, layerIdMap, layerRefs]);

  const handleCreated = useCallback((e: LeafletEvent & { layer: L.Layer; layerType: string }) => {
    if (!['polygon', 'rectangle'].includes(e.layerType)) return;

    const newTerritory: Territory = {
      id: uuidv4(),
      name: `Territory ${territories.length + 1}`,
      geojson: (e.layer as any).toGeoJSON(),
      color: getRandomColor(),
      status: 'active',
      createdBy: 1, // Will be set from auth context
    };

    layerIdMap.set(e.layer, newTerritory.id);
    onTerritoryCreated(newTerritory);
  }, [territories.length, onTerritoryCreated, layerIdMap]);

  const handleEdited = useCallback((e: LeafletEvent & { layers: L.LayerGroup }) => {
    e.layers.eachLayer(layer => {
      const territoryId = layerIdMap.get(layer);
      if (!territoryId) return;

      const existingTerritory = territories.find(t => t.id === territoryId);
      if (!existingTerritory) return;

      const updatedTerritory = {
        ...existingTerritory,
        geojson: (layer as any).toGeoJSON()
      };

      onTerritoryEdited(updatedTerritory);
    });
  }, [territories, onTerritoryEdited, layerIdMap]);

  const handleDeleted = useCallback((e: LeafletEvent & { layers: L.LayerGroup }) => {
    e.layers.eachLayer(layer => {
      const territoryId = layerIdMap.get(layer);
      if (territoryId) {
        onTerritoryDeleted(territoryId);
        layerIdMap.delete(layer);
        layerRefs.delete(territoryId);
      }
    });
  }, [onTerritoryDeleted, layerIdMap, layerRefs]);

  const editControl = useMemo(() => (
    <EditControl
      position="topright"
      onCreated={handleCreated}
      onEdited={handleEdited as any}
      onDeleted={handleDeleted as any}
      draw={{
        rectangle: true,
        polygon: true,
        circle: false,
        marker: false,
        circlemarker: false,
        polyline: false,
      }}
    />
  ), [handleCreated, handleEdited, handleDeleted]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <FeatureGroup ref={featureGroupRef}>
        {editControl}
      </FeatureGroup>
    </MapContainer>
  );
};

export default function TurfMapping() {
  const { toast } = useToast();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Fetch turfs from database
  const { data: turfsData = [], isLoading } = useQuery({
    queryKey: ["/api/turfs"],
  });

  // Fetch teams for assignment
  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
  });

  // Convert database turfs to territories format
  useEffect(() => {
    if (turfsData && Array.isArray(turfsData)) {
      const convertedTerritories: Territory[] = turfsData.map((turf: TurfData) => ({
        id: turf.id.toString(),
        name: turf.name,
        description: turf.description,
        geojson: turf.geojson,
        color: turf.color,
        teamId: turf.teamId,
        status: turf.status as 'active' | 'inactive' | 'completed',
        assignedDate: turf.assignedDate,
        completedDate: turf.completedDate,
        createdBy: turf.createdBy,
        createdAt: turf.createdAt,
      }));
      setTerritories(convertedTerritories);
    }
  }, [turfsData]);

  // Create turf mutation
  const createTurfMutation = useMutation({
    mutationFn: async (territoryData: Partial<Territory>) => {
      const response = await apiRequest("POST", "/api/turfs", {
        name: territoryData.name,
        description: territoryData.description,
        geojson: territoryData.geojson,
        color: territoryData.color,
        teamId: territoryData.teamId,
        status: territoryData.status || 'active',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turfs"] });
      toast({
        title: "Success",
        description: "Territory created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create territory",
        variant: "destructive",
      });
    },
  });

  // Update turf mutation
  const updateTurfMutation = useMutation({
    mutationFn: async ({ id, ...territoryData }: Partial<Territory> & { id: string }) => {
      const response = await apiRequest("PUT", `/api/turfs/${id}`, territoryData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turfs"] });
      toast({
        title: "Success",
        description: "Territory updated successfully",
      });
      setShowEditDialog(false);
      setEditingTerritory(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update territory",
        variant: "destructive",
      });
    },
  });

  // Delete turf mutation
  const deleteTurfMutation = useMutation({
    mutationFn: async (territoryId: string) => {
      const response = await apiRequest("DELETE", `/api/turfs/${territoryId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turfs"] });
      toast({
        title: "Success",
        description: "Territory deleted successfully",
      });
      setSelectedTerritory(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete territory",
        variant: "destructive",
      });
    },
  });

  const handleTerritoryCreated = (territory: Territory) => {
    createTurfMutation.mutate(territory);
  };

  const handleTerritoryEdited = (territory: Territory) => {
    updateTurfMutation.mutate(territory);
  };

  const handleTerritoryDeleted = (territoryId: string) => {
    deleteTurfMutation.mutate(territoryId);
  };

  const handleEditTerritory = (territory: Territory) => {
    setEditingTerritory({ ...territory });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingTerritory) {
      updateTurfMutation.mutate(editingTerritory);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTeamName = (teamId?: number) => {
    if (!teamId) return 'Unassigned';
    const team = teams.find((t: any) => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading territories...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Turf Mapping & Territory Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage territorial boundaries for field operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {territories.length} Territories
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
          <TabsTrigger value="list">Territory List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Territory Map
                  </CardTitle>
                  <CardDescription>
                    Use the drawing tools to create new territories. Click on existing territories to select them.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MapComponent
                    territories={territories}
                    onTerritoryCreated={handleTerritoryCreated}
                    onTerritoryEdited={handleTerritoryEdited}
                    onTerritoryDeleted={handleTerritoryDeleted}
                    selectedTerritory={selectedTerritory}
                    onTerritorySelect={setSelectedTerritory}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {selectedTerritory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Territory Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="mt-1">{selectedTerritory.name}</p>
                    </div>
                    
                    {selectedTerritory.description && (
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="mt-1 text-sm text-muted-foreground">{selectedTerritory.description}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedTerritory.status)}>
                          {selectedTerritory.status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Assigned Team</Label>
                      <p className="mt-1 text-sm">{getTeamName(selectedTerritory.teamId)}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleEditTerritory(selectedTerritory)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleTerritoryDeleted(selectedTerritory.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Territories</span>
                    <Badge variant="outline">
                      {territories.filter(t => t.status === 'active').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <Badge variant="outline">
                      {territories.filter(t => t.status === 'completed').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Unassigned</span>
                    <Badge variant="outline">
                      {territories.filter(t => !t.teamId).length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {territories.map(territory => (
              <Card key={territory.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTerritory(territory)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: territory.color }}
                      />
                      <div>
                        <h3 className="font-medium">{territory.name}</h3>
                        {territory.description && (
                          <p className="text-sm text-muted-foreground">{territory.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(territory.status)}>
                        {territory.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getTeamName(territory.teamId)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Territories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{territories.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {territories.length > 0 
                    ? Math.round((territories.filter(t => t.status === 'completed').length / territories.length) * 100)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Teams Assigned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(territories.filter(t => t.teamId).map(t => t.teamId)).size}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Territory Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Territory</DialogTitle>
            <DialogDescription>
              Update territory details and assignments
            </DialogDescription>
          </DialogHeader>
          
          {editingTerritory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="territory-name">Territory Name</Label>
                <Input
                  id="territory-name"
                  value={editingTerritory.name}
                  onChange={(e) => setEditingTerritory({
                    ...editingTerritory,
                    name: e.target.value
                  })}
                />
              </div>

              <div>
                <Label htmlFor="territory-description">Description</Label>
                <Textarea
                  id="territory-description"
                  value={editingTerritory.description || ''}
                  onChange={(e) => setEditingTerritory({
                    ...editingTerritory,
                    description: e.target.value
                  })}
                />
              </div>

              <div>
                <Label htmlFor="territory-status">Status</Label>
                <Select
                  value={editingTerritory.status}
                  onValueChange={(value) => setEditingTerritory({
                    ...editingTerritory,
                    status: value as 'active' | 'inactive' | 'completed'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="territory-team">Assigned Team</Label>
                <Select
                  value={editingTerritory.teamId?.toString() || ''}
                  onValueChange={(value) => setEditingTerritory({
                    ...editingTerritory,
                    teamId: value ? parseInt(value) : undefined
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}