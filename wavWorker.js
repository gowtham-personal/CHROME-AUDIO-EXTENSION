importScripts("/lib/wavEncoder.js");

let encoder = undefined
let recBuffers = []

self.onmessage = function (event) {
    let data = event.data;
    switch (data.command) {
        case "ENCODE_AUDIO": encodeAudio(data.recBuffers); break;
        case "RECORD_AUDIO": recordAudio(data.buffer); break
        case "cancel": cleanup();
    }
};

const recordAudio = (buffer) => {
    console.log("record", buffer)
    recBuffers.push(buffer)
}

const encodeAudio = () => {
    encoder = new WavAudioEncoder(44100, 2);
    while (recBuffers.length > 0) {
        encoder.encode(recBuffers.shift());
    }
    let blob = encoder.finish("audio/wav")
    console.log("blob", blob)
    self.postMessage({
        command: "ENCODE_COMPLETE",
        blob
    });
}