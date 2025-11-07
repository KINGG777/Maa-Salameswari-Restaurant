nohup npm install > install.log 2>&1 && nohup npm start > app.log 2>&1 & sleep 8 && nohup cloudflared tunnel --url http://localhost:3000 > cf.log 2>&1 & sleep 5 && grep "trycloudflare.com" cf.log
