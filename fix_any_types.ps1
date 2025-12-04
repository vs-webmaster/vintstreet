# Files to process with their line numbers (from lint output)
$filesToFix = @{
    "src/components/BiddingSection.tsx" = @(56)
    "src/components/BulkBrandUpload.tsx" = @(70)
    "src/components/BulkProductUpload.tsx" = @(32, 229, 342, 349)
    "src/components/EditProductModal.tsx" = @(87)
    "src/components/LiveChat.tsx" = @(26, 63)
    "src/components/ProductTemplates.tsx" = @(32, 52)
    "src/components/ShippingAddressDialog.tsx" = @(61, 100)
    "src/components/admin/GuideManager.tsx" = @(36)
    "src/components/blog/BlogSidebar.tsx" = @(28)
}

foreach ($file in $filesToFix.Keys) {
    $lines = @($filesToFix[$file])
    Write-Output "Processing $file - lines: $($lines -join ', ')"
}
