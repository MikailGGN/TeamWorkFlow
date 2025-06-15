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
import { Plus, Clock, User, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Attendance, InsertAttendance, User as UserType } from "@shared/schema";

interface AttendanceWithUser extends Attendance {
  user: UserType;
}

export default function AttendanceLog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    userId: "",
    date: new Date().toISOString().split('T')[0],
    checkIn: "",
    checkOut: "",
    status: "present",
    notes: ""
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery<AttendanceWithUser[]>({
    queryKey: ["/api/attendance", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/attendance${selectedDate ? `?date=${selectedDate}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
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
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
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
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Check Out</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hours</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
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
                                  <p className="font-medium text-slate-900">{record.user.name}</p>
                                  <p className="text-sm text-slate-500">{record.user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {record.checkIn ? (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4 text-green-500" />
                                  <span>{new Date(record.checkIn).toLocaleTimeString()}</span>
                                </div>
                              ) : (
                                "Not recorded"
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {record.checkOut ? (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4 text-red-500" />
                                  <span>{new Date(record.checkOut).toLocaleTimeString()}</span>
                                </div>
                              ) : (
                                "Not recorded"
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {calculateHours(record.checkIn, record.checkOut)}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={getStatusColor(record.status)}>
                                {record.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {record.notes || "No notes"}
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
