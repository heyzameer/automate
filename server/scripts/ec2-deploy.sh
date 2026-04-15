#!/bin/bash
# ============================================================
# Orbix Platform: EC2 Deployment Engine 🚀
# Run this script from the /server directory on your EC2.
# ============================================================
set -e  # Exit immediately on any error

APP_DIR="/home/ubuntu/orbix/server"
COMPOSE_FILE="docker-compose.prod.yaml"
ENV_FILE=".env.prod"
SSM_PREFIX="/orbix/prod"

echo "============================================"
echo "  🚀 Orbix Platform — Production Deploy"
echo "============================================"

# ── Step 1: Fetch all secrets from AWS SSM ───────────────────
echo ""
echo "🔐 Fetching secrets from AWS SSM Parameter Store..."

# Map of SSM param name → .env.prod variable name
declare -A SSM_MAP=(
  ["jwt-secret"]="JWT_SECRET"
  ["internal-secret"]="INTERNAL_SECRET"
  ["mongodb-uri"]="MONGODB_URI"
  ["mongo-uri"]="MONGO_URI"
  ["auth-mongo-uri"]="AUTH_MONGO_URI"
  ["inventory-mongo-uri"]="INVENTORY_MONGO_URI"
  ["frontend-url"]="FRONTEND_URL"
  ["cors-origin"]="CORS_ORIGIN"
  ["redis-url"]="REDIS_URL"
  ["gemini-api-key"]="GEMINI_API_KEY"
  ["whatsapp-system-token"]="WHATSAPP_SYSTEM_TOKEN"
  ["whatsapp-app-secret"]="WHATSAPP_APP_SECRET"
  ["whatsapp-verify-token"]="WHATSAPP_VERIFY_TOKEN"
  ["node-env"]="NODE_ENV"
)

# Write production env file from SSM
> "$APP_DIR/$ENV_FILE"   # Clear file first

for SSM_KEY in "${!SSM_MAP[@]}"; do
  ENV_KEY="${SSM_MAP[$SSM_KEY]}"
  VALUE=$(aws ssm get-parameter \
    --name "$SSM_PREFIX/$SSM_KEY" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text 2>/dev/null || echo "")

  if [ -n "$VALUE" ]; then
    echo "$ENV_KEY=$VALUE" >> "$APP_DIR/$ENV_FILE"
    echo "  ✅ $ENV_KEY loaded"
  else
    echo "  ⚠️  WARNING: $SSM_PREFIX/$SSM_KEY not found in SSM!"
  fi
done

# Static production values
cat >> "$APP_DIR/$ENV_FILE" << 'EOF'

# ── Service Discovery (Monolithic Localhost) ──
AUTH_SERVICE_URL=http://localhost:5001
INVENTORY_SERVICE_URL=http://localhost:5002
BOT_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:5006
BILLING_SERVICE_URL=http://localhost:5008
CAMPAIGN_SERVICE_URL=http://localhost:5005

# ── Message Queue (Internal Docker) ──
RABBITMQ_URL=amqp://orbix:orbixrabbit@rabbitmq:5672

# ── Search (Internal Docker) ──
ELASTICSEARCH_URL=http://elasticsearch:9200

# ── Ports ──
PORT_GATEWAY=5000
PORT_AUTH=5001
PORT_INVENTORY=5002
PORT_BOT=3003
PORT_NOTIFICATION=5006
PORT_BILLING=5008
PORT_CAMPAIGN=5005
EOF

echo ""
echo "✅ Environment file built successfully."

# ── Step 2: Pull latest code ─────────────────────────────────
echo ""
echo "📥 Pulling latest code from GitHub..."
cd "$APP_DIR"
git pull origin dev

# ── Step 3: Stop old containers ──────────────────────────────
echo ""
echo "🛑 Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans

# ── Step 4: Build & launch microservice mesh ─────────────────
echo ""
echo "🏗️  Building and launching Orbix mesh..."
docker compose -f "$COMPOSE_FILE" up -d --build

# ── Step 5: Cleanup old images ───────────────────────────────
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

# ── Step 6: Status report ────────────────────────────────────
echo ""
echo "============================================"
echo "  ✅ Orbix Platform Is Live!"
echo "============================================"
docker compose -f "$COMPOSE_FILE" ps
