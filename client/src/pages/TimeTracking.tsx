import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { createSupabaseClient } from '../../../server/supabase-config';

interface Location {
  lat: number;
  lon: number;
}

interface TimeEntry {
  id: number;
  useremail: string;
  type: string;
  time: string;
  date: string;
  day: string;
  location: string;
  created_at: string;
}

const TimeTracking: React.FC = () => {
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Get current user email from localStorage
    const userEmail = localStorage.getItem("userEmail");
    setCurrentUser(userEmail);
    
    if (userEmail) {
      fetchTodayEntries(userEmail);
    }
  }, []);

  // Get user's current location
  const getLocation = (): Promise<Location | null> => {
    return new Promise((resolve) => {
      setIsLocationLoading(true);
      setLocationError(null);

      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by this browser");
        setIsLocationLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setIsLocationLoading(false);
          resolve(loc);
        },
        (error) => {
          let errorMessage = "Location access denied";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          setLocationError(errorMessage);
          setIsLocationLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  // Fetch today's time entries for the current user
  const fetchTodayEntries = async (userEmail: string) => {
    try {
      if (!supabase) {
        throw new Error("Database connection not available");
      }

      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("time_clocked")
        .select("*")
        .eq("useremail", userEmail)
        .eq("date", today)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setTodayEntries(data || []);
      
      // Set current clock status based on entries
      const entries = data || [];
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        if (lastEntry.type === "Clock In") {
          setClockInTime(lastEntry.time);
          setClockOutTime(null);
        } else if (lastEntry.type === "Clock Out") {
          setClockOutTime(lastEntry.time);
        }
      }
    } catch (err: any) {
      console.error("Error fetching today's entries:", err);
    }
  };

  // Save clock activity to database
  const saveClockActivity = async (useremail: string, type: string, time: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const loc = await getLocation();
      if (!loc) throw new Error("Location not available.");

      setLocation(loc);

      if (!supabase) {
        throw new Error("Database connection not available");
      }

      const { error } = await supabase.from("time_clocked").insert([
        {
          useremail,
          type,
          time,
          date: new Date().toISOString().split("T")[0],
          day: new Date().toLocaleString("en-US", { weekday: "long" }),
          location: `${loc.lat}, ${loc.lon}`,
        },
      ]);

      if (error) throw error;

      // Refresh today's entries after successful insert
      await fetchTodayEntries(useremail);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle clock-in
  const handleClockIn = async () => {
    if (!currentUser) {
      setError("User email not found. Please log in again.");
      return;
    }

    const now = new Date().toLocaleTimeString();
    setClockInTime(now);
    await saveClockActivity(currentUser, "Clock In", now);
  };

  // Handle clock-out
  const handleClockOut = async () => {
    if (!currentUser) {
      setError("User email not found. Please log in again.");
      return;
    }

    const now = new Date().toLocaleTimeString();
    setClockOutTime(now);
    await saveClockActivity(currentUser, "Clock Out", now);
  };

  // Check if user is currently clocked in
  const isCurrentlyClockedIn = () => {
    if (todayEntries.length === 0) return false;
    const lastEntry = todayEntries[todayEntries.length - 1];
    return lastEntry.type === "Clock In";
  };

  // Calculate total hours worked today
  const calculateHoursWorked = () => {
    if (todayEntries.length < 2) return "0:00";
    
    let totalMinutes = 0;
    for (let i = 0; i < todayEntries.length; i += 2) {
      const clockIn = todayEntries[i];
      const clockOut = todayEntries[i + 1];
      
      if (clockIn && clockOut && clockIn.type === "Clock In" && clockOut.type === "Clock Out") {
        const inTime = new Date(`1970-01-01T${clockIn.time}`);
        const outTime = new Date(`1970-01-01T${clockOut.time}`);
        const diffMinutes = (outTime.getTime() - inTime.getTime()) / (1000 * 60);
        totalMinutes += diffMinutes;
      }
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Tracking</h1>
          <p className="text-gray-600">Track your work hours with location verification</p>
        </div>

        {/* Current Status Card */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {new Date().toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">Today's Date</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {calculateHoursWorked()}
                </div>
                <div className="text-sm text-gray-500">Hours Worked</div>
              </div>
              <div className="text-center">
                <Badge variant={isCurrentlyClockedIn() ? "default" : "secondary"} className="text-sm">
                  {isCurrentlyClockedIn() ? "Clocked In" : "Clocked Out"}
                </Badge>
              </div>
            </div>

            {/* User Info */}
            {currentUser && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Logged in as: {currentUser}</span>
              </div>
            )}

            {/* Location Status */}
            {isLocationLoading && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-700">Getting your location...</span>
              </div>
            )}

            {location && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">
                  Location verified: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                </span>
              </div>
            )}

            {locationError && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-lg">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{locationError}</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-lg">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Clock In/Out Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleClockIn}
                disabled={loading || isCurrentlyClockedIn()}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Clock In
              </Button>
              
              <Button
                onClick={handleClockOut}
                disabled={loading || !isCurrentlyClockedIn()}
                variant="destructive"
                className="px-8 py-3"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Clock Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEntries.length > 0 ? (
              <div className="space-y-3">
                {todayEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.type === "Clock In" ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {entry.type === "Clock In" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">{entry.type}</div>
                        <div className="text-sm text-gray-500">{entry.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{entry.day}</div>
                      <div className="text-xs text-gray-400">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Location verified
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No time entries for today</p>
                <p className="text-sm">Clock in to start tracking your time</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">How to Use Time Tracking</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Allow location access when prompted for accurate time tracking</li>
              <li>Click "Clock In" when you start your work day</li>
              <li>Your location will be automatically recorded with each entry</li>
              <li>Click "Clock Out" when you finish work or take a break</li>
              <li>You can clock in and out multiple times throughout the day</li>
              <li>Your total hours worked will be calculated automatically</li>
              <li>All entries are saved to the database with location verification</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimeTracking;