// Optional horizontal Socket.IO scaling
//
// The actual integration lives in backend/src/config/socket.js.
// Enable it only in a multi-instance deployment after installing:
//   npm install @socket.io/redis-adapter redis
//
// Environment:
//   SOCKET_REDIS_ADAPTER=true
//   REDIS_URL=rediss://<elasticache-endpoint>:6379
//
// The application keeps the adapter optional so a single local instance can
// run without Redis pub/sub clients. AWS Terraform enables Redis encryption
// at rest and in transit for the production path.
