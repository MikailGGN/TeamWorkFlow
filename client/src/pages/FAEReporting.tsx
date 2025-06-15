import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Users, Target, Download, Filter, BarChart3, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, dbApi } from '@/lib/supabase';

interface FAEPerformance {
  fae_email: string;
  fae_name: string;
  date: string;
  total_gads: number;
  total_smartphone_activation: number;
  total_others: number;
  total_activities: number;
  canvassers_managed: number;
  avg_performance_per_canvasser: number;
}

interface DailyReport {
  date: string;
  gads: number;
  smartphone_activation: number;
  others: number;
  total: number;
  canvassers_active: number;
}

interface MonthlyReport {
  month: string;
  year: number;
  total_gads: number;
  total_smartphone_activation: number;
  total_others: number;
  total_activities: number;
  avg_daily_performance: number;
  best_performing_day: string;
  canvassers_managed: number;
}

const FAEReporting: React.FC = () => {
  const [selectedFAE, setSelectedFAE] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [faeList, setFAEList] = useState<Array<{email: string, name: string}>>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    setCurrentUser(userEmail);
    setSelectedFAE(userEmail || '');
    fetchFAEList();
    generateReport();
  }, []);

  useEffect(() => {
    if (selectedFAE) {
      generateReport();
    }
  }, [selectedFAE, startDate, endDate, reportType]);

  const fetchFAEList = async () => {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("employees")
        .select("email, full_name")
        .eq("role", "FAE");

      if (error) throw error;
      setFAEList(data?.map(emp => ({ email: emp.email, name: emp.full_name })) || []);
    } catch (err: any) {
      console.error("Error fetching FAE list:", err);
    }
  };

  const generateReport = async () => {
    if (!selectedFAE) return;

    try {
      setLoading(true);
      
      if (!supabase) {
        // Fallback to API when Supabase client not available
        const reportData = await dbApi.post('/performance-report', {
          fae_email: selectedFAE,
          start_date: startDate,
          end_date: endDate,
          report_type: reportType
        });
        
        setDailyReports(reportData.daily_reports || []);
        setMonthlyReports(reportData.monthly_reports || []);
        return;
      }

      // Generate daily performance reports
      const { data: performanceData, error } = await supabase
        .from("canvasser_performance")
        .select("*")
        .eq("recorded_by", selectedFAE)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) throw error;

      // Aggregate data by date
      const dailyAggregates = new Map<string, DailyReport>();
      
      performanceData?.forEach(record => {
        const existing = dailyAggregates.get(record.date) || {
          date: record.date,
          gads: 0,
          smartphone_activation: 0,
          others: 0,
          total: 0,
          canvassers_active: 0
        };

        existing.gads += record.gads || 0;
        existing.smartphone_activation += record.smartphone_activation || 0;
        existing.others += record.others || 0;
        existing.total += (record.gads || 0) + (record.smartphone_activation || 0) + (record.others || 0);
        existing.canvassers_active += 1;

        dailyAggregates.set(record.date, existing);
      });

      const dailyReportsData = Array.from(dailyAggregates.values());
      setDailyReports(dailyReportsData);

      // Generate monthly aggregates
      const monthlyAggregates = new Map<string, MonthlyReport>();
      
      dailyReportsData.forEach(dailyReport => {
        const date = new Date(dailyReport.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existing = monthlyAggregates.get(monthKey) || {
          month: new Date(date.getFullYear(), date.getMonth()).toLocaleDateString('en-US', { month: 'long' }),
          year: date.getFullYear(),
          total_gads: 0,
          total_smartphone_activation: 0,
          total_others: 0,
          total_activities: 0,
          avg_daily_performance: 0,
          best_performing_day: '',
          canvassers_managed: 0
        };

        existing.total_gads += dailyReport.gads;
        existing.total_smartphone_activation += dailyReport.smartphone_activation;
        existing.total_others += dailyReport.others;
        existing.total_activities += dailyReport.total;
        existing.canvassers_managed = Math.max(existing.canvassers_managed, dailyReport.canvassers_active);

        monthlyAggregates.set(monthKey, existing);
      });

      // Calculate averages and best performing days
      monthlyAggregates.forEach((monthlyReport, monthKey) => {
        const monthlyDays = dailyReportsData.filter(daily => {
          const date = new Date(daily.date);
          const dailyMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return dailyMonthKey === monthKey;
        });

        if (monthlyDays.length > 0) {
          monthlyReport.avg_daily_performance = Math.round(monthlyReport.total_activities / monthlyDays.length);
          
          const bestDay = monthlyDays.reduce((prev, current) => 
            current.total > prev.total ? current : prev
          );
          monthlyReport.best_performing_day = new Date(bestDay.date).toLocaleDateString();
        }
      });

      const monthlyReportsData = Array.from(monthlyAggregates.values());
      setMonthlyReports(monthlyReportsData);

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to generate performance report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvData = dailyReports.map(report => [
      report.date,
      report.gads,
      report.smartphone_activation,
      report.others,
      report.total,
      report.canvassers_active
    ]);

    const csvContent = [
      ['Date', 'GADs', 'SmartPhone Activation', 'Others', 'Total Activities', 'Active Canvassers'],
      ...csvData
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `fae-performance-${selectedFAE}-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Performance report exported successfully",
    });
  };

  const getTotals = () => {
    return dailyReports.reduce((totals, report) => ({
      gads: totals.gads + report.gads,
      smartphone_activation: totals.smartphone_activation + report.smartphone_activation,
      others: totals.others + report.others,
      total: totals.total + report.total,
      avg_canvassers: Math.round(totals.avg_canvassers + report.canvassers_active)
    }), { gads: 0, smartphone_activation: 0, others: 0, total: 0, avg_canvassers: 0 });
  };

  const totals = getTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FAE Performance Reporting</h1>
          <p className="text-gray-600">Comprehensive performance analytics from daily canvasser activities</p>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="fae-select">FAE Selection</Label>
                <select
                  id="fae-select"
                  value={selectedFAE}
                  onChange={(e) => setSelectedFAE(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {faeList.map((fae) => (
                    <option key={fae.email} value={fae.email}>
                      {fae.name} ({fae.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <select
                  id="report-type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={exportReport}
                  disabled={loading || dailyReports.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totals.gads}</div>
                <div className="text-sm text-green-700">Total GADs</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totals.smartphone_activation}</div>
                <div className="text-sm text-blue-700">SmartPhone Activations</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totals.others}</div>
                <div className="text-sm text-purple-700">Others</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{totals.total}</div>
                <div className="text-sm text-gray-700">Total Activities</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {dailyReports.length > 0 ? Math.round(totals.total / dailyReports.length) : 0}
                </div>
                <div className="text-sm text-orange-700">Daily Average</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Performance Table */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Performance Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Generating performance report...</p>
              </div>
            ) : dailyReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-center p-3 font-medium">GADs</th>
                      <th className="text-center p-3 font-medium">SmartPhone</th>
                      <th className="text-center p-3 font-medium">Others</th>
                      <th className="text-center p-3 font-medium">Total</th>
                      <th className="text-center p-3 font-medium">Active Canvassers</th>
                      <th className="text-center p-3 font-medium">Avg per Canvasser</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReports.map((report) => (
                      <tr key={report.date} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {new Date(report.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {report.gads}
                          </Badge>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {report.smartphone_activation}
                          </Badge>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {report.others}
                          </Badge>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="outline" className="font-bold">
                            {report.total}
                          </Badge>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                            {report.canvassers_active}
                          </Badge>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="outline">
                            {report.canvassers_active > 0 ? Math.round(report.total / report.canvassers_active) : 0}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No performance data found for the selected period</p>
                <p className="text-sm">Adjust your filters to view available reports</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        {monthlyReports.length > 0 && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Monthly Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlyReports.map((report, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2">{report.month} {report.year}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Activities:</span>
                          <Badge variant="outline">{report.total_activities}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>GADs:</span>
                          <Badge className="bg-green-100 text-green-800">{report.total_gads}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>SmartPhone:</span>
                          <Badge className="bg-blue-100 text-blue-800">{report.total_smartphone_activation}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Others:</span>
                          <Badge className="bg-purple-100 text-purple-800">{report.total_others}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Avg:</span>
                          <Badge variant="secondary">{report.avg_daily_performance}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Best Day:</span>
                          <span className="text-green-600 font-medium">{report.best_performing_day}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">How to Use FAE Performance Reporting</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Select the FAE (Field Area Executive) to generate reports for</li>
              <li>Choose your date range using the start and end date filters</li>
              <li>Select report type: Daily for day-by-day breakdown, Weekly/Monthly for aggregated views</li>
              <li>View performance summaries showing total GADs, SmartPhone Activations, and Others</li>
              <li>Analyze daily performance trends and canvasser productivity metrics</li>
              <li>Export data to CSV for further analysis or sharing with management</li>
              <li>Use monthly summaries to identify best performing periods and trends</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAEReporting;