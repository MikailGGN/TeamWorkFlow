import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarDays, Plus, Search, Filter, Download, Edit, 
  ArrowLeft, Clock, MapPin, Users, Target, Calendar,
  ChevronLeft, ChevronRight, Trash2, List, Grid3X3
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth, addMonths, subMonths } from "date-fns";

// Activity Types Configuration
const ACTIVITY_TYPES = [
  { value: 'Mega Activation', label: 'Mega Activation', color: '#ffb6c1' },
  { value: 'Mini Activation', label: 'Mini Activation', color: '#87cefa' },
  { value: 'New Site Activation', label: 'New Site Activation', color: '#90ee90' },
  { value: 'New Site Launch', label: 'New Site Launch', color: '#ffa500' },
  { value: 'Service Camp', label: 'Service Camp', color: '#da70d6' }
];

interface ActivityPlan {
  id: number;
  date: string;
  location: string;
  activity: string;
  notes?: string;
  useremail: string;
  created_at: string;
  updated_at: string;
  teamId?: string;
  channels?: string;
  kitId?: string;
}

interface ActivityFormData {
  date: string;
  location: string;
  activity: string;
  notes: string;
  teamId?: string;
  channels?: string;
  kitId?: string;
}

export function ActivityPlanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("");
  
  const [formData, setFormData] = useState<ActivityFormData>({
    date: format(new Date(), "yyyy-MM-dd"),
    location: "",
    activity: "",
    notes: "",
    teamId: "",
    channels: "",
    kitId: ""
  });

  // Fetch activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activity-planner"],
    queryFn: async () => {
      const response = await fetch("/api/activity-planner", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    }
  });

  // Create/Update activity mutation
  const saveActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData & { id?: number }) => {
      const url = data.id ? `/api/activity-planner/${data.id}` : "/api/activity-planner";
      const method = data.id ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Failed to ${data.id ? 'update' : 'create'} activity`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-planner"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: editingActivity ? "Activity updated successfully!" : "Activity planned successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error saving activity", description: error.message, variant: "destructive" });
    }
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/activity-planner/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete activity');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-planner"] });
      toast({ title: "Activity deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting activity", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      location: "",
      activity: "",
      notes: "",
      teamId: "",
      channels: "",
      kitId: ""
    });
    setEditingActivity(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, date: format(date, "yyyy-MM-dd") }));
    
    // Check if there's an existing activity for this date
    const existingActivity = activities.find(
      (activity: ActivityPlan) => activity.date === format(date, "yyyy-MM-dd")
    );
    
    if (existingActivity) {
      setEditingActivity(existingActivity);
      setFormData({
        date: existingActivity.date,
        location: existingActivity.location,
        activity: existingActivity.activity,
        notes: existingActivity.notes || "",
        teamId: existingActivity.teamId || "",
        channels: existingActivity.channels || "",
        kitId: existingActivity.kitId || ""
      });
    } else {
      resetForm();
      setFormData(prev => ({ ...prev, date: format(date, "yyyy-MM-dd") }));
    }
    
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.activity) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    const dataToSave = editingActivity 
      ? { ...formData, id: editingActivity.id }
      : formData;
    
    saveActivityMutation.mutate(dataToSave);
  };

  const getActivityColor = (activityType: string) => {
    const type = ACTIVITY_TYPES.find(t => t.value === activityType);
    return type ? type.color : '#e5e7eb';
  };

  const getActivityTypeLabel = (activityType: string) => {
    const type = ACTIVITY_TYPES.find(t => t.value === activityType);
    return type ? type.label : activityType;
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date: Date) => {
    return activities.filter(
      (activity: ActivityPlan) => activity.date === format(date, "yyyy-MM-dd")
    );
  };

  // Filter activities for list view
  const filteredActivities = activities.filter((activity: ActivityPlan) => {
    const matchesSearch = !searchTerm || 
      activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.notes && activity.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !activityTypeFilter || activity.activity === activityTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Calendar rendering
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days from previous month
    const firstDayOfWeek = getDay(monthStart);
    const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const paddingDate = new Date(monthStart);
      paddingDate.setDate(paddingDate.getDate() - (firstDayOfWeek - i));
      return paddingDate;
    });
    
    const allDays = [...paddingDays, ...calendarDays];
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {allDays.map((date, index) => {
          const dayActivities = getActivitiesForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isToday_ = isToday(date);
          
          return (
            <div
              key={index}
              className={`
                min-h-[80px] p-1 border border-gray-200 dark:border-gray-700 cursor-pointer
                ${isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                ${isToday_ ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''}
                hover:bg-gray-100 dark:hover:bg-gray-800
              `}
              onClick={() => isCurrentMonth && handleDateClick(date)}
            >
              <div className={`text-sm ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'} ${isToday_ ? 'font-bold' : ''}`}>
                {format(date, 'd')}
              </div>
              
              {/* Activity indicators */}
              <div className="mt-1 space-y-1">
                {dayActivities.slice(0, 2).map((activity: ActivityPlan, actIndex) => (
                  <div
                    key={actIndex}
                    className="text-xs p-1 rounded truncate text-white"
                    style={{ backgroundColor: getActivityColor(activity.activity) }}
                    title={`${activity.activity} - ${activity.location}`}
                  >
                    {activity.location}
                  </div>
                ))}
                {dayActivities.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayActivities.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Activity Planner</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      {/* Activity Types Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Activity Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ACTIVITY_TYPES.map((type) => (
              <Badge
                key={type.value}
                variant="secondary"
                className="text-white"
                style={{ backgroundColor: type.color }}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderCalendar()}
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Activities</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by location, activity, or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-64">
                  <Label htmlFor="activity-filter">Activity Type</Label>
                  <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities Table */}
          <Card>
            <CardHeader>
              <CardTitle>Planned Activities ({filteredActivities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading activities...</div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No activities found. Click a date on the calendar to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Activity Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity: ActivityPlan) => (
                      <TableRow key={activity.id}>
                        <TableCell>{format(new Date(activity.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-white"
                            style={{ backgroundColor: getActivityColor(activity.activity) }}
                          >
                            {getActivityTypeLabel(activity.activity)}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {activity.location}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {activity.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingActivity(activity);
                                setFormData({
                                  date: activity.date,
                                  location: activity.location,
                                  activity: activity.activity,
                                  notes: activity.notes || "",
                                  teamId: activity.teamId || "",
                                  channels: activity.channels || "",
                                  kitId: activity.kitId || ""
                                });
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteActivityMutation.mutate(activity.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Edit Activity' : 'Plan New Activity'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="activity">Activity Type</Label>
              <Select value={formData.activity} onValueChange={(value) => setFormData(prev => ({ ...prev, activity: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or details"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={saveActivityMutation.isPending}
                className="flex-1"
              >
                {saveActivityMutation.isPending ? 'Saving...' : editingActivity ? 'Update Activity' : 'Plan Activity'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}