import React from 'react';
import { Sidebar } from "@/components/Sidebar";
import { EnhancedCamera, CameraExample } from "@/components/EnhancedCamera";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  MapPin, 
  Zap, 
  CheckCircle,
  Info
} from "lucide-react";

export default function CameraDemo() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Enhanced Camera with MDNL Watermark</h1>
            <p className="text-slate-600 mt-1">Professional photo capture with GPS coordinates and MDNL branding</p>
          </div>

          {/* Features Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Enhanced Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <MapPin className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">GPS Precision</h3>
                    <p className="text-sm text-blue-700">High-accuracy coordinates with ±meter precision</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Camera className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Professional Quality</h3>
                    <p className="text-sm text-green-700">High-resolution capture with overlay text</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Zap className="w-8 h-8 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">MDNL Branding</h3>
                    <p className="text-sm text-yellow-700">Professional watermark with verification mark</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-purple-900">Date Stamping</h3>
                    <p className="text-sm text-purple-700">Automatic timestamp with UTC reference</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Camera Component */}
          <CameraExample />

          {/* Technical Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Implementation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Photo Enhancement Features</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Professional rule-of-thirds grid overlay</li>
                    <li>• Semi-transparent information panels</li>
                    <li>• High-precision GPS coordinates (6 decimal places)</li>
                    <li>• Location accuracy indicator with color coding</li>
                    <li>• Reverse geocoding for address display</li>
                    <li>• Smart text truncation for long addresses</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">MDNL Branding Elements</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Gold-colored MDNL text with black outline</li>
                    <li>• Professional background with border styling</li>
                    <li>• Green verification checkmark in circle</li>
                    <li>• Session ID for photo tracking</li>
                    <li>• ISO timestamp for technical reference</li>
                    <li>• Configurable overlay opacity and styling</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Usage in Your Components</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <code className="text-sm">
                    {`// Import the enhanced capture function
import { enhancedCapturePhoto } from '@/utils/photoCapture';

// In your component
const capturePhoto = () => {
  const photoDataUrl = enhancedCapturePhoto(
    videoRef, 
    canvasRef, 
    location, 
    {
      width: 800,
      height: 600,
      quality: 0.95,
      showGridLines: true,
      overlayOpacity: 0.7
    }
  );
  
  if (photoDataUrl) {
    setImage(photoDataUrl);
  }
};`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}