# VintStreet

A modern vintage fashion marketplace with live streaming, auctions, and curated collections.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Redux Toolkit, React Query
- **Backend**: Supabase (PostgreSQL Database, Authentication, Edge Functions, Storage)
- **Search**: Algolia AI Search
- **Payments**: Stripe
- **Live Streaming**: Agora.io
- **Maps**: Google Maps API
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Algolia account
- Agora.io account
- Google Cloud account (for Maps API)
- Stripe account

## Getting Started

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd vintstreet

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Algolia Configuration
VITE_ALGOLIA_APP_ID=your_algolia_app_id
VITE_ALGOLIA_SEARCH_API_KEY=your_algolia_search_api_key
VITE_ALGOLIA_PRODUCTS_INDEX_NAME=products
VITE_ALGOLIA_CATEGORIES_INDEX_NAME=categories
VITE_ALGOLIA_BRANDS_INDEX_NAME=brands
VITE_ALGOLIA_PRODUCTS_QUERY_SUGGESTIONS_INDEX_NAME=products_query_suggestions
VITE_ALGOLIA_CATEGORIES_QUERY_SUGGESTIONS_INDEX_NAME=categories_query_suggestions
VITE_ALGOLIA_BRANDS_QUERY_SUGGESTIONS_INDEX_NAME=brands_query_suggestions

# Agora.io Configuration
VITE_AGORA_APP_ID=your_agora_app_id

# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

> **Note**: For additional setup instructions for each service, see the [Documentation](#documentation) section below.

### Development

Start the development server:

```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run build:dev` - Build development bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
vintstreet/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and business logic services
│   ├── store/           # Redux store configuration
│   ├── types/           # TypeScript type definitions
│   ├── lib/             # Utility functions
│   └── integrations/    # Third-party service integrations
├── supabase/
│   ├── functions/       # Supabase Edge Functions
│   └── migrations/      # Database migration files
├── docs/                # Documentation files
├── public/              # Static assets
└── server.js           # Production server (for Docker deployment)
```

## Documentation

Detailed setup guides are available in the `docs/` directory:

- [Agora Setup Guide](./docs/AGORA_SETUP.md) - Configure live streaming
- [Algolia Setup Guide](./docs/ALGOLIA_SETUP.md) - Set up AI-powered search
- [Google Maps Setup](./docs/GOOGLE_MAPS_SETUP.md) - Configure location services
- [Multi-Currency Guide](./docs/MULTI_CURRENCY_GUIDE.md) - Currency handling
- [Shipping Implementation](./docs/SHIPPING_IMPLEMENTATION.md) - Shipping label generation

## Deployment

### Production Build

Build the production bundle:

```sh
npm run build
```

The optimized output will be in the `dist/` folder, ready for deployment to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.).

### Docker Deployment

The project includes a Dockerfile for containerized deployment:

```sh
# Build the Docker image
docker build -t vintstreet .

# Run the container
docker run -p 8080:8080 vintstreet
```

The Docker image uses a multi-stage build:
1. Build stage: Compiles the React application
2. Production stage: Serves the app with a custom Node.js server that includes security headers

The server listens on port 8080 by default (configurable via `PORT` environment variable).

### Cloud Run / Container Platforms

For platforms like Google Cloud Run:

1. Build and push the image to your container registry
2. Deploy the container with environment variables configured
3. Ensure port 8080 is exposed (or update the `PORT` env var)

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass and linting is clean
4. Submit a pull request
