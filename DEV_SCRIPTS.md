# Development Scripts Guide

This document explains the various scripts available for running the Contingency POS application in development mode.

## Quick Start

### Option 1: Using the Shell Script (Recommended for macOS/Linux)
```bash
./start-dev.sh
```

### Option 2: Using the Batch File (Windows)
```cmd
start-dev.bat
```

### Option 3: Using npm Scripts
```bash
npm run dev
```

## Available Scripts

### Development Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run dev` | Start both Angular dev server and backend server with hot reload | `npm run dev` |
| `npm run dev:prod` | Start both servers in production mode | `npm run dev:prod` |
| `npm run dev:dist` | Start Angular dist server (port 4201) and backend server | `npm run dev:dist` |
| `npm run dev:all` | Start all servers: Angular dev (4200), Angular dist (4201), and backend (3001) | `npm run dev:all` |
| `npm run dev:frontend` | Start only Angular dev server (opens browser automatically) | `npm run dev:frontend` |
| `npm run dev:backend` | Start only backend server with nodemon | `npm run dev:backend` |

### Individual Server Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm start` | Start Angular dev server only | `npm start` |
| `npm run start:prod` | Start Angular dev server in production mode | `npm run start:prod` |
| `npm run serve:dist` | Start Angular dist server on port 4201 | `npm run serve:dist` |
| `npm run server` | Start backend server only (production mode) | `npm run server` |
| `npm run server:dev` | Start backend server with nodemon (development mode) | `npm run server:dev` |
| `npm run server:prod` | Start backend server in production mode | `npm run server:prod` |

### Build Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run build` | Build Angular app for development | `npm run build` |
| `npm run build:prod` | Build Angular app for production | `npm run build:prod` |
| `npm run build:all` | Build Angular app and start backend server | `npm run build:all` |
| `npm run build:all:prod` | Build Angular app for production and start backend server | `npm run build:all:prod` |

### Utility Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run install:all` | Install dependencies and build the project | `npm run install:all` |
| `npm run clean` | Clean node_modules, dist, and package-lock.json, then reinstall | `npm run clean` |
| `npm test` | Run Angular unit tests | `npm test` |
| `npm run test:watch` | Run Angular unit tests in watch mode | `npm run test:watch` |
| `npm run lint` | Run Angular linting | `npm run lint` |
| `npm run e2e` | Run end-to-end tests | `npm run e2e` |

## Server URLs

When running in development mode, the following URLs are available:

- **Angular Development Server**: http://localhost:4200
- **Angular Dist Server** (production build): http://localhost:4201
- **Backend API Server**: http://localhost:3001
- **Backend Health Check**: http://localhost:3001/health

## Features

### Enhanced Development Experience

The development scripts include several enhancements:

1. **Concurrent Execution**: Both servers start simultaneously using `concurrently`
2. **Colored Output**: Each server has colored, prefixed output for easy identification
3. **Auto-restart**: Backend server automatically restarts on file changes (nodemon)
4. **Port Management**: Scripts check and free up ports if they're already in use
5. **Error Handling**: Proper error handling and cleanup on exit
6. **Cross-platform**: Works on macOS, Linux, and Windows

### Shell Script Features (`start-dev.sh`)

- ✅ Prerequisites checking (Node.js, npm)
- ✅ Automatic dependency installation
- ✅ Port conflict resolution
- ✅ Colored output with status indicators
- ✅ Graceful shutdown handling
- ✅ Error handling and reporting
- ✅ Interactive mode selection (dev/dist/all)
- ✅ Automatic production build for dist mode

### Batch File Features (`start-dev.bat`)

- ✅ Windows-compatible
- ✅ Prerequisites checking
- ✅ Automatic dependency installation
- ✅ Error handling
- ✅ User-friendly output
- ✅ Interactive mode selection (dev/dist/all)
- ✅ Automatic production build for dist mode

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

1. **Kill processes manually**:
   ```bash
   # For Angular dev server (port 4200)
   lsof -ti :4200 | xargs kill -9
   
   # For Angular dist server (port 4201)
   lsof -ti :4201 | xargs kill -9
   
   # For backend server (port 3001)
   lsof -ti :3001 | xargs kill -9
   ```

2. **Or use the clean script**:
   ```bash
   npm run clean
   ```

### Dependencies Issues

If you encounter dependency issues:

```bash
# Clean install
npm run clean

# Or manual clean
rm -rf node_modules package-lock.json
npm install
```

### Backend Server Issues

If the backend server fails to start:

1. Check if port 3001 is available
2. Verify `server.js` exists in the project root
3. Check Node.js version compatibility
4. Review server logs for specific error messages

### Angular Dev Server Issues

If the Angular dev server fails to start:

1. Check if port 4200 is available
2. Verify Angular CLI is installed: `npm list -g @angular/cli`
3. Check for TypeScript compilation errors
4. Review Angular CLI logs for specific error messages

## Environment Variables

You can customize the development environment using these environment variables:

- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Node environment (development/production)
- `NG_CLI_ANALYTICS`: Angular CLI analytics (set to `false` to disable)

Example:
```bash
PORT=3002 npm run dev
```

## Best Practices

1. **Use the shell script** (`./start-dev.sh`) for the best development experience
2. **Choose the right mode**:
   - Mode 1: Development (hot reload, debugging)
   - Mode 2: Production testing (optimized build)
   - Mode 3: All modes (compare dev vs prod side-by-side)
3. **Use `npm run dev:frontend`** when working only on frontend changes
4. **Use `npm run dev:backend`** when working only on backend changes
5. **Run `npm run clean`** if you encounter persistent issues
6. **Check the health endpoint** (`http://localhost:3001/health`) to verify backend is running
7. **Test production builds** using mode 2 or 3 to ensure everything works in production

## Integration with IDEs

### VS Code

Add these tasks to your `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Development Servers",
      "type": "shell",
      "command": "./start-dev.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    }
  ]
}
```

### WebStorm/IntelliJ

1. Go to Run → Edit Configurations
2. Add new "Shell Script" configuration
3. Set script path to `./start-dev.sh`
4. Set working directory to project root
