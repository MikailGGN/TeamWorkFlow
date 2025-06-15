interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface PhotoCaptureOptions {
  width?: number;
  height?: number;
  quality?: number;
  showGridLines?: boolean;
  overlayOpacity?: number;
}

export const enhancedCapturePhoto = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  location: LocationData | null,
  options: PhotoCaptureOptions = {}
): string | null => {
  const {
    width = 400,
    height = 300,
    quality = 0.9,
    showGridLines = true,
    overlayOpacity = 0.8
  } = options;

  if (!videoRef.current || !canvasRef.current) {
    console.error('Video or canvas reference not available');
    return null;
  }

  const context = canvasRef.current.getContext("2d");
  if (!context) {
    console.error('Canvas context not available');
    return null;
  }

  // Set canvas dimensions
  canvasRef.current.width = width;
  canvasRef.current.height = height;

  // Draw the video frame
  context.drawImage(videoRef.current, 0, 0, width, height);

  // Add semi-transparent overlay for better text readability
  context.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;
  context.fillRect(0, 0, width, 45); // Top overlay
  context.fillRect(0, height - 85, width, 85); // Bottom overlay

  // Add grid lines for professional look
  if (showGridLines) {
    context.strokeStyle = "rgba(255, 255, 255, 0.3)";
    context.lineWidth = 1;
    
    // Vertical lines (rule of thirds)
    for (let i = 1; i < 3; i++) {
      const x = (width / 3) * i;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    
    // Horizontal lines (rule of thirds)
    for (let i = 1; i < 3; i++) {
      const y = (height / 3) * i;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }

  // Format current date and time
  const now = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const formattedDate = now.toLocaleDateString('en-GB', dateOptions).replace(/\//g, '-');
  const timestamp = now.toISOString();

  if (location) {
    // Enhanced location information with border for readability
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    
    // Top GPS coordinates with enhanced formatting
    context.font = "bold 16px Arial";
    const latText = `LAT: ${location.lat.toFixed(6)}°`;
    const lngText = `LNG: ${location.lng.toFixed(6)}°`;
    
    context.strokeText(latText, 10, 20);
    context.fillText(latText, 10, 20);
    context.strokeText(lngText, 10, 38);
    context.fillText(lngText, 10, 38);
    
    // Accuracy indicator
    if (location.accuracy) {
      context.font = "12px Arial";
      context.fillStyle = location.accuracy < 10 ? "#00ff00" : location.accuracy < 50 ? "#ffff00" : "#ff6600";
      const accuracyText = `±${location.accuracy.toFixed(0)}m`;
      context.strokeText(accuracyText, width - 80, 20);
      context.fillText(accuracyText, width - 80, 20);
    }

    // Bottom information with enhanced styling
    context.fillStyle = "white";
    context.font = "bold 18px Arial";
    const dateText = `${formattedDate}`;
    context.strokeText(dateText, 10, height - 55);
    context.fillText(dateText, 10, height - 55);
    
    // Address with smart truncation
    if (location.address) {
      context.font = "14px Arial";
      const maxWidth = width - 20;
      let addressText = location.address;
      
      // Smart truncation - prioritize important parts
      if (context.measureText(addressText).width > maxWidth) {
        const parts = addressText.split(',');
        if (parts.length > 2) {
          addressText = parts.slice(0, 2).join(',') + '...';
        } else {
          addressText = addressText.substring(0, 45) + "...";
        }
      }
      
      context.strokeText(addressText, 10, height - 35);
      context.fillText(addressText, 10, height - 35);
    }

    // Technical reference timestamp
    context.font = "10px Arial";
    context.fillStyle = "rgba(255, 255, 255, 0.8)";
    context.fillText(`UTC: ${timestamp}`, 10, height - 15);
  }

  // Enhanced MDNL branding with professional styling
  context.fillStyle = "white";
  context.strokeStyle = "black";
  context.lineWidth = 3;
  
  // Main MDNL label with enhanced background
  context.font = "bold 36px Arial";
  const mdnlText = "MDNL";
  const textMetrics = context.measureText(mdnlText);
  const textWidth = textMetrics.width;
  const textHeight = 36;
  
  // Position at bottom right with padding
  const mdnlX = width - textWidth - 25;
  const mdnlY = height - 25;
  
  // Add styled background with border
  const bgPadding = 12;
  context.fillStyle = "rgba(0, 0, 0, 0.85)";
  context.strokeStyle = "white";
  context.lineWidth = 2;
  const bgRect = {
    x: mdnlX - bgPadding,
    y: mdnlY - textHeight - 5,
    width: textWidth + (bgPadding * 2),
    height: textHeight + 15
  };
  
  context.fillRect(bgRect.x, bgRect.y, bgRect.width, bgRect.height);
  context.strokeRect(bgRect.x, bgRect.y, bgRect.width, bgRect.height);
  
  // Draw MDNL text with enhanced styling
  context.fillStyle = "#FFD700"; // Gold color for premium look
  context.strokeStyle = "black";
  context.lineWidth = 2;
  context.strokeText(mdnlText, mdnlX, mdnlY);
  context.fillText(mdnlText, mdnlX, mdnlY);
  
  // Add verification checkmark with circle
  const checkX = mdnlX + textWidth + 10;
  const checkY = mdnlY - textHeight/2;
  
  // Green circle background
  context.fillStyle = "#00AA00";
  context.beginPath();
  context.arc(checkX, checkY, 12, 0, 2 * Math.PI);
  context.fill();
  
  // White checkmark
  context.fillStyle = "white";
  context.font = "bold 16px Arial";
  context.fillText("✓", checkX - 6, checkY + 5);

  // Add frame number/session ID for tracking
  const sessionId = Date.now().toString().slice(-6);
  context.fillStyle = "rgba(255, 255, 255, 0.6)";
  context.font = "10px monospace";
  context.fillText(`#${sessionId}`, width - 60, height - 5);

  // Convert to data URL with specified quality
  return canvasRef.current.toDataURL("image/jpeg", quality);
};