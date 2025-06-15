import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TableLoading } from "@/components/ui/loading";
import { Plus, Clock, User, Calendar, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Attendance, InsertAttendance, User as UserType } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import moment from "moment";

interface TimeClockEntry {
  id: string;
  date: string;
  time: string;
  type: string;
  location?: any;
  employees: {
    fullnames: string;
    mobile_number: string;
    employee_id: string;
    role: string;
  };
}

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if both URL and key are available
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function AttendanceLog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeRange, setTimeRange] = useState({
    start: moment().subtract(7, 'days'),
    end: moment()
  });
  
  const [formData, setFormData] = useState({
    userId: "",
    date: new Date().toISOString().split('T')[0],
    checkIn: "",
    checkOut: "",
    status: "present",
    notes: ""
  });

  const { data: attendance, isLoading: attendanceLoading, error: attendanceError } = useQuery<TimeClockEntry[]>({
    queryKey: ["/api/time-clocked", timeRange.start.format('YYYY-MM-DD'), timeRange.end.format('YYYY-MM-DD')],
    queryFn: async () => {
      if (!supabase) {
        // Fallback to regular API when Supabase isn't configured
        const response = await fetch(`/api/attendance?date=${timeRange.start.format('YYYY-MM-DD')}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch attendance data from API');
        const fallbackData = await response.json();
        
        // Transform regular attendance data to match TimeClockEntry structure
        return fallbackData.map((record: any) => ({
          id: record.id.toString(),
          date: record.date,
          time: record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'Not recorded',
          type: 'Clock In',
          location: record.location || null,
          employees: {
            fullnames: record.user?.name || 'Unknown',
            mobile_number: 'N/A',
            employee_id: record.user?.id?.toString() || 'N/A',
            role: record.user?.role || 'N/A'
          }
        }));
      }

      const { data, error } = await supabase
        .from('time_clocked')
        .select(`
          *,
          employees:email (
            fullnames,
            mobile_number,
            employee_id,
            role
          )
        `)
        .eq('type', 'Clock In')
        .gte('date', timeRange.start.format('YYYY-MM-DD'))
        .lte('date', timeRange.end.format('YYYY-MM-DD'))
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Failed to fetch attendance data from Supabase');
      }

      return data || [];
    }
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: InsertAttendance) => {
      const response = await apiRequest("POST", "/api/attendance", attendanceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Attendance logged successfully!",
        description: "The attendance record has been created.",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to log attendance",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      userId: "",
      date: new Date().toISOString().split('T')[0],
      checkIn: "",
      checkOut: "",
      status: "present",
      notes: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const attendanceData = {
      userId: parseInt(formData.userId),
      date: new Date(formData.date),
      checkIn: formData.checkIn ? new Date(`${formData.date}T${formData.checkIn}`) : null,
      checkOut: formData.checkOut ? new Date(`${formData.date}T${formData.checkOut}`) : null,
      status: formData.status,
      notes: formData.notes || null
    };

    createAttendanceMutation.mutate(attendanceData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateHours = (checkIn: Date | null, checkOut: Date | null) => {
    if (!checkIn || !checkOut) return "N/A";
    
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Attendance Log</h1>
                <p className="text-slate-600 mt-1">Track employee attendance and working hours</p>
                {!supabase && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      Using fallback data source. Configure Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) for direct time_clocked table access.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Label className="text-sm font-medium">From:</Label>
                  <Input
                    type="date"
                    value={timeRange.start.format('YYYY-MM-DD')}
                    onChange={(e) => setTimeRange(prev => ({
                      ...prev,
                      start: moment(e.target.value)
                    }))}
                    className="w-40"
                  />
                  <Label className="text-sm font-medium">To:</Label>
                  <Input
                    type="date"
                    value={timeRange.end.format('YYYY-MM-DD')}
                    onChange={(e) => setTimeRange(prev => ({
                      ...prev,
                      end: moment(e.target.value)
                    }))}
                    className="w-40"
                  />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-primary-600 text-white hover:bg-primary-700"
                      onClick={resetForm}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Log Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Log Attendance</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Employee *</Label>
                          <Select value={formData.userId} onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                              {users?.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Date *</Label>
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Check In Time</Label>
                          <Input
                            type="time"
                            value={formData.checkIn}
                            onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Check Out Time</Label>
                          <Input
                            type="time"
                            value={formData.checkOut}
                            onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Input
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add any notes or comments"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createAttendanceMutation.isPending}>
                          {createAttendanceMutation.isPending ? "Logging..." : "Log Attendance"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-0">
              {attendanceLoading ? (
                <div className="p-6">
                  <TableLoading />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee ID</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Clock In Time</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mobile</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {attendance && attendance.length > 0 ? (
                        attendance.map((record) => (
                          <tr key={record.id}>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{record.employees?.fullnames || 'Unknown'}</p>
                                  <p className="text-sm text-slate-500">ID: {record.employees?.employee_id || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {record.employees?.employee_id || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {moment(record.date).format('MMM DD, YYYY')}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-green-500" />
                                <span>{record.time || 'Not recorded'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              <Badge variant="outline" className="capitalize">
                                {record.employees?.role || 'N/A'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {record.employees?.mobile_number || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {record.location ? JSON.stringify(record.location) : 'Not specified'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                            No attendance records found for the selected date.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
