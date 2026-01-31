/**
 * USAGE EXAMPLES - OpenTelemetry Observability Module
 * 
 * These examples show how to integrate the metrics and tracing modules
 * into different types of Node.js applications.
 */

// ============================================================================
// EXAMPLE 1: Basic Express API (Minimal Setup)
// ============================================================================

function example1_basicExpressAPI() {
  const express = require('express');
  const { initTracing } = require('./obervability/tracing');
  const { initMetrics } = require('./obervability/metrics');

  // 1. Initialize observability FIRST
  initTracing();
  const { middleware } = initMetrics({
    port: 9464,
    serviceName: 'my-api-service'
  });

  // 2. Create Express app
  const app = express();
  
  // 3. Apply metrics middleware
  app.use(middleware);
  
  // 4. Define routes
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  app.listen(3000);
  
  // That's it! You now have:
  // - HTTP request count metrics
  // - HTTP request duration metrics
  // - Active requests gauge
  // - Distributed tracing
}

// ============================================================================
// EXAMPLE 2: API with Custom Business Metrics
// ============================================================================

function example2_customBusinessMetrics() {
  const express = require('express');
  const { initTracing } = require('./obervability/tracing');
  const { initMetrics, getMeter } = require('./obervability/metrics');

  initTracing();
  const { middleware } = initMetrics({ serviceName: 'ecommerce-api' });
  
  const app = express();
  app.use(express.json());
  app.use(middleware);

  // Create custom business metrics
  const meter = getMeter();
  
  const ordersProcessed = meter.createCounter('orders_processed_total', {
    description: 'Total orders processed',
  });
  
  const orderValue = meter.createHistogram('order_value_usd', {
    description: 'Order value in USD',
    unit: 'usd',
  });
  
  const inventoryLevel = meter.createUpDownCounter('inventory_items', {
    description: 'Current inventory level',
  });

  // Use custom metrics in your routes
  app.post('/orders', (req, res) => {
    const { items, totalValue } = req.body;
    
    // Process order...
    
    // Record metrics
    ordersProcessed.add(1, { 
      payment_method: 'credit_card',
      region: 'us-west' 
    });
    
    orderValue.record(totalValue, { 
      category: 'electronics' 
    });
    
    inventoryLevel.add(-items.length);
    
    res.json({ orderId: '12345' });
  });

  app.listen(3000);
}

// ============================================================================
// EXAMPLE 3: Multiple Microservices
// ============================================================================

function example3_microservices() {
  // Service A: User Service
  // File: services/user-service/server.js
  const userService = () => {
    const express = require('express');
    const { initTracing } = require('../../obervability/tracing');
    const { initMetrics } = require('../../obervability/metrics');

    initTracing();
    const { middleware } = initMetrics({
      serviceName: 'user-service',
      port: 9464  // Different port per service
    });

    const app = express();
    app.use(middleware);
    
    app.get('/users/:id', (req, res) => {
      res.json({ id: req.params.id, name: 'John' });
    });

    app.listen(3001);
  };

  // Service B: Order Service
  // File: services/order-service/server.js
  const orderService = () => {
    const express = require('express');
    const { initTracing } = require('../../obervability/tracing');
    const { initMetrics } = require('../../obervability/metrics');

    initTracing();
    const { middleware } = initMetrics({
      serviceName: 'order-service',
      port: 9465  // Different port!
    });

    const app = express();
    app.use(middleware);
    
    app.get('/orders/:id', (req, res) => {
      res.json({ id: req.params.id, status: 'shipped' });
    });

    app.listen(3002);
  };
}

// ============================================================================
// EXAMPLE 4: Conditional Metrics (Only Specific Routes)
// ============================================================================

function example4_conditionalMetrics() {
  const express = require('express');
  const { initTracing } = require('./obervability/tracing');
  const { initMetrics } = require('./obervability/metrics');

  initTracing();
  const { middleware } = initMetrics();
  
  const app = express();

  // Only track metrics for /api/* routes
  app.use('/api', middleware);

  // These will have metrics
  app.get('/api/users', (req, res) => res.json({ users: [] }));
  app.get('/api/orders', (req, res) => res.json({ orders: [] }));

  // These won't have metrics
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/ping', (req, res) => res.send('pong'));

  app.listen(3000);
}

