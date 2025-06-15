import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Users, Activity, RefreshCw, Thermometer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Extend Leaflet with heatmap functionality
declare global {
  namespace L {
    class HeatLayer extends Layer {
      constructor(latlngs: [number, number, number][], options?: any);
      setLatLngs(latlngs: [number, number, number][]): this;
    }
    namespace heatLayer {
      function heatLayer(latlngs: [number, number, number][], options?: any): HeatLayer;
    }
  }
}

interface CanvasserLocation {
  id: string;
  email: string;
  full_name: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  engagement_score: number;
  activities_count: number;
  last_active: string;
  status: string;
}

interface HeatmapComponentProps {
  canvassers: CanvasserLocation[];
  mapProvider: string;
}

const MAP_PROVIDERS = {
  OPENSTREETMAP: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  CARTO_DARK: {
    name: 'CartoDB Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  SATELLITE: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

const HeatmapComponent: React.FC<HeatmapComponentProps> = ({ canvassers, mapProvider }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [heatLayer, setHeatLayer] = useState<L.HeatLayer | null>(null);

  // Calculate map center based on canvasser locations
  const mapCenter = useMemo((): [number, number] => {
    const validLocations = canvassers.filter(c => c.location);
    if (validLocations.length === 0) return [6.45407, 3.39467]; // Default to Lagos, Nigeria

    const sum = validLocations.reduce(
      (acc, canvasser) => ({
        lat: acc.lat + canvasser.location!.latitude,
        lng: acc.lng + canvasser.location!.longitude,
      }),
      { lat: 0, lng: 0 }
    );

    return [sum.lat / validLocations.length, sum.lng / validLocations.length];
  }, [canvassers]);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    return canvassers
      .filter(c => c.location)
      .map(canvasser => [
        canvasser.location!.latitude,
        canvasser.location!.longitude,
        canvasser.engagement_score / 100, // Normalize to 0-1 for heat intensity
      ] as [number, number, number]);
  }, [canvassers]);

  // Update heatmap when data changes
  useEffect(() => {
    if (map && heatmapData.length > 0) {
      // Remove existing heat layer
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }

      // Create new heat layer
      const newHeatLayer = (L as any).heatLayer(heatmapData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.0: 'blue',
          0.3: 'cyan',
          0.5: 'lime',
          0.7: 'yellow',
          1.0: 'red'
        }
      });

      map.addLayer(newHeatLayer);
      setHeatLayer(newHeatLayer);
    }
  }, [map, heatmapData]);

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={10} 
      style={{ height: '100%', width: '100%', minHeight: '500px' }}
      ref={setMap}
    >
      <TileLayer 
        url={MAP_PROVIDERS[mapProvider as keyof typeof MAP_PROVIDERS].url} 
        attribution={MAP_PROVIDERS[mapProvider as keyof typeof MAP_PROVIDERS].attribution} 
      />
      
      {/* Individual markers for canvassers */}
      {canvassers.filter(c => c.location).map((canvasser) => (
        <Marker 
          key={canvasser.id} 
          position={[canvasser.location!.latitude, canvasser.location!.longitude]}
        >
          <Popup>
            <div className="p-2">
              <div className="font-semibold">{canvasser.full_name}</div>
              <div className="text-sm text-muted-foreground">{canvasser.email}</div>
              <div className="mt-1">
                <Badge variant={canvasser.engagement_score > 70 ? 'default' : canvasser.engagement_score > 40 ? 'secondary' : 'destructive'}>
                  Engagement: {canvasser.engagement_score}%
                </Badge>
              </div>
              <div className="text-xs mt-1">
                Activities: {canvasser.activities_count} | Status: {canvasser.status}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default function EngagementHeatmap() {
  const { toast } = useToast();
  const [mapProvider, setMapProvider] = useState('OPENSTREETMAP');
  const [engagementFilter, setEngagementFilter] = useState('all');

  // Fetch canvassers data
  const { data: canvassersData = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/canvassers/engagement"],
  });

  // Calculate engagement metrics
  const engagementMetrics = useMemo(() => {
    if (!Array.isArray(canvassersData) || !canvassersData.length) return { high: 0, medium: 0, low: 0, total: 0 };

    const metrics = (canvassersData as CanvasserLocation[]).reduce((acc: any, canvasser: CanvasserLocation) => {
      const score = canvasser.engagement_score || 0;
      if (score > 70) acc.high++;
      else if (score > 40) acc.medium++;
      else acc.low++;
      acc.total++;
      return acc;
    }, { high: 0, medium: 0, low: 0, total: 0 });

    return metrics;
  }, [canvassersData]);

  // Filter canvassers based on engagement level
  const filteredCanvassers = useMemo(() => {
    if (!Array.isArray(canvassersData)) return [];
    if (engagementFilter === 'all') return canvassersData as CanvasserLocation[];
    
    return (canvassersData as CanvasserLocation[]).filter((canvasser: CanvasserLocation) => {
      const score = canvasser.engagement_score || 0;
      switch (engagementFilter) {
        case 'high': return score > 70;
        case 'medium': return score > 40 && score <= 70;
        case 'low': return score <= 40;
        default: return true;
      }
    });
  }, [canvassersData, engagementFilter]);

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Data Refreshed",
      description: "Engagement heatmap data has been updated.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading engagement data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Canvasser Engagement Heatmap</h1>
          <p className="text-muted-foreground">Visualize high and low engagement zones based on canvasser activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Canvassers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementMetrics.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Engagement</CardTitle>
            <Thermometer className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{engagementMetrics.high}</div>
            <p className="text-xs text-muted-foreground">70%+ engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Engagement</CardTitle>
            <Thermometer className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{engagementMetrics.medium}</div>
            <p className="text-xs text-muted-foreground">40-70% engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Engagement</CardTitle>
            <Thermometer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{engagementMetrics.low}</div>
            <p className="text-xs text-muted-foreground">&lt;40% engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Map Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Label htmlFor="map-provider">Map Style:</Label>
          <Select value={mapProvider} onValueChange={setMapProvider}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MAP_PROVIDERS).map(([key, provider]) => (
                <SelectItem key={key} value={key}>{provider.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="engagement-filter">Filter by Engagement:</Label>
          <Select value={engagementFilter} onValueChange={setEngagementFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="high">High (70%+)</SelectItem>
              <SelectItem value="medium">Medium (40-70%)</SelectItem>
              <SelectItem value="low">Low (&lt;40%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Engagement Heatmap
          </CardTitle>
          <CardDescription>
            Red zones indicate high engagement areas, blue zones show low engagement. 
            Showing {filteredCanvassers.length} of {engagementMetrics.total} canvassers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px', width: '100%' }}>
            <HeatmapComponent canvassers={filteredCanvassers} mapProvider={mapProvider} />
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">Heatmap Legend:</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                High Engagement Zones
              </span>
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                Medium Engagement Zones
              </span>
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                Low Engagement Zones
              </span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}