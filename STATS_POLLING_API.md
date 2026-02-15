# Real-Time Download Statistics Polling API

## Overview

These public API endpoints provide real-time download statistics that update **immediately** when downloads occur. All endpoints are designed for polling (every 3 seconds) and require **no authentication**.

## Base URL

```
{your-ojs-site}/index.php/{journal-path}/api/v1/fast-stats
```

Example: `http://localhost:8000/index.php/tjpsd/api/v1/fast-stats`

---

## Endpoints

### 1. Combined Poll (Recommended)

**GET** `/stats/poll`

Returns all download statistics in a single request. **Use this for widget polling.**

#### Query Parameters

| Parameter   | Type    | Required | Description                          |
|-------------|---------|----------|--------------------------------------|
| `contextId` | integer | No       | Filter by journal ID. Omit for site-wide stats. |

#### Response

```json
{
  "todayDownloads": 11,
  "totalDownloads": 26779,
  "yearDownloads": 7387,
  "totalPapers": 181,
  "timestamp": 1771162164,
  "realtime": true
}
```

| Field            | Type    | Description                                      |
|------------------|---------|--------------------------------------------------|
| `todayDownloads` | integer | Downloads today (real-time, updates immediately) |
| `totalDownloads` | integer | All-time total downloads (historical + today)    |
| `yearDownloads`  | integer | Past 12 months downloads (historical + today)    |
| `totalPapers`    | integer | Total published papers                           |
| `timestamp`      | integer | Unix timestamp of response                       |
| `realtime`       | boolean | Always `true` - indicates real-time data         |

#### Example

```bash
# Site-wide stats
curl "http://localhost:8000/index.php/tjpsd/api/v1/fast-stats/stats/poll"

# Journal-specific stats
curl "http://localhost:8000/index.php/tjpsd/api/v1/fast-stats/stats/poll?contextId=1"
```

---

### 2. Today's Downloads

**GET** `/stats/today`

Returns only today's download count.

#### Response

```json
{
  "todayDownloads": 11,
  "timestamp": 1771162166
}
```

#### Example

```bash
curl "http://localhost:8000/index.php/tjpsd/api/v1/fast-stats/stats/today"
```

---

### 3. Total Downloads

**GET** `/stats/total`

Returns total all-time downloads with breakdown.

#### Response

```json
{
  "totalDownloads": 26779,
  "metricsTotal": 26768,
  "todayRealtime": 11,
  "timestamp": 1771162167
}
```

| Field           | Type    | Description                                    |
|-----------------|---------|------------------------------------------------|
| `totalDownloads`| integer | Combined total (historical + today)            |
| `metricsTotal`  | integer | Historical downloads from OJS metrics table    |
| `todayRealtime` | integer | Today's real-time downloads being added        |

#### Example

```bash
curl "http://localhost:8000/index.php/tjpsd/api/v1/fast-stats/stats/total"
```

---

### 4. Past Year Downloads

**GET** `/stats/year`

Returns downloads from the past 12 months.

#### Response

```json
{
  "yearDownloads": 7387,
  "metricsYear": 7376,
  "todayRealtime": 11,
  "timestamp": 1771162168
}
```

| Field           | Type    | Description                                    |
|-----------------|---------|------------------------------------------------|
| `yearDownloads` | integer | Combined year total (historical + today)       |
| `metricsYear`   | integer | Past year from OJS metrics table               |
| `todayRealtime` | integer | Today's real-time downloads being added        |

#### Example

```bash
curl "http://localhost:8000/index.php/tjpsd/api/v1/fast-stats/stats/year"
```

---

## How Real-Time Works

```
When someone downloads a paper:
    │
    ├─► fast_stats_downloads_geo table ← Updated IMMEDIATELY
    │       └─► Today's count increments
    │
    └─► metrics table ← Updated by OJS in batches (hourly/daily)
            └─► Historical totals

API Response Calculation:
    • todayDownloads = SUM from fast_stats_downloads_geo (real-time)
    • totalDownloads = metrics total + todayDownloads
    • yearDownloads  = metrics year + todayDownloads
```

This ensures ALL THREE stats increment together in real-time!

---

## JavaScript Polling Example

```javascript
// Poll every 3 seconds for real-time updates
const API_URL = '/index.php/tjpsd/api/v1/fast-stats/stats/poll';
let lastStats = { todayDownloads: 0, totalDownloads: 0, yearDownloads: 0 };

async function pollStats() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // Detect changes and animate
    if (data.todayDownloads !== lastStats.todayDownloads) {
      animateCounter('today', lastStats.todayDownloads, data.todayDownloads);
    }
    if (data.totalDownloads !== lastStats.totalDownloads) {
      animateCounter('total', lastStats.totalDownloads, data.totalDownloads);
    }
    if (data.yearDownloads !== lastStats.yearDownloads) {
      animateCounter('year', lastStats.yearDownloads, data.yearDownloads);
    }
    
    lastStats = data;
  } catch (error) {
    console.error('Polling failed:', error);
  }
}

// Start polling
setInterval(pollStats, 3000);
pollStats(); // Initial call

function animateCounter(id, from, to) {
  const element = document.getElementById(id);
  element.classList.add('updating');
  
  // Smooth number animation
  const duration = 800;
  const start = performance.now();
  
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(from + (to - from) * easeOut(progress));
    element.textContent = value.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.classList.remove('updating');
    }
  }
  
  requestAnimationFrame(update);
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}
```

---

## CSS for Animated Updates

```css
.stat-value {
  transition: color 0.3s, transform 0.3s;
}

.stat-value.updating {
  color: #10b981; /* Green highlight */
  transform: scale(1.05);
}
```

---

## Rate Limiting

These endpoints are public and lightweight. Recommended polling interval: **3 seconds**.

For high-traffic sites, consider:
- Using the combined `/stats/poll` endpoint (1 request vs 3)
- Implementing client-side caching
- Adjusting polling interval based on activity

---

## Error Handling

| HTTP Code | Description                    |
|-----------|--------------------------------|
| 200       | Success                        |
| 404       | Invalid journal path           |
| 500       | Database error                 |

Example error response:
```json
{
  "error": "Database connection failed",
  "timestamp": 1771162168
}
```

---

## Version

- **Plugin Version**: 1.1.0
- **OJS Compatibility**: 3.3.x, 3.4.x
- **Last Updated**: February 2026
