import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown, Target, Award, Filter, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { apiRequest } from '@/lib/queryClient';
import type { OkrTarget, InsertOkrTarget, OkrActual, InsertOkrActual, Team, Employee } from '@shared/schema';

interface OKRTableRow {
  id: string;
  period: string;
  team: string;
  fae: string;
  region: string;
  activityType: string;
  channel: string;
  expectedSales: number;
  actualSales: number;
  salesVariance: number;
  salesPercentage: number;
  targetUnits: number;
  actualUnits: number;
  unitsVariance: number;
  unitsPercentage: number;
  targetRevenue: number;
  actualRevenue: number;
  revenueVariance: number;
  revenuePercentage: number;
  status: 'exceeded' | 'met' | 'below' | 'pending';
}

const PERIODS = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const ACTIVITY_TYPES = [
  'MEGA_ROADSHOW',
  'MIDI_ACTIVATION', 
  'MINI_BOOTH',
  'DOOR_TO_DOOR',
  'CORPORATE_VISIT',
  'TRAINING_SESSION',
  'FIELD_SURVEY',
  'COMMUNITY_EVENT'
];
const CHANNELS = ['Direct Sales', 'Online', 'Retail Partners', 'Distributors', 'Events'];

function TableLoading() {
  return (
    <div className="animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-4">
          <div className="h-4 bg-slate-200 rounded w-1/12"></div>
          <div className="h-4 bg-slate-200 rounded w-1/12"></div>
          <div className="h-4 bg-slate-200 rounded w-1/12"></div>
          <div className="h-4 bg-slate-200 rounded w-1/12"></div>
          <div className="h-4 bg-slate-200 rounded w-1/12"></div>
          <div className="h-4 bg-slate-200 rounded w-1/12"></div>
          <div className="h-4 bg-slate-200 rounded w-1/12"></div>
          <div className="h-4 bg-slate-200 rounded w-1/12"></div>
          <div className="h-4 bg-slate-200 rounded w-1/12"></div>
        </div>
      ))}
    </div>
  );
}

