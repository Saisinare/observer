# OpenTelemetry Observability Module

Complete, reusable observability setup with tracing and metrics for Node.js APIs.

## 📁 Files

- **`tracing.js`** - Distributed tracing with Jaeger
- **`metrics.js`** - Prometheus metrics with automatic HTTP instrumentation
- **`README.md`** - This documentation

---

## 🚀 Quick Start

### 1. Basic Setup (Auto HTTP Metrics)

```javascript
// server.js
const { initTracing } = require('./obervability/tracing');
const { initMetrics } = require('./obervability/metrics');
const express = require('express');

// Initialize observability FIRST
initTracing();
const { middleware: metricsMiddleware } = initMetrics({
  port: 9464,
  endpoint: '/metrics',
  serviceName: 'my-api-service',
});

const app = express();

// Apply metrics middleware - automatically tracks all HTTP requests
app.use(metricsMiddleware);

// Your routes here
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
```

**That's it!** Your API now exports:
- ✅ HTTP request count by method, route, status
- ✅ HTTP request duration histogram
- ✅ Active requests gauge
- ✅ Distributed traces to Jaeger

---

## 📊 Configuration Options

### Metrics Configuration

```javascript
const { middleware, meter, instruments } = initMetrics({
  port: 9464,              // Prometheus exporter port
  endpoint: '/metrics',     // Metrics endpoint path
  serviceName: 'my-service' // Service name in metrics
});
```

### Tracing Configuration

Tracing uses environment variables or defaults:

```bash
# Optional environment variables
SERVICE_NAME=my-api-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

---

## 🎯 Use Cases

### Use Case 1: Basic Express API

```javascript
const express = require('express');
const { initTracing } = require('./obervability/tracing');
const { initMetrics } = require('./obervability/metrics');

initTracing();
const { middleware } = initMetrics();

const app = express();
app.use(middleware);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(3000);
```

---

### Use Case 2: Custom Business Metrics

```javascript
const { initMetrics, getMeter } = require('./obervability/metrics');

// Initialize with auto HTTP metrics
const { middleware } = initMetrics({ serviceName: 'payment-service' });
app.use(middleware);

// Create custom business metrics
const meter = getMeter();
const orderCounter = meter.createCounter('orders_processed_total', {
  description: 'Total orders processed',
});
const paymentDuration = meter.createHistogram('payment_processing_ms', {
  description: 'Payment processing duration',
  unit: 'ms',
});

// Use in your code
app.post('/orders', (req, res) => {
  const start = Date.now();
  
  // Process order...
  
  orderCounter.add(1, { 
    status: 'success',
    payment_method: 'credit_card' 
  });
  
  paymentDuration.record(Date.now() - start, {
    payment_method: 'credit_card'
  });
  
  res.json({ orderId: '12345' });
});
```

---

### Use Case 3: Multiple Services

```javascript
// service-a/server.js
initTracing();
const { middleware } = initMetrics({ 
  serviceName: 'service-a',
  port: 9464 
});

// service-b/server.js
initTracing();
const { middleware } = initMetrics({ 
  serviceName: 'service-b',
  port: 9465  // Different port!
});
```

---

### Use Case 4: Non-Express Frameworks (Fastify, Koa, etc.)

#### Fastify

```javascript
const fastify = require('fastify')();
const { initMetrics } = require('./obervability/metrics');

const { middleware } = initMetrics();

// Convert Express middleware to Fastify
fastify.use(require('@fastify/express'));
fastify.use(middleware);

fastify.get('/health', async (req, reply) => {
  return { status: 'ok' };
});
```

#### Koa

```javascript
const Koa = require('koa');
const { initMetrics } = require('./obervability/metrics');

const app = new Koa();
const { middleware } = initMetrics();

// Wrap Express middleware for Koa
app.use((ctx, next) => {
  return new Promise((resolve) => {
    middleware(ctx.req, ctx.res, () => {
      resolve(next());
    });
  });
});
```

#### Native HTTP Server

```javascript
const http = require('http');
const { initMetrics } = require('./obervability/metrics');

const { middleware } = initMetrics();

