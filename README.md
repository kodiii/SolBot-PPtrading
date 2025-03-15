# Paper Trading Dashboard

A paper trading dashboard for simulating and monitoring trades.

## Architecture

The application consists of two main parts:
1. Backend API Server (`src/api-server/`)
   - Express.js server providing REST API endpoints
   - Direct access to SQLite database using DatabaseService
   - Handles all data operations and business logic

2. Frontend (`frontend/`)
   - Next.js application
   - Uses SWR for data fetching
   - Communicates with backend API
   - Real-time updates with auto-refresh

## Development

### Prerequisites

#### Node.js Version
- Required: Node.js v18.17.0 or higher (Next.js requirement)
- Recommended: Use [nvm](https://github.com/nvm-sh/nvm) for Node.js version management

If using nvm:
```bash
nvm install 18.17.0
nvm use 18.17.0
```

If not using nvm, download and install Node.js 18.17.0 or higher from [nodejs.org](https://nodejs.org/)

#### Package Manager
- npm v8 or higher (included with Node.js)

### Setup & Development

1. Clone the repository:
```bash
git clone <repository-url>
cd SolBot-PPtrading
```

2. Install Dependencies:
```bash
# Install API server dependencies
cd src/api-server && npm install
cd ../..

# Install frontend dependencies
cd frontend && npm install
cd ..
```

3. Run Development Environment:
```bash
# The dev script will:
# - Check/set correct Node.js version if using nvm
# - Start the API server on port 3001
# - Start the frontend on port 3000
./dev.sh
```

4. Access the Application:
- Frontend Dashboard: http://localhost:3000
- API Documentation: http://localhost:3001/api-docs
- API Health Check: http://localhost:3001/health

The frontend will automatically connect to the API server and update in real-time.

### Troubleshooting

If you encounter Node.js version errors:
1. Install nvm: Follow instructions at https://github.com/nvm-sh/nvm
2. Install and use the correct Node.js version:
   ```bash
   nvm install 18.17.0
   nvm use 18.17.0
   ```
3. Restart the development server: `./dev.sh`

### Environment Variables

Frontend (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

The backend provides the following endpoints:

- `GET /api/dashboard` - Get all dashboard data
- `GET /api/dashboard/positions` - Get current positions
- `GET /api/dashboard/trades` - Get recent trades
- `GET /api/dashboard/stats` - Get trading statistics
