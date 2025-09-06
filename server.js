const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

// Clean up old temporary files (older than 1 hour)
async function cleanupTempFiles() {
  try {
    const tempDir = path.join(UPLOADS_DIR, 'temp');
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      // Delete files older than 1 hour
      if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
        await fs.unlink(filePath);
        console.log(`Cleaned up old temp file: ${file}`);
      }
    }
  } catch (error) {
    // Ignore errors (temp directory might not exist)
  }
}

// Run cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Use a temporary directory for all uploads initially
    // Authentication will be checked in the route handler
    const tempDir = path.join(UPLOADS_DIR, 'temp');
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      cb(null, tempDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalName = file.originalname || 'export';
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const filename = `${name}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common export file types
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Upload file endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('Upload request received:', {
    hasFile: !!req.file,
    username: req.body.username,
    originalName: req.file?.originalname
  });

  try {
    if (!req.file) {
      console.log('No file in upload request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const username = req.body.username;
    if (!username) {
      console.log('No username in upload request, cleaning up temp file');
      // Clean up the temporary file if authentication fails
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn('Failed to clean up temp file:', unlinkError);
      }
      return res.status(400).json({ error: 'Username is required' });
    }

    // Sanitize username to prevent directory traversal
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDir = path.join(UPLOADS_DIR, sanitizedUsername);
    
    // Create user directory
    await fs.mkdir(userDir, { recursive: true });
    
    // Move file from temp directory to user directory
    const finalPath = path.join(userDir, req.file.filename);
    await fs.rename(req.file.path, finalPath);

    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: finalPath,
      size: req.file.size,
      mimetype: req.file.mimetype,
      username: username,
      uploadedAt: new Date().toISOString()
    };

    // Save file metadata to a JSON file in the user's directory
    const metadataFile = path.join(userDir, 'files_metadata.json');
    
    let metadata = [];
    try {
      const existingData = await fs.readFile(metadataFile, 'utf8');
      metadata = JSON.parse(existingData);
    } catch {
      // File doesn't exist yet, start with empty array
    }
    
    metadata.push(fileInfo);
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));

    console.log('File uploaded successfully:', {
      username: sanitizedUsername,
      filename: fileInfo.filename,
      originalName: fileInfo.originalName,
      size: fileInfo.size
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: fileInfo.filename,
        originalName: fileInfo.originalName,
        size: fileInfo.size,
        uploadedAt: fileInfo.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up the temporary file if there's an error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn('Failed to clean up temp file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get user's files
app.get('/api/files/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDir = path.join(UPLOADS_DIR, sanitizedUsername);
    const metadataFile = path.join(userDir, 'files_metadata.json');

    try {
      const metadata = await fs.readFile(metadataFile, 'utf8');
      const files = JSON.parse(metadata);
      res.json({ files });
    } catch {
      res.json({ files: [] });
    }
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// Get all files from all users
app.get('/api/files', async (req, res) => {
  try {
    const allFiles = [];
    const entries = await fs.readdir(UPLOADS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const userDir = path.join(UPLOADS_DIR, entry.name);
        const metadataFile = path.join(userDir, 'files_metadata.json');
        
        try {
          const metadata = await fs.readFile(metadataFile, 'utf8');
          const files = JSON.parse(metadata);
          
          // Add username to each file for ownership tracking
          const filesWithOwner = files.map(file => ({
            ...file,
            owner: entry.name
          }));
          
          allFiles.push(...filesWithOwner);
        } catch {
          // No metadata file or corrupted, skip this user
        }
      }
    }
    
    // Sort by upload date (newest first)
    allFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    res.json({ files: allFiles });
  } catch (error) {
    console.error('Get all files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// Download file
app.get('/api/download/:username/:filename', async (req, res) => {
  try {
    const username = req.params.username;
    const filename = req.params.filename;
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(UPLOADS_DIR, sanitizedUsername, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers for download
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete file
app.delete('/api/files/:username/:filename', async (req, res) => {
  try {
    const username = req.params.username;
    const filename = req.params.filename;
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDir = path.join(UPLOADS_DIR, sanitizedUsername);
    const filePath = path.join(userDir, filename);
    const metadataFile = path.join(userDir, 'files_metadata.json');

    // Remove file from filesystem
    try {
      await fs.unlink(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Update metadata
    try {
      const metadata = await fs.readFile(metadataFile, 'utf8');
      const files = JSON.parse(metadata);
      const updatedFiles = files.filter(file => file.filename !== filename);
      await fs.writeFile(metadataFile, JSON.stringify(updatedFiles, null, 2));
    } catch {
      // Metadata file doesn't exist or is corrupted, that's okay
    }

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Save exported product data to server
app.post('/api/export/save', async (req, res) => {
  try {
    const { username, products, exportName } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Products data is required' });
    }
    
    // Sanitize username to prevent directory traversal
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDir = path.join(UPLOADS_DIR, sanitizedUsername);
    
    // Create user directory if it doesn't exist
    await fs.mkdir(userDir, { recursive: true });
    
    // Generate export filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = exportName ? exportName.replace(/[^a-zA-Z0-9_-]/g, '_') : 'products-export';
    const filename = `${name}_${timestamp}.json`;
    const filePath = path.join(userDir, filename);
    
    // Create export data with metadata
    const exportData = {
      products,
      metadata: {
        exportName: exportName || 'Product Export',
        exportedAt: new Date().toISOString(),
        productCount: products.length,
        version: '1.0'
      }
    };
    
    // Save the export file
    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    
    // Update metadata file
    const metadataFile = path.join(userDir, 'files_metadata.json');
    let metadata = [];
    try {
      const existingData = await fs.readFile(metadataFile, 'utf8');
      metadata = JSON.parse(existingData);
    } catch {
      // File doesn't exist yet, start with empty array
    }
    
    const fileInfo = {
      originalName: `${exportName || 'products-export'}.json`,
      filename: filename,
      path: filePath,
      size: JSON.stringify(exportData).length,
      mimetype: 'application/json',
      username: username,
      uploadedAt: new Date().toISOString(),
      type: 'export'
    };
    
    metadata.push(fileInfo);
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
    
    console.log('Export saved successfully:', {
      username: sanitizedUsername,
      filename: filename,
      productCount: products.length
    });
    
    res.json({
      success: true,
      message: 'Export saved successfully',
      export: {
        id: filename,
        name: exportName || 'Product Export',
        productCount: products.length,
        exportedAt: fileInfo.uploadedAt
      }
    });
  } catch (error) {
    console.error('Save export error:', error);
    res.status(500).json({ error: 'Failed to save export' });
  }
});

// Get saved exports for a user
app.get('/api/export/list/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDir = path.join(UPLOADS_DIR, sanitizedUsername);
    const metadataFile = path.join(userDir, 'files_metadata.json');

    try {
      const metadata = await fs.readFile(metadataFile, 'utf8');
      const files = JSON.parse(metadata);
      
      // Filter only export files and map to SavedExport format
      const exports = [];
      
      for (const file of files) {
        if (file.type === 'export' || file.mimetype === 'application/json') {
          let productCount = 0;
          let exportName = file.originalName ? file.originalName.replace(/\.(json|JSON)$/, '') : 'Export';
          
          // Try to read the export file to get the actual product count
          try {
            const filePath = path.join(userDir, file.filename);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const exportData = JSON.parse(fileContent);
            
            console.log(`Processing export file ${file.filename}:`, {
              hasProducts: !!(exportData.products && Array.isArray(exportData.products)),
              hasMetadata: !!exportData.metadata,
              metadataExportName: exportData.metadata?.exportName,
              originalName: file.originalName
            });
            
            // Get product count from various possible structures
            if (exportData.products && Array.isArray(exportData.products)) {
              productCount = exportData.products.length;
              if (exportData.metadata && exportData.metadata.exportName) {
                exportName = exportData.metadata.exportName;
                console.log(`Using metadata export name: ${exportName}`);
              } else {
                console.log(`No metadata export name found, using original name: ${exportName}`);
              }
            } else if (Array.isArray(exportData)) {
              productCount = exportData.length;
            } else if (exportData.items && Array.isArray(exportData.items)) {
              productCount = exportData.items.length;
            } else if (exportData.data && Array.isArray(exportData.data)) {
              productCount = exportData.data.length;
            }
          } catch (error) {
            console.warn(`Failed to read export file ${file.filename}:`, error.message);
            // Keep productCount as 0 if we can't read the file
          }
          
          const exportItem = {
            id: file.filename,
            name: exportName,
            productCount: productCount,
            exportedAt: file.uploadedAt,
            originalName: file.originalName,
            filename: file.filename,
            size: file.size,
            uploadedAt: file.uploadedAt,
            type: file.type || 'export'
          };
          
          console.log(`Final export item for ${file.filename}:`, exportItem);
          exports.push(exportItem);
        }
      }
      
      res.json({ exports });
    } catch {
      res.json({ exports: [] });
    }
  } catch (error) {
    console.error('Get exports error:', error);
    res.status(500).json({ error: 'Failed to retrieve exports' });
  }
});

// Load saved export data
app.get('/api/export/load/:username/:filename', async (req, res) => {
  try {
    const username = req.params.username;
    const filename = req.params.filename;
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(UPLOADS_DIR, sanitizedUsername, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Export file not found' });
    }

    // Read and parse the export file
    const fileContent = await fs.readFile(filePath, 'utf8');
    const exportData = JSON.parse(fileContent);
    
    // Validate the export data structure
    if (!exportData.products || !Array.isArray(exportData.products)) {
      return res.status(400).json({ error: 'Invalid export file format' });
    }
    
    res.json({
      success: true,
      export: exportData
    });
  } catch (error) {
    console.error('Load export error:', error);
    res.status(500).json({ error: 'Failed to load export' });
  }
});

// Get all users with exports (for cross-user export viewing)
app.get('/api/export/users', async (req, res) => {
  try {
    const users = [];
    const entries = await fs.readdir(UPLOADS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const userDir = path.join(UPLOADS_DIR, entry.name);
        const metadataFile = path.join(userDir, 'files_metadata.json');
        
        let exportCount = 0;
        try {
          const metadata = await fs.readFile(metadataFile, 'utf8');
          const files = JSON.parse(metadata);
          // Count only export files
          exportCount = files.filter(file => file.type === 'export' || file.mimetype === 'application/json').length;
        } catch {
          // No metadata file or corrupted
        }
        
        // Only include users who have exports
        if (exportCount > 0) {
          users.push({
            username: entry.name,
            exportCount
          });
        }
      }
    }
    
    res.json({ users });
  } catch (error) {
    console.error('Get export users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users with exports' });
  }
});

// Get all users (for admin purposes)
app.get('/api/users', async (req, res) => {
  try {
    const users = [];
    const entries = await fs.readdir(UPLOADS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const userDir = path.join(UPLOADS_DIR, entry.name);
        const metadataFile = path.join(userDir, 'files_metadata.json');
        
        let fileCount = 0;
        try {
          const metadata = await fs.readFile(metadataFile, 'utf8');
          const files = JSON.parse(metadata);
          fileCount = files.length;
        } catch {
          // No metadata file or corrupted
        }
        
        users.push({
          username: entry.name,
          fileCount
        });
      }
    }
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  await ensureUploadsDir();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Uploads directory: ${UPLOADS_DIR}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch(console.error);
