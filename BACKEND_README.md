# Backend Server Setup

This document explains how to set up and run the backend server for the Contingency POS application.

## Overview

The backend server provides file storage functionality that organizes exported files by username. When users export PDFs or other files from the POS system, they are automatically uploaded to the backend and stored in user-specific folders.

## Features

- **File Upload**: Accepts file uploads with username-based organization
- **File Management**: List, download, and delete user files
- **User Organization**: Files are stored in separate folders per username
- **File Metadata**: Tracks file information including upload date, size, and original name
- **Security**: Username sanitization to prevent directory traversal attacks
- **File Type Validation**: Only allows common export file types (PDF, CSV, Excel, JSON, etc.)

## API Endpoints

### Health Check
- `GET /health` - Server health status

### File Management
- `POST /api/upload` - Upload a file
  - Body: FormData with `file` and `username` fields
  - Response: Upload confirmation with file details

- `GET /api/files/:username` - Get all files for a user
  - Response: Array of file metadata

- `GET /api/download/:username/:filename` - Download a specific file
  - Response: File blob for download

- `DELETE /api/files/:username/:filename` - Delete a specific file
  - Response: Deletion confirmation

### Admin
- `GET /api/users` - Get all users with file counts (for admin purposes)

## Installation

1. **Install Backend Dependencies**
   ```bash
   npm install express multer cors
   ```

2. **Install Development Dependencies** (optional, for development)
   ```bash
   npm install --save-dev concurrently nodemon
   ```

## Running the Server

### Development Mode
```bash
# Run both frontend and backend concurrently
npm run dev

# Or run backend only with auto-restart
npm run server:dev

# Or run backend only
npm run server
```

### Production Mode
```bash
# Build frontend and run backend
npm run build:all

# Or run backend only
npm run server
```

## Configuration

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm run server
```

## File Storage Structure

Files are stored in the `uploads/` directory with the following structure:

```
uploads/
├── username1/
│   ├── orders-list_2024-01-15T10-30-00-000Z.pdf
│   ├── orders-summary_2024-01-15T11-45-00-000Z.pdf
│   └── files_metadata.json
├── username2/
│   ├── orders-list_2024-01-16T09-15-00-000Z.pdf
│   └── files_metadata.json
└── ...
```

Each user folder contains:
- Exported files with timestamped filenames
- `files_metadata.json` - JSON file containing metadata for all user files

## Security Features

1. **Username Sanitization**: Usernames are sanitized to prevent directory traversal attacks
2. **File Type Validation**: Only allows specific file types (PDF, CSV, Excel, JSON, plain text)
3. **File Size Limits**: 10MB maximum file size
4. **CORS Support**: Configured for cross-origin requests from the frontend

## Frontend Integration

The frontend automatically uploads exported files to the backend when:
- PDF exports are generated (orders list and summary)
- Users are authenticated (username is required)

The system provides fallback behavior:
- If backend upload fails, files are still downloaded locally
- If backend is unavailable, the system continues to work with local downloads only

## Troubleshooting

### Common Issues

1. **Backend not starting**
   - Check if port 3001 is available
   - Ensure all dependencies are installed
   - Check console for error messages

2. **File uploads failing**
   - Verify backend server is running
   - Check browser console for CORS errors
   - Ensure user is authenticated

3. **Files not appearing in file manager**
   - Check if backend server is accessible at `http://localhost:3001`
   - Verify user authentication
   - Check browser network tab for API call failures

### Logs

The server logs important events to the console:
- Server startup confirmation
- File upload success/failure
- API request errors
- File operations (download, delete)

## Development

### Adding New File Types

To support additional file types, update the `allowedTypes` array in `server.js`:

```javascript
const allowedTypes = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'text/plain',
  // Add new types here
];
```

### Modifying File Storage

The file storage logic is in the `multer` configuration in `server.js`. You can modify:
- File naming conventions
- Directory structure
- File size limits
- Storage location

## Production Deployment

For production deployment:

1. **Environment Variables**
   ```bash
   export PORT=3001
   export NODE_ENV=production
   ```

2. **Process Management**
   Consider using PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "contingency-pos-backend"
   ```

3. **Reverse Proxy**
   Use nginx or similar to proxy requests to the backend server.

4. **File Storage**
   Consider using cloud storage (AWS S3, Google Cloud Storage) for production file storage.

## API Examples

### Upload a file
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@orders.pdf" \
  -F "username=john_doe"
```

### Get user files
```bash
curl http://localhost:3001/api/files/john_doe
```

### Download a file
```bash
curl -O http://localhost:3001/api/download/john_doe/orders-list_2024-01-15T10-30-00-000Z.pdf
```

### Delete a file
```bash
curl -X DELETE http://localhost:3001/api/files/john_doe/orders-list_2024-01-15T10-30-00-000Z.pdf
```
