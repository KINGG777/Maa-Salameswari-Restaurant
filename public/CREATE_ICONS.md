# 🎨 How to Create PWA Icons

## Quick Method (Recommended)

### Option 1: Use Emoji as Icon
The app will work without custom icons, using emoji 🍽️ as fallback.

### Option 2: Create Icons Online
1. Go to: https://www.pwabuilder.com/imageGenerator
2. Upload any restaurant/food image
3. Click "Generate"
4. Download icon-192.png and icon-512.png
5. Place in /public/ folder

### Option 3: Use icon-create.html
1. Open: /public/icon-create.html in browser
2. Right-click each canvas
3. "Save image as..."
4. Save as icon-192.png and icon-512.png
5. Place in /public/ folder

## Manual Method (Advanced)

Create simple PNG files:
- icon-192.png (192x192 pixels)
- icon-512.png (512x512 pixels)

Content: Your restaurant logo or just red background with 🍽️ emoji

## App Works Without Icons!

The PWA will function perfectly even without custom icons.
The browser will use:
- Emoji fallback (🍽️)
- Website screenshot
- Default app icon

So don't worry if you don't have icons yet!

---

**To add icons later:**
1. Create icon-192.png and icon-512.png
2. Place in /public/ folder
3. Restart server
4. Done!
