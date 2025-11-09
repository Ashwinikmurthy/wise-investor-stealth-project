# Wise Investor - Part 6: Installation & Deployment Guide
## Complete Setup Instructions

**Version**: 1.0.0  
**Last Updated**: November 2025

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Pre-Installation Checklist](#2-pre-installation-checklist)
3. [Install System Dependencies](#3-install-system-dependencies)
4. [Install & Configure NGINX](#4-install--configure-nginx)
5. [Configure PostgreSQL](#5-configure-postgresql)
6. [Deploy Backend Application](#6-deploy-backend-application)
7. [Deploy Frontend Application](#7-deploy-frontend-application)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Initialize Database](#9-initialize-database)
10. [Start Services](#10-start-services)
11. [Verify Installation](#11-verify-installation)
12. [Production Deployment](#12-production-deployment)
13. [SSL/TLS Configuration](#13-ssltls-configuration)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. System Requirements

### 1.1 Minimum Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB SSD | 50+ GB SSD |
| Network | 10 Mbps | 100+ Mbps |

### 1.2 Software Requirements

- **Python**: 3.12 or higher
- **PostgreSQL**: 14 or higher
- **Node.js**: 18 LTS or higher
- **npm**: 9 or higher
- **NGINX**: 1.18 or higher
- **Git**: 2.25 or higher

### 1.3 Network Requirements

**Required Open Ports:**
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 22 (SSH, for administration)
- Port 5432 (PostgreSQL, local only)
- Port 8000 (FastAPI backend, local only)
- Port 5173 (Vite dev server, development only)

**Firewall Rules:**
- Allow inbound on ports 80, 443
- Allow outbound to package repositories
- Restrict database port to localhost only

---

## 2. Pre-Installation Checklist

Before beginning installation, ensure you have:

- [ ] Root or sudo access to the server
- [ ] Server meets minimum requirements
- [ ] Domain name (optional but recommended for production)
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] GitHub access for cloning repository
- [ ] Database credentials planned
- [ ] Superadmin credentials planned
- [ ] Backup strategy planned

---

## 3. Install System Dependencies

### 3.1 Update System Packages

```bash
# Update package lists
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential curl wget git
```

### 3.2 Install Python 3.12+

```bash
# Add deadsnakes PPA for latest Python
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Install Python 3.12
sudo apt install -y python3.12 python3.12-venv python3.12-dev

# Verify installation
python3.12 --version
# Output: Python 3.12.x

# Install pip
sudo apt install -y python3-pip

# Verify pip
pip3 --version
```

### 3.2 Install PostgreSQL

```bash
# Install PostgreSQL and extensions
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
# Should show "active (running)"

# Check PostgreSQL version
psql --version
# Output: psql (PostgreSQL) 14.x
```

### 3.4 Install Node.js and npm

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version
# Output: v18.x.x

npm --version
# Output: 9.x.x
```

### 3.5 Install NGINX

```bash
# Install NGINX
sudo apt install -y nginx

# Start and enable NGINX
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify NGINX is running
sudo systemctl status nginx

# Check NGINX version
nginx -v
# Output: nginx version: nginx/1.18.x

# Test default page
curl http://localhost
# Should return HTML
```

### 3.6 Install Git

```bash
# Install Git
sudo apt install -y git

# Verify installation
git --version
# Output: git version 2.x.x

# Configure Git (optional)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 4. Install & Configure NGINX

### 4.1 Backup Default Configuration

```bash
# Backup default NGINX configuration
sudo mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Verify backup
ls -la /etc/nginx/sites-available/
```

### 4.2 Create Wise Investor Configuration

```bash
# Create new configuration file
sudo nano /etc/nginx/sites-available/wise-investor
```

### 4.3 Add Configuration Content

```nginx
# Upstream definitions
upstream fastapi_backend {
    server 127.0.0.1:8000 fail_timeout=0;
}

upstream vite_frontend {
    server 127.0.0.1:5173 fail_timeout=0;
}

# Main server block
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Logging
    access_log /var/log/nginx/wise-investor-access.log;
    error_log /var/log/nginx/wise-investor-error.log;

    # Upload size limit
    client_max_body_size 50M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # API Routes
    location /api/v1/ {
        proxy_pass http://localhost:8000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }

    location /api/public/ {
        proxy_pass http://localhost:8000/api/public/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }

    # API Documentation
    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # OpenAPI Schema
    location /openapi.json {
        proxy_pass http://localhost:8000/openapi.json;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend - Proxy to Vite
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Host localhost;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Vite HMR
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
    }
}
```

### 4.4 Enable Configuration

```bash
# Create symbolic link to enable site
sudo ln -sf /etc/nginx/sites-available/wise-investor /etc/nginx/sites-enabled/wise-investor

# Verify symbolic link
ls -la /etc/nginx/sites-enabled/
# Should show: wise-investor -> /etc/nginx/sites-available/wise-investor

# Test NGINX configuration for syntax errors
sudo nginx -t
# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload NGINX to apply changes
sudo systemctl reload nginx

# Verify NGINX is running
sudo systemctl status nginx
```

---

## 5. Configure PostgreSQL

### 5.1 Create Database and User

```bash
# Switch to postgres user and run psql
sudo -u postgres psql << 'EOSQL'

-- Create database user
CREATE USER orguser WITH PASSWORD 'orgpassword';

-- Create database
CREATE DATABASE organization_db OWNER orguser;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE organization_db TO orguser;

-- Connect to database
\c organization_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO orguser;

-- Exit
\q
EOSQL
```

### 5.2 Verify Database Creation

```bash
# List databases
sudo -u postgres psql -l | grep organization_db

# Test connection
psql -h localhost -U orguser -d organization_db -c "SELECT version();"
# Enter password when prompted
```

### 5.3 Configure PostgreSQL for Performance

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Recommended settings for 8GB RAM server:
# shared_buffers = 2GB
# effective_cache_size = 6GB
# maintenance_work_mem = 512MB
# work_mem = 32MB
# max_connections = 100

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 6. Deploy Backend Application

### 6.1 Clone Repository

```bash
# Navigate to home directory
cd ~

# Create codebase directory
mkdir -p codebase
cd codebase

# Clone repository (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/wise-investor.git .

# Verify files
ls -la
# Should see: backend/ frontend/ .git/ etc.
```

### 6.2 Setup Python Virtual Environment

```bash
# Navigate to backend directory
cd ~/codebase/backend

# Create virtual environment using Python 3.12
python3.12 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Verify virtual environment
which python
# Output should be: /home/ubuntu/codebase/backend/venv/bin/python

python --version
# Output: Python 3.12.x
```

### 6.3 Install Python Dependencies

**CRITICAL: Install passlib and bcrypt with specific versions first**

```bash
# Still in activated virtual environment

# Uninstall any existing versions
pip uninstall passlib bcrypt -y

# Install specific versions for compatibility
pip install passlib==1.7.4 bcrypt==3.2.2

# Verify bcrypt installation
python -c "from passlib.hash import bcrypt; print('Success')"
# Should print: Success

# Install remaining dependencies
pip install -r requirements.txt

# Verify key packages
pip list | grep -E "fastapi|sqlalchemy|uvicorn|pydantic"
```

### 6.4 Create Environment File

```bash
# Create .env file
nano ~/codebase/backend/.env
```

**Add the following configuration:**

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=organization_db
DB_USER=orguser
DB_PASSWORD=orgpassword

# Security
SECRET_KEY=your-secret-key-here-generate-with-openssl
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# Superadmin Credentials
SUPERADMIN_USERNAME=superadmin@example.com
SUPERADMIN_PASSWORD=SuperAdmin@123

# Application Settings
DEBUG=False
CORS_ORIGINS=http://localhost:5173,http://your-domain.com
API_VERSION=v1

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@wise-investor.com
```

**Generate Secret Key:**

```bash
# Generate secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output and paste as SECRET_KEY value
```

---

## 9. Initialize Database

### 9.1 Run Schema Creation Scripts

```bash
cd ~/codebase/backend

# Run main schema creation
psql -h localhost -U orguser -d organization_db -f new_create_schema.sql

# Run additional enums/types
psql -h localhost -U orguser -d organization_db -f create_enum_extra.sql

# Verify tables were created
psql -h localhost -U orguser -d organization_db -c "\dt"
# Should list all tables
```

### 9.2 Create Superadmin User

```bash
# Make sure virtual environment is activated
source ~/codebase/backend/venv/bin/activate

# Update database details in create_superadmin.py if needed
nano create_superadmin.py

# Run superadmin creation script
python create_superadmin.py

# Expected output:
# Superadmin user created successfully!
# Email: superadmin@example.com
# Password: SuperAdmin@123
```

### 9.3 (Optional) Generate Test Data

```bash
cd ~/codebase/backend/datagen

# Update database credentials in scripts
nano gendata.py
# Update DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

# Truncate existing data (if any)
python truncate_all.py

# Generate donor and organization data
python gendata.py

# Generate donation data
python gendata_gifts.py

# Verify data was created
psql -h localhost -U orguser -d organization_db -c "SELECT COUNT(*) FROM donors;"
```

---

## 10. Start Services

### 10.1 Start Backend with Systemd (Production)

**Create systemd service file:**

```bash
sudo nano /etc/systemd/system/wise-investor-backend.service
```

**Add service configuration:**

```ini
[Unit]
Description=Wise Investor FastAPI Backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/codebase/backend

# Environment
Environment="PATH=/home/ubuntu/codebase/backend/venv/bin"
Environment="PYTHONPATH=/home/ubuntu/codebase/backend"
EnvironmentFile=/home/ubuntu/codebase/backend/.env

# Execution
ExecStart=/home/ubuntu/codebase/backend/venv/bin/uvicorn main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 4 \
    --log-level info \
    --access-log

# Restart policy
Restart=always
RestartSec=10
StartLimitInterval=5min
StartLimitBurst=5

# Resource limits
LimitNOFILE=65535

# Security
NoNewPrivileges=true
PrivateTmp=true

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=wise-investor-backend

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable wise-investor-backend

# Start service
sudo systemctl start wise-investor-backend

# Check status
sudo systemctl status wise-investor-backend
# Should show "active (running)"

# View logs
sudo journalctl -u wise-investor-backend -f
```

### 10.2 Start Backend Manually (Development)

```bash
cd ~/codebase/backend
source venv/bin/activate

# Start with auto-reload for development
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Or start without reload for testing
uvicorn main:app --host 127.0.0.1 --port 8000
```

### 10.3 Deploy Frontend

**For Development:**

```bash
cd ~/codebase/frontend/wise-investor

# Install dependencies
npm install

# Create .env file
nano .env

# Add:
VITE_API_URL=http://your-domain.com/api/v1

# Start development server
npm run dev
```

**For Production:**

```bash
cd ~/codebase/frontend/wise-investor

# Install dependencies
npm install

# Build for production
npm run build

# Files will be in dist/ directory
ls -la dist/

# Serve with a production server or configure NGINX to serve static files
```

---

## 11. Verify Installation

### 11.1 Check All Services

```bash
# Check NGINX
sudo systemctl status nginx
curl http://localhost

# Check PostgreSQL
sudo systemctl status postgresql
psql -h localhost -U orguser -d organization_db -c "SELECT 1;"

# Check Backend
sudo systemctl status wise-investor-backend
curl http://localhost:8000/docs
curl http://localhost:8000/api/v1/health

# Check Frontend (if running)
curl http://localhost:5173
```

### 11.2 Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:8000/api/v1/health

# Test login (replace with actual credentials)
curl -X POST http://localhost:8000/api/public/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin@example.com", "password": "SuperAdmin@123"}'

# Should return JSON with access_token
```

### 11.3 Access Application

**Open browser and navigate to:**
- Frontend: http://your-domain.com or http://server-ip
- API Docs: http://your-domain.com/docs
- Backend Health: http://your-domain.com/api/v1/health

**Login with superadmin credentials:**
- Email: superadmin@example.com
- Password: SuperAdmin@123

---

## 12. Production Deployment

### 12.1 Production Checklist

- [ ] Change default superadmin password
- [ ] Update SECRET_KEY with strong random value
- [ ] Set DEBUG=False in .env
- [ ] Configure proper CORS_ORIGINS
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall (ufw)
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Set up log rotation
- [ ] Disable development tools
- [ ] Review security settings
- [ ] Test disaster recovery
- [ ] Document deployment

### 12.2 Security Hardening

```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable password authentication for SSH (use keys only)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Keep system updated
sudo apt update && sudo apt upgrade -y

# Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 13. SSL/TLS Configuration

### 13.1 Install Certbot

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
```

### 13.2 Obtain SSL Certificate

```bash
# Make sure your domain points to your server IP

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Certbot will automatically configure NGINX
```

### 13.3 Test Auto-Renewal

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Auto-renewal is configured via systemd timer
sudo systemctl status certbot.timer
```

---

## 14. Troubleshooting

### 14.1 Backend Won't Start

**Check logs:**
```bash
sudo journalctl -u wise-investor-backend -n 50
```

**Common issues:**
1. Port 8000 already in use
   ```bash
   sudo netstat -tlnp | grep 8000
   sudo kill <PID>
   ```

2. Database connection failed
   ```bash
   # Test database connection
   psql -h localhost -U orguser -d organization_db
   # Check credentials in .env file
   ```

3. Module import errors
   ```bash
   # Reinstall dependencies
   cd ~/codebase/backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

### 14.2 Frontend Issues

**Clear cache and rebuild:**
```bash
cd ~/codebase/frontend/wise-investor
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 14.3 NGINX Issues

**Test configuration:**
```bash
sudo nginx -t
```

**Check error logs:**
```bash
sudo tail -f /var/log/nginx/wise-investor-error.log
```

**Restart NGINX:**
```bash
sudo systemctl restart nginx
```

### 14.4 Database Issues

**Check PostgreSQL status:**
```bash
sudo systemctl status postgresql
```

**View PostgreSQL logs:**
```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**Reset database (CAUTION: Deletes all data):**
```bash
sudo -u postgres psql << 'EOSQL'
DROP DATABASE IF EXISTS organization_db;
CREATE DATABASE organization_db OWNER orguser;
\q
EOSQL

# Re-run schema creation
cd ~/codebase/backend
psql -h localhost -U orguser -d organization_db -f new_create_schema.sql
```

---

**Installation Complete!** 

Your Wise Investor platform should now be running. Access it at your configured domain or server IP address.
