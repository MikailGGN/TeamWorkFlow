import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEnhancedCamera } from "@/hooks/useEnhancedCamera";
import { 
  Camera, 
  MapPin, 
  Download, 
  RotateCcw, 
  Zap, 
  Navigation,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface EnhancedCameraProps {
  onPhotoCapture?: (photoDataUrl: string) => void;
  width?: number;
  height?: number;
  showControls?: boolean;
  autoStart?: boolean;
}

export const EnhancedCamera: React.FC<EnhancedCameraProps> = ({
  onPhotoCapture,
  width = 800,
  height = 600,
  showControls = true,
  autoStart = false
}) => {
  const {
    videoRef,
    canvasRef,
    isStreaming,
    location,
    capturedImage,
    error,
    isLocationLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    clearImage,
    initializeLocation,
    hasLocation,
    locationAccuracy,
    isHighAccuracy
  } = useEnhancedCamera({ width, height });

  React.useEffect(() => {
    if (autoStart) {
      startCamera();
    }
  }, [autoStart, startCamera]);

  const handleCapturePhoto = () => {
    const photoDataUrl = capturePhoto();
    if (photoDataUrl && onPhotoCapture) {
      onPhotoCapture(photoDataUrl);
    }
  };

  const downloadPhoto = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `MDNL_photo_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
      link.href = capturedImage;
      link.click();
    }
  };

  const getLocationStatusColor = () => {
    if (!hasLocation) return 'bg-gray-100 text-gray-800';
    if (isHighAccuracy) return 'bg-green-100 text-green-800';
    if (locationAccuracy && locationAccuracy < 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getLocationStatusIcon = () => {
    if (isLocationLoading) return <Clock className="w-4 h-4" />;
    if (isHighAccuracy) return <CheckCircle className="w-4 h-4" />;
    if (hasLocation) return <Navigation className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Enhanced MDNL Camera
        </CardTitle>
        
        {/* Location Status */}
        <div className="flex items-center gap-2">
          <Badge className={getLocationStatusColor()}>
            {getLocationStatusIcon()}
            <span className="ml-1">
              {isLocationLoading ? 'Getting location...' : 
               hasLocation ? `GPS: ±${locationAccuracy?.toFixed(0)}m` : 'No location'}
            </span>
          </Badge>
          
          {hasLocation && (
            <div className="text-sm text-gray-600">
              {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Camera Controls */}
        {showControls && (
          <div className="flex flex-wrap gap-2">
            {!isStreaming ? (
              <Button onClick={startCamera} className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Stop Camera
              </Button>
            )}

            <Button 
              onClick={initializeLocation} 
              variant="outline" 
              disabled={isLocationLoading}
              className="flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {isLocationLoading ? 'Getting GPS...' : 'Refresh GPS'}
            </Button>

            {isStreaming && (
              <Button 
                onClick={handleCapturePhoto} 
                disabled={!hasLocation}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Zap className="w-4 h-4" />
                Capture Photo
              </Button>
            )}

            {capturedImage && (
              <>
                <Button 
                  onClick={downloadPhoto} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button 
                  onClick={clearImage} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear
                </Button>
              </>
            )}
          </div>
        )}

        {/* Camera View */}
        <div className="relative">
          {isStreaming && (
            <div className="relative inline-block">
              <video
                ref={videoRef}
                className="rounded-lg border-2 border-gray-200"
                width={width}
                height={height}
                autoPlay
                muted
                playsInline
              />
              
              {/* Live overlay indicators */}
              <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                LIVE
              </div>
              
              {hasLocation && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  GPS: {isHighAccuracy ? 'HIGH' : 'OK'}
                </div>
              )}
            </div>
          )}

          {/* Hidden canvas for photo processing */}
          <canvas
            ref={canvasRef}
            className="hidden"
            width={width}
            height={height}
          />
        </div>

        {/* Captured Photo Preview */}
        {capturedImage && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Captured Photo with MDNL Watermark</h3>
            <img 
              src={capturedImage} 
              alt="Captured with MDNL watermark" 
              className="rounded-lg border-2 border-green-200 max-w-full h-auto"
            />
          </div>
        )}

        {/* Location Details */}
        {hasLocation && location?.address && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">Location Details</h4>
            <p className="text-sm text-blue-800">{location.address}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Example usage component
export const CameraExample: React.FC = () => {
  const [savedPhotos, setSavedPhotos] = React.useState<string[]>([]);

  const handlePhotoCapture = (photoDataUrl: string) => {
    setSavedPhotos(prev => [...prev, photoDataUrl]);
  };

  return (
    <div className="p-4 space-y-6">
      <EnhancedCamera 
        onPhotoCapture={handlePhotoCapture}
        width={800}
        height={600}
        showControls={true}
        autoStart={false}
      />
      
      {savedPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Photos ({savedPhotos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPhotos.map((photo, index) => (
                <img 
                  key={index}
                  src={photo} 
                  alt={`Saved photo ${index + 1}`}
                  className="rounded-lg border w-full h-48 object-cover"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};