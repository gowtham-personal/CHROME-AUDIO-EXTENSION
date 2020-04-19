'use strict';
document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('start');
  const finishButton = document.getElementById('finish');
  startButton.onclick = () => {
    chrome.runtime.sendMessage("startCapture")
  };
  finishButton.onclick = () => {
    chrome.runtime.sendMessage("stopCapture")
  };
})
