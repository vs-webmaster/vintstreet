# Known Security Vulnerabilities

This document tracks known vulnerabilities that cannot be immediately fixed due to lack of available fixes or pending package updates.

## High Priority

### xlsx Package - Prototype Pollution & ReDoS (HIGH)

**Package:** `xlsx@0.18.5`  
**CVE:** GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9  
**CVSS Score:** 7.8, 7.5  
**Status:** ⚠️ **NO FIX AVAILABLE**

**Details:**
- Required fix: `xlsx >= 0.19.3` or `>= 0.20.2`
- Current latest version: `0.18.5` (no 0.19.x or 0.20.x versions published yet)
- Vulnerabilities:
  - Prototype Pollution in SheetJS
  - Regular Expression Denial of Service (ReDoS)

**Usage Locations:**
- `src/components/BulkProductUpload.tsx` - Admin bulk product upload
- `src/components/BulkBrandUpload.tsx` - Admin bulk brand upload
- `src/components/dashboard/OrdersTab.tsx` - Order export to Excel
- `src/pages/AdminArchivedProductsPage.tsx` - Archived products export
- `src/hooks/useCategoryManagement.tsx` - Category export

**Risk Assessment:**
- **Severity:** HIGH
- **Exploitability:** Low-Medium (requires malicious Excel file)
- **Impact:** Admin-only feature (not public-facing)
- **Mitigation:**
  - ✅ Only accessible to authenticated admin users
  - ✅ Files are user-uploaded (trusted admins)
  - ⚠️ Consider file validation/sanitization if accepting external uploads
  - ⚠️ Monitor package for updates

**Action Items:**
- [ ] Monitor npm for xlsx updates weekly
- [ ] Consider alternative packages (exceljs, node-xlsx) if no fix in 30 days
- [ ] Add file validation if accepting external uploads
- [ ] Review admin access controls

**Last Checked:** 2025-12-04  
**Next Review:** Weekly until fix available

