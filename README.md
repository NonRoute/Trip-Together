# Trip Together

A modern trip planning application built with Hono, Next.js, and TypeScript.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Trip Management**: Create, view, and manage trips with multiple days
- **Day Selections**: Users can join specific trip days with notes
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Real-time Updates**: Immediate feedback for all user actions

## Tech Stack

### Backend

- **Hono**: Fast web framework for TypeScript
- **Drizzle ORM**: Type-safe database queries
- **PostgreSQL**: Reliable database
- **JWT**: Secure authentication
- **Zod**: Runtime type validation

### Frontend

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Hook Form**: Form management
- **Lucide React**: Beautiful icons
- **Axios**: HTTP client for API calls

## Project Structure

```
Trip-Together/
├── server/                 # Backend API
│   ├── src/
│   │   ├── db/           # Database schema and connection
│   │   ├── lib/          # Utilities and middleware
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Server entry point
│   └── drizzle/          # Database migrations
├── client/                # Frontend application
│   ├── src/
│   │   ├── app/          # Next.js app router pages
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   └── lib/          # Utilities and API client
│   └── public/           # Static assets
```

## Getting Started

### Prerequisites

- **Bun**: Fast JavaScript runtime
- **PostgreSQL**: Database server
- **Node.js**: For development tools

### Backend Setup

1. **Navigate to server directory**:

   ```bash
   cd server
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Set up environment variables**:

   ```bash
   cp env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   PORT=8000
   DATABASE_URL="postgresql://username:password@localhost:5432/trip_together"
   ACCESS_TOKEN_SECRET="your-access-token-secret"
   REFRESH_TOKEN_SECRET="your-refresh-token-secret"
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Set up database**:

   ```bash
   # Start PostgreSQL and create database
   createdb trip_together

   # Run migrations
   bun run db:migrate
   ```

5. **Start the server**:

   ```bash
   bun run dev
   ```

   The API will be available at `http://localhost:8000`

   - API Documentation: `http://localhost:8000/docs`
   - OpenAPI Spec: `http://localhost:8000/openapi`

### Frontend Setup

1. **Navigate to client directory**:

   ```bash
   cd client
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Set up environment variables**:

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL="http://localhost:8000"
   ```

4. **Start the development server**:

   ```bash
   bun run dev
   ```

   The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Trips

- `GET /trip` - Get all trips
- `POST /trip` - Create trip
- `GET /trip/{tripId}` - Get specific trip with days
- `POST /trip/{tripId}/days` - Add day to trip
- `GET /trip/{tripId}/days/{dayId}` - Get trip day with selections
- `POST /trip/{tripId}/days/{dayId}/selections` - Create day selection
- `PUT /trip/{tripId}/days/{dayId}/selections/{selectionId}` - Update day selection
- `DELETE /trip/{tripId}/days/{dayId}/selections/{selectionId}` - Delete day selection

## Development

### Database Migrations

```bash
# Generate new migration
bun run db:generate

# Apply migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio
```

### Type Checking

```bash
# Backend
cd server && bun run tsc --noEmit

# Frontend
cd client && bun run tsc --noEmit
```

## Deployment

### Backend Deployment

1. Set production environment variables
2. Build the application: `bun run build`
3. Deploy to your preferred platform (Vercel, Railway, etc.)

### Frontend Deployment

1. Set production environment variables
2. Build the application: `bun run build`
3. Deploy to Vercel or your preferred platform

## License

MIT License - see LICENSE file for details.
