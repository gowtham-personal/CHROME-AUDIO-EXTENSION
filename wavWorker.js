importScripts("/lib/wavEncoder.js");

let encoder = undefined
let recorderBuffer = [];

self.onmessage = function (event) {
    let data = event.data;
    switch (data.command) {
        case "ENCODE_AUDIO": encodeAudio(); break;
        case "RECORD_AUDIO": recordAudio(data.buffer); break
        case "cancel": cleanup();
    }
};

const recordAudio = (buffer) => {
    recorderBuffer.push(buffer)
    console.log("recorderBuffer", recorderBuffer)
}

const encodeAudio = () => {
    encoder = new WavAudioEncoder(44100, 2);
    while (recorderBuffer.length > 0) {
        encoder.encode(recorderBuffer.shift());
    }
    let blob = encoder.finish("audio/wav")
    self.postMessage({
        command: "ENCODE_COMPLETE",
        blob
    });
}


