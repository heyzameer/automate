#!/bin/bash
# ============================================================
# Orbix Platform: Nginx + SSL (Certbot) Setup 🔐
# Run AFTER ec2-bootstrap.sh
# Usage: bash setup-nginx.sh api.yourdomain.com your@email.com
# ============================================================
set -e

DOMAIN=${1:-"api.orbix.com"}
EMAIL=${2:-"admin@orbix.com"}

echo "============================================"
echo "  🔐 Nginx + SSL Setup for $DOMAIN"
echo "============================================"

# ── Step 1: Write Nginx config ────────────────────────────────
echo ""
echo "📝 Writing Nginx config..."

sudo tee /etc/nginx/sites-available/orbix << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # ── API Gateway ──────────────────────────────────────────
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # ── WhatsApp Webhook (Meta requires HTTPS) ───────────────
    location /api/v1/bot/webhooks {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # ── Notification Service (Socket.io) ─────────────────────
    location /socket.io/ {
        proxy_pass http://localhost:5006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
EOF

# ── Step 2: Enable site ───────────────────────────────────────
echo ""
echo "🔗 Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/orbix /etc/nginx/sites-enabled/orbix
sudo rm -f /etc/nginx/sites-enabled/default

# ── Step 3: Test Nginx config ─────────────────────────────────
echo ""
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# ── Step 4: Restart Nginx ─────────────────────────────────────
echo ""
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# ── Step 5: Get SSL cert from Let's Encrypt ───────────────────
echo ""
echo "🔒 Requesting SSL certificate from Let's Encrypt..."
sudo certbot --nginx \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --redirect

# ── Step 6: Auto-renewal test ─────────────────────────────────
echo ""
echo "🔄 Testing Certbot auto-renewal..."
sudo certbot renew --dry-run

echo ""
echo "============================================"
echo "  ✅ SSL Setup Complete!"
echo "============================================"
echo ""
echo "  🌐 Your API is now live at: https://$DOMAIN"
echo "  🤖 Meta Webhook URL:        https://$DOMAIN/api/v1/bot/webhooks"
echo ""
echo "  ⚠️  ACTION REQUIRED:"
echo "  Go to Meta Developer Dashboard and update your"
echo "  Webhook Callback URL to: https://$DOMAIN/api/v1/bot/webhooks"
