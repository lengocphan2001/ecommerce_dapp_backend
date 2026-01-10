#!/bin/bash

echo "🔍 Diagnosing 502 Bad Gateway Error..."
echo ""

# Check PM2 status
echo "1. Checking PM2 status..."
pm2 status
echo ""

# Check if app is listening on port 3002
echo "2. Checking if port 3002 is in use..."
sudo netstat -tlnp | grep 3002 || echo "❌ Port 3002 is NOT in use - app is not running!"
echo ""

# Check PM2 logs
echo "3. Checking PM2 logs (last 30 lines)..."
pm2 logs ecommerce-backend --lines 30 --nostream
echo ""

# Check if dist/main.js exists
echo "4. Checking if dist/main.js exists..."
if [ -f "/var/www/backend/dist/main.js" ]; then
    echo "✅ dist/main.js exists"
else
    echo "❌ dist/main.js NOT found - need to build!"
fi
echo ""

# Check .env file
echo "5. Checking PORT in .env..."
if [ -f "/var/www/backend/.env" ]; then
    grep PORT /var/www/backend/.env || echo "⚠️  PORT not found in .env"
else
    echo "❌ .env file not found!"
fi
echo ""

# Check database connection
echo "6. Testing database connection..."
if grep -q "DB_TYPE=postgres" /var/www/backend/.env 2>/dev/null; then
    echo "Testing PostgreSQL..."
    sudo systemctl status postgresql --no-pager | head -3
elif grep -q "DB_TYPE=mysql" /var/www/backend/.env 2>/dev/null; then
    echo "Testing MySQL..."
    sudo systemctl status mysql --no-pager | head -3
fi
echo ""

# Check Redis
echo "7. Testing Redis..."
redis-cli ping 2>/dev/null || echo "❌ Redis not responding"
echo ""

echo "=========================================="
echo "🔧 Quick Fix Commands:"
echo "=========================================="
echo ""
echo "If app is not running, try:"
echo "  cd /var/www/backend"
echo "  pm2 restart ecommerce-backend"
echo "  # OR if not in PM2:"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "If dist/main.js is missing:"
echo "  cd /var/www/backend"
echo "  npm run build"
echo "  pm2 restart ecommerce-backend"
echo ""
echo "Check logs in real-time:"
echo "  pm2 logs ecommerce-backend"
echo ""
