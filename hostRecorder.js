
var worker = new Worker('wavWorker.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === "START_CAPTURE") {
        startRecordingHost()
    }
});


const startRecordingHost = () => {
    navigator.mediaDevices.getUserMedia({
        audio: true,
        audioConstraints: {
            mandatory: {
                chromeMediaSource: 'desktop',
                echoCancellation: true
            }
        }
    }).then((stream) => {
        const liveStream = stream;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        let mediaRecorder = new HostRecorder(source); //initiates the recorder based on the current stream
        mediaRecorder.startRecording();
        chrome.runtime.onMessage.addListener((request) => {
            if (request === "STOP_CAPTURE") {
                stopCapture();
            }
        });

        const stopCapture = () => {
            mediaRecorder.finishRecording();
            audioCtx.close();
            liveStream.getAudioTracks()[0].stop();
        }

    }).catch((error) => {
        console.log(error)
    })
}


class HostRecorder {
    constructor(source) {
        this.context = source.context;
        if (this.context.createScriptProcessor == null) {
            this.context.createScriptProcessor = this.context.createJavaScriptNode;
        }
        this.input = this.context.createGain();
        source.connect(this.input);
        this.buffer = [];
    }

    isRecording() {
        return this.processor != null;
    }

    startRecording() {
        if (!this.isRecording()) {
            let buffer = this.buffer;
            this.processor = this.context.createScriptProcessor(
                1024, 2,
                2);
            this.input.connect(this.processor);
            this.processor.connect(this.context.destination);
            this.processor.onaudioprocess = function (event) {
                for (var ch = 0; ch < 2; ++ch) {
                    buffer[ch] = event.inputBuffer.getChannelData(ch);
                }
                worker.postMessage({ command: "RECORD_HOST_AUDIO", buffer: buffer });
            };
        }
    }


    finishRecording() {
        if (this.isRecording()) {
            this.input.disconnect();
            this.processor.disconnect();
            delete this.processor;
        }
        worker.postMessage({ command: "ENCODE_HOST_AUDIO" });
        worker.onmessage = function (event) {
            let data = event.data;
            if (data.command == "ENCODE_COMPLETE") {
                let audioURL = window.URL.createObjectURL(data.blob);
                const currentDate = new Date(Date.now()).toDateString();
                chrome.downloads.download({ url: audioURL, filename: `${currentDate}.wav`, saveAs: true });
            }
        }
    }
}
