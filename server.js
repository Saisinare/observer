
const { initTracing } = require('./obervability/tracing');
const { initMetrics } = require('./obervability/metrics');
const { logger, httpLogger, initLogging } = require('./obervability/logging');

initTracing();

const { middleware: metricsMiddleware } = initMetrics({
  port: 9464,
  endpoint: '/metrics',
  serviceName: 'api-monitoring-service',
});

initLogging();

logger.info('OpenTelemetry initialized successfully');

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);
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
  logger.error('Simulated error endpoint called');
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: 'Simulated error for testing',
    timestamp: new Date().toISOString()
  });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server started on http://localhost:${PORT}`);
  logger.info('Metrics will be exported to OTLP collector');
  logger.info('Traces will be sent to Jaeger');
  logger.info('Logs will be sent to Loki via OTLP collector');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
