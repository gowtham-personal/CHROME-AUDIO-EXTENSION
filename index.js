'use strict';
document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('start');
  const finishButton = document.getElementById('finish');
  startButton.onclick = () => {
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
      chrome.runtime.sendMessage("START_CAPTURE")
    }).catch((error) => {
      chrome.tabs.create({ url: "termsAndCondition.html" }, (tab) => { });
    })
  };
  finishButton.onclick = () => {
    chrome.runtime.sendMessage("STOP_CAPTURE")
  };
})

// "background": {
//   "scripts": [
//         "participantRecorder.js",
// "hostRecorder.js",
//   ],
//   "persistent": true
// },

// "content_scripts": [
//   {
//     "matches": [
//       "<all_urls>"
//     ],
//     "js": [
//       "mediaAccessContentScript.js"
//     ]
//   }
// ],

