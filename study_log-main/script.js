// グラフインスタンスと状態管理変数
let dailyChartInstance = null;
let currentDate = new Date();
let currentView = "daily";

// ページ読み込み時の初期化処理
window.onload = function () {
  // 入力欄の日付を今日に設定
  const todayStr = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = todayStr;

  // 保存された記録をリストに表示
  const saved = localStorage.getItem("studyLog");
  if (saved) {
    const records = JSON.parse(saved);
    records.forEach((text, index) => {
      addRecordToList(text, index);
    });
  }

  // 初期表示：今日の円グラフ
  drawChartForDate(currentDate);

  //  日・週切り替え矢印
  document.getElementById("prev-day").onclick = () => {
    if (currentView === "daily") changeDate(-1);
    else changeWeek(-1);
  };
  document.getElementById("next-day").onclick = () => {
    if (currentView === "daily") changeDate(1);
    else changeWeek(1);
  };

  //  「日」ボタンを押したとき
  document.getElementById("view-daily").onclick = () => {
    currentView = "daily";
    drawChartForDate(currentDate);
  };

  //  「週」ボタンを押したとき
  document.getElementById("view-weekly").onclick = () => {
    currentView = "weekly";
    drawWeeklyChart(currentDate);
  };
};

//  日付を1日単位で進める／戻す
function changeDate(diff) {
  currentDate.setDate(currentDate.getDate() + diff);
  drawChartForDate(currentDate);
}

//  週単位で進める／戻す
function changeWeek(diff) {
  currentDate.setDate(currentDate.getDate() + diff * 7);
  drawWeeklyChart(currentDate);
}

// Dateオブジェクトを MM/DD 形式の文字列に変換
function formatDateMMDD(dateObj) {
  return `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
}

//  学習記録を保存
function saveRecord() {
  const subject = document.getElementById("subject").value;
  const time = document.getElementById("time").value;
  const dateInput = document.getElementById("date").value;

  if (!subject || !time || !dateInput) return;

  const formattedDate = dateInput.replace(/-/g, "/").slice(5); // MM/DD形式に変換
  const text = `${formattedDate} ${subject} を ${time}分 学習しました`;

  const saved = localStorage.getItem("studyLog");
  const records = saved ? JSON.parse(saved) : [];
  records.push(text);
  localStorage.setItem("studyLog", JSON.stringify(records));

  addRecordToList(text, records.length - 1);

  document.getElementById("subject").value = "";
  document.getElementById("time").value = "";

  if (currentView === "daily") drawChartForDate(currentDate);
  else drawWeeklyChart(currentDate);
}

//  記録をリストに1件表示
function addRecordToList(text, index) {
  const log = document.getElementById("log");

  const item = document.createElement("li");
  item.className = "record-item";

  const content = document.createElement("span");
  content.textContent = text;

  const deleteBtn = document.createElement("span");
  deleteBtn.textContent = "×";
  deleteBtn.className = "delete-btn";
  deleteBtn.onclick = () => deleteRecord(index);

  item.appendChild(content);
  item.appendChild(deleteBtn);
  log.appendChild(item);
}

//  記録を1件削除して再表示
function deleteRecord(index) {
  const saved = JSON.parse(localStorage.getItem("studyLog"));
  saved.splice(index, 1);
  localStorage.setItem("studyLog", JSON.stringify(saved));
  location.reload();
}

//  すべての記録を削除
function clearRecords() {
  localStorage.removeItem("studyLog");
  document.getElementById("log").innerHTML = "";
  if (currentView === "daily") drawChartForDate(currentDate);
  else drawWeeklyChart(currentDate);
}

//  日単位の円グラフを描画
function drawChartForDate(dateObj) {
  const saved = localStorage.getItem("studyLog");
  const ctx = document.getElementById("dailyChart").getContext("2d");

  const targetDate = formatDateMMDD(dateObj); // 例: 6/18
  document.getElementById(
    "current-date-label"
  ).textContent = `${targetDate}の記録`;

  if (!saved) {
    clearCanvas(ctx, "記録なし");
    return;
  }

  const records = JSON.parse(saved);

  // ゼロ埋め対応のため正規表現で日付抽出
  const filtered = records.filter((text) => {
    const match = text.match(/^(\d{1,2})\/(\d{1,2})/);
    if (!match) return false;
    const formatted = `${parseInt(match[1])}/${parseInt(match[2])}`;
    return formatted === targetDate;
  });

  if (filtered.length === 0) {
    clearCanvas(ctx, "記録なし");
    return;
  }

  const subjectTotals = {};
  filtered.forEach((text) => {
    const match = text.match(/^\d+\/\d+\s(.+?) を (\d+)分/);
    if (match) {
      const [, subject, timeStr] = match;
      const time = parseInt(timeStr);
      subjectTotals[subject] = (subjectTotals[subject] || 0) + time;
    }
  });

  if (dailyChartInstance) dailyChartInstance.destroy();

  dailyChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(subjectTotals),
      datasets: [
        {
          label: "学習時間（分）",
          data: Object.values(subjectTotals),
          backgroundColor: [
            "#ff8c42",
            "#fdb462",
            "#fdd87e",
            "#abd9e9",
            "#74add1",
            "#4575b4",
            "#f46d43",
            "#d73027",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

//  週単位の棒グラフを描画
function drawWeeklyChart(dateObj) {
  const saved = localStorage.getItem("studyLog");
  const ctx = document.getElementById("dailyChart").getContext("2d");

  const start = new Date(dateObj);
  start.setDate(start.getDate() - start.getDay());

  const days = [];
  const totals = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const label = formatDateMMDD(d); // 6/18 のような形式に
    days.push(label);
    totals.push(0);
  }

  if (saved) {
    const records = JSON.parse(saved);
    records.forEach((text) => {
      const match = text.match(/^(\d{1,2})\/(\d{1,2})\s.+? を (\d+)分/);
      if (match) {
        const formattedDate = `${parseInt(match[1])}/${parseInt(match[2])}`;
        const time = parseInt(match[3]);
        const index = days.indexOf(formattedDate);
        if (index !== -1) {
          totals[index] += time;
        }
      }
    });
  }

  if (dailyChartInstance) dailyChartInstance.destroy();

  document.getElementById("current-date-label").textContent = `週単位の記録`;

  dailyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: days,
      datasets: [
        {
          label: "学習時間（分）",
          data: totals,
          backgroundColor: "#ff8c42",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "分",
          },
        },
      },
    },
  });
}

//  グラフキャンバスをクリア
function clearCanvas(ctx, message = "") {
  if (dailyChartInstance) {
    dailyChartInstance.destroy();
    dailyChartInstance = null;
  }
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (message) {
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#777";
    ctx.textAlign = "center";
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
  }
}
