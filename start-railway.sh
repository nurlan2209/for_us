#!/bin/bash
# start-railway.sh - Запуск MinIO + Portfolio на Railway

set -e

echo "🚀 Starting MinIO + Portfolio on Railway..."

# Переменные окружения для MinIO
export MINIO_ROOT_USER=${MINIO_ACCESS_KEY:-portfolioadmin}
export MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY:-portfoliosecret123}

# Запускаем MinIO в фоне
echo "🗄️ Starting MinIO server..."
minio server /app/minio-data --address ":9000" --console-address ":9001" &
MINIO_PID=$!

# Ждем запуска MinIO
echo "⏳ Waiting for MinIO to start..."
sleep 5

# Настраиваем MinIO
echo "🔧 Configuring MinIO..."
mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} || true
mc mb local/${MINIO_BUCKET_NAME:-portfolio-files} || true

# Настраиваем CORS для MinIO
echo "🌐 Setting up CORS..."
mc admin config set local cors_allowed_origins="*" || true
mc admin service restart local || true

sleep 2

# Запускаем Node.js приложение
echo "🚀 Starting Node.js application..."
exec node src/app.js