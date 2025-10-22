const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { kv } = require('@vercel/kv');
const cors = require('cors'); // <-- YEH LINE ADD KAREIN

const app = express();
app.use(cors()); // <-- YEH LINE ADD KAREIN

// ... baaki ka server code ...storage for uploads

// --- Configure Cloudinary ---
// You need to get these credentials from your Cloudinary account
cloudinary.config({ 
  cloud_name: 'dublbe56c', 
  api_key: '839466264455988', 
  api_secret: 'cXFzWltEqU2zw_O8QSUjMDD0GzM' 
});

// --- API Endpoints ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to upload a new recording
app.post('/api/uploadRecording', upload.single('video'), async (req, res) => {
    try {
        const { timestamp } = req.body;
        const videoPath = req.file.path;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(videoPath, {
            resource_type: 'video',
            public_id: `ztype-recordings/recording-${timestamp}`,
        });

        // Save recording metadata to Vercel KV
        const recordingData = {
            timestamp: timestamp,
            url: result.secure_url,
            public_id: result.public_id
        };
        
        await kv.hset('recordings', { [timestamp]: JSON.stringify(recordingData) });

        res.status(200).json({ message: 'Upload successful', data: recordingData });
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        res.status(500).send('Server error during upload.');
    }
});

// Endpoint to get all recordings (for the admin panel)
app.get('/api/getRecordings', async (req, res) => {
    try {
        const recordings = await kv.hgetall('recordings');
        const recordingsArray = Object.values(recordings).map(rec => JSON.parse(rec));
        res.status(200).json(recordingsArray);
    } catch (error) {
        res.status(500).send('Error fetching recordings.');
    }
});

// Endpoint to delete a recording
app.post('/api/deleteRecording', async (req, res) => {
    try {
        const { timestamp } = req.body;
        const recordingStr = await kv.hget('recordings', timestamp);
        const recording = JSON.parse(recordingStr);

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(recording.public_id, { resource_type: 'video' });
        
        // Delete from Vercel KV
        await kv.hdel('recordings', timestamp);

        res.status(200).send('Recording deleted.');
    } catch (error) {
        res.status(500).send('Error deleting recording.');
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));