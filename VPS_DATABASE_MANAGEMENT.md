# 🗄️ Quản lý Database trên VPS

Hướng dẫn xóa và quản lý database trên Ubuntu VPS.

## 🗑️ Xóa Database

### MySQL

#### Cách 1: Xóa database qua MySQL command line

```bash
# Kết nối MySQL
sudo mysql -u root -p

# Hoặc nếu dùng user khác
mysql -u ecommerce_user -ppassword
```

Trong MySQL shell:
```sql
-- Xem danh sách databases
SHOW DATABASES;

-- Xóa database
DROP DATABASE ecommerce_dapp;

-- Xác nhận đã xóa
SHOW DATABASES;

-- Thoát
EXIT;
```

#### Cách 2: Xóa database bằng một lệnh

```bash
# Xóa database trực tiếp
sudo mysql -u root -p -e "DROP DATABASE ecommerce_dapp;"

# Hoặc với user khác
mysql -u ecommerce_user -ppassword -e "DROP DATABASE ecommerce_dapp;"
```

#### Cách 3: Xóa database và user cùng lúc

```bash
sudo mysql -u root -p
```

Trong MySQL shell:
```sql
-- Xóa database
DROP DATABASE IF EXISTS ecommerce_dapp;

-- Xóa user
DROP USER IF EXISTS 'ecommerce_user'@'localhost';

-- Xác nhận quyền đã được xóa
FLUSH PRIVILEGES;

-- Kiểm tra
SHOW DATABASES;
SELECT user FROM mysql.user WHERE user='ecommerce_user';

EXIT;
```

### PostgreSQL

#### Cách 1: Xóa database qua psql

```bash
# Kết nối PostgreSQL
sudo -u postgres psql

# Hoặc với user khác
psql -U ecommerce_user -d postgres
```

Trong PostgreSQL shell:
```sql
-- Xem danh sách databases
\l

-- Ngắt tất cả connections đến database trước khi xóa
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'ecommerce_dapp'
  AND pid <> pg_backend_pid();

-- Xóa database
DROP DATABASE ecommerce_dapp;

-- Xác nhận
\l

-- Thoát
\q
```

#### Cách 2: Xóa database bằng một lệnh

```bash
# Xóa database trực tiếp
sudo -u postgres dropdb ecommerce_dapp

# Hoặc với user khác
dropdb -U ecommerce_user ecommerce_dapp
```

#### Cách 3: Xóa database và user cùng lúc

```bash
sudo -u postgres psql
```

Trong PostgreSQL shell:
```sql
-- Ngắt connections
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'ecommerce_dapp'
  AND pid <> pg_backend_pid();

-- Xóa database
DROP DATABASE IF EXISTS ecommerce_dapp;

-- Xóa user
DROP USER IF EXISTS ecommerce_user;

-- Kiểm tra
\l
\du

\q
```

## 🔄 Tạo lại Database

### MySQL

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE ecommerce_dapp;
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON ecommerce_dapp.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE ecommerce_dapp;
CREATE USER ecommerce_user WITH PASSWORD 'password';
ALTER ROLE ecommerce_user SET client_encoding TO 'utf8';
ALTER ROLE ecommerce_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ecommerce_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ecommerce_dapp TO ecommerce_user;
\q
```

## 📋 Backup Database trước khi xóa

### MySQL Backup

```bash
# Backup database
mysqldump -u ecommerce_user -ppassword ecommerce_dapp > backup_$(date +%Y%m%d_%H%M%S).sql

# Hoặc với root
sudo mysqldump -u root -p ecommerce_dapp > backup_$(date +%Y%m%d_%H%M%S).sql
```

### PostgreSQL Backup

```bash
# Backup database
sudo -u postgres pg_dump ecommerce_dapp > backup_$(date +%Y%m%d_%H%M%S).sql

# Hoặc với user khác
pg_dump -U ecommerce_user ecommerce_dapp > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🔍 Kiểm tra Database

### MySQL

```bash
# Liệt kê tất cả databases
sudo mysql -u root -p -e "SHOW DATABASES;"

# Kiểm tra database cụ thể
sudo mysql -u root -p -e "USE ecommerce_dapp; SHOW TABLES;"

# Kiểm tra user
sudo mysql -u root -p -e "SELECT user, host FROM mysql.user;"
```

### PostgreSQL

```bash
# Liệt kê tất cả databases
sudo -u postgres psql -l

# Kiểm tra database cụ thể
sudo -u postgres psql -d ecommerce_dapp -c "\dt"

# Kiểm tra users
sudo -u postgres psql -c "\du"
```

## ⚠️ Lưu ý quan trọng

1. **Backup trước khi xóa**: Luôn backup database trước khi xóa để tránh mất dữ liệu
2. **Ngắt connections**: Với PostgreSQL, cần ngắt tất cả connections trước khi xóa database
3. **Kiểm tra ứng dụng**: Đảm bảo ứng dụng đã dừng hoặc không còn kết nối đến database
4. **Quyền truy cập**: Cần quyền phù hợp để xóa database (thường là root hoặc superuser)

## 🛠️ Script tự động xóa và tạo lại

### MySQL Script

Tạo file `reset-db-mysql.sh`:

```bash
#!/bin/bash

DB_NAME="ecommerce_dapp"
DB_USER="ecommerce_user"
DB_PASS="password"

echo "🗑️  Dropping database $DB_NAME..."

sudo mysql -u root -p <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS '$DB_USER'@'localhost';
CREATE DATABASE $DB_NAME;
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Database $DB_NAME has been reset!"
```

### PostgreSQL Script

Tạo file `reset-db-postgres.sh`:

```bash
#!/bin/bash

DB_NAME="ecommerce_dapp"
DB_USER="ecommerce_user"
DB_PASS="password"

echo "🗑️  Dropping database $DB_NAME..."

sudo -u postgres psql <<EOF
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
ALTER ROLE $DB_USER SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "✅ Database $DB_NAME has been reset!"
```

Sử dụng:
```bash
chmod +x reset-db-mysql.sh
./reset-db-mysql.sh
```

## 🔄 Sau khi xóa database

Sau khi xóa database, ứng dụng NestJS sẽ tự động tạo lại schema khi khởi động (nếu `synchronize: true` trong TypeORM config).

```bash
cd /var/www/backend
pm2 restart ecommerce-backend
pm2 logs ecommerce-backend
```

---

**💡 Tip**: Nếu muốn xóa tất cả dữ liệu nhưng giữ lại cấu trúc, có thể dùng:
- MySQL: `TRUNCATE TABLE table_name;` cho từng table
- PostgreSQL: `TRUNCATE TABLE table_name CASCADE;`
