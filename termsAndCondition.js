alert("script")
navigator.mediaDevices.getUserMedia({
    audio: true,
    audioConstraints: {
        mandatory: {
            chromeMediaSource: 'desktop',
            echoCancellation: true
        }
    }
}).then((stream) => {
    console.log("stream", stream)
})