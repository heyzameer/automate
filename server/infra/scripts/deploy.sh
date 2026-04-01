#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Deploy the CarBot backend to Kubernetes
# =============================================================================
# Usage:
#   ./infra/scripts/deploy.sh [environment]
#
# Examples:
#   ./infra/scripts/deploy.sh           # defaults to development
#   ./infra/scripts/deploy.sh staging
#   ./infra/scripts/deploy.sh production
# =============================================================================

set -euo pipefail

ENV="${1:-development}"
NAMESPACE="carbot"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="${SCRIPT_DIR}/../k8s"

echo "🚀  Deploying CarBot backend to [${ENV}] environment..."

# ─── 1. Namespace ─────────────────────────────────────────────────────────────
echo "📦  Applying namespace..."
kubectl apply -f "${K8S_DIR}/namespace.yaml"

# ─── 2. Auth Service ──────────────────────────────────────────────────────────
echo "🔐  Deploying auth-service..."
kubectl apply -f "${K8S_DIR}/auth-service/" -n "${NAMESPACE}"

# ─── 3. API Gateway ───────────────────────────────────────────────────────────
echo "🌐  Deploying api-gateway..."
kubectl apply -f "${K8S_DIR}/api-gateway/" -n "${NAMESPACE}"

# ─── 4. Wait for rollouts ─────────────────────────────────────────────────────
echo "⏳  Waiting for deployments to become ready..."
kubectl rollout status deployment/auth-service -n "${NAMESPACE}"
kubectl rollout status deployment/api-gateway  -n "${NAMESPACE}"

echo ""
echo "✅  Deployment complete!"
echo "    Namespace : ${NAMESPACE}"
echo "    Env       : ${ENV}"
kubectl get pods -n "${NAMESPACE}"
