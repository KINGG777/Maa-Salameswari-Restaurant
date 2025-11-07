#!/bin/bash
# ========= stop.sh =========
echo "🛑 Stopping Node.js and Cloudflare..."
pkill -f node
pkill -f cloudflared
sleep 1
echo "✅ All processes stopped."
