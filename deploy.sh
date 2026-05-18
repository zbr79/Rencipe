#!/bin/bash

echo "🚀 Starting deployment..."
set -e

BASE_DIR=$(pwd)
BACKEND_PM2_NAME="rencipe-backend"
FRONTEND_PM2_NAME="rencipe-frontend"
BACKEND_PORT=6000
FRONTEND_PORT=4000
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"

echo "📦 Building backend..."
cd "$BASE_DIR/backend"
npm run build

echo "🔄 Reloading backend..."
PORT=$BACKEND_PORT pm2 describe "$BACKEND_PM2_NAME" > /dev/null \
  && PORT=$BACKEND_PORT pm2 reload "$BACKEND_PM2_NAME" --update-env \
  || PORT=$BACKEND_PORT pm2 start dist/server.js --name "$BACKEND_PM2_NAME"

echo "📦 Building frontend..."
cd "$BASE_DIR/frontend"
NEXT_PUBLIC_BACKEND_URL="$BACKEND_URL" npm run build

echo "🔄 Reloading frontend..."
PORT=$FRONTEND_PORT NEXT_PUBLIC_BACKEND_URL="$BACKEND_URL" pm2 describe "$FRONTEND_PM2_NAME" > /dev/null \
  && PORT=$FRONTEND_PORT NEXT_PUBLIC_BACKEND_URL="$BACKEND_URL" pm2 reload "$FRONTEND_PM2_NAME" --update-env \
  || PORT=$FRONTEND_PORT NEXT_PUBLIC_BACKEND_URL="$BACKEND_URL" pm2 start npm --name "$FRONTEND_PM2_NAME" -- start

echo "💾 Saving PM2 state..."
pm2 save

echo "✅ Deployment complete."
