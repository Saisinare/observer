# 🔐 Observer Stack - Access Information

## 📍 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **API** | http://localhost:3000 | Your monitored application |
| **Metrics Endpoint** | http://localhost:9464/metrics | Prometheus metrics |
| **Prometheus** | http://localhost:9090 | Metrics storage & queries |
| **Jaeger** | http://localhost:16686 | Distributed tracing UI |
| **Grafana** | http://localhost:3001 | Visualization dashboards |
| **Loki** | http://localhost:3100 | Log aggregation |

---

## 🔑 Login Credentials

### Grafana
- **URL:** http://localhost:3001
- **Username:** `admin`
- **Password:** `admin`
- **Note:** You'll be prompted to change password on first login (optional)

### Prometheus
- **URL:** http://localhost:9090
- **Authentication:** None (default)

### Jaeger
- **URL:** http://localhost:16686
- **Authentication:** None (default)

---

## 🚀 Quick Access Tests

### 1. Test API
```bash
curl http://localhost:3000/api/health
```

### 2. View Metrics
```bash
curl http://localhost:9464/metrics
```

### 3. Query Prometheus
Open: http://localhost:9090/graph
Example query: `http_requests_total`

### 4. View Traces in Jaeger
1. Open: http://localhost:16686
2. Select service: `api-monitoring-service`
3. Click "Find Traces"

### 5. Access Grafana
1. Open: http://localhost:3001
2. Login with `admin` / `admin`
3. (Optional) Change password or skip

---

## 🔧 Setting Up Grafana Data Sources

### Add Prometheus Data Source
1. Go to: http://localhost:3001/connections/datasources
2. Click "Add data source"
3. Select "Prometheus"
4. URL: `http://prometheus:9090`
5. Click "Save & Test"

### Add Jaeger Data Source
1. Click "Add data source"
2. Select "Jaeger"
3. URL: `http://jaeger:16686`
4. Click "Save & Test"

### Add Loki Data Source
1. Click "Add data source"
2. Select "Loki"
3. URL: `http://loki:3100`
4. Click "Save & Test"

---

## 📊 Example Grafana Dashboard Queries

### Panel 1: Request Rate
```promql
rate(http_requests_total[1m])
```

### Panel 2: Average Response Time
```promql
rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m])
```

### Panel 3: 95th Percentile Latency
```promql
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))
```

### Panel 4: Error Rate
```promql
sum(rate(http_requests_total{status=~"5.."}[1m])) / sum(rate(http_requests_total[1m]))
```

### Panel 5: Active Requests
```promql
http_active_requests
```

---

## 🐳 Docker Container Management

### View Running Containers
```bash
docker ps
```

### View Container Logs
```bash
# API logs
docker logs docker-api-1 --tail 50 -f

# Grafana logs
docker logs docker-grafana-1 --tail 50 -f

# Prometheus logs
docker logs docker-prometheus-1 --tail 50 -f

# Jaeger logs
docker logs docker-jaeger-1 --tail 50 -f
```

### Restart Services
```bash
# Restart all services
docker-compose -f docker/docker-compose.yml restart

# Restart specific service
docker-compose -f docker/docker-compose.yml restart grafana
docker-compose -f docker/docker-compose.yml restart api
```

### Stop All Services
```bash
docker-compose -f docker/docker-compose.yml down
```

### Start All Services
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Rebuild and Restart
```bash
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml build --no-cache
docker-compose -f docker/docker-compose.yml up -d
```

---

## 🔍 Troubleshooting

### Grafana Can't Connect to Prometheus
**Problem:** "Bad Gateway" or connection refused

**Solution:**
- Use internal Docker DNS: `http://prometheus:9090`
- Not: `http://localhost:9090`

### Port Already Allocated
**Problem:** "Bind for 0.0.0.0:3000 failed: port is already allocated"

**Solution:**
```bash
# Stop all containers
docker-compose -f docker/docker-compose.yml down

# Check what's using the port
netstat -ano | findstr :3000

# Kill the process or change the port in docker-compose.yml
```

### Grafana Password Reset
**Problem:** Forgot admin password

**Solution:**
```bash
# Stop Grafana
docker-compose -f docker/docker-compose.yml stop grafana

# Remove Grafana data volume
docker volume rm docker_grafana-data

# Restart Grafana (will recreate with default admin/admin)
docker-compose -f docker/docker-compose.yml up -d grafana
```

### No Metrics Appearing
**Problem:** Prometheus shows no data

**Solution:**
1. Check API is generating metrics: `curl http://localhost:9464/metrics`
2. Generate traffic: `curl http://localhost:3000/api/health`
3. Check Prometheus targets: http://localhost:9090/targets
4. Verify scrape config in `docker/prometheus.yml`

---

## 📈 Sample Grafana Dashboard JSON

Create a new dashboard and import this JSON:

```json
{
  "dashboard": {
    "title": "API Monitoring Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (95th percentile)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Total Requests by Status",
        "targets": [
          {
            "expr": "sum(http_requests_total) by (status)"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

---

## 🎯 Next Steps

1. ✅ Access Grafana: http://localhost:3001 (admin/admin)
2. ✅ Add Prometheus data source
3. ✅ Import or create dashboards
4. ✅ Generate API traffic to see metrics
5. ✅ View traces in Jaeger
6. ✅ Explore logs in Loki (via Grafana)

---

## 📝 Notes

- **Default Password:** `admin` / `admin` (change on first login)
- **Data Persistence:** Grafana and Prometheus data is stored in Docker volumes
- **Internal Networking:** Services communicate via Docker DNS (e.g., `prometheus:9090`)
- **External Access:** All services are accessible from your host machine

---

**Your complete observability stack is now running!** 🎉

Last updated: 2026-01-31
