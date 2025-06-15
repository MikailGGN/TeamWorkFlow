import { useState, useRef, useCallback, useEffect } from 'react';
import { enhancedCapturePhoto } from '@/utils/photoCapture';

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface CameraOptions {
  width?: number;
  height?: number;
  quality?: number;
  showGridLines?: boolean;
  overlayOpacity?: number;
  facingMode?: 'user' | 'environment';
}

export const useEnhancedCamera = (options: CameraOptions = {}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const {
    width = 800,
    height = 600,
    quality = 0.95,
    showGridLines = true,
    overlayOpacity = 0.7,
    facingMode = 'environment'
  } = options;

  // Enhanced geolocation with better error handling
  const getLocation = useCallback(async (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          // Try to get address using reverse geocoding (optional)
          try {
            // Using a free geocoding service - replace with your preferred service
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${locationData.lat}&lon=${locationData.lng}&limit=1`,
              {
                headers: {
                  'User-Agent': 'FieldForce-Pro-App'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.display_name) {
                locationData.address = data.display_name;
              }
            }
          } catch (error) {
            console.warn('Could not fetch address:', error);
          }

          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Location access denied';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: facingMode
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setError('Unable to access camera. Please check permissions.');
    }
  }, [width, height, facingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Initialize location
  const initializeLocation = useCallback(async () => {
    try {
      setIsLocationLoading(true);
      setError(null);
      const locationData = await getLocation();
      setLocation(locationData);
    } catch (error) {
      console.error('Location error:', error);
      setError(error instanceof Error ? error.message : 'Location access failed');
    } finally {
      setIsLocationLoading(false);
    }
  }, [getLocation]);

  // Enhanced photo capture
  const capturePhoto = useCallback(() => {
    try {
      setError(null);
      
      const photoDataUrl = enhancedCapturePhoto(
        videoRef,
        canvasRef,
        location,
        {
          width,
          height,
          quality,
          showGridLines,
          overlayOpacity
        }
      );
      
      if (photoDataUrl) {
        setCapturedImage(photoDataUrl);
        return photoDataUrl;
      } else {
        throw new Error('Failed to capture photo');
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      setError('Failed to capture photo. Please try again.');
      return null;
    }
  }, [location, width, height, quality, showGridLines, overlayOpacity]);

  // Clear captured image
  const clearImage = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Auto-initialize location when hook is used
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    // Refs
    videoRef,
    canvasRef,
    
    // State
    isStreaming,
    location,
    capturedImage,
    error,
    isLocationLoading,
    
    // Actions
    startCamera,
    stopCamera,
    capturePhoto,
    clearImage,
    initializeLocation,
    
    // Computed values
    hasLocation: !!location,
    locationAccuracy: location?.accuracy,
    isHighAccuracy: location ? (location.accuracy ?? 999) < 10 : false
  };
};