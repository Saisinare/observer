# 🔍 Observer - OpenTelemetry Observability Module

A **production-ready, reusable** observability module for Node.js APIs with OpenTelemetry, Prometheus metrics, and distributed tracing.

[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Enabled-blue)](https://opentelemetry.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-orange)](https://prometheus.io/)
[![Jaeger](https://img.shields.io/badge/Jaeger-Tracing-purple)](https://www.jaegertracing.io/)

## ✨ Features

- ✅ **Automatic HTTP Metrics** - Request count, duration, active requests
- ✅ **Distributed Tracing** - Full request traces with Jaeger
- ✅ **Zero Configuration** - Works out of the box with sensible defaults
- ✅ **Completely Reusable** - Drop into any Node.js API project
- ✅ **Framework Agnostic** - Works with Express, Fastify, Koa, Native HTTP
- ✅ **Production Ready** - Battle-tested patterns and best practices
- ✅ **Extensible** - Easy to add custom business metrics

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install express \
  @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/sdk-metrics \
  @opentelemetry/exporter-prometheus \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions
```

### 2. Copy the Observability Module

Copy the `obervability/` folder to your project:

```
your-project/
├── obervability/
│   ├── metrics.js
│   ├── tracing.js
│   └── README.md
└── server.js
```

### 3. Integrate (3 Lines of Code!)

```javascript
const express = require('express');
const { initTracing } = require('./obervability/tracing');
const { initMetrics } = require('./obervability/metrics');

// Initialize observability
initTracing();
const { middleware } = initMetrics({
  serviceName: 'your-api',
  port: 9464
});

// Create your app
const app = express();
app.use(middleware);

// Your routes
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
```

**That's it!** You now have full observability! 🎉

## 📊 What You Get

### Automatic Metrics

- `http_requests_total` - Total HTTP requests by method, route, status
- `http_request_duration_ms` - Request duration histogram
- `http_active_requests` - Currently active requests gauge

### Distributed Tracing

- Automatic span creation for all HTTP requests
- Context propagation across services
- Integration with Jaeger for visualization

## 🎯 Use Cases

### Basic Express API

```javascript
const { initTracing } = require('./obervability/tracing');
const { initMetrics } = require('./obervability/metrics');

initTracing();
const { middleware } = initMetrics();

app.use(middleware);
```

### Custom Business Metrics

```javascript
const { initMetrics, getMeter } = require('./obervability/metrics');

const { middleware } = initMetrics();
app.use(middleware);

// Create custom metrics
const meter = getMeter();
const ordersProcessed = meter.createCounter('orders_processed_total');

app.post('/orders', (req, res) => {
  ordersProcessed.add(1, { status: 'success' });
  res.json({ orderId: '12345' });
});
```

### Multiple Microservices

```javascript
// Service A
initMetrics({ serviceName: 'user-service', port: 9464 });

// Service B
initMetrics({ serviceName: 'order-service', port: 9465 });

// Service C
initMetrics({ serviceName: 'payment-service', port: 9466 });
```

## 🐳 Docker Setup

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
      - "9464:9464"
    environment:
      SERVICE_NAME: my-api

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml

  jaeger:
    image: jaegertracing/all-in-one
    ports:
      - "16686:16686"
      - "4318:4318"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

### Prometheus Configuration

```yaml
# docker/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:9464']
```

## 📈 Access Your Observability Stack

- **API**: http://localhost:3000
- **Metrics Endpoint**: http://localhost:9464/metrics
- **Prometheus UI**: http://localhost:9090
- **Jaeger UI**: http://localhost:16686
- **Grafana**: http://localhost:3001

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get started in 5 minutes
- **[Usage Examples](USAGE_EXAMPLES.js)** - 10 real-world examples
- **[Architecture](ARCHITECTURE.md)** - System design and data flow
- **[Module README](obervability/README.md)** - Detailed API documentation

## 🔧 API Reference

### `initMetrics(config)`

Initialize metrics infrastructure and create HTTP instruments.

```javascript
const { middleware, meter, instruments } = initMetrics({
  port: 9464,              // Prometheus exporter port
  endpoint: '/metrics',     // Metrics endpoint path
  serviceName: 'my-api'    // Service name for metrics
});
```

### `getMeter()`

Get meter instance for creating custom metrics.

```javascript
const meter = getMeter();
const customCounter = meter.createCounter('my_custom_metric');
customCounter.add(1, { label: 'value' });
```

### `getHttpInstruments()`

Get pre-created HTTP metric instruments.

```javascript
const { httpRequestCounter, httpRequestDuration, activeRequests } = getHttpInstruments();
```

## 🎓 Best Practices

### ✅ DO

- Initialize metrics before creating Express app
- Apply middleware before route handlers
- Use meaningful service names
- Keep label cardinality low
- Create custom metrics for business logic

### ❌ DON'T

- Don't create metrics inside route handlers
- Don't use high-cardinality labels (user IDs, timestamps)
- Don't skip middleware application
- Don't expose sensitive data in labels

## 📊 Example PromQL Queries

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

## 🛠️ Tech Stack

- **OpenTelemetry** - Observability framework
- **Prometheus** - Metrics storage and querying
- **Jaeger** - Distributed tracing backend
- **Grafana** - Metrics visualization
- **Node.js** - Runtime environment
- **Express** - Web framework (example)

## 📦 Package Versions

```json
{
  "@opentelemetry/api": "^1.7.0",
  "@opentelemetry/sdk-node": "^0.211.0",
  "@opentelemetry/sdk-metrics": "^1.18.0",
  "@opentelemetry/exporter-prometheus": "^0.48.0",
  "@opentelemetry/exporter-trace-otlp-http": "^0.211.0",
  "@opentelemetry/auto-instrumentations-node": "^0.69.0",
  "@opentelemetry/resources": "^1.18.0",
  "@opentelemetry/semantic-conventions": "^1.18.0"
}
```

## 🐛 Troubleshooting

### No metrics appearing

1. Check middleware is applied: `app.use(middleware)`
2. Generate traffic to your API
3. Verify endpoint: `curl http://localhost:9464/metrics`

### Port already in use

Change the port in configuration:

```javascript
initMetrics({ port: 9465 })
```

### Metrics not in Prometheus

Check Prometheus scrape configuration targets your service:

```yaml
- targets: ['api:9464']  # or 'localhost:9464'
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this in your projects!

## 🙏 Acknowledgments

- [OpenTelemetry](https://opentelemetry.io/) - Observability framework
- [Prometheus](https://prometheus.io/) - Metrics and monitoring
- [Jaeger](https://www.jaegertracing.io/) - Distributed tracing
- [Grafana](https://grafana.com/) - Visualization platform

## 📧 Contact

For questions and support, please open an issue on GitHub.

---

**Made with ❤️ for the Node.js community**

*Drop this module into any API and get instant observability!* 🚀
