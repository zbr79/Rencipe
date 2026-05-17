
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath: string, folder: string = 'rencipe') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `rencipe/${folder}`,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete from Cloudinary: ${error}`);
  }
};

export const extractPublicIdFromUrl = (imageUrl: string): string | null => {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') return null;

    const match = imageUrl.match(/\/([^\/]+)\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match) {
      const folder = match[1];
      const publicId = match[2];
      return `${folder}/${publicId}`;
    }

    return null;
  } catch (error) {
    console.error(`Failed to extract public ID: ${error}`);
    return null;
  }
};