export default function OKRDashboard() {
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [isActualDialogOpen, setIsActualDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Q4 2024');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [targetFormData, setTargetFormData] = useState({
    period: 'Q4 2024',
    teamId: '',
    faeId: '',
    region: '',
    activityType: '',
    channel: '',
    expectedSales: '',
    targetUnits: '',
    targetRevenue: ''
  });

  const [actualFormData, setActualFormData] = useState({
    okrTargetId: '',
    period: 'Q4 2024',
    actualSales: '',
    actualUnits: '',
    actualRevenue: ''
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
  });

  // Fetch employees 
  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch OKR targets
  const { data: okrTargets, isLoading: targetsLoading } = useQuery({
    queryKey: ['/api/okr-targets'],
    queryFn: async () => {
      const response = await fetch('/api/okr-targets');
      if (!response.ok) throw new Error('Failed to fetch OKR targets');
      return response.json();
    }
  });

  // Fetch OKR actuals
  const { data: okrActuals } = useQuery({
    queryKey: ['/api/okr-actuals'],
    queryFn: async () => {
      const response = await fetch('/api/okr-actuals');
      if (!response.ok) throw new Error('Failed to fetch OKR actuals');
      return response.json();
    }
  });

  const createTargetMutation = useMutation({
    mutationFn: async (targetData: InsertOkrTarget) => {
      const response = await apiRequest("POST", "/api/okr-targets", targetData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/okr-targets"] });
      toast({
        title: "Success",
        description: "OKR target created successfully",
      });
      setIsTargetDialogOpen(false);
      resetTargetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create OKR target",
        variant: "destructive",
      });
    },
  });

  const createActualMutation = useMutation({
    mutationFn: async (actualData: InsertOkrActual) => {
      const response = await apiRequest("POST", "/api/okr-actuals", actualData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/okr-actuals"] });
      toast({
        title: "Success",
        description: "OKR actual result recorded successfully",
      });
      setIsActualDialogOpen(false);
      resetActualForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record OKR actual result",
        variant: "destructive",
      });
    },
  });

  const resetTargetForm = () => {
    setTargetFormData({
      period: 'Q4 2024',
      teamId: '',
      faeId: '',
      region: '',
      activityType: '',
      channel: '',
      expectedSales: '',
      targetUnits: '',
      targetRevenue: ''
    });
  };

  const resetActualForm = () => {
    setActualFormData({
      okrTargetId: '',
      period: 'Q4 2024',
      actualSales: '',
      actualUnits: '',
      actualRevenue: ''
    });
  };

  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFormData.period || !targetFormData.region || !targetFormData.activityType || !targetFormData.channel) return;

    const targetData: InsertOkrTarget = {
      period: targetFormData.period,
      teamId: targetFormData.teamId ? parseInt(targetFormData.teamId) : null,
      faeId: targetFormData.faeId || null,
      region: targetFormData.region,
      activityType: targetFormData.activityType,
      channel: targetFormData.channel,
      expectedSales: targetFormData.expectedSales,
      targetUnits: parseInt(targetFormData.targetUnits),
      targetRevenue: targetFormData.targetRevenue,
    };

    createTargetMutation.mutate(targetData);
  };

  const handleActualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualFormData.okrTargetId || !actualFormData.period) return;

    const actualData: InsertOkrActual = {
      okrTargetId: parseInt(actualFormData.okrTargetId),
      period: actualFormData.period,
      actualSales: actualFormData.actualSales,
      actualUnits: parseInt(actualFormData.actualUnits),
      actualRevenue: actualFormData.actualRevenue,
    };

    createActualMutation.mutate(actualData);
  };

  // Process OKR data for table display
  const processOKRData = (): OKRTableRow[] => {
    if (!okrTargets || !Array.isArray(okrTargets)) return [];

    return okrTargets.map((target: any) => {
      const actual = Array.isArray(okrActuals) ? okrActuals.find((a: any) => a.okrTargetId === target.id) : null;
      const team = Array.isArray(teams) ? teams.find((t: any) => t.id === target.teamId) : null;
      const fae = Array.isArray(employees) ? employees.find((e: any) => e.id === target.faeId) : null;

      const actualSales = actual ? parseFloat(actual.actualSales) : 0;
      const expectedSales = parseFloat(target.expectedSales);
      const salesVariance = actualSales - expectedSales;
      const salesPercentage = expectedSales > 0 ? ((actualSales / expectedSales) - 1) * 100 : 0;

      const actualUnits = actual ? actual.actualUnits : 0;
      const targetUnits = target.targetUnits;
      const unitsVariance = actualUnits - targetUnits;
      const unitsPercentage = targetUnits > 0 ? ((actualUnits / targetUnits) - 1) * 100 : 0;

      const actualRevenue = actual ? parseFloat(actual.actualRevenue) : 0;
      const targetRevenue = parseFloat(target.targetRevenue);
      const revenueVariance = actualRevenue - targetRevenue;
      const revenuePercentage = targetRevenue > 0 ? ((actualRevenue / targetRevenue) - 1) * 100 : 0;

      let status: 'exceeded' | 'met' | 'below' | 'pending' = 'pending';
      if (actual) {
        const avgPerformance = (salesPercentage + unitsPercentage + revenuePercentage) / 3;
        if (avgPerformance >= 10) status = 'exceeded';
        else if (avgPerformance >= -5) status = 'met';
        else status = 'below';
      }

      return {
        id: target.id.toString(),
        period: target.period,
        team: team?.name || 'N/A',
        fae: fae?.fullName || 'N/A',
        region: target.region,
        activityType: target.activityType,
        channel: target.channel,
        expectedSales,
        actualSales,
        salesVariance,
        salesPercentage,
        targetUnits,
        actualUnits,
        unitsVariance,
        unitsPercentage,
        targetRevenue,
        actualRevenue,
        revenueVariance,
        revenuePercentage,
        status,
      };
    });
  };

  const okrData = processOKRData();

  // Filter data based on selected filters
  const filteredData = okrData.filter(row => {
    if (selectedPeriod && row.period !== selectedPeriod) return false;
    if (selectedRegion && row.region !== selectedRegion) return false;
    if (selectedActivityType && row.activityType !== selectedActivityType) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <Badge className="bg-green-100 text-green-800">Exceeded</Badge>;
      case 'met':
        return <Badge className="bg-blue-100 text-blue-800">Met</Badge>;
      case 'below':
        return <Badge className="bg-red-100 text-red-800">Below Target</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getPercentageIndicator = (percentage: number) => {
    const isPositive = percentage >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        {icon}
        <span className="font-medium">{Math.abs(percentage).toFixed(1)}%</span>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Calculate summary metrics
  const summaryMetrics = {
    totalTargets: filteredData.length,
    targetsExceeded: filteredData.filter(row => row.status === 'exceeded').length,
    targetsMet: filteredData.filter(row => row.status === 'met').length,
    targetsBelow: filteredData.filter(row => row.status === 'below').length,
    avgSalesPerformance: filteredData.reduce((sum, row) => sum + row.salesPercentage, 0) / filteredData.length || 0,
    avgRevenuePerformance: filteredData.reduce((sum, row) => sum + row.revenuePercentage, 0) / filteredData.length || 0,
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">OKR Performance Dashboard</h1>
                <p className="text-slate-600 mt-1">Track expected vs actual sales performance by team, FAE, and region</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      <Target className="w-4 h-4 mr-2" />
                      Set Target
                    </Button>
                  </DialogTrigger>
                </Dialog>
                
                <Dialog open={isActualDialogOpen} onOpenChange={setIsActualDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 text-white hover:bg-green-700">
                      <Award className="w-4 h-4 mr-2" />
                      Record Actual
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.totalTargets}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Targets Exceeded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summaryMetrics.targetsExceeded}</div>
                <div className="text-xs text-gray-500">
                  {summaryMetrics.totalTargets > 0 ? Math.round((summaryMetrics.targetsExceeded / summaryMetrics.totalTargets) * 100) : 0}% of total
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Sales Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getPercentageIndicator(summaryMetrics.avgSalesPerformance)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Revenue Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getPercentageIndicator(summaryMetrics.avgRevenuePerformance)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="All periods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Periods</SelectItem>
                      {PERIODS.map(period => (
                        <SelectItem key={period} value={period}>{period}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Region</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="All regions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Regions</SelectItem>
                      {REGIONS.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Activity Type</Label>
                  <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All activities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Activities</SelectItem>
                      {ACTIVITY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OKR Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>OKR Performance Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {targetsLoading ? (
                <div className="p-6">
                  <TableLoading />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Period</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Team</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">FAE</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Region</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Activity</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Channel</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Expected Sales</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Actual Sales</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Sales %</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Target Units</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Actual Units</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Units %</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Target Revenue</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Actual Revenue</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Revenue %</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">{row.period}</td>
                          <td className="px-4 py-3">{row.team}</td>
                          <td className="px-4 py-3">{row.fae}</td>
                          <td className="px-4 py-3">{row.region}</td>
                          <td className="px-4 py-3">{row.activityType.replace('_', ' ')}</td>
                          <td className="px-4 py-3">{row.channel}</td>
                          <td className="px-4 py-3 text-center">{formatCurrency(row.expectedSales)}</td>
                          <td className="px-4 py-3 text-center">{formatCurrency(row.actualSales)}</td>
                          <td className="px-4 py-3 text-center">{getPercentageIndicator(row.salesPercentage)}</td>
                          <td className="px-4 py-3 text-center">{formatNumber(row.targetUnits)}</td>
                          <td className="px-4 py-3 text-center">{formatNumber(row.actualUnits)}</td>
                          <td className="px-4 py-3 text-center">{getPercentageIndicator(row.unitsPercentage)}</td>
                          <td className="px-4 py-3 text-center">{formatCurrency(row.targetRevenue)}</td>
                          <td className="px-4 py-3 text-center">{formatCurrency(row.actualRevenue)}</td>
                          <td className="px-4 py-3 text-center">{getPercentageIndicator(row.revenuePercentage)}</td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(row.status)}</td>
                        </tr>
                      ))}
                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan={16} className="px-4 py-8 text-center text-slate-500">
                            No OKR data found. Set targets and record actual results to begin tracking performance.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Setting Dialog */}
          <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Set OKR Target</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTargetSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Period *</Label>
                    <Select value={targetFormData.period} onValueChange={(value) => setTargetFormData(prev => ({ ...prev, period: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODS.map(period => (
                          <SelectItem key={period} value={period}>{period}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Team</Label>
                    <Select value={targetFormData.teamId} onValueChange={(value) => setTargetFormData(prev => ({ ...prev, teamId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(teams) && teams.map((team: any) => (
                          <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>FAE</Label>
                    <Select value={targetFormData.faeId} onValueChange={(value) => setTargetFormData(prev => ({ ...prev, faeId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select FAE" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(employees) && employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id}>{employee.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Region *</Label>
                    <Select value={targetFormData.region} onValueChange={(value) => setTargetFormData(prev => ({ ...prev, region: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Activity Type *</Label>
                    <Select value={targetFormData.activityType} onValueChange={(value) => setTargetFormData(prev => ({ ...prev, activityType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Channel *</Label>
                    <Select value={targetFormData.channel} onValueChange={(value) => setTargetFormData(prev => ({ ...prev, channel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNELS.map(channel => (
                          <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Expected Sales *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={targetFormData.expectedSales}
                      onChange={(e) => setTargetFormData(prev => ({ ...prev, expectedSales: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Target Units *</Label>
                    <Input
                      type="number"
                      value={targetFormData.targetUnits}
                      onChange={(e) => setTargetFormData(prev => ({ ...prev, targetUnits: e.target.value }))}
                      placeholder="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Target Revenue *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={targetFormData.targetRevenue}
                      onChange={(e) => setTargetFormData(prev => ({ ...prev, targetRevenue: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsTargetDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createTargetMutation.isPending}
                  >
                    {createTargetMutation.isPending ? "Setting..." : "Set Target"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Actual Results Dialog */}
          <Dialog open={isActualDialogOpen} onOpenChange={setIsActualDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Record Actual Results</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleActualSubmit} className="space-y-4">
                <div>
                  <Label>Target *</Label>
                  <Select value={actualFormData.okrTargetId} onValueChange={(value) => setActualFormData(prev => ({ ...prev, okrTargetId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(okrTargets) && okrTargets.map((target: any) => (
                        <SelectItem key={target.id} value={target.id.toString()}>
                          {target.period} - {target.region} - {target.activityType.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Period *</Label>
                  <Select value={actualFormData.period} onValueChange={(value) => setActualFormData(prev => ({ ...prev, period: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map(period => (
                        <SelectItem key={period} value={period}>{period}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Actual Sales *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={actualFormData.actualSales}
                      onChange={(e) => setActualFormData(prev => ({ ...prev, actualSales: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Actual Units *</Label>
                    <Input
                      type="number"
                      value={actualFormData.actualUnits}
                      onChange={(e) => setActualFormData(prev => ({ ...prev, actualUnits: e.target.value }))}
                      placeholder="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Actual Revenue *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={actualFormData.actualRevenue}
                      onChange={(e) => setActualFormData(prev => ({ ...prev, actualRevenue: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsActualDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createActualMutation.isPending}
                  >
                    {createActualMutation.isPending ? "Recording..." : "Record Results"}
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