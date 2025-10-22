// camera.js (Updated Version)

const videoElement = document.getElementById('camera-preview');
const recordingIndicator = document.getElementById('recording-indicator');

let mediaRecorder;
let recordedChunks = [];
let mediaStream = null; // Stream ko store karne ke liye

/**
 * Camera access karna.
 */
async function setupCamera() {
    // Agar stream pehle se hai, to use hi istemal karein
    if (mediaStream && mediaStream.active) {
        return mediaStream;
    }

    console.log("Camera access karne ki koshish...");
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: true 
        });
        videoElement.srcObject = mediaStream;
        videoElement.classList.remove('hidden');
        console.log("Camera access safal!");
        return mediaStream;
    } catch (error) {
        console.error("Camera access mein error:", error.name, error.message);
        // Alert ko hata diya hai, ab error console mein dikhega.
        // Yeh 'Permission Denied' wale alert ko rokega agar user ne permission di hai.
        return null;
    }
}

/**
 * Recording start karna.
 */
async function startRecording() {
    console.log("Recording start karne ka function call hua.");
    const stream = await setupCamera();
    
    if (!stream) {
        console.error("Camera stream na milne ke kaaran recording start nahi hui.");
        return;
    }

    recordedChunks = [];
    
    try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        mediaRecorder.onstart = () => {
            recordingIndicator.classList.remove('hidden');
            console.log('Recording shuru ho gayi hai...');
        };

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
                console.log("Recording data chunk receive hua:", event.data.size, "bytes");
            }
        };

        mediaRecorder.onstop = () => {
            recordingIndicator.classList.add('hidden');
            console.log('Recording band. Ab upload ho rahi hai...');
            uploadRecording();
            
            // Stream ke sabhi tracks ko band kar dein taaki camera light off ho jaye
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null; // Stream ko clear karein
                videoElement.classList.add('hidden');
            }
        };
        
        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder Error:', event.error);
        };

        mediaRecorder.start();
    } catch (error) {
        console.error("MediaRecorder initialize nahi ho paya:", error);
    }
}

/**
 * Recording stop karna.
 */
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        console.log("Recording stop karne ka function call hua.");
        mediaRecorder.stop();
    }
}

/**
 * Video ko server par upload karna.
 */
async function uploadRecording() {
    if (recordedChunks.length === 0) {
        console.warn("Upload karne ke liye koi recording data nahi hai. Ho sakta hai recording bahut choti thi.");
        return;
    }

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const timestamp = new Date().toISOString();
    
    console.log("Blob banaya gaya, size:", blob.size, "bytes. Server par upload kiya ja raha hai...");

    const formData = new FormData();
    formData.append('video', blob, `recording-${timestamp}.webm`);
    formData.append('timestamp', timestamp);

    try {
        const response = await fetch('/api/uploadRecording', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            console.log('Recording safaltapoorvak upload ho gayi!');
        } else {
            const errorText = await response.text();
            console.error('Upload fail ho gaya:', response.status, errorText);
        }
    } catch (error) {
        console.error('Recording upload mein network error:', error);
    }
}