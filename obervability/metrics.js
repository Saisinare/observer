'use strict';

const { MeterProvider } = require('@opentelemetry/sdk-metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { metrics } = require('@opentelemetry/api');

let meterProvider = null;
let meter = null;
let httpRequestCounter = null;
let httpRequestDuration = null;
let activeRequests = null;

/**
 * Initialize metrics infrastructure and create HTTP metric instruments
 * @param {Object} config - Configuration options
 * @param {number} config.port - Prometheus exporter port (default: 9464)
 * @param {string} config.endpoint - Metrics endpoint path (default: '/metrics')
 * @param {string} config.serviceName - Service name for metrics
 * @returns {Object} Metrics instruments and middleware
 */
function initMetrics(config = {}) {
  const {
    port = 9464,
    endpoint = '/metrics',
    serviceName = process.env.SERVICE_NAME || 'api-monitoring-service',
  } = config;

  // Create a Prometheus exporter
  const prometheusExporter = new PrometheusExporter({
    port,
    endpoint,
  });

  // Create MeterProvider with resource
  meterProvider = new MeterProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });

  // Add the Prometheus exporter as a metric reader
  meterProvider.addMetricReader(prometheusExporter);

  // Set global meter provider
  metrics.setGlobalMeterProvider(meterProvider);

  // Get meter instance
  meter = meterProvider.getMeter(serviceName);

  // Create HTTP metric instruments
  httpRequestCounter = meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
  });

  httpRequestDuration = meter.createHistogram('http_request_duration_ms', {
    description: 'HTTP request duration in milliseconds',
    unit: 'ms',
  });

  activeRequests = meter.createUpDownCounter('http_active_requests', {
    description: 'Number of active HTTP requests',
  });

  console.log(`✅ Prometheus metrics server started on port ${port}`);
  console.log('✅ Metrics initialized successfully');

  return {
    meterProvider,
    meter,
    instruments: {
      httpRequestCounter,
      httpRequestDuration,
      activeRequests,
    },
    middleware: createHttpMetricsMiddleware(),
  };
}

/**
 * Create Express/Connect middleware for automatic HTTP metrics collection
 * @returns {Function} Express middleware function
 */
function createHttpMetricsMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Increment active requests
    activeRequests.add(1, {
      method: req.method,
      route: req.path || req.url,
    });

    // Track request completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Decrement active requests
      activeRequests.add(-1, {
        method: req.method,
        route: req.path || req.url,
      });
      
      // Record request count
      httpRequestCounter.add(1, {
        method: req.method,
        route: req.path || req.url,
        status: res.statusCode,
      });
      
      // Record request duration
      httpRequestDuration.record(duration, {
        method: req.method,
        route: req.path || req.url,
        status: res.statusCode,
      });
    });

    next();
  };
}

/**
 * Get the meter instance for creating custom metrics
 * @returns {Meter} OpenTelemetry Meter instance
 */
function getMeter() {
  if (!meter) {
    throw new Error('Metrics not initialized. Call initMetrics() first.');
  }
  return meter;
}

/**
 * Get existing HTTP metric instruments
 * @returns {Object} HTTP metric instruments
 */
function getHttpInstruments() {
  if (!httpRequestCounter || !httpRequestDuration || !activeRequests) {
    throw new Error('Metrics not initialized. Call initMetrics() first.');
  }
  return {
    httpRequestCounter,
    httpRequestDuration,
    activeRequests,
  };
}

module.exports = { 
  initMetrics,
  getMeter,
  getHttpInstruments,
  createHttpMetricsMiddleware,
};
