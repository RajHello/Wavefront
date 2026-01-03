let workTime = 25 * 60;
let breakTime = 5 * 60;
let timeLeft = workTime;
let timer = null;
let running = false;
let focusSeconds = 0;
let audio = null;

/* ELEMENTS */
const minEl = document.getElementById("min");
const secEl = document.getElementById("sec");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const workSlider = document.getElementById("workSlider");
const breakSlider = document.getElementById("breakSlider");
const workLabel = document.getElementById("workLabel");
const breakLabel = document.getElementById("breakLabel");
const focusToggle = document.getElementById("focusToggle");
const focusTimeEl = document.getElementById("focusTime");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const timerBox = document.getElementById("timerBox");

/* FUNCTIONS */
function updateDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  minEl.textContent = String(m).padStart(2, "0");
  secEl.textContent = String(s).padStart(2, "0");
}

function startTimer() {
  if (running) return;
  running = true;

  timer = setInterval(() => {
    timeLeft--;
    focusSeconds++;
    updateDisplay();
    focusTimeEl.textContent = Math.floor(focusSeconds / 60);

    if (timeLeft <= 0) {
      clearInterval(timer);
      running = false;
      startBtn.textContent = "Start";
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
  running = false;
  timeLeft = workTime;
  updateDisplay();
}

/* EVENTS */
startBtn.onclick = () => {
  if (running) {
    clearInterval(timer);
    running = false;
    startBtn.textContent = "Start";
  } else {
    startTimer();
    startBtn.textContent = "Pause";
  }
};

resetBtn.onclick = () => {
  resetTimer();
  startBtn.textContent = "Start";
};

workSlider.oninput = e => {
  workTime = e.target.value * 60;
  workLabel.textContent = e.target.value;
  resetTimer();
};

breakSlider.oninput = e => {
  breakTime = e.target.value * 60;
  breakLabel.textContent = e.target.value;
};

document.getElementById("musicBtn").onclick = () => {
  if (!audio) {
    audio = new Audio("music/lofi.mp3");
    audio.loop = true;
  }
  audio.paused ? audio.play() : audio.pause();
};

focusToggle.onchange = e => {
  workSlider.disabled = e.target.checked;
  breakSlider.disabled = e.target.checked;
};

fullscreenBtn.onclick = () => {
  if (!document.fullscreenElement) {
    timerBox.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

/* INIT */
updateDisplay();
