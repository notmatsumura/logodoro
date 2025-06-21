// タイマー設定
let workDuration = 25 * 60;
let breakDuration = 5 * 60;
let isRunning = false;
let isMuted = false;
let timer;
let timeLeft = workDuration;
let phase = "work";
let workCount = 0;
let totalMinutes = 0;

// 保存対象の現在の作業時間（分単位）
let currentWorkMinutes = 25;

// 音声
const sound = document.getElementById("notificationSound");

// HTML要素
const timerDisplay = document.getElementById("timer");
const phaseLabel = document.getElementById("phaseLabel");
const startPauseBtn = document.getElementById("startPauseBtn");
const workCountEl = document.getElementById("workCount");
const totalMinutesEl = document.getElementById("totalMinutes");

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

function switchPhase() {
  if (!isMuted) sound.play();

  if (phase === "work") {
    // ポモドーロ終了時、学習記録に保存
    const subject =
      document.getElementById("subjectInput").value || "ポモドーロ";
    saveToStudyLog(subject, currentWorkMinutes);

    phase = "break";
    timeLeft = breakDuration;
    document.body.classList.add("break");
    phaseLabel.textContent = "休憩中";
    startPauseBtn.textContent = "休憩中";
    workCount++;
    totalMinutes += currentWorkMinutes;
    workCountEl.textContent = workCount;
    totalMinutesEl.textContent = totalMinutes;
  } else {
    phase = "work";
    timeLeft = workDuration;
    document.body.classList.remove("break");
    phaseLabel.textContent = "作業中";
    startPauseBtn.textContent = "作業中";
  }

  updateDisplay();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startPauseBtn.textContent = "一時停止";
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      switchPhase();
      startTimer(); // 自動で次フェーズへ
    }
    updateDisplay();
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timer);
  startPauseBtn.textContent = "再開";
}

startPauseBtn.addEventListener("click", () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  pauseTimer();
  timeLeft = phase === "work" ? workDuration : breakDuration;
  updateDisplay();
  startPauseBtn.textContent = "スタート";
});

document.getElementById("testBtn").addEventListener("click", () => {
  timeLeft = 1;
  updateDisplay();
});

// 作業時間・休憩時間の調整
function updateDurations() {
  workDuration = currentWorkMinutes * 60;
  if (phase === "work") {
    timeLeft = workDuration;
    updateDisplay();
  }
}

document.getElementById("increaseWork").addEventListener("click", () => {
  currentWorkMinutes++;
  document.getElementById("workMinutes").textContent = currentWorkMinutes;
  updateDurations();
});

document.getElementById("decreaseWork").addEventListener("click", () => {
  if (currentWorkMinutes > 1) {
    currentWorkMinutes--;
    document.getElementById("workMinutes").textContent = currentWorkMinutes;
    updateDurations();
  }
});

document.getElementById("increaseBreak").addEventListener("click", () => {
  breakDuration += 60;
  document.getElementById("breakMinutes").textContent = breakDuration / 60;
  if (phase === "break") {
    timeLeft = breakDuration;
    updateDisplay();
  }
});

document.getElementById("decreaseBreak").addEventListener("click", () => {
  if (breakDuration > 60) {
    breakDuration -= 60;
    document.getElementById("breakMinutes").textContent = breakDuration / 60;
    if (phase === "break") {
      timeLeft = breakDuration;
      updateDisplay();
    }
  }
});

// ミュート切り替え
document.getElementById("muteToggle").addEventListener("click", () => {
  isMuted = !isMuted;
  document.getElementById("muteToggle").textContent = isMuted
    ? "ミュート中：🔇"
    : "ミュートする：🔈";
});

// ローカルストレージへ記録を保存
function saveToStudyLog(subject, minutes) {
  const now = new Date();
  const formattedDate = `${now.getMonth() + 1}/${now.getDate()}`;
  const entry = `${formattedDate} ${subject} を ${minutes}分 学習しました`;

  const saved = localStorage.getItem("studyLog");
  const records = saved ? JSON.parse(saved) : [];
  records.push(entry);
  localStorage.setItem("studyLog", JSON.stringify(records));
}

// 初期化
updateDisplay();
