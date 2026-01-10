# 🚀 Deploy Backend to Ubuntu VPS (mon88.click)

Hướng dẫn chi tiết deploy NestJS backend lên Ubuntu VPS với domain mon88.click.

## 📋 Yêu cầu

1. **VPS Ubuntu** (20.04 LTS hoặc 22.04 LTS trở lên)
2. **Domain name**: mon88.click (đã trỏ về IP của VPS)
3. **SSH access** đến VPS
4. **Root hoặc sudo access**

## 🔧 Bước 1: Chuẩn bị VPS

### 1.1. Kết nối SSH vào VPS

```bash
ssh root@your-vps-ip
# hoặc
ssh username@your-vps-ip
```

### 1.2. Cập nhật hệ thống

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3. Tạo user mới (khuyến nghị, nếu chưa có)

```bash
# Tạo user mới
sudo adduser deploy
sudo usermod -aG sudo deploy

# Chuyển sang user mới
su - deploy
```

## 🔧 Bước 2: Cài đặt Node.js

### 2.1. Cài đặt Node.js 20.x (LTS)

```bash
# Cài đặt Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra version
node --version
npm --version
```

### 2.2. Cài đặt PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## 🔧 Bước 3: Cài đặt Database

### 3.1. Cài đặt PostgreSQL (khuyến nghị)

```bash
# Cài đặt PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Khởi động PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Tạo database và user
sudo -u postgres psql

# Trong PostgreSQL shell, chạy:
CREATE DATABASE ecommerce_dapp;
CREATE USER ecommerce_user WITH PASSWORD 'password';
ALTER ROLE ecommerce_user SET client_encoding TO 'utf8';
ALTER ROLE ecommerce_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ecommerce_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ecommerce_dapp TO ecommerce_user;
\q
```

### 3.2. Hoặc cài đặt MySQL (nếu thích MySQL)

```bash
# Cài đặt MySQL
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Tạo database và user
sudo mysql

# Trong MySQL shell, chạy:
CREATE DATABASE ecommerce_dapp;
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON ecommerce_dapp.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 🔧 Bước 4: Cài đặt Redis (cho BullMQ queues)

```bash
# Cài đặt Redis
sudo apt install -y redis-server

# Khởi động Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Kiểm tra Redis
redis-cli ping
# Kết quả mong đợi: PONG
```

## 🔧 Bước 5: Cài đặt Nginx (Reverse Proxy)

```bash
# Cài đặt Nginx
sudo apt install -y nginx

# Khởi động Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Kiểm tra status
sudo systemctl status nginx
```

## 🔧 Bước 6: Cài đặt SSL với Let's Encrypt

```bash
# Cài đặt Certbot
sudo apt install -y certbot python3-certbot-nginx

# Lấy SSL certificate cho domain mon88.click
sudo certbot --nginx -d mon88.click -d www.mon88.click

# Certbot sẽ tự động cấu hình Nginx
# Chọn option 2 để redirect HTTP to HTTPS
```

## 🔧 Bước 7: Clone và Setup Project

### 7.1. Cài đặt Git

```bash
sudo apt install -y git
```

### 7.2. Clone repository

```bash
# Tạo thư mục cho ứng dụng
cd /var/www
sudo mkdir -p backend
sudo chown $USER:$USER backend
cd backend

# Clone repository (thay bằng URL repo của bạn)
git clone https://github.com/your-username/your-repo.git .

# Hoặc nếu repo ở thư mục backend
# git clone https://github.com/your-username/your-repo.git temp
# mv temp/* temp/.* . 2>/dev/null || true
# rmdir temp
```

### 7.3. Cài đặt dependencies

```bash
# Cài đặt dependencies
npm install

# Build project
npm run build
```

## 🔧 Bước 8: Cấu hình Environment Variables

### 8.1. Tạo file .env

```bash
cd /var/www/backend
nano .env
```

### 8.2. Thêm các biến môi trường sau:

```env
# Server Configuration
NODE_ENV=production
PORT=3002


# Hoặc nếu dùng MySQL
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=ecommerce_user
DB_PASSWORD=password
DB_NAME=ecommerce_dapp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this
JWT_EXPIRES_IN=7d