// ============================================================================
// EXAMPLE 5: Fastify Framework
// ============================================================================

async function example5_fastifyFramework() {
  const fastify = require('fastify')();
  const { initTracing } = require('./obervability/tracing');
  const { initMetrics } = require('./obervability/metrics');

  initTracing();
  const { middleware } = initMetrics({ serviceName: 'fastify-api' });

  // Convert Express middleware to Fastify
  await fastify.register(require('@fastify/express'));
  fastify.use(middleware);

  fastify.get('/health', async (request, reply) => {
    return { status: 'healthy' };
  });

  await fastify.listen({ port: 3000 });
}

// ============================================================================
// EXAMPLE 6: Native HTTP Server
// ============================================================================

function example6_nativeHTTPServer() {
  const http = require('http');
  const { initTracing } = require('./obervability/tracing');
  const { initMetrics } = require('./obervability/metrics');

  initTracing();
  const { middleware } = initMetrics({ serviceName: 'http-server' });

  const server = http.createServer((req, res) => {
    // Wrap with metrics middleware
    middleware(req, res, () => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy' }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
  });

  server.listen(3000);
}

// ============================================================================
// EXAMPLE 7: Access HTTP Instruments Directly
// ============================================================================

function example7_directInstrumentAccess() {
  const express = require('express');
  const { initTracing } = require('./obervability/tracing');
  const { initMetrics, getHttpInstruments } = require('./obervability/metrics');

  initTracing();
  initMetrics();
  
  const app = express();

  // Get instruments manually
  const { httpRequestCounter, httpRequestDuration, activeRequests } = getHttpInstruments();

  // Custom middleware with manual tracking
  app.use((req, res, next) => {
    const start = Date.now();
    
    activeRequests.add(1, { route: req.path });
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Add custom labels
      httpRequestCounter.add(1, {
        method: req.method,
        route: req.path,
        status: res.statusCode,
        tenant: req.headers['x-tenant-id'] || 'default',  // Custom label!
        version: 'v2'  // Custom label!
      });
      
      httpRequestDuration.record(duration, {
        method: req.method,
        route: req.path,
        status: res.statusCode
      });
      
      activeRequests.add(-1, { route: req.path });
    });
    
    next();
  });

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.listen(3000);
}

// ============================================================================
// EXAMPLE 8: Observable Gauges (Async Metrics)
// ============================================================================

function example8_observableGauges() {
  const express = require('express');
  const { initTracing } = require('./obervability/tracing');
  const { initMetrics, getMeter } = require('./obervability/metrics');

  initTracing();
  const { middleware } = initMetrics();
  
  const app = express();
  app.use(middleware);

  const meter = getMeter();

  // Create observable gauge for memory usage
  const memoryGauge = meter.createObservableGauge('nodejs_memory_usage_bytes', {
    description: 'Node.js memory usage',
  });

  memoryGauge.addCallback((observableResult) => {
    const mem = process.memoryUsage();
    observableResult.observe(mem.heapUsed, { type: 'heapUsed' });
    observableResult.observe(mem.heapTotal, { type: 'heapTotal' });
    observableResult.observe(mem.rss, { type: 'rss' });
    observableResult.observe(mem.external, { type: 'external' });
  });

  // Create observable gauge for active connections
  let activeConnections = 0;
  const connectionGauge = meter.createObservableGauge('active_connections', {
    description: 'Number of active database connections',
  });

  connectionGauge.addCallback((observableResult) => {
    observableResult.observe(activeConnections, { pool: 'primary' });
  });

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.listen(3000);
}

// ============================================================================
// EXAMPLE 9: Error Tracking Metrics
// ============================================================================

