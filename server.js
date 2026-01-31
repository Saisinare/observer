// Initialize OpenTelemetry FIRST (before any other imports)
const { initTracing } = require('./obervability/tracing');
const { initMetrics } = require('./obervability/metrics');

// Initialize observability
initTracing();

// Initialize metrics with configuration
const { middleware: metricsMiddleware } = initMetrics({
  port: 9464,
  endpoint: '/metrics',
  serviceName: 'api-monitoring-service',
});

console.log('OpenTelemetry initialized successfully');

// Now import and start the application
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply metrics middleware - automatically tracks all HTTP requests
app.use(metricsMiddleware);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Monitoring Project with OpenTelemetry',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      slow: '/api/slow',
      error: '/api/error',
      metrics: 'http://localhost:9464/metrics'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'api-monitoring-service'
  });
});

// Simulated slow endpoint for testing
app.get('/api/slow', (req, res) => {
  setTimeout(() => {
    res.json({ 
      message: 'This was a slow request', 
      delay: '2 seconds',
      timestamp: new Date().toISOString()
    });
  }, 2000);
});

// Simulated error endpoint for testing
app.get('/api/error', (req, res) => {
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: 'Simulated error for testing',
    timestamp: new Date().toISOString()
  });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`📊 Metrics will be exported to OTLP collector`);
  console.log(`🔍 Traces will be sent to Jaeger`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
