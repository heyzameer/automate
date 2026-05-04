# 🏁 Pre-Deployment Checklist

Before running `sh scripts/ec2-deploy.sh`, verify the following items:

## 1. 🔐 AWS SSM Parameter Store
The deployment script fetches secrets from `/orbix/prod/`. Ensure these keys exist in AWS:
- [ ] `jwt-secret`
- [ ] `mongodb-uri` (and service-specific ones if different)
- [ ] `gemini-api-key`
- [ ] `whatsapp-system-token`
- [ ] `whatsapp-app-secret`
- [ ] `whatsapp-verify-token`
- [ ] `redis-url`

## 2. 🌐 Network & Infrastructure
- [ ] **Security Groups**: Ports `5000` (API), `3003` (WhatsApp), `3001` (Grafana), and `80/443` (Nginx) must be open.
- [ ] **Nginx**: Run `setup-nginx.sh` first to configure the reverse proxy.
- [ ] **Elasticsearch**: The container is set to `discovery.type=single-node`. Ensure the EC2 instance has at least **4GB RAM** to handle ES + Microservices.

## 3. 📦 Code Sync
- [ ] Ensure all changes are committed and pushed to the `dev` branch (the script pulls from `dev`).
- [ ] Check `docker-compose.prod.yaml` for any hardcoded local paths (none found during audit).

## 4. 💬 WhatsApp Configuration
- [ ] Verify the `WHATSAPP_VERIFY_TOKEN` in SSM matches what you set in the Meta Developer Portal.
- [ ] Ensure the Webhook URL in Meta is set to `https://<your-domain>/api/v1/whatsapp/webhook`.

## 🚀 Execution Order
1. `sh scripts/ec2-bootstrap.sh` (First time only)
2. `sh scripts/setup-nginx.sh` (Configure domain/SSL)
3. `sh scripts/ec2-deploy.sh` (Main deployment)
4. `cd monitoring && docker compose up -d` (Start monitoring)
