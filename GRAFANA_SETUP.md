# 📊 Manual Dashboard Creation - Step by Step

## ⚠️ If Import Doesn't Work, Follow These Steps

### Step 1: Login to Grafana
1. Open: http://localhost:3001
2. Login: `admin` / `admin`
3. Skip password change (click "Skip")

---

### Step 2: Verify Prometheus Data Source

1. Click **☰ menu** (hamburger, top left)
2. Go to: **Connections** → **Data sources**
3. You should see **Prometheus** listed
4. Click on **Prometheus**
5. Verify URL is: `http://prometheus:9090`
6. Scroll down and click **Save & Test**
7. Should show: ✅ "Successfully queried the Prometheus API"

**If you don't see Prometheus data source:**
1. Click **Add data source**
2. Select **Prometheus**
3. Name: `Prometheus`
4. URL: `http://prometheus:9090`
5. Click **Save & Test**

---

### Step 3: Test Query in Explore

**Before creating dashboard, verify data exists:**

1. Click **Explore** icon (🧭 compass, left sidebar)
2. Select **Prometheus** from dropdown (top)
3. In the query field, type: `up`
4. Click **Run query** button (top right)

**You should see:**
- A graph showing value of 1
- A table below with targets

**If you see data** ✅ → Continue to Step 4  
**If you see "No data"** ❌ → Run the traffic generator first

---

### Step 4: Create New Dashboard

1. Click **+** (plus icon, top right corner)
2. Select **Dashboard**
3. Click **Add visualization**
4. Select **Prometheus** data source

---

### Step 5: Create First Panel - Total Requests

**You're now in the panel editor:**

1. **At the bottom**, in the query field, enter:
   ```
   sum(http_requests_total)
   ```

2. **Click "Run query"** or wait for auto-refresh

3. **On the right side panel**, find:
   - **Panel options** section
   - Change **Title** to: `Total HTTP Requests`

4. **Change visualization type** (top right of edit area):
   - Click current type (probably "Time series")
   - Select **Stat**

5. **In the Stat options**:
   - Graph mode: `Area`
   - Color mode: `Value`

6. **Click Apply** (top right)

**You should now see a big number showing total requests!**

---

### Step 6: Add Second Panel - Request Rate

1. Click **Add** → **Visualization** (top toolbar)
2. Select **Prometheus**
3. Query field: 
   ```
   rate(http_requests_total[1m])
   ```
4. **Legend format** (under query): `{{method}} {{route}}`
5. Title: `Request Rate`
6. Visualization type: **Time series** (default)
7. **Click Apply**

---

### Step 7: Add Third Panel - Active Requests

1. Add → Visualization → Prometheus
2. Query: 
   ```
   sum(http_active_requests)
   ```
3. Title: `Active Requests`
4. Visualization: **Stat**
5. Under **Standard options** → **Unit**: `short`
6. Under **Thresholds**:
   - Click **+ Add threshold**
   - Value: `10`, Color: Yellow
   - Click **+ Add threshold** again
   - Value: `50`, Color: Red
7. **Click Apply**

---

### Step 8: Save Dashboard

1. Click **💾 Save dashboard** (top right, disk icon)
2. Dashboard name: `API Monitoring`
3. Folder: Leave as `General`
4. Click **Save**

---

### Step 9: Generate Traffic to See Data

**Open PowerShell and run:**

```powershell
# Generate traffic
for ($i=1; $i -le 50; $i++) { 
    curl http://localhost:3000/api/health 
    Start-Sleep -Milliseconds 100
}
```

**Watch your dashboard update in real-time!**

---

### Step 10: Adjust Time Range

**If you still don't see data:**

1. Look at **top right** of dashboard
2. Find the time picker (shows "Last 6 hours" or similar)
3. Click it
4. Select **Last 15 minutes**
5. Click **Apply**

**Also check auto-refresh:**
1. Next to time picker, click refresh icon dropdown
2. Select **5s** (refresh every 5 seconds)

---

## 🎯 Quick Troubleshooting

### Problem: "No data" in panels

**Solution:**
1. Generate traffic (run the PowerShell command above)
2. Check time range is "Last 15 minutes"
3. Wait 15-30 seconds for Prometheus to scrape
4. Click refresh button in dashboard

### Problem: Panel shows error

**Check the query:**
1. Click **Edit** on the panel (pencil icon when you hover)
2. Look for red error message under query
3. Common fixes:
   - Make sure metric name is exactly: `http_requests_total`
   - No typos in the query
   - Data source is selected

### Problem: Dashboard is empty after saving

**Solution:**
1. Click **Dashboard settings** (⚙️ gear icon, top right)
2. Check **JSON Model** (left sidebar)
3. Verify it has panels
4. If empty, recreate dashboard

---

## 📊 What You Should See

After completing all steps and generating traffic:

```
┌─────────────────────────────────────────────────────┐
│  API Monitoring Dashboard                Last 15m ↻ │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌─────────────────────────────┐ │
│  │ Total HTTP   │  │   Request Rate              │ │
│  │  Requests    │  │                             │ │
│  │              │  │   ╱╲  /api/health           │ │
│  │     52       │  │  ╱  ╲╱                      │ │
│  │              │  │                             │ │
│  └──────────────┘  └─────────────────────────────┘ │
│                                                      │
│  ┌──────────────┐                                   │
│  │ Active Req   │                                   │
│  │              │                                   │
│  │      0       │  (Green background)              │
│  │              │                                   │
│  └──────────────┘                                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Success Checklist

- [ ] Logged into Grafana
- [ ] Prometheus data source verified
- [ ] Data visible in Explore page
- [ ] Created new dashboard
- [ ] Added at least one panel
- [ ] Panel shows data
- [ ] Generated traffic with PowerShell
- [ ] Dashboard saved
- [ ] Time range set to "Last 15 minutes"
- [ ] Auto-refresh enabled

**Once you see data, you can add more panels using the same process!**

---

## 🆘 Still Not Working?

Run the diagnostic script:
```powershell
.\test-dashboard.ps1
```

This will check:
- ✅ Grafana accessibility
- ✅ API accessibility
- ✅ Metrics endpoint
- ✅ Prometheus health
- ✅ Prometheus targets
- ✅ Metric data availability

**Share the output if you need more help!**