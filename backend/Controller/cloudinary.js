const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageToCloudinary = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'avatars',
    });
    return result.secure_url;  
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Image upload failed');
  }
};

module.exports = { uploadImageToCloudinary };
