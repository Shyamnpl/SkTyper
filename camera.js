// camera.js

// HTML elements ko select karna
const videoElement = document.getElementById('camera-preview');
const recordingIndicator = document.getElementById('recording-indicator');

let mediaRecorder;
let recordedChunks = [];

/**
 * Camera access karne aur video element mein stream dikhane ka function.
 */
async function setupCamera() {
    try {
        // Front camera (user-facing) access karna
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: true 
        });
        videoElement.srcObject = stream;
        videoElement.classList.remove('hidden'); // Camera feed dikhana
        return stream;
    } catch (error) {
        console.error("Camera access mein error:", error);
        alert("Camera access nahi ho paya. Please permission check karein.");
        return null;
    }
}

/**
 * Recording start karne ka function.
 */
async function startRecording() {
    // Pehle se chal rahi recording ko rokein agar hai toh
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    
    const stream = await setupCamera();
    if (!stream) {
        console.log("Camera stream na milne ke kaaran recording start nahi hui.");
        return;
    }

    recordedChunks = []; // Purane chunks saaf karna
    
    // MediaRecorder ko initialize karna
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    // Jab data available ho, use chunks array mein store karna
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    // Jab recording start ho, indicator dikhana
    mediaRecorder.onstart = () => {
        recordingIndicator.classList.remove('hidden');
        console.log('Recording shuru ho gayi hai...');
    };

    // Jab recording stop ho, indicator hide karna aur video upload karna
    mediaRecorder.onstop = () => {
        recordingIndicator.classList.add('hidden');
        videoElement.classList.add('hidden'); // Camera feed bhi hide kar dein
        console.log('Recording band. Ab upload ho rahi hai...');
        uploadRecording();
    };

    mediaRecorder.start();
}

/**
 * Recording stop karne ka function.
 */
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

/**
 * Record ki gayi video ko server par upload karne ka function.
 */
async function uploadRecording() {
    if (recordedChunks.length === 0) {
        console.log("Upload karne ke liye koi recording data nahi hai.");
        return;
    }

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const timestamp = new Date().toISOString();
    
    const formData = new FormData();
    formData.append('video', blob, `recording-${timestamp}.webm`);
    formData.append('timestamp', timestamp);

    try {
        // Server ke upload endpoint par POST request bhejna
        const response = await fetch('/api/uploadRecording', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            console.log('Recording safaltapoorvak upload ho gayi!');
        } else {
            console.error('Upload fail ho gaya:', await response.text());
        }
    } catch (error) {
        console.error('Recording upload mein error:', error);
    }
}