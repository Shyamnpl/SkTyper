const videoElement = document.getElementById('camera-preview');
const recordingIndicator = document.getElementById('recording-indicator');

let mediaRecorder;
let recordedChunks = [];
let mediaStream = null; // Stream ko global variable mein store karenge

async function setupCamera() {
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
        return null;
    }
}

async function startRecording() {
    console.log("Recording start karne ka function call hua.");
    const stream = await setupCamera();
    if (!stream) {
        console.error("Stream na milne ke kaaran recording start nahi hui.");
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
            }
        };

        mediaRecorder.onstop = () => {
            console.log('MediaRecorder stop ho gaya. Uploading...');
            recordingIndicator.classList.add('hidden');
            uploadRecording();
            
            // YEH ZAROORI HAI: Stream ke sabhi tracks ko band karein
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null; // Stream ko reset karein
                videoElement.srcObject = null; // Video element se bhi hata dein
                videoElement.classList.add('hidden');
                console.log("Camera stream band kar diya gaya hai.");
            }
        };

        mediaRecorder.start();
    } catch (error) {
        console.error("MediaRecorder initialize nahi ho paya:", error);
    }
}

function stopRecording() {
    console.log("stopRecording function call hua.");
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    } else {
        console.warn("stopRecording call hua, lekin recorder recording state mein nahi tha.");
    }
}

async function uploadRecording() {
    // ... (Yeh function waisa hi rahega jaisa pichle jawab mein tha) ...
    if (recordedChunks.length === 0) {
        console.warn("Upload karne ke liye koi data nahi hai.");
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
            console.error('Upload fail:', await response.text());
        }
    } catch (error) {
        console.error('Upload mein network error:', error);
    }
}