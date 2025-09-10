const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { run } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const organizationRoutes = require('./routes/organizations');
const trainerRoutes = require('./routes/trainers');
const sessionRoutes = require('./routes/sessions');
const analyticsRoutes = require('./routes/analytics');
const apiKeyRoutes = require('./routes/apiKeys');
const templateRoutes = require('./routes/templates');
const testRoutes = require('./routes/tests');
const deploymentRoutes = require('./routes/deployments');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const testEmailRoutes = require('./routes/test');
const contentRoutes = require('./routes/content');
const trainerFlowRoutes = require('./routes/trainerFlows');

const app = express();
const PORT = process.env.PORT || 5000;

run().catch(console.dir);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Chat Train API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/test', testEmailRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/trainer-flows', trainerFlowRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

module.exports = app;