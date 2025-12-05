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

- **Node.js 20.19+** (or 22.12+) - Required for Vite 7
- npm
- Supabase account and project
- Algolia account
- Agora.io account
- Google Cloud account (for Maps API)
- Stripe account

> **Note**: Node.js 18 is no longer supported. See [Vite 7 Migration Guide](./docs/VITE7_MIGRATION.md) for details.

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

### Setup Guides
- [Agora Setup Guide](./docs/AGORA_SETUP.md) - Configure live streaming
- [Algolia Setup Guide](./docs/ALGOLIA_SETUP.md) - Set up AI-powered search
- [Google Maps Setup](./docs/GOOGLE_MAPS_SETUP.md) - Configure location services
- [Multi-Currency Guide](./docs/MULTI_CURRENCY_GUIDE.md) - Currency handling
- [Shipping Implementation](./docs/SHIPPING_IMPLEMENTATION.md) - Shipping label generation

### Development & Deployment
- [Local Docker Build Guide](./docs/LOCAL_DOCKER_BUILD.md) - How to build and run Docker containers locally
- [Vite 7 Migration Guide](./docs/VITE7_MIGRATION.md) - Information about the Vite 7 upgrade and breaking changes
- [Deployment Runbook](./docs/DEPLOYMENT_RUNBOOK.md) - Production deployment procedures

## Deployment

### Production Build

Build the production bundle:

```sh
npm run build
```

The optimized output will be in the `dist/` folder, ready for deployment to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.).

**Important**: The build process requires all environment variables to be set in your `.env` file. These variables are embedded at build time by Vite.

### Docker Deployment

The project uses an optimized Docker build process for security and CI/CD integration.

#### Local Docker Build

For local development and testing:

```sh
# 1. Build the application first (required!)
npm run build

# 2. Build the Docker image
docker build -t vintstreet .

# 3. Run the container
docker run -p 8080:8080 vintstreet
```

**Important Notes**:
- You **must** run `npm run build` before `docker build` - the Dockerfile expects a pre-built `dist` folder
- The `dist` folder is not in `.dockerignore` because it's required for the Docker build
- See [Local Docker Build Guide](./docs/LOCAL_DOCKER_BUILD.md) for detailed instructions

#### Build Architecture

The Docker build process has been optimized:

1. **Build Stage** (CI/CD or local): Application is built with `npm run build` using environment variables
2. **Docker Stage**: Only the pre-built `dist` folder is copied into a minimal Node.js Alpine image
3. **Security**: No secrets are passed as Docker build arguments - they're only used during the build step

This architecture provides:
- Better security (no secrets in Docker layers)
- Faster Docker builds (no dependency installation in Docker)
- Consistent builds between CI/CD and local development

#### Cloud Run / Container Platforms

For platforms like Google Cloud Run:

1. The CI/CD pipeline (`.github/workflows/deploy.yml`) handles the build and deployment automatically
2. Build artifacts are passed between jobs securely
3. Docker image is pushed to Google Artifact Registry
4. Cloud Run deployment uses the built image

For manual deployment:
1. Build the application: `npm run build`
2. Build and push the Docker image to your container registry
3. Deploy the container with port 8080 exposed

The server listens on port 8080 by default (configurable via `PORT` environment variable).

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass and linting is clean
4. Submit a pull request
