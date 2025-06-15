import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Save, RefreshCw, Users, TrendingUp, Award, Edit2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CanvasserProductivity {
  id: string;
  email: string;
  fullName: string;
  status: string;
  dailyTarget: number;
  actualCount: number;
  gadsPoints: number;
  incentiveAmount: number;
  performanceRating: 'excellent' | 'good' | 'average' | 'poor';
  notes: string;
  lastUpdated: Date;
  updatedBy: string;
}

interface EditableCell {
  canvasserId: string;
  field: string;
  value: string | number;
}

export default function DailyCanvasserList() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const { toast } = useToast();

  // Fetch approved canvassers for the selected date
  const { data: canvassersData = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/canvassers/daily-productivity", format(selectedDate, 'yyyy-MM-dd')],
  });

  // Calculate daily metrics
  const dailyMetrics = {
    totalCanvassers: canvassersData.length,
    targetsAchieved: canvassersData.filter((c: CanvasserProductivity) => c.actualCount >= c.dailyTarget).length,
    totalGadsPoints: canvassersData.reduce((sum: number, c: CanvasserProductivity) => sum + c.gadsPoints, 0),
    totalIncentives: canvassersData.reduce((sum: number, c: CanvasserProductivity) => sum + c.incentiveAmount, 0),
    averagePerformance: canvassersData.length > 0 
      ? (canvassersData.reduce((sum: number, c: CanvasserProductivity) => sum + (c.actualCount / c.dailyTarget * 100), 0) / canvassersData.length).toFixed(1)
      : 0
  };

  // Update canvasser productivity mutation
  const updateProductivityMutation = useMutation({
    mutationFn: async ({ canvasserId, field, value }: { canvasserId: string; field: string; value: string | number }) => {
      return apiRequest({
        url: `/api/canvassers/${canvasserId}/productivity`,
        method: "PUT",
        body: { 
          date: format(selectedDate, 'yyyy-MM-dd'),
          [field]: value 
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/canvassers/daily-productivity"] });
      toast({
        title: "Updated Successfully",
        description: "Canvasser productivity data has been updated.",
      });
      setEditingCell(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update productivity data.",
        variant: "destructive",
      });
    },
  });

  const handleCellEdit = (canvasserId: string, field: string, currentValue: string | number) => {
    setEditingCell({ canvasserId, field, value: currentValue });
    setTempValue(String(currentValue));
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    
    const numericFields = ['dailyTarget', 'actualCount', 'gadsPoints', 'incentiveAmount'];
    const value = numericFields.includes(editingCell.field) 
      ? parseFloat(tempValue) || 0 
      : tempValue;

    updateProductivityMutation.mutate({
      canvasserId: editingCell.canvasserId,
      field: editingCell.field,
      value
    });
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setTempValue("");
  };

  const getPerformanceBadge = (rating: string) => {
    const variants = {
      excellent: "bg-green-100 text-green-800",
      good: "bg-blue-100 text-blue-800", 
      average: "bg-yellow-100 text-yellow-800",
      poor: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={variants[rating as keyof typeof variants] || variants.average}>
        {rating.charAt(0).toUpperCase() + rating.slice(1)}
      </Badge>
    );
  };

  const calculatePerformanceRating = (actual: number, target: number): 'excellent' | 'good' | 'average' | 'poor' => {
    const percentage = (actual / target) * 100;
    if (percentage >= 120) return 'excellent';
    if (percentage >= 100) return 'good';
    if (percentage >= 80) return 'average';
    return 'poor';
  };

  const renderEditableCell = (canvasser: CanvasserProductivity, field: string, value: string | number) => {
    const isEditing = editingCell?.canvasserId === canvasser.id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {field === 'notes' ? (
            <Textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="min-w-[200px]"
              rows={2}
            />
          ) : field === 'performanceRating' ? (
            <Select value={tempValue} onValueChange={setTempValue}>
              <SelectTrigger className="min-w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="min-w-[80px]"
              type={['dailyTarget', 'actualCount', 'gadsPoints', 'incentiveAmount'].includes(field) ? 'number' : 'text'}
            />
          )}
          <Button size="sm" onClick={handleCellSave} disabled={updateProductivityMutation.isPending}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCellCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
        onClick={() => handleCellEdit(canvasser.id, field, value)}
      >
        <span>{field === 'performanceRating' ? getPerformanceBadge(String(value)) : value}</span>
        <Edit2 className="w-3 h-3 text-slate-400" />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Daily Canvasser Productivity
        </h1>
        <p className="text-slate-600">
          Track and manage daily productivity incentives and GADs points for approved canvassers
        </p>
      </div>

      {/* Date Selection and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Date Selection</CardTitle>
              <CardDescription>Select date to view canvasser productivity</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Daily Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Canvassers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyMetrics.totalCanvassers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Targets Achieved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dailyMetrics.targetsAchieved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total GADs Points</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dailyMetrics.totalGadsPoints}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incentives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{dailyMetrics.totalIncentives.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyMetrics.averagePerformance}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Canvasser Productivity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Canvasser Productivity List</CardTitle>
          <CardDescription>
            Click on any cell to edit inline. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading canvasser data...
            </div>
          ) : canvassersData.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No approved canvassers found for {format(selectedDate, "PPP")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canvasser</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Daily Target</TableHead>
                    <TableHead>Actual Count</TableHead>
                    <TableHead>Achievement %</TableHead>
                    <TableHead>GADs Points</TableHead>
                    <TableHead>Incentive (₦)</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {canvassersData.map((canvasser: CanvasserProductivity) => {
                    const achievementPercent = canvasser.dailyTarget > 0 
                      ? ((canvasser.actualCount / canvasser.dailyTarget) * 100).toFixed(1)
                      : "0";
                    
                    return (
                      <TableRow key={canvasser.id}>
                        <TableCell className="font-medium">{canvasser.fullName}</TableCell>
                        <TableCell>{canvasser.email}</TableCell>
                        <TableCell>
                          <Badge variant={canvasser.status === 'approved' ? 'default' : 'secondary'}>
                            {canvasser.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(canvasser, 'dailyTarget', canvasser.dailyTarget)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(canvasser, 'actualCount', canvasser.actualCount)}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-semibold",
                            parseFloat(achievementPercent) >= 100 ? "text-green-600" : 
                            parseFloat(achievementPercent) >= 80 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {achievementPercent}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(canvasser, 'gadsPoints', canvasser.gadsPoints)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(canvasser, 'incentiveAmount', canvasser.incentiveAmount)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(canvasser, 'performanceRating', canvasser.performanceRating)}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {renderEditableCell(canvasser, 'notes', canvasser.notes || 'No notes')}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {canvasser.lastUpdated ? format(new Date(canvasser.lastUpdated), "MMM dd, HH:mm") : 'Never'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}