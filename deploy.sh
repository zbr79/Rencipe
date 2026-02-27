#!/bin/bash

echo "🚀 Starting deployment..."
set -e

BASE_DIR=$(pwd)

# ========================
# Backend
# ========================
echo "📦 Building backend..."
cd $BASE_DIR/backend
npm run build

echo "🔄 Reloading backend..."
pm2 describe backend > /dev/null \
  && pm2 reload backend --update-env \
  || pm2 start dist/server.js --name backend


# ========================
# Frontend
# ========================
echo "📦 Building frontend..."
cd $BASE_DIR/frontend
npm run build

echo "🔄 Reloading frontend..."
pm2 describe frontend > /dev/null \
  && pm2 reload frontend --update-env \
  || pm2 start npm --name frontend -- start


# ========================
# Save PM2
# ========================
echo "💾 Saving PM2 state..."
pm2 save

echo "✅ Deployment complete."