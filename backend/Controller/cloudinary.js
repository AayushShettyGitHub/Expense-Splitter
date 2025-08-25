const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageToCloudinary = async (file, folder = 'avatars') => {
  try {
    if (Buffer.isBuffer(file)) {
      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) {
              console.error('Cloudinary Buffer Upload Error:', error);
              return reject(new Error('Image upload failed'));
            }
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(file).pipe(uploadStream);
      });
    } else if (typeof file === 'string') {
      const result = await cloudinary.uploader.upload(file, { folder });
      return result.secure_url;
    } else {
      throw new Error('Invalid file type. Must be buffer or string path.');
    }
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Image upload failed');
  }
};

module.exports = { uploadImageToCloudinary };