const server = http.createServer((req, res) => {
  middleware(req, res, () => {
    res.writeHead(200);
    res.end('Hello World');
  });
});

server.listen(3000);
```

---

## 📈 Available Metrics

### Automatic HTTP Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `http_requests_total` | Counter | method, route, status | Total HTTP requests |
| `http_request_duration_ms` | Histogram | method, route, status | Request duration in ms |
| `http_active_requests` | Gauge | method, route | Currently active requests |

### Custom Metric Types

```javascript
const meter = getMeter();

// Counter - only increases
const counter = meter.createCounter('items_total');
counter.add(1, { type: 'order' });

// Histogram - distribution of values
const histogram = meter.createHistogram('processing_time_ms');
histogram.record(150, { operation: 'checkout' });

// UpDownCounter - can increase or decrease
const gauge = meter.createUpDownCounter('queue_size');
gauge.add(5);   // Add to queue
gauge.add(-2);  // Remove from queue

// Observable Gauge - value polled periodically
const observableGauge = meter.createObservableGauge('memory_usage_bytes');
observableGauge.addCallback((result) => {
  result.observe(process.memoryUsage().heapUsed, { type: 'heap' });
});
```

---

## 🔧 Advanced Usage

### Access Instruments Directly

```javascript
const { getHttpInstruments } = require('./obervability/metrics');

// After initMetrics() is called
const { httpRequestCounter, httpRequestDuration, activeRequests } = getHttpInstruments();

// Manually record metrics
httpRequestCounter.add(1, { method: 'GET', route: '/custom', status: 200 });
```

### Custom Labels

```javascript
app.use(middleware);

// Add custom labels to requests
app.use((req, res, next) => {
  req.metricLabels = {
    tenant: req.headers['x-tenant-id'],
    version: 'v2'
  };
  next();
});
```

### Conditional Metrics

```javascript
const { middleware } = initMetrics();

// Only track metrics for specific routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    middleware(req, res, next);
  } else {
    next();
  }
});
```

---

## 🌐 Deployment

### Docker Compose

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
      - "9464:9464"  # Prometheus metrics
    environment:
      SERVICE_NAME: my-api
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:9464']
```

---

## 🎨 Grafana Dashboards

### Example PromQL Queries

```promql
# Request rate (requests per second)
rate(http_requests_total[1m])

# Average request duration
rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[1m])) / sum(rate(http_requests_total[1m]))

# Active requests
http_active_requests
```

---

## 🐛 Troubleshooting

### No Metrics Appearing

1. Check Prometheus exporter is running:
   ```bash
   curl http://localhost:9464/metrics
   ```

2. Verify middleware is applied:
   ```javascript
   app.use(metricsMiddleware); // Before routes!
   ```

3. Generate traffic to create metrics:
   ```bash
   curl http://localhost:3000/api/health
   ```

### Version Compatibility

Ensure compatible OpenTelemetry versions:

```json
{
  "@opentelemetry/sdk-metrics": "^1.18.0",
  "@opentelemetry/exporter-prometheus": "^0.48.0"
}
```

### Port Already in Use

Change the metrics port:

```javascript
initMetrics({ port: 9465 }); // Use different port
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@opentelemetry/api": "^1.7.0",
    "@opentelemetry/sdk-node": "^0.211.0",
    "@opentelemetry/sdk-metrics": "^1.18.0",
    "@opentelemetry/exporter-prometheus": "^0.48.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.211.0",
    "@opentelemetry/auto-instrumentations-node": "^0.69.0",
    "@opentelemetry/resources": "^1.18.0",
    "@opentelemetry/semantic-conventions": "^1.18.0"
  }
}
```

---

## 🎓 Best Practices

1. **Initialize Early** - Call `initMetrics()` before creating Express app
2. **Apply Middleware First** - Before your route handlers
3. **Use Labels Wisely** - Don't use high-cardinality values (user IDs, timestamps)
4. **Monitor What Matters** - Focus on business metrics, not just technical ones
5. **Set Alerts** - Use Prometheus alerting for error rates, latency, etc.

---

## 📚 Resources

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [OpenTelemetry JS](https://github.com/open-telemetry/opentelemetry-js)
