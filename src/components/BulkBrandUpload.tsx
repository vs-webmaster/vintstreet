import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { bulkCreateBrands, CreateBrandInput } from '@/services/brands';
import { isFailure } from '@/types/api';
import type { ExcelRowData } from '@/types/common';

interface BulkBrandUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandsAdded: () => void;
}

export const BulkBrandUpload: React.FC<BulkBrandUploadProps> = ({ isOpen, onClose, onBrandsAdded }) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number } | null>(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        name: 'Example Brand Name',
        description: 'Optional description of the brand',
        logo_url: 'https://example.com/logo.png (optional)',
        is_active: 'TRUE or FALSE (default: TRUE)',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Brands');
    XLSX.writeFile(wb, 'brand_upload_template.xlsx');

    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and upload it to add brands in bulk',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast({
          title: 'Empty file',
          description: 'The uploaded file contains no brands',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      // Prepare brands for bulk creation
      const brandsToCreate: CreateBrandInput[] = [];
      const skippedRows: unknown[] = [];

<<<<<<< HEAD
      for (const row of jsonData as unknown[]) {
=======
      for (const row of jsonData as ExcelRowData[]) {
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
        // Skip example rows
        if (row.name === 'Example Brand Name') continue;

        // Validate required fields
        if (!row.name) {
          skippedRows.push(row);
          continue;
        }

        // Parse boolean value
        const isActive = row.is_active?.toString().toUpperCase() !== 'FALSE';

        brandsToCreate.push({
          name: row.name.trim(),
          description: row.description?.trim() || null,
          logo_url: row.logo_url?.trim() || null,
          is_active: isActive,
        });
      }

      if (brandsToCreate.length === 0) {
        toast({
          title: 'No valid brands',
          description: 'No valid brands found in the file. Please check your data.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      // Use bulkCreateBrands to create all brands at once
      const result = await bulkCreateBrands(brandsToCreate);

      if (isFailure(result)) {
        toast({
          title: 'Upload failed',
          description: result.error.message || 'Failed to upload brands. Please try again.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      const successCount = result.data?.length || 0;
      const failedCount = skippedRows.length;

      setUploadResults({ success: successCount, failed: failedCount });

      if (successCount > 0) {
        toast({
          title: 'Upload complete',
          description: `Successfully added ${successCount} brand${successCount !== 1 ? 's' : ''}${
            failedCount > 0 ? `, ${failedCount} failed` : ''
          }`,
        });
        onBrandsAdded();
      } else {
        toast({
          title: 'Upload failed',
          description: 'No brands were added. Please check your file and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: "Failed to process file. Please ensure it's a valid Excel file.",
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Brand Upload
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Download the template, fill in your brands, then upload the completed file. Required field: name.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Step 1: Download Template</h3>
            <Button onClick={downloadTemplate} variant="outline" className="w-full" disabled={isUploading}>
              <Download className="mr-2 h-4 w-4" />
              Download Excel Template
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Step 2: Upload Completed File</h3>
            <div className="relative">
              <Button variant="default" className="w-full" disabled={isUploading} asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Excel File'}
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>

          {uploadResults && (
            <Alert
              className={
                uploadResults.success > 0 ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : ''
              }
            >
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Upload Results:</p>
                  <p className="text-sm">✓ Successfully added: {uploadResults.success} brands</p>
                  {uploadResults.failed > 0 && (
                    <p className="text-sm text-destructive">✗ Failed: {uploadResults.failed} brands</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
