# VintStreet

A modern vintage fashion marketplace with live streaming, auctions, and curated collections.

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Database, Auth, Edge Functions, Storage)
- **Search**: Algolia
- **Payments**: Stripe
- **Live Streaming**: Agora.io

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for backend services)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd vintstreet

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ALGOLIA_APP_ID=your_algolia_app_id
VITE_ALGOLIA_SEARCH_KEY=your_algolia_search_key
```

## Documentation

- [Agora Setup Guide](./AGORA_SETUP.md)
- [Algolia Setup Guide](./ALGOLIA_SETUP.md)
- [Google Maps Setup](./GOOGLE_MAPS_SETUP.md)
- [Multi-Currency Guide](./MULTI_CURRENCY_GUIDE.md)
- [Shipping Implementation](./SHIPPING_IMPLEMENTATION.md)

## Deployment

Build the production bundle:

```sh
npm run build
```

The output will be in the `dist` folder, ready for deployment to any static hosting service.
