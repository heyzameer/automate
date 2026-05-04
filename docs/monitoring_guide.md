# 📊 ORBIX Monitoring Guide

The ORBIX platform uses a standard **PLG Stack** (Prometheus, Loki, Grafana) for full-system observability.

## 🚀 How to Start
The monitoring stack runs independently from the main application. To start it:

```bash
cd server/monitoring
docker compose up -d
```

> [!IMPORTANT]
> Ensure the main application is already running or the `orbix-mesh` network exists, as the monitoring stack relies on it.

## 📈 Components

### 1. Grafana (Visual Dashboards)
*   **URL**: `http://<your-ec2-ip>:3001`
*   **Credentials**: `admin` / `admin`
*   **Use Case**: This is your primary window. Use it to view system health, API latency, and log streams.

### 2. Prometheus (Metrics)
*   **URL**: `http://<your-ec2-ip>:9090`
*   **Use Case**: Debugging specific metric scrapes. You can check `Status > Targets` to ensure all microservices are reporting data.
*   **Targets**:
    *   Gateway (5000)
    *   Auth (5001)
    *   Inventory (5002)
    *   WhatsApp Bot (3003)

### 3. Loki & Promtail (Logs)
*   **Loki**: The log database (Port 3100).
*   **Promtail**: Scrapes logs from `server/logs/*.log`.
*   **How to view logs**:
    1.  Open Grafana.
    2.  Go to **Explore**.
    3.  Select **Loki** as the datasource.
    4.  Use the Query: `{job="varlogs"}` or filter by filename.

## 🛠 Troubleshooting
*   **Targets are DOWN in Prometheus**: Ensure the `orbix-monolith` container is running and ports are exposed.
*   **No logs in Grafana**: Check if `server/logs` contains `.log` files. Promtail is configured to watch that specific directory.
