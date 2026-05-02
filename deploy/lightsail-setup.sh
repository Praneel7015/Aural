#!/bin/bash
# Verity - AWS Lightsail deployment script
# Run this on a fresh Ubuntu 22.04 Lightsail instance (8GB RAM recommended)
#
# Usage:
#   1. Create Lightsail instance: Ubuntu 22.04, 8GB RAM ($40/month)
#   2. SSH in: ssh -i key.pem ubuntu@your-ip
#   3. Run: curl -sSL https://raw.githubusercontent.com/Praneel7015/Aural/main/deploy/lightsail-setup.sh | bash
#
# Or copy-paste this script and run it.

set -e

echo "=========================================="
echo "  Verity - Deployment Setup"
echo "=========================================="

# Add 4GB swap (critical for 4GB instances)
echo "[1/8] Setting up swap space..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "  >> 4GB swap created"
else
    echo "  >> Swap already exists"
fi

# System dependencies
echo "[2/8] Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq python3.11 python3.11-venv python3.11-dev \
    python3-pip git libsndfile1 ffmpeg nginx certbot python3-certbot-nginx

# Clone repo (private repo -- use SSH key or PAT)
echo "[3/8] Cloning repository..."
cd /home/ubuntu
if [ -d "Aural" ]; then
    cd Aural && git pull origin main
else
    echo "  >> Repo is private. Choose one method:"
    echo "  >> A) SSH: git clone git@github.com:Praneel7015/Aural.git"
    echo "  >> B) PAT: git clone https://YOUR_TOKEN@github.com/Praneel7015/Aural.git"
    echo ""
    echo "  >> If you haven't cloned yet, run one of the above manually, then re-run this script."

    # Try SSH first, then HTTPS
    git clone git@github.com:Praneel7015/Aural.git 2>/dev/null || \
    git clone https://github.com/Praneel7015/Aural.git 2>/dev/null || {
        echo "  >> Clone failed. Clone manually and re-run this script."
        exit 1
    }
    cd Aural
fi

# Backend setup
echo "[3/7] Setting up Python environment..."
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

# Clone AASIST3 vendor
echo "[4/7] Setting up AASIST3 model..."
if [ ! -d "vendor/AASIST3" ]; then
    git clone https://github.com/lab260ru/AASIST3.git vendor/AASIST3
fi

# Create .env if not exists
echo "[5/7] Configuring environment..."
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
WHISPER_MODEL=distil-large-v3
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

LLM_PROVIDER=featherless
FEATHERLESS_API_KEY=REPLACE_ME
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
FEATHERLESS_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct

GEMINI_API_KEY=REPLACE_ME
GEMINI_MODEL=gemini-2.5-flash

ANTISPOOF_THRESHOLD=0.5
VOICEPRINT_MATCH_THRESHOLD=0.4
SCAM_VERDICT_THRESHOLD=0.7

# CORS: comma-separated allowed origins
# Use * to allow all, or list specific URLs:
# CORS_ORIGINS=https://verity-app.vercel.app,http://localhost:3000
CORS_ORIGINS=*
ENVEOF
    echo ""
    echo "  >> .env created. ADD YOUR API KEYS:"
    echo "  >> nano /home/ubuntu/Aural/backend/.env"
    echo ""
fi

# Create systemd service for backend
echo "[6/7] Creating systemd service..."
sudo tee /etc/systemd/system/verity-backend.service > /dev/null << 'SVCEOF'
[Unit]
Description=Verity Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Aural/backend
Environment=PATH=/home/ubuntu/Aural/backend/.venv/bin:/usr/bin
ExecStart=/home/ubuntu/Aural/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

sudo systemctl daemon-reload
sudo systemctl enable verity-backend
sudo systemctl start verity-backend

# Nginx reverse proxy
echo "[7/7] Configuring Nginx..."
sudo tee /etc/nginx/sites-available/verity > /dev/null << 'NGXEOF'
server {
    listen 80;
    server_name _;

    # Backend API
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        client_max_body_size 50M;
    }
}
NGXEOF

sudo ln -sf /etc/nginx/sites-available/verity /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "=========================================="
echo "  Verity deployed!"
echo "=========================================="
echo ""
echo "  Backend: http://$(curl -s ifconfig.me):80"
echo ""
echo "  IMPORTANT: Edit your API keys:"
echo "    nano /home/ubuntu/Aural/backend/.env"
echo "    sudo systemctl restart verity-backend"
echo ""
echo "  Check logs:"
echo "    sudo journalctl -u verity-backend -f"
echo ""
echo "  First request will be slow (model download)."
echo "  Subsequent requests: ~30-40s per analysis."
echo "=========================================="
