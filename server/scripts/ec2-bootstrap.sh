#!/bin/bash
# ============================================================
# Orbix Platform: EC2 First-Time Server Bootstrap 🛠️
# Run this ONCE after you SSH into a fresh Ubuntu EC2.
# Usage: bash ec2-bootstrap.sh your-github-repo-url
# ============================================================
set -e

REPO_URL=${1:-"https://github.com/YOUR_GITHUB_USERNAME/CarBot.git"}
APP_DIR="/home/ubuntu/orbix"

echo "============================================"
echo "  🛠️  Orbix EC2 Bootstrap — First Run"
echo "============================================"

# ── Step 1: Update system ─────────────────────────────────────
echo ""
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ── Step 2: Install Docker ────────────────────────────────────
echo ""
echo "🐳 Installing Docker..."
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# ── Step 3: Install Docker Compose v2 ────────────────────────
echo ""
echo "🐳 Installing Docker Compose..."
sudo apt install -y docker-compose-plugin
docker compose version

# ── Step 4: Install AWS CLI ───────────────────────────────────
echo ""
echo "☁️  Installing AWS CLI..."
sudo apt install -y unzip curl
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
aws --version

# ── Step 5: Install Nginx + Certbot ──────────────────────────
echo ""
echo "🌐 Installing Nginx and Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# ── Step 6: Install Git ───────────────────────────────────────
echo ""
echo "🔧 Installing Git..."
sudo apt install -y git

# ── Step 7: Clone repository ──────────────────────────────────
echo ""
echo "📥 Cloning repository..."
mkdir -p "$APP_DIR"
git clone "$REPO_URL" "$APP_DIR"

# ── Step 8: Set script permissions ───────────────────────────
echo ""
echo "🔑 Setting script permissions..."
chmod +x "$APP_DIR/server/scripts/"*.sh

echo ""
echo "============================================"
echo "  ✅ Bootstrap Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Run: newgrp docker   (to refresh docker group)"
echo "  2. Run: bash $APP_DIR/server/scripts/setup-nginx.sh your-domain.com"
echo "  3. Run: bash $APP_DIR/server/scripts/ec2-deploy.sh"
