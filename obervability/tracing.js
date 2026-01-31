'use strict';

// 1. Core OpenTelemetry SDK
const { NodeSDK } = require('@opentelemetry/sdk-node');

// 2. Auto instrumentation (Express, HTTP, DB, etc.)
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// 3. Trace exporter (OTLP → Jaeger)
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

// 4. Resource & semantic attributes
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// 5. Exporter configuration
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318/v1/traces',
});

// 6. SDK initialization
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'api-monitoring-service',
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

// 7. Start tracing
sdk.start();
console.log('✅ Tracing initialized');

// 8. Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((err) => console.error('Error terminating tracing', err))
    .finally(() => process.exit(0));
});

function initTracing() {
  return sdk;
}

module.exports = { initTracing };
