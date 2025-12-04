import { AdminLayout } from './AdminLayout';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MoreHorizontal, Ban, CheckCircle, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { SendMessageModal } from '@/components/admin/SendMessageModal';
import { UserDetailsModal } from '@/components/admin/UserDetailsModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { createMessage } from '@/services/messages';
import {
  fetchAllProfiles,
  fetchSellerProfilesByUserIds,
  fetchSellerProfilesByShopNames,
  getUserStatsCounts,
  blockUser,
  unblockUser,
} from '@/services/users';
import { isFailure } from '@/types/api';

const AdminUsersPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageUserId, setMessageUserId] = useState<string | null>(null);
  const [messageUserName, setMessageUserName] = useState<string>('');

  const ITEMS_PER_PAGE = 50;

  const handleFilterChange = (value: string) => {
    setUserFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const {
    data: userStats = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const profilesResult = await fetchAllProfiles();
      if (isFailure(profilesResult)) throw profilesResult.error;
      const profiles = profilesResult.data;

      const userIds = profiles.map((p) => p.user_id);
      const sellerProfilesResult = await fetchSellerProfilesByUserIds(userIds);
      const sellerProfiles = sellerProfilesResult.success ? sellerProfilesResult.data : [];

      const shopNameMap = new Map<string, string>(
        sellerProfiles
          ?.map((sp) => [sp.user_id, 'shop_name' in sp ? (sp.shop_name as string) : null])
          .filter(([_, name]) => name) as [string, string][],
      );

      const statsPromises = profiles.map(async (profile) => {
        const statsResult = await getUserStatsCounts(profile.user_id);
        const stats = isFailure(statsResult)
          ? { items_listed: 0, items_sold: 0, purchases: 0, last_purchase_date: null }
          : statsResult.data;

        const lastPurchaseDate = stats.last_purchase_date ? new Date(stats.last_purchase_date) : null;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return {
          profile,
          shop_name: shopNameMap.get(profile.user_id) || null,
          items_listed: stats.items_listed,
          items_sold: stats.items_sold,
          purchases: stats.purchases,
          last_purchase_date: lastPurchaseDate,
          purchased_in_last_7_days: lastPurchaseDate ? lastPurchaseDate >= sevenDaysAgo : false,
        };
      });

      return await Promise.all(statsPromises);
    },
    enabled: !!user?.id,
  });

  const filteredUsers = userStats.filter((stat) => {
    // Search filter
    const matchesSearch =
      stat.profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stat.profile.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stat.shop_name && stat.shop_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // User activity filter
    switch (userFilter) {
      case 'bought_last_7_days':
        return stat.purchased_in_last_7_days;
      case 'signed_up_no_purchase':
        return stat.purchases === 0;
      case 'purchased_once':
        return stat.purchases === 1;
      case 'purchased_multiple':
        return stat.purchases > 1;
      case 'no_signup_no_purchase':
        // Users who have no email (guest/incomplete signup) and no purchases
        return !stat.profile.email && stat.purchases === 0;
      case 'all':
      default:
        return true;
    }
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSendMessage = async (messageText: string) => {
    if (!messageUserId) return;

    // Fetch system seller by shop name
    const sellerProfilesResult = await fetchSellerProfilesByShopNames(['VintStreet']);
    const systemSeller =
      sellerProfilesResult.success && sellerProfilesResult.data.length > 0
        ? { user_id: sellerProfilesResult.data[0].user_id }
        : null;

    if (!systemSeller) {
      toast.error('System seller not found');
      return;
    }

    const result = await createMessage(systemSeller.user_id, {
      recipient_id: messageUserId,
      subject: 'Message from VintStreet',
      message: messageText,
    });

    if (isFailure(result)) {
      toast.error('Failed to send message');
      throw result.error;
    }

    toast.success('Message sent successfully');
    setMessageModalOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Users</h1>
        </div>

        <Card className="p-6">
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">User Management</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="user-filter" className="text-sm font-medium">
                    Filter:
                  </Label>
                  <Select value={userFilter} onValueChange={handleFilterChange}>
                    <SelectTrigger id="user-filter" className="w-[220px]">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="all">All users</SelectItem>
                      <SelectItem value="bought_last_7_days">Bought in last 7 days</SelectItem>
                      <SelectItem value="signed_up_no_purchase">Signed up, no purchase</SelectItem>
                      <SelectItem value="purchased_once">Purchased once</SelectItem>
                      <SelectItem value="purchased_multiple">Purchased multiple times</SelectItem>
                      <SelectItem value="no_signup_no_purchase">No signup, no purchase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            {userFilter !== 'all' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{filteredUsers.length}</Badge>
                <span>
                  user{filteredUsers.length !== 1 ? 's' : ''} match{filteredUsers.length === 1 ? 'es' : ''} the selected
                  filter
                </span>
              </div>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Listed</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((stat) => (
                    <TableRow
                      key={stat.profile.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedUserId(stat.profile.user_id);
                        setSelectedUserName(stat.profile.full_name || stat.profile.username || 'User');
                      }}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{stat.profile.full_name || stat.profile.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {stat.shop_name || stat.profile.username || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{stat.profile.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stat.profile.user_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{stat.items_listed}</TableCell>
                      <TableCell className="text-right">{stat.items_sold}</TableCell>
                      <TableCell className="text-right">{stat.purchases}</TableCell>
                      <TableCell>{new Date(stat.profile.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {stat.profile.is_blocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setMessageUserId(stat.profile.user_id);
                                setMessageUserName(stat.profile.full_name || stat.profile.username || 'User');
                                setMessageModalOpen(true);
                              }}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message User
                            </DropdownMenuItem>
                            {stat.profile.is_blocked ? (
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const result = await unblockUser(stat.profile.user_id);
                                  if (isFailure(result)) {
                                    toast.error('Failed to unblock user');
                                  } else {
                                    toast.success('User unblocked');
                                    refetch();
                                  }
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Unblock User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm('Block this user?')) {
                                    const result = await blockUser(stat.profile.user_id);
                                    if (isFailure(result)) {
                                      toast.error('Failed to block user');
                                    } else {
                                      toast.success('User blocked');
                                      refetch();
                                    }
                                  }
                                }}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Block User
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <UserDetailsModal
        userId={selectedUserId}
        userName={selectedUserName}
        open={!!selectedUserId}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
      />

      <SendMessageModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        onSend={handleSendMessage}
        recipientName={messageUserName}
      />
    </AdminLayout>
  );
};

export default AdminUsersPage;
