const { Server } = require('socket.io');
const socketAuth = require('../middleware/socketAuth.middleware');
const registerSocketHandlers = require('../sockets');

async function attachRedisAdapter(io) {
  if (process.env.SOCKET_REDIS_ADAPTER !== 'true') return;

  // Optional dependency: this keeps local/demo installs working without Redis
  // adapter packages, while production can enable horizontal Socket.IO scaling.
  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');
    if (!process.env.REDIS_URL) throw new Error('REDIS_URL is required');

    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    pubClient.on('error', (error) => console.error('Redis pub client error:', error.message));
    subClient.on('error', (error) => console.error('Redis sub client error:', error.message));
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('⚡ Socket.IO Redis adapter attached');
  } catch (error) {
    console.error('❌ SOCKET_REDIS_ADAPTER=true but Redis adapter packages are unavailable or failed:', error.message);
    throw error;
  }
}

async function initSocket(httpServer) {
  const corsOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((origin) => origin.trim());
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins.includes('*') ? '*' : corsOrigins },
    transports: ['websocket', 'polling'],
  });

  io.use(socketAuth);
  await attachRedisAdapter(io);
  registerSocketHandlers(io);

  console.log('⚡ Socket.IO شغّال');
  return io;
}

module.exports = initSocket;
