# Observability Module Architecture

## 📐 Module Structure

```
obervability/
├── tracing.js          # Distributed tracing with Jaeger
├── metrics.js          # Prometheus metrics with auto-instrumentation
└── README.md           # Full documentation
```

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR APPLICATION                       │
│                                                              │
│  ┌──────────────┐                                           │
│  │  server.js   │                                           │
│  │              │                                           │
│  │  1. require('./obervability/tracing')                   │
│  │  2. require('./obervability/metrics')                   │
│  │                                                           │
│  │  3. initTracing()                                        │
│  │  4. initMetrics({ serviceName, port })                  │
│  │                                                           │
│  │  5. app.use(metricsMiddleware) ─────┐                   │
│  │                                       │                   │
│  │  6. Define routes...                 │                   │
│  └──────────────┘                        │                   │
│                                          │                   │
└──────────────────────────────────────────┼───────────────────┘
                                           │
                ┌──────────────────────────┼──────────────────────┐
                │                          ▼                      │
                │            ┏━━━━━━━━━━━━━━━━━━━━┓             │
                │            ┃ Metrics Middleware ┃             │
                │            ┃                    ┃             │
                │            ┃ On Each Request:   ┃             │
                │            ┃ • activeRequests++ ┃             │
                │            ┃ • Start timer      ┃             │
                │            ┃                    ┃             │
                │            ┃ On Response:       ┃             │
                │            ┃ • activeRequests-- ┃             │
                │            ┃ • Counter++        ┃             │
                │            ┃ • Record duration  ┃             │
                │            ┗━━━━━━━━━━━━━━━━━━━━┛             │
                │                      │                         │
                └──────────────────────┼─────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            │                                                      │
            ▼                                                      ▼
   ┌─────────────────┐                              ┌──────────────────────┐
   │  Prometheus     │                              │  OpenTelemetry       │
   │  Exporter       │                              │  Collector (OTLP)    │
   │                 │                              │                      │
   │  Port: 9464     │                              │  Port: 4318 (HTTP)   │
   │  /metrics       │                              │  Port: 4317 (gRPC)   │
   └────────┬────────┘                              └──────────┬───────────┘
            │                                                   │
            │                                                   │
            ▼                                                   ▼
   ┌─────────────────┐                              ┌──────────────────────┐
   │  Prometheus     │                              │  Jaeger              │
   │  Server         │                              │  (Traces)            │
   │                 │                              │                      │
   │  Port: 9090     │                              │  Port: 16686         │
   │  Time-series DB │                              │  UI & Query          │
   └────────┬────────┘                              └──────────┬───────────┘
            │                                                   │
            │                                                   │
            └───────────────────┬───────────────────────────────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │  Grafana         │
                      │  (Visualization) │
                      │                  │
                      │  Port: 3001      │
                      │  Dashboards      │
                      └──────────────────┘
```

## 📊 Metrics Pipeline

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────┐
│ 1. Request Arrives                          │
│    activeRequests.add(1)                    │
│    startTime = Date.now()                   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. Route Handler Processes Request          │
│    (Your business logic)                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. Response Sent                            │
│    duration = Date.now() - startTime        │
│    activeRequests.add(-1)                   │
│    httpRequestCounter.add(1, {...labels})   │
│    httpRequestDuration.record(duration)     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. MeterProvider                            │
│    Aggregates metrics                       │
│    Batch processing                         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. PrometheusExporter                       │
│    Exposes /metrics endpoint                │
│    Text format (Prometheus compatible)      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 6. Prometheus Scrapes                       │
│    Every 15s (configurable)                 │
│    Stores in time-series database           │
└─────────────────────────────────────────────┘
```

## 🔍 Tracing Pipeline

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────┐
│ 1. Auto-Instrumentation                     │
│    Creates span automatically               │
│    Span name: "GET /api/users"              │
│    Attributes: http.method, http.route, etc │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. Context Propagation                      │
│    Trace ID injected into headers           │
│    Supports distributed tracing             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. OTLP Exporter                            │
│    Batch export to collector                │
│    Protocol: HTTP/gRPC                      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. OpenTelemetry Collector                 │
│    Receives traces                          │
│    Processes/filters                        │
│    Routes to backends                       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. Jaeger Backend                           │
│    Stores traces                            │
│    Enables queries and visualization        │
└─────────────────────────────────────────────┘
```

## 🎯 Key Components

### metrics.js Functions

```javascript
initMetrics(config)
├── Creates PrometheusExporter (port 9464)
├── Creates MeterProvider
├── Adds metric reader
├── Creates HTTP instruments
│   ├── httpRequestCounter (Counter)
│   ├── httpRequestDuration (Histogram)
│   └── activeRequests (UpDownCounter)
└── Returns { middleware, meter, instruments }

getMeter()
└── Returns Meter instance for custom metrics

getHttpInstruments()
└── Returns existing HTTP instruments

createHttpMetricsMiddleware()
└── Returns Express middleware function
```

### tracing.js Functions

```javascript
initTracing()
├── Creates NodeSDK
├── Configures auto-instrumentations
│   ├── HTTP
│   ├── Express
│   ├── Database drivers
│   └── More...
├── Sets up OTLP exporter
└── Starts SDK
```

## 📦 Reusability Features

### ✅ What Makes It Reusable

1. **Zero Configuration Required**
   - Works out of the box with defaults
   - Configurable when needed

2. **Framework Agnostic**
   - Works with Express, Fastify, Koa, HTTP
   - Standard middleware pattern

3. **Modular Design**
   - Separate files for tracing and metrics
   - Independent initialization
   - Can use one without the other

4. **Flexible Integration**
   - Auto HTTP metrics via middleware
   - Custom metrics via getMeter()
   - Direct instrument access

5. **Standard Protocols**
   - OpenTelemetry (OTLP) for tracing
   - Prometheus exposition format for metrics
   - Compatible with all OTLP/Prometheus tools

### 📋 Integration Checklist

- [ ] Copy `obervability/` folder to your project
- [ ] Install npm dependencies
- [ ] Add `initTracing()` before Express app
- [ ] Add `initMetrics()` and get middleware
- [ ] Apply `app.use(middleware)`
- [ ] Access metrics at http://localhost:9464/metrics
- [ ] View traces at http://localhost:16686

## 🚀 Quick Copy-Paste Setup

```javascript
// 1. Import
const { initTracing } = require('./obervability/tracing');
const { initMetrics } = require('./obervability/metrics');

// 2. Initialize
initTracing();
const { middleware } = initMetrics({
  serviceName: 'my-service',
  port: 9464
});

// 3. Use
const app = express();
app.use(middleware);
```

That's it! Your API is now fully instrumented! 🎉
