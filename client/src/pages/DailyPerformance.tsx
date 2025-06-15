import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Save, Target, Smartphone, Plus, Edit, Trash2, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, dbApi } from '@/lib/supabase';

interface PerformanceRecord {
  id?: number;
  canvasser_id: string;
  canvasser_name: string;
  date: string;
  gads: number;
  smartphone_activation: number;
  others: number;
  recorded_by: string;
  created_at?: string;
  updated_at?: string;
}

interface Canvasser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

const DailyPerformance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [canvassers, setCanvassers] = useState<Canvasser[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<PerformanceRecord | null>(null);
  const [newRecord, setNewRecord] = useState<Partial<PerformanceRecord>>({
    gads: 0,
    smartphone_activation: 0,
    others: 0
  });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    setCurrentUser(userEmail);
    fetchCanvassers();
    fetchPerformanceRecords();
  }, [selectedDate]);

  const fetchCanvassers = async () => {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .eq("role", "canvasser")
        .eq("status", "approved");

      if (error) throw error;
      setCanvassers(data || []);
    } catch (err: any) {
      console.error("Error fetching canvassers:", err);
    }
  };

  const fetchPerformanceRecords = async () => {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("canvasser_performance")
        .select("*")
        .eq("date", selectedDate)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPerformanceRecords(data || []);
    } catch (err: any) {
      console.error("Error fetching performance records:", err);
    }
  };

  const savePerformanceRecord = async (record: PerformanceRecord) => {
    try {
      if (!supabase || !currentUser) return;

      setLoading(true);
      
      const recordData = {
        ...record,
        date: selectedDate,
        recorded_by: currentUser,
        updated_at: new Date().toISOString()
      };

      if (record.id) {
        // Update existing record
        const { error } = await supabase
          .from("canvasser_performance")
          .update(recordData)
          .eq("id", record.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Performance record updated successfully",
        });
      } else {
        // Create new record
        const { error } = await supabase
          .from("canvasser_performance")
          .insert([{
            ...recordData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Performance record saved successfully",
        });
      }

      fetchPerformanceRecords();
      setEditingRecord(null);
      setNewRecord({ gads: 0, smartphone_activation: 0, others: 0 });
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save performance record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePerformanceRecord = async (id: number) => {
    try {
      if (!supabase) return;

      setLoading(true);
      
      const { error } = await supabase
        .from("canvasser_performance")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Performance record deleted successfully",
      });

      fetchPerformanceRecords();
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete performance record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    if (!newRecord.canvasser_id || !newRecord.canvasser_name) {
      toast({
        title: "Validation Error",
        description: "Please select a canvasser",
        variant: "destructive",
      });
      return;
    }

    savePerformanceRecord(newRecord as PerformanceRecord);
  };

  const handleEditRecord = (record: PerformanceRecord) => {
    setEditingRecord(record);
  };

  const handleUpdateRecord = () => {
    if (editingRecord) {
      savePerformanceRecord(editingRecord);
    }
  };

  const getCanvasserById = (id: string) => {
    return canvassers.find(c => c.id === id);
  };

  const getTotalPerformance = () => {
    return performanceRecords.reduce((totals, record) => ({
      gads: totals.gads + record.gads,
      smartphone_activation: totals.smartphone_activation + record.smartphone_activation,
      others: totals.others + record.others,
      total: totals.total + record.gads + record.smartphone_activation + record.others
    }), { gads: 0, smartphone_activation: 0, others: 0, total: 0 });
  };

  const totals = getTotalPerformance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Canvasser Performance</h1>
          <p className="text-gray-600">Record and track GADs, SmartPhone Activation, and Others</p>
        </div>

        {/* Date Selection */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              <Badge variant="outline" className="text-sm">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totals.gads}</div>
                <div className="text-sm text-green-700">GADs</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totals.smartphone_activation}</div>
                <div className="text-sm text-blue-700">SmartPhone Activation</div>
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
        </div>

        {/* Add New Record */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Performance Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="canvasser">Canvasser *</Label>
                <select
                  id="canvasser"
                  value={newRecord.canvasser_id || ''}
                  onChange={(e) => {
                    const canvasser = getCanvasserById(e.target.value);
                    setNewRecord(prev => ({
                      ...prev,
                      canvasser_id: e.target.value,
                      canvasser_name: canvasser?.full_name || ''
                    }));
                  }}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Canvasser</option>
                  {canvassers.map((canvasser) => (
                    <option key={canvasser.id} value={canvasser.id}>
                      {canvasser.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="gads">GADs</Label>
                <Input
                  id="gads"
                  type="number"
                  min="0"
                  value={newRecord.gads}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, gads: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="smartphone">SmartPhone Activation</Label>
                <Input
                  id="smartphone"
                  type="number"
                  min="0"
                  value={newRecord.smartphone_activation}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, smartphone_activation: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="others">Others</Label>
                <Input
                  id="others"
                  type="number"
                  min="0"
                  value={newRecord.others}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, others: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleAddRecord}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Record
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Records Table */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Records - {new Date(selectedDate).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Canvasser</th>
                      <th className="text-center p-3 font-medium">GADs</th>
                      <th className="text-center p-3 font-medium">SmartPhone</th>
                      <th className="text-center p-3 font-medium">Others</th>
                      <th className="text-center p-3 font-medium">Total</th>
                      <th className="text-center p-3 font-medium">Recorded By</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{record.canvasser_name}</span>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          {editingRecord?.id === record.id ? (
                            <Input
                              type="number"
                              min="0"
                              value={editingRecord?.gads || 0}
                              onChange={(e) => setEditingRecord(prev => prev ? { ...prev, gads: parseInt(e.target.value) || 0 } : null)}
                              className="w-20 mx-auto"
                            />
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {record.gads}
                            </Badge>
                          )}
                        </td>
                        <td className="text-center p-3">
                          {editingRecord?.id === record.id ? (
                            <Input
                              type="number"
                              min="0"
                              value={editingRecord?.smartphone_activation || 0}
                              onChange={(e) => setEditingRecord(prev => prev ? { ...prev, smartphone_activation: parseInt(e.target.value) || 0 } : null)}
                              className="w-20 mx-auto"
                            />
                          ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {record.smartphone_activation}
                            </Badge>
                          )}
                        </td>
                        <td className="text-center p-3">
                          {editingRecord?.id === record.id ? (
                            <Input
                              type="number"
                              min="0"
                              value={editingRecord?.others || 0}
                              onChange={(e) => setEditingRecord(prev => prev ? { ...prev, others: parseInt(e.target.value) || 0 } : null)}
                              className="w-20 mx-auto"
                            />
                          ) : (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              {record.others}
                            </Badge>
                          )}
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="outline" className="font-bold">
                            {record.gads + record.smartphone_activation + record.others}
                          </Badge>
                        </td>
                        <td className="text-center p-3 text-sm text-gray-600">
                          {record.recorded_by}
                        </td>
                        <td className="text-center p-3">
                          <div className="flex items-center justify-center gap-2">
                            {editingRecord?.id === record.id ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={handleUpdateRecord}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingRecord(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditRecord(record)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => record.id && deletePerformanceRecord(record.id)}
                                  disabled={loading}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No performance records for this date</p>
                <p className="text-sm">Add records above to start tracking performance</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">How to Use Daily Performance Tracking</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Select the date you want to record performance for</li>
              <li>Choose a canvasser from the approved list</li>
              <li>Enter the number of GADs, SmartPhone Activations, and Others completed</li>
              <li>Click "Save Record" to store the performance data</li>
              <li>Use the edit button to modify existing records</li>
              <li>View daily totals in the summary cards above</li>
              <li>All records are automatically timestamped and attributed to you as the FAE</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyPerformance;