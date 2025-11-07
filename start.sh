#!/bin/bash
# ========= start.sh =========
# Kill any old processes
pkill -f node
pkill -f cloudflared
sleep 2

echo "🧹 Old processes cleared."

# Install dependencies if needed
npm install > install.log 2>&1

# Start Node app in background
nohup npm start > app.log 2>&1 &
echo "🚀 Starting Node.js app..."
sleep 5

# Wait until port 3000 is live
for i in {1..15}; do
  if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Node.js app is up!"
    break
  fi
  echo "⏳ Waiting for app to start ($i)..."
  sleep 2
done

# Start Cloudflare tunnel
nohup cloudflared tunnel --url http://localhost:3000 > cf.log 2>&1 &
echo "☁️ Starting Cloudflare tunnel..."
sleep 8

# Extract the https:// URL from log
URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' cf.log | head -n 1)

if [ -n "$URL" ]; then
  echo ""
  echo "🌐 Your Public URL:"
  echo "👉 $URL"
  echo ""
else
  echo "⚠️ Could not detect Cloudflare URL yet. Try:"
  echo "grep 'trycloudflare.com' cf.log"
fi
