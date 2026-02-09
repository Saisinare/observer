# Logging Guide

## Overview

This project uses **Pino** for structured JSON logging, integrated with **OpenTelemetry** for correlation with traces and metrics. Logs are collected via the **OTLP Collector** and stored in **Loki**, visualized through **Grafana**.

## Architecture

```
Application (Pino) → OpenTelemetry Collector (OTLP) → Loki → Grafana
```

## Key Features

- **Structured JSON Logs**: Fast, parseable log format
- **Trace Correlation**: Automatic trace_id injection in logs
- **HTTP Request Logging**: Automatic request/response logging
- **Log Levels**: INFO, WARN, ERROR with color-coded visualization
- **Centralized Storage**: All logs in Loki for querying
- **Real-time Monitoring**: Live log streaming in Grafana

## Configuration

### Environment Variables

```env
LOG_LEVEL=info                                              # Default: info
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://otel-collector:4318/v1/logs
```

### Log Levels

- `info` - General information (default)
- `warn` - Warning messages
- `error` - Error messages
- `debug` - Debug information (verbose)

## Usage in Code

### Import Logger

```javascript
const { logger } = require('./observability/logging');
```

### Basic Logging

```javascript
logger.info('User logged in');
logger.warn('Rate limit approaching');
logger.error('Database connection failed');
```

### Structured Logging

```javascript
logger.info({
  user: 'john@example.com',
  action: 'purchase',
  amount: 99.99
}, 'Purchase completed');
```

### HTTP Request Logging

HTTP requests are automatically logged with:
- Method and URL
- Response status code
- Response time
- Trace correlation

## Viewing Logs

### 1. Access Grafana

```
URL: http://localhost:3001
Username: admin
Password: admin
```

### 2. Navigate to Logs Dashboard

- Go to **Dashboards** → **Application Logs Dashboard**

### 3. Dashboard Panels

- **Log Volume by Level**: Time series of log counts by level
- **Application Logs**: Full log viewer with filtering
- **Logs by Level (Last 5m)**: Gauge showing recent log distribution
- **Error & Warning Logs**: Filtered view of problems

## Querying Logs in Grafana

### Basic Queries

```logql
# All logs
{service_name="api-monitoring-service"}

# Only errors
{service_name="api-monitoring-service"} | json | level="ERROR"

# Only warnings
{service_name="api-monitoring-service"} | json | level="WARN"

# HTTP requests
{service_name="api-monitoring-service"} | json | req!=""

# Search for specific text
{service_name="api-monitoring-service"} |= "error"
```

### Advanced Queries

```logql
# Logs with specific trace ID
{service_name="api-monitoring-service"} | json | trace_id="abc123"

# Count errors in last 5 minutes
sum(count_over_time({service_name="api-monitoring-service"} | json | level="ERROR" [5m]))

# Rate of logs per second
rate({service_name="api-monitoring-service"}[1m])
```

## Trace Correlation

Every log entry includes:
- `trace_id` - OpenTelemetry trace ID
- `span_id` - Current span ID
- `trace_flags` - Trace sampling flags

Use trace_id to:
1. Find logs related to a specific request
2. Jump from Jaeger trace to related logs
3. Debug distributed transactions

## Testing Logs

### 1. Generate Logs

```bash
# Normal request (INFO)
curl http://localhost:3000/

# Health check (INFO)
curl http://localhost:3000/api/health

# Slow request (INFO)
curl http://localhost:3000/api/slow

# Error request (ERROR)
curl http://localhost:3000/api/error
```

### 2. Verify in Loki

```bash
# Query Loki directly
curl -G -s "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={service_name="api-monitoring-service"}' \
  | jq
```

### 3. Check in Grafana

- Open **Application Logs Dashboard**
- See real-time logs appearing
- Filter by level, search text
- Click on log entry for details

## Log Format

Example log entry:

```json
{
  "level": "INFO",
  "time": "2024-01-15T10:30:45.123Z",
  "message": "GET / 200",
  "trace_id": "a1b2c3d4e5f6g7h8",
  "span_id": "12345678",
  "trace_flags": "01",
  "req": {
    "method": "GET",
    "url": "/",
    "headers": {...}
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 15
}
```

## Troubleshooting

### No Logs in Grafana

1. Check Loki is running:
   ```bash
   curl http://localhost:3100/ready
   ```

2. Verify collector is forwarding logs:
   ```bash
   docker logs observer-otel-collector-1
   ```

3. Check API logs are being generated:
   ```bash
   docker logs observer-api-1
   ```

4. Verify Loki datasource in Grafana:
   - Go to **Connections** → **Data sources**
   - Check **Loki** status
   - URL should be: `http://loki:3100`

### Logs Not Correlated with Traces

- Ensure tracing is initialized before logging
- Check trace context is active during logging
- Verify trace_id appears in log entries

### High Log Volume

Adjust log level to reduce volume:

```env
LOG_LEVEL=warn  # Only warnings and errors
LOG_LEVEL=error # Only errors
```

## Best Practices

1. **Use Structured Logging**
   ```javascript
   // Good
   logger.info({ userId, action }, 'User action');
   
   // Avoid
   logger.info(`User ${userId} performed ${action}`);
   ```

2. **Log at Appropriate Levels**
   - INFO: Normal operations
   - WARN: Unexpected but handled
   - ERROR: Failures requiring attention

3. **Include Context**
   - User IDs, request IDs, resource names
   - Helps debugging and auditing

4. **Avoid Sensitive Data**
   - Don't log passwords, tokens, PII
   - Sanitize user input before logging

5. **Use Trace Correlation**
   - Leverage automatic trace_id injection
   - Find related logs for a trace in Jaeger

## Performance

Pino is designed for high performance:
- **Fast**: ~30x faster than alternatives
- **Async**: Non-blocking I/O
- **Low Overhead**: Minimal CPU/memory impact
- **Structured**: JSON output for efficient parsing

## Retention

Loki default retention: 30 days

To change, update Loki configuration.

## Integration with Metrics & Traces

Complete observability stack:
- **Traces** (Jaeger): Request flows and timing
- **Metrics** (Prometheus): Quantitative measurements
- **Logs** (Loki): Detailed event data

Use together:
1. See high error rate in metrics → Check logs for details
2. See slow trace in Jaeger → Find logs with same trace_id
3. See error in logs → Check related trace for full context

## Resources

- Pino Docs: https://getpino.io
- Loki Docs: https://grafana.com/docs/loki
- LogQL: https://grafana.com/docs/loki/latest/logql
- OpenTelemetry Logs: https://opentelemetry.io/docs/specs/otel/logs
