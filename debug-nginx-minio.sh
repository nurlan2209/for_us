#!/bin/bash
# debug-nginx-minio.sh - Диагностика проблем nginx с MinIO

set -e

echo "🔍 Debugging nginx MinIO configuration..."

# Проверяем текущую конфигурацию nginx
echo "📋 Current nginx configuration:"
echo "================================"
sudo nginx -T | grep -A 50 "location /media/"

echo ""
echo "🔍 Checking nginx sites:"
echo "========================"
sudo ls -la /etc/nginx/sites-available/kartofan.online
sudo ls -la /etc/nginx/sites-enabled/kartofan.online

echo ""
echo "🔍 Testing nginx syntax:"
echo "========================"
sudo nginx -t

echo ""
echo "🔍 Testing direct MinIO access:"
echo "==============================="
echo "Direct MinIO test:"
curl -I http://localhost:9000/portfolio-files/images/42c5a57f-e6f8-4b18-8123-957c8809917b.jpg | head -3

echo ""
echo "🔍 Testing nginx proxy without SSL:"
echo "=================================="
echo "Testing HTTP proxy to MinIO:"
curl -I -H "Host: kartofan.online" http://localhost:80/media/portfolio-files/images/42c5a57f-e6f8-4b18-8123-957c8809917b.jpg | head -3

echo ""
echo "🔍 Checking nginx error logs:"
echo "============================="
echo "Recent nginx errors:"
sudo tail -20 /var/log/nginx/error.log | grep -E "(error|warn|crit)" || echo "No recent errors found"

echo ""
echo "🔍 Checking nginx access logs:"
echo "=============================="
echo "Recent media requests:"
sudo tail -10 /var/log/nginx/access.log | grep "/media/" || echo "No media requests found"

echo ""
echo "🔍 Testing nginx process and listening ports:"
echo "============================================="
echo "Nginx processes:"
ps aux | grep nginx | grep -v grep

echo ""
echo "Listening ports:"
sudo netstat -tlnp | grep -E "(80|443|9000)"

echo ""
echo "🔍 Testing internal nginx routing:"
echo "================================="
echo "Testing with curl through nginx internally:"
curl -v -H "Host: kartofan.online" http://127.0.0.1:443/media/portfolio-files/images/42c5a57f-e6f8-4b18-8123-957c8809917b.jpg 2>&1 | head -10

echo ""
echo "🔧 Attempting temporary fix..."
echo "=============================="

# Создаем временную упрощенную конфигурацию для тестирования
sudo tee /tmp/test-media-location.conf > /dev/null << 'EOF'
location /media/ {
    access_log /var/log/nginx/debug_media.log;
    error_log /var/log/nginx/debug_media_error.log debug;
    
    rewrite ^/media/(.*)$ /$1 break;
    proxy_pass http://127.0.0.1:9000/;
    proxy_set_header Host $host;
}
EOF

echo "Created test configuration in /tmp/test-media-location.conf"
echo ""
echo "🔧 Manual fix steps:"
echo "==================="
echo "1. Check if the configuration was applied:"
echo "   sudo nginx -T | grep -A 20 'location /media/'"
echo ""
echo "2. If not applied, reload nginx:"
echo "   sudo systemctl reload nginx"
echo ""
echo "3. Test again:"
echo "   curl -I https://kartofan.online/media/portfolio-files/images/42c5a57f-e6f8-4b18-8123-957c8809917b.jpg"
echo ""
echo "4. Check debug logs:"
echo "   sudo tail -f /var/log/nginx/debug_media_error.log"
echo ""

# Проверяем, применилась ли конфигурация
echo "🔍 Checking if media location is properly configured:"
if sudo nginx -T 2>/dev/null | grep -q "location /media/"; then
    echo "✅ Media location block found in nginx config"
else
    echo "❌ Media location block NOT found in nginx config"
    echo "🔧 The configuration may not have been applied properly"
fi

echo ""
echo "🔍 Final diagnostics:"
echo "====================="
echo "Current working directory: $(pwd)"
echo "Nginx config file exists: $(test -f /etc/nginx/sites-available/kartofan.online && echo 'YES' || echo 'NO')"
echo "Nginx config is linked: $(test -L /etc/nginx/sites-enabled/kartofan.online && echo 'YES' || echo 'NO')"

# Проверим размер конфигурационного файла
echo "Config file size: $(wc -l /etc/nginx/sites-available/kartofan.online 2>/dev/null || echo 'Cannot read file')"
