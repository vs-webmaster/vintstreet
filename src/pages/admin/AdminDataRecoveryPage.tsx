import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  History,
  Search,
  RotateCcw,
  Image,
  Tag,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from './AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  fetchImageAuditHistory,
  fetchAttributeAuditHistory,
  fetchTagAuditHistory,
  scanForDataLoss,
  restoreImages,
  restoreAttribute,
  restoreTag,
  cleanupAuditLogs,
} from '@/services/audit';
import { isFailure } from '@/types/api';

type AuditType = 'images' | 'attributes' | 'tags';

export default function AdminDataRecoveryPage() {
  const [productId, setProductId] = useState('');
  const [searchedProductId, setSearchedProductId] = useState('');
  const [selectedAuditType, setSelectedAuditType] = useState<AuditType>('images');
  const [daysToScan, setDaysToScan] = useState('7');
  const queryClient = useQueryClient();

  // Fetch product history for a specific product
  const { data: productHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['product-audit-history', searchedProductId, selectedAuditType],
    queryFn: async (): Promise<any[] | null> => {
      if (!searchedProductId) return null;

      let result;
      if (selectedAuditType === 'images') {
        result = await fetchImageAuditHistory(searchedProductId);
      } else if (selectedAuditType === 'attributes') {
        result = await fetchAttributeAuditHistory(searchedProductId);
      } else {
        result = await fetchTagAuditHistory(searchedProductId);
      }

      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!searchedProductId,
  });

  // Fetch products with potential data loss
  const {
    data: dataLossProducts,
    isLoading: scanLoading,
    refetch: scanForLoss,
  } = useQuery({
    queryKey: ['data-loss-scan', daysToScan],
    queryFn: async () => {
      const result = await scanForDataLoss(parseInt(daysToScan));
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: false, // Only run when manually triggered
  });

  // Restore images mutation
  const restoreImagesMutation = useMutation({
    mutationFn: async ({ listingId, images }: { listingId: string; images: string[] }) => {
      const result = await restoreImages(listingId, images);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      toast.success('Images restored successfully');
      queryClient.invalidateQueries({ queryKey: ['product-audit-history'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to restore images: ${error.message}`);
    },
  });

  // Restore attributes mutation
  const restoreAttributesMutation = useMutation({
    mutationFn: async ({ productId, attributeId, values }: { productId: string; attributeId: string; values: any }) => {
      const result = await restoreAttribute(productId, attributeId, values);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      toast.success('Attribute restored successfully');
      queryClient.invalidateQueries({ queryKey: ['product-audit-history'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to restore attribute: ${error.message}`);
    },
  });

  // Restore tag mutation
  const restoreTagMutation = useMutation({
    mutationFn: async ({ productId, tagId }: { productId: string; tagId: string }) => {
      const result = await restoreTag(productId, tagId);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      toast.success('Tag restored successfully');
      queryClient.invalidateQueries({ queryKey: ['product-audit-history'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to restore tag: ${error.message}`);
    },
  });

  // Cleanup old audit logs mutation
  const cleanupMutation = useMutation({
    mutationFn: async (olderThanDays: number) => {
      const result = await cleanupAuditLogs(olderThanDays);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      toast.success('Old audit logs cleaned up successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to cleanup logs: ${error.message}`);
    },
  });

  const handleSearch = () => {
    if (productId.trim()) {
      setSearchedProductId(productId.trim());
    }
  };

  const renderAuditValue = (value: any) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">null</span>;
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground">empty array</span>;
      return <span className="text-xs">{value.length} items</span>;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value).filter(([_, v]) => v !== null);
      if (entries.length === 0) return <span className="text-muted-foreground">empty</span>;
      return (
        <div className="space-y-1 text-xs">
          {entries.map(([k, v]) => (
            <div key={k}>
              <span className="font-medium">{k}:</span> {String(v)}
            </div>
          ))}
        </div>
      );
    }
    return String(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Data Recovery</h1>
          <p className="text-muted-foreground">View audit history and recover accidentally deleted product data</p>
        </div>

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Product History
            </TabsTrigger>
            <TabsTrigger value="scanner" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Data Loss Scanner
            </TabsTrigger>
            <TabsTrigger value="cleanup" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Cleanup
            </TabsTrigger>
          </TabsList>

          {/* Product History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Product Audit History</CardTitle>
                <CardDescription>
                  Enter a product ID to view all changes to its images, attributes, and tags
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="productId">Product ID</Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        id="productId"
                        placeholder="Enter product UUID..."
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch}>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Audit Type</Label>
                    <Select value={selectedAuditType} onValueChange={(v) => setSelectedAuditType(v as AuditType)}>
                      <SelectTrigger className="mt-1.5 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="images">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Images
                          </div>
                        </SelectItem>
                        <SelectItem value="attributes">
                          <div className="flex items-center gap-2">
                            <Sliders className="h-4 w-4" />
                            Attributes
                          </div>
                        </SelectItem>
                        <SelectItem value="tags">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Tags
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {historyLoading && <p className="text-muted-foreground">Loading history...</p>}

                {productHistory && productHistory.length > 0 && (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Operation</TableHead>
                          <TableHead>Old Value</TableHead>
                          <TableHead>New Value</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productHistory.map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(record.changed_at), 'PPp')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  record.operation === 'DELETE'
                                    ? 'destructive'
                                    : record.operation === 'INSERT'
                                      ? 'default'
                                      : 'secondary'
                                }
                              >
                                {record.operation}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              {renderAuditValue(record.old_images || record.old_values)}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              {renderAuditValue(record.new_images || record.new_values)}
                            </TableCell>
                            <TableCell>
                              {record.operation === 'DELETE' ||
                              (record.operation === 'UPDATE' &&
                                selectedAuditType === 'images' &&
                                Array.isArray(record.old_images) &&
                                record.old_images.length > 0) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (selectedAuditType === 'images') {
                                      restoreImagesMutation.mutate({
                                        listingId: record.listing_id,
                                        images: record.old_images,
                                      });
                                    } else if (selectedAuditType === 'attributes') {
                                      restoreAttributesMutation.mutate({
                                        productId: record.product_id,
                                        attributeId: record.attribute_id,
                                        values: record.old_values,
                                      });
                                    } else if (selectedAuditType === 'tags') {
                                      restoreTagMutation.mutate({
                                        productId: record.product_id,
                                        tagId: record.tag_id,
                                      });
                                    }
                                  }}
                                >
                                  <RotateCcw className="mr-1 h-3 w-3" />
                                  Restore
                                </Button>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}

                {productHistory && productHistory.length === 0 && (
                  <p className="text-center text-muted-foreground">No audit records found for this product</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Loss Scanner Tab */}
          <TabsContent value="scanner" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scan for Data Loss</CardTitle>
                <CardDescription>Find products that may have lost images, attributes, or tags recently</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-4">
                  <div>
                    <Label>Time Period</Label>
                    <Select value={daysToScan} onValueChange={setDaysToScan}>
                      <SelectTrigger className="mt-1.5 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Last 24 hours</SelectItem>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => scanForLoss()} disabled={scanLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${scanLoading ? 'animate-spin' : ''}`} />
                    Scan for Data Loss
                  </Button>
                </div>

                {dataLossProducts && (
                  <div className="space-y-6">
                    {/* Image Loss */}
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-semibold">
                        <Image className="h-4 w-4" />
                        Products with Lost Images ({dataLossProducts.imageLoss.length})
                      </h3>
                      {dataLossProducts.imageLoss.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product ID</TableHead>
                              <TableHead>Images Before</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dataLossProducts.imageLoss.slice(0, 10).map((record: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-xs">{record.listing_id}</TableCell>
                                <TableCell>{record.old_images?.length || 0} images</TableCell>
                                <TableCell>{format(new Date(record.changed_at), 'PPp')}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      restoreImagesMutation.mutate({
                                        listingId: record.listing_id,
                                        images: record.old_images,
                                      })
                                    }
                                  >
                                    <RotateCcw className="mr-1 h-3 w-3" />
                                    Restore
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No image loss detected</p>
                      )}
                    </div>

                    <Separator />

                    {/* Attribute Loss */}
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-semibold">
                        <Sliders className="h-4 w-4" />
                        Products with Mass Attribute Deletions ({dataLossProducts.attributeLoss.length})
                      </h3>
                      {dataLossProducts.attributeLoss.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product ID</TableHead>
                              <TableHead>Deletions</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dataLossProducts.attributeLoss.slice(0, 10).map((record: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-xs">{record.product_id}</TableCell>
                                <TableCell>{record.deletion_count} attributes deleted</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setProductId(record.product_id);
                                      setSelectedAuditType('attributes');
                                      setSearchedProductId(record.product_id);
                                    }}
                                  >
                                    View History
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No mass attribute deletions detected</p>
                      )}
                    </div>

                    <Separator />

                    {/* Tag Loss */}
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-semibold">
                        <Tag className="h-4 w-4" />
                        Products with Mass Tag Deletions ({dataLossProducts.tagLoss.length})
                      </h3>
                      {dataLossProducts.tagLoss.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product ID</TableHead>
                              <TableHead>Deletions</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dataLossProducts.tagLoss.slice(0, 10).map((record: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-xs">{record.product_id}</TableCell>
                                <TableCell>{record.deletion_count} tags deleted</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setProductId(record.product_id);
                                      setSelectedAuditType('tags');
                                      setSearchedProductId(record.product_id);
                                    }}
                                  >
                                    View History
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No mass tag deletions detected</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cleanup Tab */}
          <TabsContent value="cleanup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log Cleanup</CardTitle>
                <CardDescription>
                  Remove old audit logs to save storage space. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <h4 className="font-medium text-amber-500">Warning</h4>
                      <p className="text-sm text-muted-foreground">
                        Deleting audit logs will permanently remove the ability to recover data from before the cleanup
                        date. Only proceed if you're sure you don't need the historical data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">Delete logs older than 30 days</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cleanup</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all audit logs older than 30 days. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => cleanupMutation.mutate(30)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">Delete logs older than 90 days</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cleanup</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all audit logs older than 90 days. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => cleanupMutation.mutate(90)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
