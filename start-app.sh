#!/bin/bash

echo "🚀 Starting Backend Application..."
echo ""

cd /var/www/backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create .env file first"
    exit 1
fi

# Check if dist/main.js exists
if [ ! -f "dist/main.js" ]; then
    echo "⚠️  dist/main.js not found. Building project..."
    npm run build
    
    if [ ! -f "dist/main.js" ]; then
        echo "❌ ERROR: Build failed! Check errors above"
        exit 1
    fi
    echo "✅ Build successful"
fi

# Check PM2 status
echo "Checking PM2 status..."
pm2 status

# Stop existing process if running
pm2 stop ecommerce-backend 2>/dev/null
pm2 delete ecommerce-backend 2>/dev/null

# Start the app
echo ""
echo "Starting application with PM2..."
pm2 start ecosystem.config.js

# Wait a moment
sleep 2

# Check status
echo ""
echo "PM2 Status:"
pm2 status

# Check if port is listening
echo ""
echo "Checking if app is listening on port 3002..."
if sudo netstat -tlnp | grep -q ":3002"; then
    echo "✅ App is running on port 3002!"
else
    echo "❌ App is NOT listening on port 3002"
    echo ""
    echo "Checking logs for errors:"
    pm2 logs ecommerce-backend --lines 30 --nostream
fi

# Test the endpoint
echo ""
echo "Testing endpoint..."
curl -s http://localhost:3002 || echo "❌ Cannot connect to app"

echo ""
echo "✅ Done! Check logs with: pm2 logs ecommerce-backend"
