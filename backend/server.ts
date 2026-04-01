import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import marketRoutes from './routes/markets';
import { startOracleEngine } from './services/oracle';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/markets', marketRoutes);

// Socket.io for Real-time Engine
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // A client can join a specific market room to get live depth chart updates
  socket.on('join_market', (marketId) => {
    socket.join(`market_${marketId}`);
    console.log(`Socket ${socket.id} joined market_${marketId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Expose io to routes/services if needed
export { io };

const PORT = process.env.PORT || 4000;

// Start backend server immediately without MongoDB for MVP
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  
  // Start background Oracle engine polling
  startOracleEngine();
});
