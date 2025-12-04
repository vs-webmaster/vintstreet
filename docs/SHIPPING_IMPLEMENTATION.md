# Shipping Label Generation Implementation Summary

## Overview

This implementation provides a complete shipping label generation system for Vint Street, supporting both warehouse fulfillment (Ninja/MoovParcel) and C2C marketplace shipping (Voila).

## Files Created

### Supabase Edge Functions
- `supabase/functions/generate-shipping-label/index.ts` - Main label generation function
- `supabase/functions/shipping-webhook/index.ts` - Webhook handler for Ninja API callbacks

### Frontend Hooks
- `src/hooks/useShippingLabel.tsx` - React hook for triggering label generation

### Database
- `supabase/migrations/20250120000000_shipping_labels_table.sql` - Database schema for shipping labels

### Integration
- Updated `src/components/dashboard/OrdersTab.tsx` - Integrated label generation button

## Setup Instructions

### 1. Environment Variables

Add these to your Supabase project secrets (Dashboard → Settings → Edge Functions → Secrets):

```bash
NINJA_EMAIL=will@vintstreet.com
NINJA_PASSWORD=your_ninja_password
VOILA_API_USER=Vintstreet
VOILA_API_TOKEN=your_voila_token
```

### 2. Run Database Migration

The migration file `20250120000000_shipping_labels_table.sql` needs to be applied to your database. If using Supabase CLI:

```bash
supabase db push
```

Or apply it manually through the Supabase dashboard.

### 3. Deploy Edge Functions

Deploy the edge functions to Supabase:

```bash
supabase functions deploy generate-shipping-label
supabase functions deploy shipping-webhook
```

### 4. Configure Webhook URL

In your Ninja/MoovParcel dashboard, configure the webhook URL:
```
https://your-project.supabase.co/functions/v1/shipping-webhook
```

## How It Works

### Warehouse Orders (Ninja Flow)

1. Order is created with listing that has `stream_id === 'master-catalog'` OR seller_id matching "VintStreet System"
2. System detects it's a warehouse order
3. Order data is sent to Ninja API via `Orders Import JSON` endpoint
4. Order appears in Ninja dashboard for warehouse team
5. Warehouse team processes order and generates label in Ninja
6. Ninja sends webhook with label data
7. Webhook handler updates `shipping_labels` table and order tracking number

### C2C Orders (Voila Flow)

1. Order is created with any other seller
2. System detects it's a C2C order
3. Label creation request is sent directly to Voila API
4. Voila responds with label data (PDF, QR code, tracking)
5. Label data is stored in `shipping_labels` table
6. Order tracking number is updated
7. Seller can view/download label from dashboard

## Usage

### From Frontend

```typescript
import { useShippingLabel } from '@/hooks/useShippingLabel';

const { generateLabel, isGenerating } = useShippingLabel();

// Generate label for an order
const result = await generateLabel(orderId);
if (result?.success) {
  console.log('Tracking:', result.tracking_number);
}
```

### From Edge Function

```typescript
const { data, error } = await supabase.functions.invoke('generate-shipping-label', {
  body: { order_id: 'order-uuid-here' },
});
```

## Database Schema

### shipping_labels Table

- `id` - UUID primary key
- `order_id` - Foreign key to orders table
- `tracking_number` - Tracking number from carrier
- `label_type` - 'ninja' or 'voila'
- `label_uri` - URL to label PDF
- `label_base64` - Base64 encoded label
- `qr_code_uri` - URL to QR code
- `qr_code_base64` - Base64 encoded QR code
- `barcode_base64` - Base64 encoded barcode
- `label_data` - Full API response (JSONB)
- `generated_at` - When label was generated
- `updated_at` - Last update time
- `created_at` - Creation time

## Order Type Detection

The system automatically determines order type by checking:
1. **Primary check**: If listing's `stream_id === 'master-catalog'` → Warehouse order (Ninja)
2. **Fallback check**: If seller's `shop_name === 'VintStreet System'` → Warehouse order (Ninja)
3. **Otherwise** → C2C order (Voila)

## API Endpoints

### Ninja API
- **Base URL**: `https://api.moovparcel.net/api`
- **Login**: POST `/login`
- **Import Order**: POST `/orders/import-json`

### Voila API
- **Base URL**: `https://production.courierapi.co.uk/api/couriers/v1/MoovParcel`
- **Create Label**: POST `/create-label`

## Testing

1. Create a test order in the database
2. Call the `generate-shipping-label` edge function with the order ID
3. Check the `shipping_labels` table for generated label
4. Verify tracking number is updated in `orders` table

## Next Steps

1. **Email Notifications**: Send email to sellers with label attachments
2. **Label Preview**: Add label preview/download in dashboard
3. **Bulk Generation**: Support bulk label generation for multiple orders
4. **Label Regeneration**: Allow regenerating labels if needed
5. **Label Cancellation**: Support canceling labels through API

## Troubleshooting

### Label Generation Fails

1. Check environment variables are set correctly
2. Verify API credentials are valid
3. Check edge function logs in Supabase dashboard
4. Ensure order has required data (buyer profile, shipping address)

### Webhook Not Receiving Data

1. Verify webhook URL is configured in Ninja dashboard
2. Check webhook endpoint logs
3. Ensure webhook payload format matches expected structure

## Support

For issues or questions, refer to:
- `src/services/shipping/README.md` - Detailed API documentation
- Supabase Edge Functions logs
- API provider documentation (Ninja/Voila)

