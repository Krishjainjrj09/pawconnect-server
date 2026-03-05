require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');   // ✅ Added for frontend serving
const connectDB   = require('./config/db');

const connectDB   = require('./db');
const authRoutes      = require('./auth');
const petRoutes       = require('./pets');
const lfRoutes        = require('./lostfound');
const adminRoutes     = require('./admin');
const uploadRoutes    = require('./upload');

connectDB();
const app = express();

// 🔹 Security & Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));



// ✅ Serve Frontend from "public" folder
app.use(express.static(__dirname));;

// 🔹 Rate Limiter (only for API)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { ok: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// 🔹 API Routes
app.use('/api/auth',      authRoutes);
app.use('/api/pets',      petRoutes);
app.use('/api/lostfound', lfRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/adoptions', require('./adoptions'));;

// 🔹 Root Route (Optional – can keep or remove)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔹 404 Handler
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Route ${req.originalUrl} not found.` });
});

// 🔹 Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.statusCode || 500).json({
    ok: false,
    message: err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🐾 PawConnect API running on port ${PORT}`);
});


module.exports = app;
