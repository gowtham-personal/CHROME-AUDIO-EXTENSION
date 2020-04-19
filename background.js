
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === "startCapture") {
        startAudioContextCapture();
    }
});
let recLength = 0
let recBuffers = []
let buffers = []
var worker = new Worker('wavWorker.js');


const startAudioContextCapture = () => {
    chrome.tabCapture.capture({ audio: true }, (stream) => { // sets up stream for capture
        let startTabId; //tab when the capture is started
        let completeTabID; //tab when the capture is stopped
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => startTabId = tabs[0].id) //saves start tab
        const liveStream = stream;
        let audio = new Audio();
        audio.srcObject = liveStream;
        audio.play();
        const audioCtx = new AudioContext();
        console.log("audioCtx", audioCtx)
        const source = audioCtx.createMediaStreamSource(stream);
        let mediaRecorder = new Recorder(source); //initiates the recorder based on the current stream
        mediaRecorder.startRecording();
        chrome.runtime.onMessage.addListener((request) => {
            if (request === "stopCapture") {
                stopCapture();
            }
        });

        const stopCapture = function () {
            let endTabId;
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                endTabId = tabs[0].id;
                if (mediaRecorder && startTabId === endTabId) {
                    mediaRecorder.finishRecording();
                }
            })
            audioCtx.close();
            liveStream.getAudioTracks()[0].stop();
        }
    })



}


class Recorder {
    constructor(source) {
        this.context = source.context;
        if (this.context.createScriptProcessor == null) {
            this.context.createScriptProcessor = this.context.createJavaScriptNode;
        }
        this.input = this.context.createGain();
        source.connect(this.input);
        this.buffer = [];
        console.log("constructor")
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
                console.log("buffer[ch]", buffer)
                worker.postMessage({ command: "RECORD_AUDIO", buffer: buffer });
                // recBuffers.push(buffer)
            };
        }
    }


    finishRecording() {
        if (this.isRecording()) {
            this.input.disconnect();
            this.processor.disconnect();
            delete this.processor;
        }
        if (recBuffers) {
            worker.postMessage({ command: "ENCODE_AUDIO" });
        }
        worker.onmessage = function (event) {
            let data = event.data;
            if (data.command == "ENCODE_COMPLETE") {
                let audioURL = window.URL.createObjectURL(data.blob);
                console.log("audioURL", audioURL)
                const currentDate = new Date(Date.now()).toDateString();
                chrome.downloads.download({ url: audioURL, filename: `${currentDate}.wav`, saveAs: true });
            }
        }
    }
}
