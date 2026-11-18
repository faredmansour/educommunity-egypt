const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const missingEnv = ['JWT_SECRET', 'JWT_REFRESH_SECRET'].filter((key) => !process.env[key]?.trim());
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}. Set them in backend/.env before starting the server.`);
  process.exit(1);
}

const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const errorMiddleware = require('./middleware/error.middleware');
const { sendError } = require('./utils/apiResponse');

// نوصل بقاعدة البيانات MongoDB
connectDB();

const app = express();

// ===== إعدادات أساسية =====
const corsOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((origin) => origin.trim());
app.use(cors({ origin: corsOrigins.includes('*') ? '*' : corsOrigins }));
app.use(express.json());          // نقدر نقرأ JSON من جسم الطلب
app.use(morgan('dev'));           // نطبع كل طلب في الكونسول (مفيد للمتابعة)

// الملفات المرفوعة محلياً تكون متاحة على /uploads
// (لو Cloudinary متظبّط، الملفات بتروح هناك والمسار ده مش بيتستخدم)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== كل مسارات الـAPI تحت الإصدار الأول =====
app.use('/api/v1', require('./routes/v1'));

// ===== لو حد طلب مسار مش موجود =====
app.use((req, res) => sendError(res, 404, 'المسار غير موجود'));

// ===== معالج الأخطاء المركزي — لازم يكون آخر واحد =====
app.use(errorMiddleware);

// ===== سيرفر HTTP + Socket.IO =====
// Express لوحده مابيعرفش يعمل WebSocket، فبنعمل سيرفر HTTP
// ونركّب عليه Express و Socket.IO مع بعض على نفس البورت.
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

(async () => {
  await initSocket(server);
  server.listen(PORT, () => console.log(`🚀 السيرفر شغّال على http://localhost:${PORT}`));
})().catch((error) => {
  console.error('❌ فشل بدء Socket.IO:', error);
  process.exit(1);
});
