/* ===== DANH SÁCH BÀI HỌC (dùng chung cho index.html, english.html, math.html) =====
   Thêm bài mới: thêm 1 dòng vào VH_LESSONS.
   subject: "english" | "math"
   unit/title/desc/icon/color: hiển thị trên trang danh sách bài
   file: trang game của bài
   saveKey: khoá localStorage mà game lưu điểm ({stars:{<idTrò>: số sao}})
   games: số trò chơi trong bài (mỗi trò tối đa 3 sao) — trò "hoàn thành" khi đạt ≥ 1 sao */
window.VH_LESSONS = [
  { subject: "english", unit: 5, title: "Theme Park", desc: "Nghề nghiệp, nơi ở, quốc tịch · was/were",
    icon: "🎡", color: "#ff5a5f", file: "unit5.html", saveKey: "u5park.v1", games: 7 },
  { subject: "english", unit: 6, title: "My School", desc: "Phòng học, chỉ đường, lớp tiếng Anh · Where is…?",
    icon: "🏫", color: "#2f80ed", file: "unit6.html", saveKey: "u6school.v1", games: 9 },
  // { subject: "math", unit: 1, title: "xyz", desc: "…", icon: "➕", color: "#2f80ed", file: "math1.html", saveKey: "m1.v1", games: 5 },
];

/* Tiến độ 1 bài: { done: số trò đã có sao, total, stars, maxStars } */
window.VH_progress = function (lesson) {
  var stars = {}, total = lesson.games || 0;
  try {
    var s = JSON.parse(localStorage.getItem(lesson.saveKey) || "null");
    if (s && s.stars) stars = s.stars;
  } catch (e) {}
  var done = 0, sum = 0;
  for (var k in stars) {
    var v = +stars[k] || 0;
    if (v > 0) done++;
    sum += v;
  }
  return { done: Math.min(done, total), total: total, stars: sum, maxStars: total * 3 };
};

/* Báo tiến độ tất cả bài cho app Android (để hiện chấm báo trên avatar) */
window.VH_reportAll = function () {
  try {
    if (!window.AndroidApp || typeof AndroidApp.reportProgress !== "function") return;
    window.VH_LESSONS.forEach(function (l) {
      var p = window.VH_progress(l);
      AndroidApp.reportProgress(l.saveKey, p.done, p.total);
    });
  } catch (e) {}
};
window.VH_reportAll();

/* ===== BẢNG XẾP HẠNG =====
   Dán đường link Ứng dụng web (Google Apps Script, kết thúc bằng /exec) vào giữa hai dấu "" */
window.VH_LEADERBOARD_URL = "https://script.google.com/macros/s/AKfycbwnqyJ2q-vdbgmswwKLqzAJeA0zdGU3fH5qYunxAvSH-F3n-dO4pCm-my-6-1gUBz05/exec";

/* Tổng sao của bé ở tất cả bài học */
window.VH_totalStars = function () {
  return window.VH_LESSONS.reduce(function (s, l) { return s + window.VH_progress(l).stars; }, 0);
};
/* Mã ngẫu nhiên của máy này (để cập nhật đúng dòng của bé, không tạo trùng) */
window.VH_deviceId = function () {
  try {
    var id = localStorage.getItem("vh.id");
    if (!id) {
      id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("vh.id", id);
    }
    return id;
  } catch (e) { return ""; }
};
/* Tên bé (nhập trong app Android); trên trình duyệt không có tên → chỉ xem bảng */
window.VH_myName = function () {
  try { return (window.AndroidApp && AndroidApp.getName && AndroidApp.getName()) || ""; } catch (e) { return ""; }
};
window.VH_myAvatar = function () {
  try { return (window.AndroidApp && AndroidApp.getAvatar && AndroidApp.getAvatar()) || ""; } catch (e) { return ""; }
};
/* Gửi tổng sao lên bảng xếp hạng (chỉ gửi khi tên/sao thay đổi, trừ khi force) */
window.VH_submitScore = function (force) {
  var url = window.VH_LEADERBOARD_URL, name = window.VH_myName(), id = window.VH_deviceId();
  if (!url || !name || !id || !window.fetch) return Promise.resolve(null);
  var stars = window.VH_totalStars(), avatar = window.VH_myAvatar();
  var sig = name + "|" + stars + "|" + avatar;
  try { if (!force && localStorage.getItem("vh.sent") === sig) return Promise.resolve(null); } catch (e) {}
  var q = "action=submit&id=" + encodeURIComponent(id) + "&name=" + encodeURIComponent(name) +
          "&stars=" + stars + "&avatar=" + encodeURIComponent(avatar);
  return fetch(url + (url.indexOf("?") < 0 ? "?" : "&") + q)
    .then(function (r) { return r.json(); })
    .then(function (j) { if (j && j.ok) { try { localStorage.setItem("vh.sent", sig); } catch (e) {} } return j; })
    .catch(function () { return null; });
};
/* Lấy danh sách xếp hạng */
window.VH_fetchLeaderboard = function () {
  var url = window.VH_LEADERBOARD_URL;
  if (!url || !window.fetch) return Promise.reject(new Error("no-url"));
  return fetch(url + (url.indexOf("?") < 0 ? "?" : "&") + "action=list").then(function (r) { return r.json(); });
};
// Tự gửi điểm mỗi khi mở trang chọn môn / danh sách bài (nếu có thay đổi)
window.VH_submitScore();
