// api/upload.js
const cloudinary = require('cloudinary').v2;
const stream = require('stream');

// Cloudinary config Vercel Environment Variables se aayega
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'video' },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary Error:', error);
                    res.status(500).json({ error: 'Upload failed' });
                    return reject();
                }
                res.status(200).json({ url: result.secure_url });
                return resolve();
            }
        );

        req.pipe(uploadStream);
    });
}