function example9_errorTracking() {
  const express = require('express');
  const { initTracing } = require('./obervability/tracing');
  const { initMetrics, getMeter } = require('./obervability/metrics');

  initTracing();
  const { middleware } = initMetrics();
  
  const app = express();
  app.use(express.json());
  app.use(middleware);

  const meter = getMeter();

  // Create error tracking metrics
  const errorCounter = meter.createCounter('api_errors_total', {
    description: 'Total API errors',
  });

  const validationErrorCounter = meter.createCounter('validation_errors_total', {
    description: 'Total validation errors',
  });

  // Routes
  app.post('/users', (req, res) => {
    try {
      if (!req.body.email) {
        validationErrorCounter.add(1, { field: 'email' });
        return res.status(400).json({ error: 'Email required' });
      }
      
      // Process user...
      res.json({ id: '123' });
    } catch (error) {
      errorCounter.add(1, { 
        route: '/users', 
        type: error.name 
      });
      res.status(500).json({ error: 'Internal error' });
    }
  });

  // Global error handler
  app.use((err, req, res, next) => {
    errorCounter.add(1, {
      route: req.path,
      type: err.name || 'UnknownError',
      status: err.status || 500
    });
    
    res.status(err.status || 500).json({ error: err.message });
  });

  app.listen(3000);
}

// ============================================================================
// EXAMPLE 10: Database Query Metrics
// ============================================================================

function example10_databaseMetrics() {
  const express = require('express');
  const { initTracing } = require('./obervability/tracing');
  const { initMetrics, getMeter } = require('./obervability/metrics');

  initTracing();
  const { middleware } = initMetrics();
  
  const app = express();
  app.use(middleware);

  const meter = getMeter();

  // Database metrics
  const dbQueryCounter = meter.createCounter('db_queries_total', {
    description: 'Total database queries',
  });

  const dbQueryDuration = meter.createHistogram('db_query_duration_ms', {
    description: 'Database query duration',
    unit: 'ms',
  });

  const dbConnectionPool = meter.createUpDownCounter('db_connection_pool_size', {
    description: 'Database connection pool size',
  });

  // Simulated database wrapper
  async function executeQuery(sql, operation) {
    const start = Date.now();
    
    try {
      // Execute query...
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const duration = Date.now() - start;
      
      dbQueryCounter.add(1, { 
        operation,
        status: 'success' 
      });
      
      dbQueryDuration.record(duration, { operation });
      
      return { rows: [] };
    } catch (error) {
      dbQueryCounter.add(1, { 
        operation,
        status: 'error' 
      });
      throw error;
    }
  }

  app.get('/users', async (req, res) => {
    const result = await executeQuery('SELECT * FROM users', 'select');
    res.json(result);
  });

  app.listen(3000);
}

// ============================================================================
// HOW TO COPY TO YOUR PROJECT
// ============================================================================

/*
1. Copy the entire 'obervability' folder to your project:
   
   your-project/
   ├── obervability/
   │   ├── tracing.js
   │   ├── metrics.js
   │   └── README.md
   ├── server.js
   └── package.json

2. Install dependencies:

   npm install @opentelemetry/api \
               @opentelemetry/sdk-node \
               @opentelemetry/sdk-metrics \
               @opentelemetry/exporter-prometheus \
               @opentelemetry/exporter-trace-otlp-http \
               @opentelemetry/auto-instrumentations-node \
               @opentelemetry/resources \
               @opentelemetry/semantic-conventions

3. Initialize in your server.js:

   const { initTracing } = require('./obervability/tracing');
   const { initMetrics } = require('./obervability/metrics');

   initTracing();
   const { middleware } = initMetrics({ serviceName: 'your-service' });

   const app = express();
   app.use(middleware);

4. Access metrics:
   - Prometheus metrics: http://localhost:9464/metrics
   - Jaeger traces: http://localhost:16686

5. Configure Prometheus to scrape your service:

   scrape_configs:
     - job_name: 'your-service'
       static_configs:
         - targets: ['localhost:9464']
*/

module.exports = {
  example1_basicExpressAPI,
  example2_customBusinessMetrics,
  example3_microservices,
  example4_conditionalMetrics,
  example5_fastifyFramework,
  example6_nativeHTTPServer,
  example7_directInstrumentAccess,
  example8_observableGauges,
  example9_errorTracking,
  example10_databaseMetrics,
};
