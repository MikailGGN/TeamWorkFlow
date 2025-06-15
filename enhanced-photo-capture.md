# Enhanced Photo Capture Method - Complete Implementation

## Improved capturePhoto Method

Replace your existing method with this enhanced version:

```javascript
const capturePhoto = () => {
  if (!videoRef.current || !canvasRef.current) {
    console.error('Video or canvas reference not available');
    return;
  }

  const context = canvasRef.current.getContext("2d");
  if (!context) {
    console.error('Canvas context not available');
    return;
  }

  const width = 800;
  const height = 600;
  
  // Set canvas dimensions
  canvasRef.current.width = width;
  canvasRef.current.height = height;

  // Draw the video frame
  context.drawImage(videoRef.current, 0, 0, width, height);

  // Add semi-transparent overlays for better text readability
  context.fillStyle = "rgba(0, 0, 0, 0.8)";
  context.fillRect(0, 0, width, 45); // Top overlay
  context.fillRect(0, height - 85, width, 85); // Bottom overlay

  // Add professional grid lines (rule of thirds)
  context.strokeStyle = "rgba(255, 255, 255, 0.3)";
  context.lineWidth = 1;
  
  // Vertical lines
  for (let i = 1; i < 3; i++) {
    const x = (width / 3) * i;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  
  // Horizontal lines
  for (let i = 1; i < 3; i++) {
    const y = (height / 3) * i;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  // Format current date and time
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');

  if (location) {
    // Enhanced GPS coordinates with outline for readability
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    
    // Top GPS coordinates
    context.font = "bold 16px Arial";
    const latText = `LAT: ${location.lat.toFixed(6)}°`;
    const lngText = `LNG: ${location.lng.toFixed(6)}°`;
    
    context.strokeText(latText, 10, 20);
    context.fillText(latText, 10, 20);
    context.strokeText(lngText, 10, 38);
    context.fillText(lngText, 10, 38);
    
    // Accuracy indicator (color-coded)
    if (location.accuracy) {
      context.font = "12px Arial";
      context.fillStyle = location.accuracy < 10 ? "#00ff00" : 
                         location.accuracy < 50 ? "#ffff00" : "#ff6600";
      const accuracyText = `±${location.accuracy.toFixed(0)}m`;
      context.strokeText(accuracyText, width - 80, 20);
      context.fillText(accuracyText, width - 80, 20);
    }

    // Bottom date and time
    context.fillStyle = "white";
    context.font = "bold 18px Arial";
    context.strokeText(formattedDate, 10, height - 55);
    context.fillText(formattedDate, 10, height - 55);
    
    // Address (if available)
    if (location.address) {
      context.font = "14px Arial";
      let addressText = location.address;
      
      // Smart truncation for long addresses
      if (context.measureText(addressText).width > width - 20) {
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

    // UTC timestamp for technical reference
    context.font = "10px Arial";
    context.fillStyle = "rgba(255, 255, 255, 0.8)";
    context.fillText(`UTC: ${now.toISOString()}`, 10, height - 15);
  }

  // Enhanced MDNL branding
  context.fillStyle = "white";
  context.strokeStyle = "black";
  context.lineWidth = 3;
  
  // Main MDNL label
  context.font = "bold 36px Arial";
  const mdnlText = "MDNL";
  const textMetrics = context.measureText(mdnlText);
  const textWidth = textMetrics.width;
  const textHeight = 36;
  
  // Position at bottom right
  const mdnlX = width - textWidth - 25;
  const mdnlY = height - 25;
  
  // Add professional background with border
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
  
  // Draw MDNL text in gold with black outline
  context.fillStyle = "#FFD700"; // Gold color
  context.strokeStyle = "black";
  context.lineWidth = 2;
  context.strokeText(mdnlText, mdnlX, mdnlY);
  context.fillText(mdnlText, mdnlX, mdnlY);
  
  // Add verification checkmark with green circle
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

  // Add session ID for tracking
  const sessionId = Date.now().toString().slice(-6);
  context.fillStyle = "rgba(255, 255, 255, 0.6)";
  context.font = "10px monospace";
  context.fillText(`#${sessionId}`, width - 60, height - 5);

  // Convert to high-quality JPEG
  setImage(canvasRef.current.toDataURL("image/jpeg", 0.95));
};
```

## Key Improvements

### Enhanced Geolocation Display
- **High-precision coordinates**: 6 decimal places for GPS accuracy
- **Color-coded accuracy indicator**: Green (<10m), Yellow (<50m), Orange (>50m)
- **Smart address truncation**: Prioritizes important location parts
- **Professional text styling**: White text with black outline for readability

### Professional MDNL Branding
- **Gold-colored MDNL text**: Premium appearance with black outline
- **Styled background**: Semi-transparent black with white border
- **Verification checkmark**: Green circle with white checkmark
- **Session tracking**: Unique ID for photo identification

### Visual Enhancements
- **Rule of thirds grid**: Professional photography guidelines
- **Semi-transparent overlays**: Better text readability over any background
- **Multiple font weights**: Hierarchy for different information types
- **UTC timestamp**: Technical reference for precise timing

### Technical Features
- **High-quality output**: JPEG format at 95% quality
- **Configurable dimensions**: Easy to adjust canvas size
- **Error handling**: Proper checks for video and canvas availability
- **Performance optimized**: Efficient canvas operations

## Usage Example

```javascript
// In your component state
const [location, setLocation] = useState(null);

// Get enhanced location with accuracy
const getLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        address: 'Location address here' // From reverse geocoding
      });
    },
    (error) => console.error('Location error:', error),
    { enableHighAccuracy: true }
  );
};

// Use in your camera component
useEffect(() => {
  getLocation();
}, []);
```

This enhanced method provides professional-grade photo capture with comprehensive geolocation data and distinctive MDNL branding suitable for field documentation and verification purposes.