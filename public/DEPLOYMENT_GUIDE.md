# 🚀 Deployment Guide - Maa Samaleswari Restaurant Ledger

## ✅ Build & Deployment Ready

Your application is now ready to be deployed to any hosting service!

## 📦 What's Included

```
maa-samaleswari-restaurant-ledger/
├── server.js              # Backend server
├── package.json           # Dependencies & scripts
├── public/
│   ├── index.html         # Frontend UI
│   ├── app.js             # Application logic
│   └── styles.css         # Styling
└── data/                  # Auto-created on first run
    ├── customers.json     # Customer data
    └── settings.json      # Settings
```

## 🔨 Build Command

```bash
npm run build
```

This prepares your application for deployment. All files are already optimized and ready!

## 🌐 Deployment Options

### Option 1: Heroku (Recommended)

**Step 1: Install Heroku CLI**
```bash
# Download from: https://devcli.heroku.com/
```

**Step 2: Login to Heroku**
```bash
heroku login
```

**Step 3: Create Heroku App**
```bash
heroku create maa-samaleswari-ledger
```

**Step 4: Deploy**
```bash
git init
git add .
git commit -m "Initial deployment"
git push heroku master
```

**Step 5: Open App**
```bash
heroku open
```

**Cost:** Free tier available!

---

### Option 2: Render.com

**Step 1:** Go to https://render.com

**Step 2:** Sign up / Login

**Step 3:** Click "New +" → "Web Service"

**Step 4:** Connect your GitHub repository or upload files

**Step 5:** Configure:
- **Name:** maa-samaleswari-ledger
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Port:** 3000 (auto-detected)

**Step 6:** Click "Create Web Service"

**Cost:** Free tier available!

---

### Option 3: Railway.app

**Step 1:** Go to https://railway.app

**Step 2:** Sign up with GitHub

**Step 3:** Click "New Project" → "Deploy from GitHub"

**Step 4:** Select your repository

**Step 5:** Railway auto-detects and deploys!

**Cost:** Free $5 credit monthly!

---

### Option 4: Vercel (Serverless)

**Step 1:** Install Vercel CLI
```bash
npm install -g vercel
```

**Step 2:** Login
```bash
vercel login
```

**Step 3:** Deploy
```bash
vercel
```

**Step 4:** Follow prompts

**Cost:** Free tier available!

---

### Option 5: DigitalOcean App Platform

**Step 1:** Go to https://cloud.digitalocean.com

**Step 2:** Create account / Login

**Step 3:** Click "Create" → "Apps"

**Step 4:** Connect GitHub or upload

**Step 5:** Configure and deploy

**Cost:** $5/month

---

### Option 6: Your Own Server (VPS)

**Requirements:**
- Ubuntu/Linux server
- Node.js 14+
- Domain name (optional)

**Steps:**

1. **SSH to server**
```bash
ssh user@your-server-ip
```

2. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Upload files**
```bash
scp -r ./* user@your-server-ip:/var/www/ledger/
```

4. **Install dependencies**
```bash
cd /var/www/ledger
npm install
```

5. **Install PM2 (process manager)**
```bash
sudo npm install -g pm2
```

6. **Start application**
```bash
pm2 start server.js --name "ledger"
pm2 save
pm2 startup
```

7. **Setup Nginx (optional)**
```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/ledger`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ledger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📝 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All files are in project folder
- [ ] `npm install` runs without errors
- [ ] `npm start` works locally
- [ ] Test all features (add customer, transaction, backup, etc.)
- [ ] Change master password from default (KINGG123)
- [ ] Create backup of any existing data

## 🔐 Important: Environment Variables

For production, set these (if using cloud hosting):

```bash
PORT=3000
NODE_ENV=production
```

Most hosting services auto-detect these!

## 📱 SMS/WhatsApp Feature

The new SMS feature works on deployed sites:
- ✅ WhatsApp Web (works everywhere)
- ✅ SMS (works on mobile devices)
- ✅ Copy message (works everywhere)

No additional API keys needed!

## 🔄 Continuous Deployment

### With GitHub:

1. **Create GitHub repository**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ledger.git
git push -u origin main
```

2. **Connect to hosting service**
   - Most services (Vercel, Railway, Render) can auto-deploy from GitHub
   - Every `git push` triggers automatic deployment!

## 🌍 Custom Domain

### After deployment:

**Heroku:**
```bash
heroku domains:add www.your-domain.com
```

**Render/Railway:**
- Go to settings → Add custom domain
- Update DNS records as instructed

**Your Server:**
- Update Nginx config with your domain
- Get free SSL with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring

### PM2 (if using VPS):
```bash
pm2 monit          # Monitor in real-time
pm2 logs ledger    # View logs
pm2 restart ledger # Restart app
pm2 stop ledger    # Stop app
```

### Cloud Services:
- Most provide built-in monitoring
- Check logs in dashboard
- Set up alerts for downtime

## 🔒 Security for Production

1. **Change Master Password**
   - Settings → Change Master Password
   - Use strong password!

2. **Setup HTTPS**
   - All hosting services provide free SSL
   - Or use Let's Encrypt for VPS

3. **Regular Backups**
   - Enable auto-backup (daily at 2 AM)
   - Download manual backups regularly
   - Store in cloud (Google Drive)

4. **Keep Updated**
   - Update Node.js and dependencies
   - Monitor security advisories

## 💾 Data Persistence

### Important Notes:

**Free Hosting (Heroku, Render, Railway):**
- Files reset on restart
- Use their database add-ons OR
- Download backups frequently
- Data folder is temporary

**Paid Hosting / VPS:**
- Data persists in `data/` folder
- Still backup regularly!

### Solution: Regular Backups!
- Enable auto-backup feature
- Download backups to cloud storage
- Restore when needed

## 🎯 Post-Deployment

After successful deployment:

1. **Test Everything**
   - Add test customer
   - Create transaction
   - Test export
   - Test SMS feature
   - Test backup/restore

2. **Update Bookmarks**
   - Save your deployed URL
   - Share with team members

3. **Monitor**
   - Check logs regularly
   - Test daily for first week
   - Setup mobile bookmarks

## 🆘 Troubleshooting

### App won't start:
```bash
# Check logs
npm start

# Check port
lsof -i :3000

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Database issues:
```bash
# Check data folder exists
ls -la data/

# Check permissions
chmod 755 data/
```

### Can't access online:
- Check firewall settings
- Verify port 3000 is open
- Check hosting service status

## 📚 Additional Resources

- **Heroku Docs:** https://devcenter.heroku.com/
- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app/
- **Vercel Docs:** https://vercel.com/docs
- **PM2 Docs:** https://pm2.keymetrics.io/docs/

## ✅ Quick Deploy Commands

### For Git + Cloud Hosting:
```bash
# One-time setup
git init
git add .
git commit -m "Deploy Maa Samaleswari Ledger"

# Deploy to Heroku
heroku create
git push heroku master

# Deploy to Railway
railway init
railway up

# Deploy to Vercel
vercel
```

## 🎊 You're Ready!

Your Maa Samaleswari Restaurant Ledger is production-ready with:

- ✅ Professional UI
- ✅ Complete features
- ✅ SMS/WhatsApp support
- ✅ Backup system
- ✅ Security features
- ✅ Mobile responsive
- ✅ Ready to deploy!

**Choose your hosting service and deploy now!** 🚀

---

**Version:** 3.0 Professional Edition
**Status:** ✅ Production Ready
**Last Updated:** November 3, 2025

🍽️ **Maa Samaleswari Restaurant - Deploy with Confidence!** 🍽️
