# TS App Demo

A full-stack TypeScript application with Vue.js frontend and Express.js backend.

## Environment Setup

1. Install Node.js (v18 or higher)
2. Clone the repository
3. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

4. Set up environment variables:
   ```bash
   cd backend
   cp example.env .env
   # Edit .env with your actual API keys
   ```

## Run Commands

### Development Mode

Start both frontend and backend:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

The frontend will be available at `http://localhost:5173` (dev) and backend at `http://localhost:8000`.