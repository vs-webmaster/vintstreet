# Google Maps Address Autocomplete Setup

This project uses Google Maps Places API to provide address autocomplete functionality in the checkout and shipping address forms.

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** (not Places API (New))
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **API Key**
6. Copy your API key

### 2. Configure API Key Restrictions (Recommended)

For security, restrict your API key:

1. Click on your API key in the credentials page
2. Under **API restrictions**, select **Restrict key**
3. Choose **Places API** from the list
4. Under **Application restrictions**, you can:
   - Restrict by HTTP referrers (for web apps)
   - Restrict by IP addresses (for server-side)

### 3. Set Environment Variable

Add the following to your `.env` file (or `.env.local` for local development):

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important**: Replace `your_api_key_here` with your actual Google Maps API key.

### 4. Restart Development Server

After adding the environment variable, restart your development server:

```sh
npm run dev
```

## Features

The address autocomplete is integrated into:

- **Checkout Page** (`/checkout`) - Address Line 1 field
- **Shipping Address Dialog** - Address Line 1 field

When a user starts typing an address, Google Maps will provide suggestions. Upon selecting an address, the following fields are automatically filled:

- Address Line 1
- City
- State/Province
- Postal Code
- Country

## Components

- `src/components/GoogleMapsLoader.tsx` - Loads Google Maps API script
- `src/components/AddressAutocomplete.tsx` - Reusable address autocomplete input component
- `src/hooks/useGooglePlacesAutocomplete.tsx` - Hook for Google Places Autocomplete functionality

## Troubleshooting

### Autocomplete not working

1. Check that `VITE_GOOGLE_MAPS_API_KEY` is set in your `.env` file
2. Verify the API key is valid and has Places API enabled
3. Check browser console for any error messages
4. Ensure your API key restrictions allow requests from your domain

### API Key errors

If you see errors about API key restrictions:
- Check that Places API is enabled in Google Cloud Console
- Verify API key restrictions allow your domain/IP
- Make sure you're using the correct API key

## Cost Considerations

Google Maps Places API has usage-based pricing. Check the [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/) for current rates. The autocomplete feature uses the Places API which has a free tier for development.