# Blockchain Configuration
COMMISSION_PAYOUT_CONTRACT_ADDRESS=0xCC5457C8717cd7fc722A012694F7aE388357811f
BSC_NETWORK=mainnet
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/
BLOCKCHAIN_PRIVATE_KEY=your_private_key_without_0x_prefix

# Auto Payout Configuration
AUTO_PAYOUT_ENABLED=true
AUTO_PAYOUT_BATCH_SIZE=50
AUTO_PAYOUT_MIN_AMOUNT=0

# Redis Configuration (cho BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS & Frontend URL
FRONTEND_URL=https://vinmall.org

# AWS S3 (Optional - nếu dùng S3 cho file upload)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_S3_BUCKET=your-bucket-name
```

### 8.3. Bảo mật file .env

```bash
chmod 600 .env
```

## 🔧 Bước 9: Cấu hình PM2

### 9.1. Tạo logs directory

```bash
mkdir -p /var/www/backend/logs
```

### 9.2. Khởi động ứng dụng với PM2

```bash
cd /var/www/backend

# Khởi động với ecosystem.config.js
pm2 start ecosystem.config.js

# Hoặc khởi động trực tiếp
# pm2 start npm --name "ecommerce-backend" -- run start:prod

# Lưu PM2 process list để tự động khởi động lại khi reboot
pm2 save
pm2 startup
# Chạy lệnh mà PM2 cung cấp (sẽ có dạng: sudo env PATH=...)
```

## 🔧 Bước 10: Cấu hình Nginx

### 10.1. Tạo Nginx config cho mon88.click

```bash
sudo nano /etc/nginx/sites-available/mon88.click
```

### 10.2. Thêm cấu hình sau:

```nginx
server {
    listen 80;
    server_name mon88.click www.mon88.click;
    
    # Redirect HTTP to HTTPS (sẽ được Certbot tự động thêm sau khi cài SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mon88.click www.mon88.click;

    # SSL Configuration (sẽ được Certbot tự động thêm)
    ssl_certificate /etc/letsencrypt/live/mon88.click/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mon88.click/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/mon88.click.access.log;
    error_log /var/log/nginx/mon88.click.error.log;

    # Client max body size (cho file upload)
    client_max_body_size 50M;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve static files (uploads)
    location /files {
        alias /var/www/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 10.3. Enable site và test config

```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/mon88.click /etc/nginx/sites-enabled/

# Xóa default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔧 Bước 11: Cấu hình Firewall

### 11.1. Cài đặt và cấu hình UFW

```bash
# Cài đặt UFW (nếu chưa có)
sudo apt install -y ufw

# Cho phép SSH
sudo ufw allow 22/tcp

# Cho phép HTTP và HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Kiểm tra status
sudo ufw status
```

## 🔧 Bước 12: Kiểm tra và Test

### 12.1. Kiểm tra PM2 status

```bash
pm2 status
pm2 logs ecommerce-backend
```

### 12.2. Kiểm tra Nginx status

```bash
sudo systemctl status nginx
```

### 12.3. Kiểm tra Database connection

```bash
# PostgreSQL
sudo -u postgres psql -d ecommerce_dapp -c "SELECT version();"

# MySQL
mysql -u ecommerce_user -p ecommerce_dapp -e "SELECT VERSION();"
```

### 12.4. Test API endpoint

```bash
# Test từ server
curl http://localhost:3002

# Test từ browser
# Mở: https://mon88.click
```

## 🔧 Bước 13: Setup Auto-renewal SSL

Certbot đã tự động setup auto-renewal, nhưng có thể kiểm tra:

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Kiểm tra timer
sudo systemctl status certbot.timer
```

## 🔧 Bước 14: Monitoring và Maintenance

### 14.1. PM2 Monitoring

```bash
# Xem logs
pm2 logs ecommerce-backend

# Xem real-time monitoring
pm2 monit

# Restart app
pm2 restart ecommerce-backend

# Stop app
pm2 stop ecommerce-backend

# Xem thông tin chi tiết
pm2 describe ecommerce-backend
```

### 14.2. System Monitoring

```bash
# Xem CPU và Memory usage
htop
# hoặc
top

# Xem disk usage
df -h

# Xem Nginx logs
sudo tail -f /var/log/nginx/mon88.click.access.log
sudo tail -f /var/log/nginx/mon88.click.error.log
```

## 🔄 Bước 15: Deploy Updates

### 15.1. Script để deploy updates

Tạo file `deploy.sh`:

```bash
cd /var/www/backend
nano deploy.sh
```

Thêm nội dung:

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build project
npm run build

# Restart PM2
pm2 restart ecommerce-backend

echo "✅ Deployment completed!"
```

### 15.2. Make script executable

```bash
chmod +x deploy.sh
```

### 15.3. Chạy deploy

```bash
./deploy.sh
```

## 🐛 Troubleshooting

### Lỗi: Cannot connect to database

**Nguyên nhân**: Database chưa khởi động hoặc sai credentials

**Giải pháp**:
```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql

# Kiểm tra MySQL
sudo systemctl status mysql

# Test connection
psql -h localhost -U ecommerce_user -d ecommerce_dapp
```

### Lỗi: Port 3002 already in use

**Nguyên nhân**: App đã chạy hoặc port bị chiếm

**Giải pháp**:
```bash
# Kiểm tra process đang dùng port
sudo lsof -i :3002

# Kill process nếu cần
sudo kill -9 <PID>

# Hoặc restart PM2
pm2 restart ecommerce-backend
```

### Lỗi: Nginx 502 Bad Gateway

**Nguyên nhân**: Node.js app chưa chạy hoặc không listen trên port 3002

**Giải pháp**:
```bash
# Kiểm tra PM2
pm2 status

# Kiểm tra logs
pm2 logs ecommerce-backend

# Kiểm tra app có listen trên port 3002
sudo netstat -tlnp | grep 3002
```

### Lỗi: SSL certificate expired

**Giải pháp**:
```bash
# Renew certificate manually
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

### Lỗi: Permission denied

**Giải pháp**:
```bash
# Fix permissions cho uploads directory
sudo chown -R $USER:$USER /var/www/backend/uploads
chmod -R 755 /var/www/backend/uploads

# Fix permissions cho logs
sudo chown -R $USER:$USER /var/www/backend/logs
chmod -R 755 /var/www/backend/logs
```

## 📝 Checklist

- [ ] VPS Ubuntu đã được setup
- [ ] Domain mon88.click đã trỏ về IP VPS
- [ ] Node.js 20.x đã được cài đặt
- [ ] PM2 đã được cài đặt
- [ ] PostgreSQL/MySQL đã được cài đặt và cấu hình
- [ ] Redis đã được cài đặt
- [ ] Nginx đã được cài đặt và cấu hình
- [ ] SSL certificate đã được cài đặt (Let's Encrypt)
- [ ] Environment variables đã được cấu hình (.env)
- [ ] Project đã được clone và build
- [ ] PM2 đã khởi động ứng dụng
- [ ] Nginx đã được cấu hình reverse proxy
- [ ] Firewall đã được cấu hình
- [ ] API endpoint hoạt động (https://mon88.click)
- [ ] Database connection thành công
- [ ] SSL auto-renewal đã được setup

## 🔒 Security Best Practices

1. **Đổi default SSH port** (optional nhưng khuyến nghị)
2. **Disable root login qua SSH** (nếu dùng user khác)
3. **Setup fail2ban** để chống brute force
4. **Regular updates**: `sudo apt update && sudo apt upgrade`
5. **Backup database** định kỳ
6. **Monitor logs** thường xuyên
7. **Use strong passwords** cho database và JWT_SECRET
8. **Keep .env file secure** (chmod 600)

## 📚 Tài liệu tham khảo

- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Let's Encrypt](https://letsencrypt.org/docs/)
- [TypeORM Configuration](https://typeorm.io/data-source-options)

## 🎉 Hoàn thành!

Sau khi hoàn thành tất cả các bước, bạn sẽ có:
- ✅ Backend API chạy trên https://mon88.click
- ✅ SSL certificate tự động renew
- ✅ PM2 quản lý process tự động restart
- ✅ Nginx reverse proxy với caching
- ✅ Database và Redis đã được cấu hình
- ✅ Firewall đã được bảo mật

---

**💡 Tips**:
- Sử dụng `pm2 logs` để xem logs real-time
- Sử dụng `pm2 monit` để monitor CPU/Memory
- Backup database định kỳ: `pg_dump` hoặc `mysqldump`
- Setup monitoring tools như UptimeRobot để theo dõi uptime
