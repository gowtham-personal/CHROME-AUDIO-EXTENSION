importScripts("/lib/wavEncoder.js");

let encoder = undefined
let hostBuffers = [];
let participantBuffer = [];
let blobArray = [];

self.onmessage = function (event) {
    let data = event.data;
    switch (data.command) {
        case "ENCODE_HOST_AUDIO": encodeHostAudio(); break;
        case "ENCODE_PARTICIPANT_AUDIO": encodeParticipantAudio(); break;
        case "RECORD_HOST_AUDIO": recordHostAudio(data.buffer); break
        case "RECORD_PARTICIPANT_AUDIO": recordParticipantAudio(data.buffer); break
        case "cancel": cleanup();
    }
};

const recordHostAudio = (buffer) => {
    hostBuffers.push(buffer)
    console.log("hostBuffers", hostBuffers)
}
const recordParticipantAudio = (buffer) => {
    participantBuffer.push(buffer)
    console.log("participantBuffer", participantBuffer)
}

const encodeHostAudio = () => {
    encoder = new WavAudioEncoder(44100, 2);
    while (hostBuffers.length > 0) {
        encoder.encode(hostBuffers.shift());
    }
    let blob = encoder.finish("audio/wav")
    finalBlob(blob)
}

const encodeParticipantAudio = () => {
    encoder = new WavAudioEncoder(44100, 2);
    while (hostBuffers.length > 0) {
        encoder.encode(hostBuffers.shift());
    }
    let blob = encoder.finish("audio/wav")
    finalBlob(blob)
}


const finalBlob = (blob) => {
    console.log("blob", blob)
    blobArray.push(blob)
    if (blobArray.length == 2) {
        ConcatenateBlobs(blobArray, 'audio/wav', function (resultingBlob) {
            console.log(resultingBlob, "resultingBlob")
            self.postMessage({
                command: "ENCODE_COMPLETE",
                blob: resultingBlob
            });
        })
    }
}



function ConcatenateBlobs(blobs, type, callback) {
    var buffers = [];

    var index = 0;

    function readAsArrayBuffer() {
        if (!blobs[index]) {
            return concatenateBuffers();
        }
        var reader = new FileReader();
        reader.onload = function (event) {
            buffers.push(event.target.result);
            index++;
            readAsArrayBuffer();
        };
        reader.readAsArrayBuffer(blobs[index]);
    }

    readAsArrayBuffer();

    function concatenateBuffers() {
        var byteLength = 0;
        buffers.forEach(function (buffer) {
            byteLength += buffer.byteLength;
        });

        var tmp = new Uint16Array(byteLength);
        var lastOffset = 0;
        buffers.forEach(function (buffer) {
            // BYTES_PER_ELEMENT == 2 for Uint16Array
            var reusableByteLength = buffer.byteLength;
            if (reusableByteLength % 2 != 0) {
                buffer = buffer.slice(0, reusableByteLength - 1)
            }
            tmp.set(new Uint16Array(buffer), lastOffset);
            lastOffset += reusableByteLength;
        });

        var blob = new Blob([tmp.buffer], {
            type: type
        });

        callback(blob);
    }
}