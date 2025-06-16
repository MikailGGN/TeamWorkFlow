import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarDays, Plus, Search, Filter, Download, Edit, 
  ArrowLeft, Clock, MapPin, Users, Target, Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface ActivityPlan {
  id: number;
  date: string;
  location: string;
  activity: string;
  notes?: string;
  useremail: string;
  created_at: string;
  updated_at: string;
}

interface ActivityFormData {
  date: string;
  location: string;
  activity: string;
  notes: string;
}

export function ActivityPlanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");
  
  const [formData, setFormData] = useState<ActivityFormData>({
    date: format(new Date(), "yyyy-MM-dd"),
    location: "",
    activity: "",
    notes: ""
  });

  // Fetch activity plans
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activity-planner"],
    queryFn: () => apiRequest("/api/activity-planner"),
  });

  // Create/Update activity mutation
  const activityMutation = useMutation({
    mutationFn: (data: { method: string; url: string; body?: any }) =>
      apiRequest(data.url, { method: data.method, body: data.body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-planner"] });
      toast({
        title: "Success",
        description: editingActivity ? "Activity updated successfully" : "Activity planned successfully",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save activity",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      location: "",
      activity: "",
      notes: ""
    });
    setIsAddingActivity(false);
    setEditingActivity(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.location || !formData.activity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const method = editingActivity ? "PUT" : "POST";
    const url = editingActivity ? `/api/activity-planner/${editingActivity.id}` : "/api/activity-planner";
    
    activityMutation.mutate({
      method,
      url,
      body: formData
    });
  };

  const startEdit = (activity: ActivityPlan) => {
    setEditingActivity(activity);
    setFormData({
      date: activity.date,
      location: activity.location,
      activity: activity.activity,
      notes: activity.notes || ""
    });
    setIsAddingActivity(true);
  };

  const getActivityTypeBadge = (activity: string) => {
    const activityLower = activity.toLowerCase();
    
    if (activityLower.includes('mega')) {
      return <Badge className="bg-red-100 text-red-800">MEGA</Badge>;
    } else if (activityLower.includes('midi')) {
      return <Badge className="bg-yellow-100 text-yellow-800">MIDI</Badge>;
    } else if (activityLower.includes('mini')) {
      return <Badge className="bg-green-100 text-green-800">MINI</Badge>;
    } else if (activityLower.includes('meeting')) {
      return <Badge className="bg-blue-100 text-blue-800">Meeting</Badge>;
    } else if (activityLower.includes('training')) {
      return <Badge className="bg-purple-100 text-purple-800">Training</Badge>;
    }
    
    return <Badge variant="secondary">General</Badge>;
  };

  const filteredActivities = activities.filter((activity: ActivityPlan) => {
    const matchesSearch = 
      activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || activity.date === dateFilter;
    
    return matchesSearch && matchesDate;
  });

  const getUpcomingActivities = () => {
    const today = new Date();
    return activities.filter((activity: ActivityPlan) => new Date(activity.date) >= today);
  };

  const getTodayActivities = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    return activities.filter((activity: ActivityPlan) => activity.date === today);
  };

  const upcomingCount = getUpcomingActivities().length;
  const todayCount = getTodayActivities().length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <CalendarDays className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Activity Planner</h1>
                  <p className="text-sm text-gray-600">Schedule and coordinate field activities</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsAddingActivity(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Plan Activity
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold">{activities.length}</p>
                </div>
                <CalendarDays className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Activities</p>
                  <p className="text-2xl font-bold text-blue-600">{todayCount}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-green-600">{upcomingCount}</p>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Locations</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(activities.map((a: ActivityPlan) => a.location)).size}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Form */}
        {isAddingActivity && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingActivity ? "Edit Activity" : "Plan New Activity"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter activity location"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="activity">Activity *</Label>
                  <Select
                    value={formData.activity}
                    onValueChange={(value) => setFormData({ ...formData, activity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEGA Activity - Large Scale Campaign">MEGA Activity - Large Scale Campaign</SelectItem>
                      <SelectItem value="MIDI Activity - Medium Scale Campaign">MIDI Activity - Medium Scale Campaign</SelectItem>
                      <SelectItem value="MINI Activity - Small Scale Campaign">MINI Activity - Small Scale Campaign</SelectItem>
                      <SelectItem value="Team Meeting - Strategy Session">Team Meeting - Strategy Session</SelectItem>
                      <SelectItem value="Training Session - Skill Development">Training Session - Skill Development</SelectItem>
                      <SelectItem value="Field Survey - Data Collection">Field Survey - Data Collection</SelectItem>
                      <SelectItem value="Community Engagement - Outreach">Community Engagement - Outreach</SelectItem>
                      <SelectItem value="Equipment Distribution">Equipment Distribution</SelectItem>
                      <SelectItem value="Performance Review">Performance Review</SelectItem>
                      <SelectItem value="Territory Mapping">Territory Mapping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes, requirements, or instructions"
                    rows={3}
                  />
                </div>
                
                <div className="md:col-span-2 flex gap-2">
                  <Button
                    type="submit"
                    disabled={activityMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {activityMutation.isPending ? "Saving..." : editingActivity ? "Update Activity" : "Plan Activity"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by location or activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40"
                />
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Planned Activities ({filteredActivities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading activities...</div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No activities planned</p>
                <p className="text-sm">Plan your first activity to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities
                    .sort((a: ActivityPlan, b: ActivityPlan) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((activity: ActivityPlan) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        {format(new Date(activity.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {activity.location}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {activity.activity}
                      </TableCell>
                      <TableCell>{getActivityTypeBadge(activity.activity)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {activity.notes || (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(activity)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Today's Activities Summary */}
        {todayCount > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Today's Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTodayActivities().map((activity: ActivityPlan) => (
                  <Card key={activity.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{activity.activity}</h4>
                        {getActivityTypeBadge(activity.activity)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-3 h-3" />
                        {activity.location}
                      </div>
                      {activity.notes && (
                        <p className="text-xs text-gray-500 truncate">{activity.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}