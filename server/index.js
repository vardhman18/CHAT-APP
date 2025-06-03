const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { db, dbMiddleware } = require('./db');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messages');
const roomRoutes = require('./routes/roomRoutes');
const userSettingsRoutes = require('./routes/userSettingsRoutes');
const { handleSocketConnection } = require('./socketHandlers');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Updated CORS configuration
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin not allowed by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(express.json());
app.use(dbMiddleware);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Attach socket.io and db to app for use in routes
app.set('io', io);
app.set('db', db);

// API routes
app.use('/api/auth', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/user-settings', userSettingsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket middleware to attach db
io.use((socket, next) => {
  socket.db = db;
  next();
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Create a request-like object with db
  socket.request = {
    app: {
      get: (key) => {
        if (key === 'db') return db;
        if (key === 'io') return io;
        return null;
      }
    }
  };
  
  handleSocketConnection(io)(socket);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server and database...');
  server.close(() => {
    db.close(() => {
      console.log('Server and database closed.');
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Allowed frontend origins:', allowedOrigins);
}); 