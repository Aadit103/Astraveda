import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || 'dy3z83ftr').trim();
const API_KEY = (process.env.CLOUDINARY_API_KEY || '597934114987954').trim();
const API_SECRET = (process.env.CLOUDINARY_API_SECRET || 'bRvS0dFbSjnV-8QMy9i7XCF9x0M').trim();

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true
});

// Ensure local uploads directory exists as a robust fallback
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Uploads an image either to Cloudinary, or falls back to filesystem storage.
 * @param base64Data Base64 representation of the image file (e.g. data:image/png;base64,...)
 */
export async function uploadImage(base64Data: string): Promise<string> {
  try {
    if (!base64Data) {
      throw new Error('No base64 data provided');
    }

    // Try Cloudinary Upload
    const uploadResponse = await cloudinary.uploader.upload(base64Data, {
      folder: 'premium_marketplace',
      resource_type: 'image'
    });

    console.log('Successfully uploaded image to Cloudinary:', uploadResponse.secure_url);
    return uploadResponse.secure_url;
  } catch (error) {
    console.warn('Cloudinary upload unsuccessful. Saving to local storage backup:', error);

    // Fall back to saving locally on disk
    try {
      // Decode base64
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let extension = 'png';

      if (matches && matches.length === 3) {
        extension = matches[1].split('/')[1] || 'png';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        // Fallback or treat as plain base64
        buffer = Buffer.from(base64Data, 'base64');
      }

      const filename = `uploaded-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
      const localPath = path.join(UPLOADS_DIR, filename);

      fs.writeFileSync(localPath, buffer);
      const relativeUrl = `/uploads/${filename}`;
      console.log('Saved image locally as backup:', relativeUrl);
      return relativeUrl;
    } catch (fsError) {
      console.error('Failed to write local fallback image:', fsError);
      // Fallback fallback: Return a fine placeholder
      return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
    }
  }
}
