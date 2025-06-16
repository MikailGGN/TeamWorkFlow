import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, AlertCircle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { apiRequest } from '@/lib/queryClient';
import type { Task, InsertTask, Team, ActivityPlanner, InsertActivityPlanner, Employee } from '@shared/schema';

// Activity types with colors matching the enhanced activity planner
const ACTIVITY_TYPES = [
  { value: 'Mega Activation', label: 'Mega Activation', color: '#ffb6c1' },
  { value: 'Mini Activation', label: 'Mini Activation', color: '#87cefa' },
  { value: 'New Site Activation', label: 'New Site Activation', color: '#90ee90' },
  { value: 'New Site Launch', label: 'New Site Launch', color: '#ffa500' },
  { value: 'Service Camp', label: 'Service Camp', color: '#da70d6' }
];

// Task priority levels
const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626' }
];

// Task status options
const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#6b7280' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' }
];

function TableLoading() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  );
}

export default function TaskManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamId: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    assignedProfile: ''
  });

  const [activityFormData, setActivityFormData] = useState({
    location: '',
    activity: '',
    notes: '',
    date: '',
    userEmail: ''
  });

  // Fetch teams
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
  });

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  // Fetch activity plans for the current month
  const { data: activityPlans, isLoading: activityPlansLoading } = useQuery({
    queryKey: ['/api/activity-planner', currentMonth, currentYear],
    queryFn: async () => {
      const response = await fetch(`/api/activity-planner`);
      if (!response.ok) throw new Error('Failed to fetch activity plans');
      return response.json();
    }
  });

  // Fetch employees for email assignment
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: InsertTask) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...taskData }: { id: number } & Partial<InsertTask>) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      setIsDialogOpen(false);
      setEditingTask(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (activityData: InsertActivityPlanner) => {
      const response = await apiRequest("POST", "/api/activity-planner", activityData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-planner", currentMonth, currentYear] });
      toast({
        title: "Success",
        description: "Activity scheduled successfully",
      });
      setIsActivityDialogOpen(false);
      setActivityFormData({ location: "", activity: "", notes: "", date: "", userEmail: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule activity",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      teamId: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
      assignedProfile: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.teamId) return;

    const taskData: InsertTask = {
      title: formData.title,
      description: formData.description || null,
      teamId: parseInt(formData.teamId),
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
      assignedProfile: formData.assignedProfile || null,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, ...taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      teamId: task.teamId?.toString() || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      assignedTo: task.assignedTo?.toString() || '',
      assignedProfile: task.assignedProfile || ''
    });
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityColor = (activityType: string) => {
    return ACTIVITY_TYPES.find(a => a.value === activityType)?.color || '#ffffff';
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20" />);
    }

    // Cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const plan = activityPlans?.find((p: any) => p.date === date);
      const isToday = date === new Date().toISOString().split('T')[0];

      days.push(
        <Card 
          key={`day-${day}`} 
          className={`h-20 cursor-pointer transition-colors ${isToday ? 'ring-2 ring-blue-500' : ''}`}
          style={{ backgroundColor: plan ? getActivityColor(plan.activity) : '#ffffff' }}
          onClick={() => {
            setActivityFormData({
              location: plan?.location || '',
              activity: plan?.activity || '',
              notes: plan?.notes || '',
              date,
              userEmail: plan?.userEmail || ''
            });
            setIsActivityDialogOpen(true);
          }}
        >
          <CardContent className="p-2 h-full flex flex-col">
            <div className="font-semibold text-sm">{day}</div>
            {plan && (
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-medium truncate">{plan.activity}</div>
                <div className="text-xs text-gray-600 truncate">{plan.location}</div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return days;
  };

  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityFormData.activity || !activityFormData.location) return;
    
    createActivityMutation.mutate(activityFormData);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Task & Activity Management</h1>
                <p className="text-slate-600 mt-1">Manage tasks and schedule activities with calendar planning</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Task Management</TabsTrigger>
              <TabsTrigger value="calendar">Activity Planner</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-primary-600 text-white hover:bg-primary-700"
                      onClick={() => {
                        resetForm();
                        setEditingTask(null);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTask ? "Edit Task" : "Create New Task"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Task Title *</Label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter task title"
                            required
                          />
                        </div>
                        <div>
                          <Label>Team *</Label>
                          <Select value={formData.teamId} onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(teams) && teams.map((team: any) => (
                                <SelectItem key={team.id} value={team.id.toString()}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter task description"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Status</Label>
                          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Priority</Label>
                          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            setEditingTask(null);
                            resetForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={
                            createTaskMutation.isPending || 
                            updateTaskMutation.isPending || 
                            !formData.title.trim() || 
                            !formData.teamId
                          }
                        >
                          {createTaskMutation.isPending || updateTaskMutation.isPending
                            ? "Saving..."
                            : (editingTask ? "Update Task" : "Create Task")
                          }
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-0">
                  {tasksLoading ? (
                    <div className="p-6">
                      <TableLoading />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Task</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {Array.isArray(tasks) && tasks.length > 0 ? (
                            tasks.map((task: any) => {
                              const team = Array.isArray(teams) ? teams.find((t: any) => t.id === task.teamId) : null;
                              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                              
                              return (
                                <tr key={task.id}>
                                  <td className="px-6 py-4">
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <p className="font-medium text-slate-900">{task.title}</p>
                                        {isOverdue && (
                                          <AlertCircle className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      {task.description && (
                                        <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-900">
                                    {team?.name || "No Team"}
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge className={getStatusColor(task.status)}>
                                      {task.status.replace('_', ' ')}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-900">
                                    {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date'}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex space-x-2">
                                      <Button 
                                        onClick={() => handleEdit(task)}
                                        variant="ghost" 
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                No tasks found. Create your first task to get started.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Activity Planner</CardTitle>
                      <p className="text-sm text-muted-foreground">Schedule field activities with calendar view</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleMonthChange('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="font-semibold min-w-[120px] text-center">
                        {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h3>
                      <Button variant="outline" size="sm" onClick={() => handleMonthChange('next')}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendarDays()}
                  </div>

                  {/* Activity Legend */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">Activity Types</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {ACTIVITY_TYPES.map(type => (
                        <div key={type.value} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="text-sm">{type.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity List */}
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activityPlans && activityPlans.length > 0 ? (
                      activityPlans.map((plan: any) => (
                        <div 
                          key={plan.id} 
                          className="p-3 rounded-lg border"
                          style={{ backgroundColor: getActivityColor(plan.activity) + '20' }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{plan.activity}</div>
                              <div className="text-sm text-muted-foreground">{plan.location}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(plan.date), 'MMM dd, yyyy')}
                              </div>
                              {plan.notes && (
                                <div className="text-sm mt-1">{plan.notes}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No activities scheduled. Click on a calendar date to add an activity.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Activity Dialog */}
          <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {activityFormData.date ? `Schedule Activity for ${format(new Date(activityFormData.date), 'MMM dd, yyyy')}` : 'Schedule Activity'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleActivitySubmit} className="space-y-4">
                <div>
                  <Label>Activity Type *</Label>
                  <Select 
                    value={activityFormData.activity} 
                    onValueChange={(value) => setActivityFormData(prev => ({ ...prev, activity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Location *</Label>
                  <Input
                    value={activityFormData.location}
                    onChange={(e) => setActivityFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div>
                  <Label>Assigned Employee Email</Label>
                  <Select 
                    value={activityFormData.userEmail} 
                    onValueChange={(value) => setActivityFormData(prev => ({ ...prev, userEmail: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(employees) && employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.email}>
                          {employee.email} ({employee.fullName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={activityFormData.notes}
                    onChange={(e) => setActivityFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsActivityDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createActivityMutation.isPending || !activityFormData.activity || !activityFormData.location}
                  >
                    {createActivityMutation.isPending ? "Scheduling..." : "Schedule Activity"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}