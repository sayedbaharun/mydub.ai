import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Users, 
  Search, 
  MoreVertical,
  Shield,
  Ban,
  CheckCircle,
  UserCheck,
  Mail,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { dashboardService } from '../services/dashboard.service'
import { User, UserFilter, UserRole } from '../types'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

interface RoleChangeDialogProps {
  user: User | null
  onConfirm: (role: UserRole) => void
  onCancel: () => void
}

function RoleChangeDialog({ user, onConfirm, onCancel }: RoleChangeDialogProps) {
  const { t } = useTranslation()
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'user')

  if (!user) return null

  return (
    <Dialog open={!!user} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('changeUserRole')}</DialogTitle>
          <DialogDescription>
            {t('changeRoleDescription', { name: user.fullName })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('selectRole')}</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t('role.user')}</SelectItem>
                <SelectItem value="subscriber">{t('role.subscriber')}</SelectItem>
                <SelectItem value="curator">{t('role.curator')}</SelectItem>
                <SelectItem value="editor">{t('role.editor')}</SelectItem>
                <SelectItem value="admin">{t('role.admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => onConfirm(selectedRole)}>
            {t('updateRole')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface StatusChangeDialogProps {
  user: User | null
  status: User['status']
  onConfirm: (reason: string) => void
  onCancel: () => void
}

function StatusChangeDialog({ user, status, onConfirm, onCancel }: StatusChangeDialogProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')

  if (!user) return null

  return (
    <Dialog open={!!user} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {status === 'suspended' 
              ? t('suspendUser') 
              : t('activateUser')
            }
          </DialogTitle>
          <DialogDescription>
            {t('statusChangeDescription', { 
              name: user.fullName,
              action: status === 'suspended' ? t('suspend') : t('activate')
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('reason')}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={() => onConfirm(reason)}
            variant={status === 'suspended' ? 'destructive' : 'default'}
          >
            {status === 'suspended' ? t('suspend') : t('activate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UserManagement() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<UserFilter>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null)
  const [statusChangeUser, setStatusChangeUser] = useState<{ user: User; status: User['status'] } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [filter])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const { data, count } = await dashboardService.getUsers(filter)
      setUsers(data)
      setTotalCount(count)
    } catch (error) {
      toast({
        title: t('usersLoadError'),
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setFilter({ ...filter, search: searchQuery })
  }

  const handleRoleChange = async (role: UserRole) => {
    if (!roleChangeUser || !currentUser) return

    try {
      await dashboardService.updateUserRole(roleChangeUser.id, role, currentUser.id)
      toast({
        title: t('roleUpdated'),
        description: t('roleUpdatedDescription', { name: roleChangeUser.fullName })
      })
      setRoleChangeUser(null)
      loadUsers()
    } catch (error) {
      toast({
        title: t('updateError'),
        variant: 'destructive'
      })
    }
  }

  const handleStatusChange = async (reason: string) => {
    if (!statusChangeUser || !currentUser) return

    try {
      await dashboardService.updateUserStatus(
        statusChangeUser.user.id,
        statusChangeUser.status,
        currentUser.id,
        reason
      )
      toast({
        title: t('statusUpdated'),
        description: t('statusUpdatedDescription', { name: statusChangeUser.user.fullName })
      })
      setStatusChangeUser(null)
      loadUsers()
    } catch (error) {
      toast({
        title: t('updateError'),
        variant: 'destructive'
      })
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<UserRole, { variant: any; icon: any }> = {
      user: { variant: 'secondary', icon: <Users className="h-3 w-3" /> },
      subscriber: { variant: 'default', icon: <UserCheck className="h-3 w-3" /> },
      curator: { variant: 'outline', icon: <Shield className="h-3 w-3" /> },
      editor: { variant: 'default', icon: <Shield className="h-3 w-3" /> },
      admin: { variant: 'destructive', icon: <Shield className="h-3 w-3" /> }
    }

    const { variant, icon } = variants[role]

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {t(`dashboard.role.${role}`)}
      </Badge>
    )
  }

  const getStatusBadge = (status: User['status']) => {
    const variants: Record<User['status'], { className: string; icon: any }> = {
      active: { className: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      inactive: { className: 'bg-gray-100 text-gray-800', icon: <Users className="h-3 w-3" /> },
      suspended: { className: 'bg-red-100 text-red-800', icon: <Ban className="h-3 w-3" /> }
    }

    const { className, icon } = variants[status]

    return (
      <Badge className={cn("border-0 flex items-center gap-1", className)}>
        {icon}
        {t(`dashboard.userStatus.${status}`)}
      </Badge>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('userManagement')}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                {t('inviteUser')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={t('searchUsers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button onClick={handleSearch} size="icon" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Select
                value={filter.role || 'all'}
                onValueChange={(value) => 
                  setFilter({ ...filter, role: value === 'all' ? undefined : value as UserRole })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allRoles')}</SelectItem>
                  <SelectItem value="user">{t('role.user')}</SelectItem>
                  <SelectItem value="subscriber">{t('role.subscriber')}</SelectItem>
                  <SelectItem value="curator">{t('role.curator')}</SelectItem>
                  <SelectItem value="editor">{t('role.editor')}</SelectItem>
                  <SelectItem value="admin">{t('role.admin')}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filter.status || 'all'}
                onValueChange={(value) => 
                  setFilter({ ...filter, status: value === 'all' ? undefined : value as User['status'] })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('userStatus.active')}</SelectItem>
                  <SelectItem value="inactive">{t('userStatus.inactive')}</SelectItem>
                  <SelectItem value="suspended">{t('userStatus.suspended')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('user')}</TableHead>
                    <TableHead>{t('dashboard.role')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('lastLogin')}</TableHead>
                    <TableHead>{t('joinedDate')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('noUsers')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.fullName?.split(' ').map(n => n?.[0]).filter(Boolean).join('').toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {user.lastLogin ? (
                            <div className="text-sm">
                              {new Date(user.lastLogin).toLocaleDateString()}
                              <div className="text-muted-foreground">
                                {new Date(user.lastLogin).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">{t('never')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Users className="h-4 w-4 mr-2" />
                                {t('viewProfile')}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                {t('sendEmail')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setRoleChangeUser(user)}
                                disabled={user.id === currentUser?.id}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {t('changeRole')}
                              </DropdownMenuItem>
                              {user.status === 'active' ? (
                                <DropdownMenuItem
                                  onClick={() => setStatusChangeUser({ user, status: 'suspended' })}
                                  className="text-red-600"
                                  disabled={user.id === currentUser?.id}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  {t('suspendUser')}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setStatusChangeUser({ user, status: 'active' })}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {t('activateUser')}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination info */}
          {totalCount > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {t('showingResults', { count: users.length, total: totalCount })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <RoleChangeDialog
        user={roleChangeUser}
        onConfirm={handleRoleChange}
        onCancel={() => setRoleChangeUser(null)}
      />

      {/* Status Change Dialog */}
      <StatusChangeDialog
        user={statusChangeUser?.user || null}
        status={statusChangeUser?.status || 'active'}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusChangeUser(null)}
      />
    </>
  )
}