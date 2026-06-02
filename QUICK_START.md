# Quick Start Guide - Image Upload Feature

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up Cloudinary (2 minutes)

1. Go to [Cloudinary.com](https://cloudinary.com/) and sign up for a **FREE** account
2. After login, you'll see your **Dashboard**
3. Copy these three values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 2: Configure Environment (30 seconds)

Open your `.env` file and replace the placeholder values:

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name_here
CLOUDINARY_API_KEY=your_actual_api_key_here
CLOUDINARY_API_SECRET=your_actual_api_secret_here
```

### Step 3: Restart Server (10 seconds)

```bash
npm run dev
```

### Step 4: Test the Feature (2 minutes)

#### Option A: Use the HTML Test Tool (Easiest)
1. Open `test-product-upload.html` in your browser
2. Add your admin Bearer token
3. Select some test images
4. Click "Create Product"
5. Done! ✅

#### Option B: Use Postman
1. Create POST request: `http://localhost:3000/api/products`
2. Authorization → Bearer Token → Paste your admin token
3. Body → form-data
4. Add these fields:

| KEY | TYPE | VALUE |
|-----|------|-------|
| name | Text | Organic Tomatoes |
| description | Text | Fresh organic tomatoes |
| category | Text | Vegetables |
| price | Text | 50 |
| images | File | Select image file(s) |

5. Send → Done! ✅

## 📝 What Changed?

### Before
```javascript
// Old way - sending URL strings
{
  "name": "Product",
  "images": ["http://url1.com/image.jpg"]
}
```

### After
```javascript
// New way - sending actual files
FormData:
  - name: "Product"
  - images: [File]  // Real image file
```

## 🎯 Quick Examples

### cURL Example
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Organic Tomatoes" \
  -F "description=Fresh tomatoes" \
  -F "category=Vegetables" \
  -F "price=50" \
  -F "images=@/path/to/your/image.jpg"
```

### JavaScript Example
```javascript
const formData = new FormData();
formData.append('name', 'Organic Tomatoes');
formData.append('description', 'Fresh tomatoes');
formData.append('category', 'Vegetables');
formData.append('price', 50);
formData.append('images', fileInput.files[0]);

fetch('http://localhost:3000/api/products', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

## ✅ Success Response

```json
{
  "success": true,
  "product": {
    "name": "Organic Tomatoes",
    "description": "Fresh tomatoes",
    "category": "Vegetables",
    "price": 50,
    "images": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567890/kuppam-products/abc123.jpg"
    ],
    "_id": "60a7c8d9e4b0c8f5d8e9f0a1",
    "createdAt": "2026-06-02T10:30:00.000Z"
  }
}
```

## 🎨 Supported Image Formats

✅ JPEG / JPG  
✅ PNG  
✅ WEBP  
✅ GIF  

## 📏 Limits

- **File Size:** 5MB per image
- **File Count:** 10 images per request
- **Image Dimensions:** Auto-resized to 1000x1000px max

## 🔧 Troubleshooting

### Problem: "Cloudinary credentials not found"
**Solution:** Make sure you updated the `.env` file with your actual Cloudinary credentials (not the placeholder values)

### Problem: "Only image files are allowed"
**Solution:** Only upload JPEG, PNG, GIF, or WEBP files

### Problem: "File size too large"
**Solution:** Compress your images to be under 5MB each

### Problem: "401 Unauthorized"
**Solution:** Make sure you're using a valid admin Bearer token

## 📚 Need More Help?

- **Detailed Setup:** Read `CLOUDINARY_SETUP.md`
- **Implementation Details:** Read `IMPLEMENTATION_SUMMARY.md`
- **Architecture:** Read `IMAGE_UPLOAD_FLOW.md`

## 🎉 That's It!

You're now ready to upload product images directly to Cloudinary! The images will be automatically:
- ✅ Uploaded to secure cloud storage
- ✅ Optimized and compressed
- ✅ Resized to appropriate dimensions
- ✅ Served via fast CDN
- ✅ Stored as HTTPS URLs in your database

Happy coding! 🚀
