import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  Download, 
  Trash2,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/shared/hooks/use-toast';

import { GDPRService } from '../services/gdpr.service';
import { DataSubjectRequest, ComplianceAuditLog, UserConsent, DataExportRequest, LegalNotification } from '../types';

export function ComplianceMonitoringDashboard() {
  const { toast } = useToast();
  
  // State for compliance metrics
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [dataRequests, setDataRequests] = useState<DataSubjectRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>([]);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [notifications, setNotifications] = useState<LegalNotification[]>([]);
  
  // Loading and filter states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      const [status, requests, logs, exports] = await Promise.all([
        GDPRService.getComplianceStatus(),
        GDPRService.getUserDataSubjectRequests(''), // Admin view - all requests
        GDPRService.getComplianceAuditLogs({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          limit: 100
        }),
        // GDPRService.getAllDataExportRequests(), // We'll need to implement this
        Promise.resolve([]) // Placeholder
      ]);

      setComplianceStatus(status);
      setDataRequests(requests);
      setAuditLogs(logs);
      setExportRequests(exports);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadComplianceData();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Compliance data refreshed'
    });
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject', response?: string) => {
    try {
      await GDPRService.processDataSubjectRequest(
        requestId, 
        action === 'approve' ? 'completed' : 'rejected',
        response
      );
      await loadComplianceData();
      toast({
        title: 'Success',
        description: `Request ${action}d successfully`
      });
    } catch (error) {
      console.error('Failed to process request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process request',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock },
      in_progress: { variant: 'outline' as const, icon: RefreshCw },
      completed: { variant: 'default' as const, icon: CheckCircle },
      rejected: { variant: 'destructive' as const, icon: AlertTriangle },
      processing: { variant: 'outline' as const, icon: RefreshCw },
      failed: { variant: 'destructive' as const, icon: AlertTriangle }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredRequests = dataRequests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Legal Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor GDPR compliance and data protection activities
          </p>
        </div>
        <Button onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Compliance Status Overview */}
      {complianceStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceStatus.complianceScore}%</div>
              <Progress value={complianceStatus.complianceScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {complianceStatus.gdprCompliant ? (
                  <span className="text-green-600">✓ GDPR Compliant</span>
                ) : (
                  <span className="text-red-600">⚠ Needs Attention</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Consents</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceStatus.activeConsents}</div>
              <p className="text-xs text-muted-foreground">
                of {complianceStatus.totalUsers} total users
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">
                  {Math.round((complianceStatus.activeConsents / complianceStatus.totalUsers) * 100)}% consent rate
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceStatus.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                Data subject requests
              </p>
              {complianceStatus.pendingRequests > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle className="h-3 w-3 text-orange-600" />
                  <span className="text-xs text-orange-600">Requires attention</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audit Activity</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceStatus.recentAudits}</div>
              <p className="text-xs text-muted-foreground">
                Events in last 30 days
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Last audit: {complianceStatus.lastAuditDate ? 
                  new Date(complianceStatus.lastAuditDate).toLocaleDateString() : 
                  'Never'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Alerts */}
      {complianceStatus && !complianceStatus.gdprCompliant && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Compliance Alert:</strong> Your compliance score is below 90%. 
            Please review pending requests and ensure all data protection measures are in place.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests">Data Requests</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="exports">Data Exports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Data Subject Requests */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Subject Requests</CardTitle>
                  <CardDescription>
                    Manage GDPR data subject access requests
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {request.request_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {request.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {request.description}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            {new Date(request.request_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {request.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRequestAction(request.id, 'approve')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRequestAction(request.id, 'reject')}
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Audit Logs</CardTitle>
              <CardDescription>
                Track all compliance-related activities and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.slice(0, 20).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {log.event_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.user_id ? `${log.user_id.slice(0, 8)}...` : 'System'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </TableCell>
                          <TableCell>
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.ip_address}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Exports */}
        <TabsContent value="exports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Export Requests</CardTitle>
              <CardDescription>
                Monitor user data export requests and downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exportRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No export requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      exportRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono text-sm">
                            {request.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {request.export_format.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.data_categories.join(', ')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            {new Date(request.request_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {request.status === 'completed' && request.download_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={request.download_url} download>
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Compliance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-approve Access Requests</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve data access requests
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Retention Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Set automatic data deletion schedules
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compliance Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Email alerts for compliance events
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Legal Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Privacy Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Current version: 2.1
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Terms of Service</p>
                    <p className="text-sm text-muted-foreground">
                      Current version: 1.8
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Cookie Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Current version: 1.2
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ComplianceMonitoringDashboard;