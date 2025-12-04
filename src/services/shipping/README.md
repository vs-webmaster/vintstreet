# Shipping Label Generation System

This system handles shipping label generation for Vint Street orders, supporting two different fulfillment flows:

1. **Warehouse Fulfillment (Ninja/MoovParcel)**: For orders fulfilled from Vint Street warehouse
2. **C2C Marketplace (Voila)**: For peer-to-peer marketplace shipping

## Architecture

### Flow 1: Warehouse → Ninja (Vint Street)

When an order is from the "VintStreet System" seller:
- Order data is sent to Ninja API via the `Orders Import JSON` endpoint
- Orders appear in the Ninja order management dashboard
- Warehouse team processes the order (pick, pack, dispatch)
- Labels are generated inside Ninja
- Webhook receives label data and updates the order

### Flow 2: C2C Marketplace → Voila API

When an order is from any other seller:
- Label creation request is sent directly to Voila API
- Voila API responds with label data (PDF, QR code, barcode, tracking)
- Label data is stored in the database
- Seller receives email with label information

## Components

### Supabase Edge Functions

- `supabase/functions/generate-shipping-label/index.ts`: Main function for generating labels
- `supabase/functions/shipping-webhook/index.ts`: Webhook handler for Ninja API callbacks

### Frontend Hook

- `src/hooks/useShippingLabel.tsx`: React hook for triggering label generation from the frontend

### Database

- `shipping_labels` table: Stores label data, tracking numbers, and metadata

## Environment Variables

Add these to your Supabase project secrets:

```bash
# Ninja (MoovParcel) API credentials
NINJA_EMAIL=will@vintstreet.com
NINJA_PASSWORD=your_password_here

# Voila API credentials
VOILA_API_USER=Vintstreet
VOILA_API_TOKEN=your_token_here
```

## Usage

### Generate Label from Frontend

```typescript
import { useShippingLabel } from '@/hooks/useShippingLabel';

const { generateLabel, isGenerating } = useShippingLabel();

// Generate label for an order
const handleGenerateLabel = async (orderId: string) => {
  const result = await generateLabel(orderId);
  if (result?.success) {
    console.log('Tracking number:', result.tracking_number);
  }
};
```

### Generate Label from Edge Function

```typescript
const { data, error } = await supabase.functions.invoke('generate-shipping-label', {
  body: { order_id: 'order-uuid-here' },
});
```

### Webhook Endpoint

The webhook endpoint is available at:
```
https://your-project.supabase.co/functions/v1/shipping-webhook
```

Configure this URL in your Ninja/MoovParcel dashboard to receive label updates.

## Database Schema

### shipping_labels Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | Foreign key to orders table |
| tracking_number | TEXT | Tracking number from carrier |
| label_type | TEXT | 'ninja' or 'voila' |
| label_uri | TEXT | URL to label PDF |
| label_base64 | TEXT | Base64 encoded label |
| qr_code_uri | TEXT | URL to QR code |
| qr_code_base64 | TEXT | Base64 encoded QR code |
| barcode_base64 | TEXT | Base64 encoded barcode |
| label_data | JSONB | Full API response data |
| generated_at | TIMESTAMP | When label was generated |
| updated_at | TIMESTAMP | Last update time |
| created_at | TIMESTAMP | Creation time |

## Order Type Detection

The system automatically determines if an order is warehouse or C2C by checking:

1. **Primary check**: If listing's `stream_id === 'master-catalog'` → Warehouse order (Ninja)
2. **Fallback check**: If seller's `shop_name === 'VintStreet System'` → Warehouse order (Ninja)
3. **Otherwise** → C2C order (Voila)

## API Integration Details

### Ninja API

- **Base URL**: `https://api.moovparcel.net/api`
- **Authentication**: Email/password login, returns access token
- **Order Import**: POST `/orders/import-json`
- **Webhook**: Receives label data after warehouse processing

### Voila API

- **Base URL**: `https://production.courierapi.co.uk/api/couriers/v1/MoovParcel`
- **Authentication**: API user/token in headers
- **Label Creation**: POST `/create-label`
- **Response**: Includes tracking codes, label URIs, QR codes, and base64 data

## Error Handling

Both API clients throw descriptive errors that are caught and logged. The edge function returns structured error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Testing

1. Create a test order in the database
2. Call the `generate-shipping-label` edge function with the order ID
3. Check the `shipping_labels` table for the generated label
4. Verify tracking number is updated in the `orders` table

## Future Enhancements

- Email notifications to sellers with label attachments
- Label regeneration functionality
- Label cancellation support
- Bulk label generation
- Label preview/download in dashboard

