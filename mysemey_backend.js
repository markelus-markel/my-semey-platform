// My Semey Platform - Backend API
// AWS Elastic Beanstalk ready Node.js application

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check endpoint for Elastic Beanstalk
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock database (in production, use PostgreSQL/MongoDB)
let mockData = {
  users: [
    { id: 1, name: 'Admin User', email: 'admin@semey.kz', role: 'admin' },
    { id: 2, name: 'Investor User', email: 'investor@semey.kz', role: 'investor' }
  ],
  projects: [
    {
      id: 1,
      name: 'Aqua-Monitor Abay',
      sector: 'water',
      budget: 50000000,
      status: 'active',
      roi: 15.5,
      esg_score: 85
    },
    {
      id: 2,
      name: 'Smart Road Semey',
      sector: 'transport',
      budget: 120000000,
      status: 'planning',
      roi: 22.3,
      esg_score: 78
    },
    {
      id: 3,
      name: 'Green.City.Semei',
      sector: 'ecology',
      budget: 30000000,
      status: 'active',
      roi: 12.1,
      esg_score: 95
    }
  ],
  iotData: [
    { sensor_id: 'WTR-001', type: 'water', value: 245.5, unit: 'm3/h', timestamp: new Date() },
    { sensor_id: 'TMP-001', type: 'temperature', value: 68.2, unit: '°C', timestamp: new Date() },
    { sensor_id: 'TRF-001', type: 'traffic', value: 342, unit: 'vehicles/h', timestamp: new Date() }
  ],
  loyaltyPoints: [
    { user_id: 1, points: 1250, activities: ['volunteer', 'recycling'] },
    { user_id: 2, points: 890, activities: ['public_transport'] }
  ]
};

// ==================== API ROUTES ====================

// Dashboard - Analytics Overview
app.get('/api/v1/dashboard', (req, res) => {
  try {
    const analytics = {
      total_projects: mockData.projects.length,
      active_projects: mockData.projects.filter(p => p.status === 'active').length,
      total_budget: mockData.projects.reduce((sum, p) => sum + p.budget, 0),
      avg_roi: (mockData.projects.reduce((sum, p) => sum + p.roi, 0) / mockData.projects.length).toFixed(2),
      avg_esg: (mockData.projects.reduce((sum, p) => sum + p.esg_score, 0) / mockData.projects.length).toFixed(1),
      total_users: mockData.users.length,
      iot_sensors_active: mockData.iotData.length,
      last_update: new Date().toISOString()
    };
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Projects - Get all projects
app.get('/api/v1/projects', (req, res) => {
  try {
    const { sector, status } = req.query;
    let projects = [...mockData.projects];
    
    if (sector) {
      projects = projects.filter(p => p.sector === sector);
    }
    if (status) {
      projects = projects.filter(p => p.status === status);
    }
    
    res.json({ success: true, data: projects, count: projects.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Projects - Get single project
app.get('/api/v1/projects/:id', (req, res) => {
  try {
    const project = mockData.projects.find(p => p.id === parseInt(req.params.id));
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Projects - Create new project
app.post('/api/v1/projects', (req, res) => {
  try {
    const { name, sector, budget, status, roi, esg_score } = req.body;
    
    if (!name || !sector || !budget) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const newProject = {
      id: mockData.projects.length + 1,
      name,
      sector,
      budget: parseFloat(budget),
      status: status || 'planning',
      roi: parseFloat(roi) || 0,
      esg_score: parseInt(esg_score) || 0,
      created_at: new Date().toISOString()
    };
    
    mockData.projects.push(newProject);
    res.status(201).json({ success: true, data: newProject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// IoT - Get real-time sensor data
app.get('/api/v1/iot/sensors', (req, res) => {
  try {
    const { type } = req.query;
    let sensors = [...mockData.iotData];
    
    if (type) {
      sensors = sensors.filter(s => s.type === type);
    }
    
    // Simulate real-time data by adding random variation
    sensors = sensors.map(s => ({
      ...s,
      value: s.value + (Math.random() - 0.5) * 10,
      timestamp: new Date()
    }));
    
    res.json({ success: true, data: sensors, count: sensors.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// IoT - Submit sensor reading
app.post('/api/v1/iot/sensors', (req, res) => {
  try {
    const { sensor_id, type, value, unit } = req.body;
    
    if (!sensor_id || !type || value === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const reading = {
      sensor_id,
      type,
      value: parseFloat(value),
      unit: unit || 'unit',
      timestamp: new Date()
    };
    
    mockData.iotData.push(reading);
    res.status(201).json({ success: true, data: reading });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Loyalty - Get user points
app.get('/api/v1/loyalty/:userId', (req, res) => {
  try {
    const loyalty = mockData.loyaltyPoints.find(l => l.user_id === parseInt(req.params.userId));
    if (!loyalty) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: loyalty });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Loyalty - Add points
app.post('/api/v1/loyalty/add', (req, res) => {
  try {
    const { user_id, points, activity } = req.body;
    
    if (!user_id || !points || !activity) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    let userLoyalty = mockData.loyaltyPoints.find(l => l.user_id === parseInt(user_id));
    
    if (!userLoyalty) {
      userLoyalty = { user_id: parseInt(user_id), points: 0, activities: [] };
      mockData.loyaltyPoints.push(userLoyalty);
    }
    
    userLoyalty.points += parseInt(points);
    userLoyalty.activities.push(activity);
    
    res.json({ success: true, data: userLoyalty, message: `Added ${points} points for ${activity}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics - AI Predictions (mock)
app.get('/api/v1/analytics/predictions', (req, res) => {
  try {
    const predictions = {
      water_consumption: {
        current: 245.5,
        predicted_next_month: 238.2,
        trend: 'decreasing',
        savings_potential: '3.0%'
      },
      traffic_flow: {
        current: 342,
        predicted_peak_hour: 485,
        optimization_recommendation: 'Add traffic light at intersection A'
      },
      project_roi: {
        avg_current: 16.6,
        predicted_3_years: 19.2,
        confidence: 0.85
      }
    };
    
    res.json({ success: true, data: predictions, generated_at: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Users - Get all users
app.get('/api/v1/users', (req, res) => {
  try {
    const users = mockData.users.map(({ id, name, email, role }) => ({ id, name, email, role }));
    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Integration - External systems status
app.get('/api/v1/integrations/status', (req, res) => {
  try {
    const integrations = [
      { name: 'AgroDigit Abai', status: 'connected', last_sync: new Date(Date.now() - 300000).toISOString() },
      { name: 'FreshUz', status: 'connected', last_sync: new Date(Date.now() - 120000).toISOString() },
      { name: 'Aqua-Monitor', status: 'connected', last_sync: new Date(Date.now() - 60000).toISOString() },
      { name: 'Smart Road', status: 'connected', last_sync: new Date(Date.now() - 30000).toISOString() },
      { name: 'eGov API', status: 'degraded', last_sync: new Date(Date.now() - 600000).toISOString() }
    ];
    
    res.json({ success: true, data: integrations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 My Semey API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
});

module.exports = app;