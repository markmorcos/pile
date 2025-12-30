#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=pile
ENV_FILE=".env"

# -----------------------
# Load .env
# -----------------------
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE not found"
  exit 1
fi

echo "▶ Loading environment from $ENV_FILE"

# Export everything defined in .env
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "▶ Creating namespace: $NAMESPACE (if not exists)"
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

echo "▶ Creating secrets in namespace: $NAMESPACE"

# -----------------------
# Database
# -----------------------
kubectl create secret generic pile-db \
  --namespace "$NAMESPACE" \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --dry-run=client -o yaml | kubectl apply -f -

# -----------------------
# Firebase (Public)
# -----------------------
kubectl create secret generic pile-firebase-public \
  --namespace "$NAMESPACE" \
  --from-literal=API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY" \
  --from-literal=AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" \
  --from-literal=PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID" \
  --from-literal=STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" \
  --from-literal=MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" \
  --from-literal=APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID" \
  --dry-run=client -o yaml | kubectl apply -f -

# -----------------------
# Firebase (Admin)
# IMPORTANT: PRIVATE KEY must contain escaped newlines (\n)
# -----------------------
kubectl create secret generic pile-firebase-admin \
  --namespace "$NAMESPACE" \
  --from-literal=PROJECT_ID="$FIREBASE_ADMIN_PROJECT_ID" \
  --from-literal=CLIENT_EMAIL="$FIREBASE_ADMIN_CLIENT_EMAIL" \
  --from-literal=PRIVATE_KEY="$FIREBASE_ADMIN_PRIVATE_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

# -----------------------
# Cloudflare
# -----------------------
kubectl create secret generic pile-cloudflare \
  --namespace "$NAMESPACE" \
  --from-literal=ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
  --from-literal=API_TOKEN="$CLOUDFLARE_API_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ pile namespace and secrets created successfully"
