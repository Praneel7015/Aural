#!/bin/bash
# Quick update script -- run on the Lightsail instance after pushing new code
set -e
cd /home/ubuntu/Aural
git pull origin main
cd backend
source .venv/bin/activate
pip install -r requirements.txt -q
sudo systemctl restart verity-backend
echo "Updated and restarted. Check: sudo journalctl -u verity-backend -f"
