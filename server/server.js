import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Enable CORS for all routes
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());

// In-memory storage (replace with database in production)
const users = [];
const rooms = [];
const messages = [];

// Add a default room
rooms.push({
  id: 1,
  name: "General",
  createdBy: "system",
  createdAt: new Date().toISOString()
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Find user in our database
      const user = users.find(u => u.id === decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Socket authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Invalid token'));
      }

      // Find user in our database
      const user = users.find(u => u.id === decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error'));
  }
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register attempt:', req.body);
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      displayName: displayName || email.split('@')[0]
    };

    users.push(user);
    console.log('User registered:', user.email);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful:', email);
    res.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Room routes
app.get('/api/rooms', authenticateToken, (req, res) => {
  try {
    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

app.post('/api/rooms', authenticateToken, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    const room = {
      id: rooms.length + 1,
      name,
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };
    rooms.push(room);
    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
});

app.get('/api/rooms/:roomId', authenticateToken, (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Error fetching room' });
  }
});

// Message routes
app.get('/api/rooms/:roomId/messages', authenticateToken, (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const roomMessages = messages.filter(m => m.roomId === roomId);
    console.log(`Fetched ${roomMessages.length} messages for room ${roomId}`);
    res.json(roomMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

app.post('/api/rooms/:roomId/messages', authenticateToken, (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = {
      id: messages.length + 1,
      roomId,
      userId: req.user.id,
      content,
      timestamp: new Date().toISOString()
    };
    messages.push(message);

    // Emit to room members
    io.to(`room:${roomId}`).emit('message:new', message);
    console.log(`New message sent to room ${roomId} by user ${req.user.id}`);
    res.status(201).json(message);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ message: 'Error creating message' });
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('room:join', (roomId) => {
    if (!socket.user) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    socket.join(`room:${roomId}`);
    console.log(`User ${socket.user.id} (${socket.id}) joined room ${roomId}`);
    
    // Notify room members
    socket.to(`room:${roomId}`).emit('user:joined', {
      userId: socket.user.id,
      roomId: roomId
    });
  });

  socket.on('room:leave', (roomId) => {
    if (!socket.user) return;

    socket.leave(`room:${roomId}`);
    console.log(`User ${socket.user.id} (${socket.id}) left room ${roomId}`);
    
    // Notify room members
    socket.to(`room:${roomId}`).emit('user:left', {
      userId: socket.user.id,
      roomId: roomId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Notify all rooms this user was in
    if (socket.user) {
      const userRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      userRooms.forEach(room => {
        socket.to(room).emit('user:left', {
          userId: socket.user.id,
          roomId: room.replace('room:', '')
        });
      });
    }
  });
});

// Start server
const PORT = 5001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('POST /api/auth/register - Register a new user');
  console.log('POST /api/auth/login - Login');
  console.log('GET /api/rooms - Get all rooms (requires auth)');
  console.log('POST /api/rooms - Create a new room (requires auth)');
}); 