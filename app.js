(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let data, core, selectedWeek, lastDate;
  function text(id, value) { $(id).textContent = value; }
  function courseMeta(c, separator) { return [c.room, c.teacher].filter(Boolean).map(esc).join(separator); }
  function fullStamp(value) {
    return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
  }
  function tags(c, status) {
    return `<div class="course-tags">${c.kind ? `<span class="tag">${esc(c.kind)}</span>` : ""}${c.adjusted ? '<span class="tag adjusted">已调整</span>' : ""}${status === "current" ? `<span class="tag live">${c.isStudy ? "自习中" : "进行中"}</span>` : ""}</div>`;
  }
  function courseRow(c, now, compact) {
    const isToday = now && c.date === now.date;
    const past = isToday && core.minutes(c.end) <= now.minute;
    const current = isToday && core.minutes(c.start) <= now.minute && now.minute < core.minutes(c.end);
    return `<article class="course-row${c.isStudy ? " is-study" : ""}${past ? " is-past" : ""}${current ? " is-current" : ""}"><div class="course-time"><time datetime="${esc(c.date)}T${esc(c.start)}:00+08:00">${esc(c.start)}</time><time class="end-time" datetime="${esc(c.date)}T${esc(c.end)}:00+08:00">– ${esc(c.end)}</time></div><div class="course-info"><h3>${esc(c.name)}</h3>${c.room || c.teacher ? `<p class="course-meta">${courseMeta(c, " · ")}</p>` : ""}${c.note ? `<p class="course-note">${esc(c.note)}</p>` : ""}${tags(c, current ? "current" : "")}</div></article>`;
  }
  function emptyMarkup(published) {
    return published ? '<div class="empty-state"><strong>这一天没有课程安排</strong>好好安排你的自由时间。</div>' : '<div class="empty-state"><strong>课表尚未发布</strong>请向学习委员确认，不能据此判断为无课。</div>';
  }
  function dayList(id, date, now) {
    const day = core.coursesFor(data, date);
    $(id + "-courses").innerHTML = day.courses.length ? day.courses.map(c => courseRow(c, now, id === "tomorrow")).join("") : emptyMarkup(day.published);
    text(id + "-date", core.shortDate(date) + " " + core.dayName(date));
    text(id + "-count", day.published ? `${day.courses.length} 项安排` : "待发布");
    return day;
  }
  function renderNext(now, state) {
    const c = state.current || core.findNext(data, now);
    if (!c) {
      text("next-label", "UP NEXT · 后续安排");
      text("next-title", "暂无后续已发布安排");
      text("next-date", "请留意学习委员更新课表。");
      $("next-detail").innerHTML = "";
      text("next-footer", "未发布的日期不代表没有课程。");
      return;
    }
    text("next-label", state.current ? (c.isStudy ? "RIGHT NOW · 正在" + c.name : "RIGHT NOW · 正在上课") : (c.isStudy ? "UP NEXT · 下一次安排" : "UP NEXT · 下一节课"));
    text("next-title", c.name);
    const relativeDate = c.date === now.date ? "今天" : c.date === core.addDays(now.date, 1) ? "明天" : core.shortDate(c.date);
    text("next-date", relativeDate + " · " + core.dayName(c.date) + (c.adjusted ? " · 已调整" : ""));
    $("next-detail").innerHTML = `<p class="next-detail-time">${esc(c.start)} <span aria-hidden="true">–</span> ${esc(c.end)}</p>${c.room || c.teacher ? `<p class="next-meta">${courseMeta(c, " · ")}</p>` : ""}${c.note ? `<p class="next-meta">${esc(c.note)}</p>` : ""}`;
    const gap = core.minutes(c.start) - now.minute;
    text("next-footer", state.current ? `距结束还有 ${core.minutes(c.end) - now.minute} 分钟` : c.date === now.date ? `当前空闲 · 距开始还有 ${gap >= 60 ? Math.floor(gap / 60) + " 小时" + (gap % 60 ? " " + gap % 60 + " 分钟" : "") : gap + " 分钟"}` : `今天${state.type === "unpublished" ? "课表未发布" : "没有后续安排"} · 下一次安排在${relativeDate}`);
  }
  function buildWeekSelect(now) {
    const current = core.weekOf(data, now.date);
    let options = "";
    for (let w = data.term.firstPublishedWeek; w <= data.term.lastPublishedWeek; w++) options += `<option value="${w}">第 ${w} 周${w === current ? " · 本周" : ""}</option>`;
    if (current < data.term.firstPublishedWeek || current > data.term.lastPublishedWeek) options += `<option value="${current}">本周 · 未发布</option>`;
    $("week-select").innerHTML = options;
  }
  function weekCourse(c) {
    return `<article class="week-course${c.isStudy ? " is-study" : ""}"><p class="week-course-time">${esc(c.start)}–${esc(c.end)}</p><h3>${esc(c.name)}</h3>${c.room || c.teacher || c.note ? `<p class="week-course-meta">${[courseMeta(c, "<br>"), esc(c.note)].filter(Boolean).join("<br>")}</p>` : ""}${c.adjusted ? '<span class="tag adjusted">已调整</span>' : ""}</article>`;
  }
  function renderWeek(now) {
    const currentWeek = core.weekOf(data, now.date);
    const isCurrent = selectedWeek === currentWeek;
    const monday = core.weekMonday(data, selectedWeek);
    const last = core.addDays(monday, 6);
    text("week-title", isCurrent ? "本周课表" : "第 " + selectedWeek + " 周课表");
    text("week-range", (selectedWeek > 0 ? "第 " + selectedWeek + " 周 · " : "") + monday.slice(0, 4) + "年 " + core.shortDate(monday) + "—" + (monday.slice(0, 4) !== last.slice(0, 4) ? last.slice(0, 4) + "年 " : "") + core.shortDate(last));
    $("week-select").value = String(selectedWeek);
    $("prev-week").disabled = selectedWeek <= data.term.firstPublishedWeek || selectedWeek > data.term.lastPublishedWeek;
    $("next-week").disabled = selectedWeek >= data.term.lastPublishedWeek || selectedWeek < data.term.firstPublishedWeek;
    $("current-week").disabled = isCurrent;
    let regular = 0, morning = 0, study = 0, published = true;
    let html = "";
    for (let i = 0; i < 7; i++) {
      const date = core.addDays(monday, i);
      const day = core.coursesFor(data, date);
      published = published && day.published;
      regular += day.courses.filter(c => !c.isStudy).length;
      morning += day.courses.filter(c => c.isStudy && c.name === "早自习").length;
      study += day.courses.filter(c => c.isStudy && c.name !== "早自习").length;
      html += `<section class="week-day${date === now.date ? " is-today" : ""}" aria-label="${esc(core.shortDate(date) + core.dayName(date))}"><header class="week-day-header"><h3>${esc(core.dayName(date))}${date === now.date ? " · 今天" : ""}</h3><span>${esc(date.slice(5).replace("-", "/"))}</span></header><div class="week-day-body">${day.courses.length ? day.courses.map(weekCourse).join("") : `<p class="day-empty">${day.published ? "无课程安排" : "尚未发布"}</p>`}${day.studyNote && !day.courses.some(c => c.isStudy) ? `<p class="day-empty">${esc(day.studyNote)}</p>` : ""}</div></section>`;
    }
    text("week-summary", published ? `${isCurrent ? "本周" : "这一周"}共 ${regular} 次课程 · ${morning} 次早自习 · ${study} 次晚自习　/　按实际时间显示` : "本周数据未发布，请向学习委员确认。");
    $("week-grid").innerHTML = html;
  }
  function renderChanges() {
    const changes = [...data.changes].sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt));
    const exceptions = data.studyExceptions;
    text("changes-count", changes.length + exceptions.length + " 条");
    if (!changes.length && !exceptions.length) {
      $("changes-list").innerHTML = '<p class="changes-empty">暂无已录入的课程调整。当天临时变动、临时换教室等，请查看班群和教师通知。</p>';
      return;
    }
    let html = changes.map(ch => {
      const original = ch.action === "add" ? ch.course : data.courses.find(c => c.id === ch.courseId);
      const status = { modify: "已调整", cancel: "已取消", add: "新增课程" }[ch.action];
      const oldLine = core.shortDate(ch.date) + " " + original.start + "–" + original.end + (original.room ? " · " + original.room : "");
      const newLine = ch.action === "modify" ? core.shortDate(ch.to.date) + " " + ch.to.start + "–" + ch.to.end + ((ch.to.room ?? original.room) ? " · " + (ch.to.room ?? original.room) : "") : "";
      return `<article class="change-item"><h3>${esc(original.name)}<span class="change-status">${status}</span></h3><p>${ch.action === "add" ? "安排：" : "原安排："}${esc(oldLine)}</p>${newLine ? `<p>调整为：${esc(newLine)}</p>` : ""}<p class="change-reason">${esc(ch.note)}</p><p>确认于 ${esc(fullStamp(ch.confirmedAt))}（北京时间）</p></article>`;
    }).join("");
    html += exceptions.map(ex => `<article class="change-item"><h3>${esc(core.shortDate(ex.date))} 晚自习<span class="change-status">${ex.enabled ? "已安排" : "已取消"}</span></h3><p class="change-reason">${esc(ex.note)}</p><p>确认于 ${esc(fullStamp(ex.confirmedAt))}（北京时间）</p></article>`).join("");
    $("changes-list").innerHTML = html;
  }
  function render() {
    const now = core.schoolNow();
    if (lastDate !== now.date) {
      if (lastDate == null || selectedWeek === core.weekOf(data, lastDate)) selectedWeek = core.weekOf(data, now.date);
      buildWeekSelect(now);
      lastDate = now.date;
    }
    const currentWeek = core.weekOf(data, now.date);
    text("date-line", now.date.slice(0, 4) + "年 " + core.shortDate(now.date) + " · " + core.dayName(now.date) + (currentWeek > 0 ? " · 第 " + currentWeek + " 周" : "") + " · 北京时间");
    dayList("today", now.date, now);
    dayList("tomorrow", core.addDays(now.date, 1), now);
    const state = core.dayState(data, now);
    const suffix = state.type === "free" ? ` · 今日下一次安排 ${state.next.start} 开始` : state.type === "ongoing" ? ` · ${state.current.end} 结束` : "";
    text("today-state", state.label + suffix);
    renderNext(now, state);
    renderWeek(now);
  }
  function showError(error) {
    $("schedule-content").hidden = true;
    $("load-error").hidden = false;
    $("load-error").innerHTML = `<strong>课表暂时无法显示，请查看班群通知。</strong><p>数据未能完整读取或校验通过，不能据此判断为无课。请联系学习委员检查后刷新。</p><p>错误说明：${esc(error.message)}</p>`;
    text("updated-top", "课表读取失败");
    text("updated-bottom", "最近更新于：未能验证");
  }
  try {
    core = window.ScheduleCore;
    if (!core || !window.COURSE_DATA) throw new Error("课程文件未加载，请刷新或检查文件是否齐全");
    data = core.validate(window.COURSE_DATA);
    text("site-name", data.className);
    document.title = data.className + " · 班级课表";
    const updated = fullStamp(data.updatedAt);
    text("updated-top", "最近更新于 " + updated);
    text("updated-bottom", "最近更新于：" + updated + "（北京时间；刷新页面获取已发布更新）");
    text("coverage-note", `数据范围：第 ${data.term.firstPublishedWeek}—${data.term.lastPublishedWeek} 周。${data.term.note}`);
    renderChanges();
    render();
    $("schedule-content").hidden = false;
    $("week-select").addEventListener("change", e => { selectedWeek = Number(e.target.value); renderWeek(core.schoolNow()); });
    $("prev-week").addEventListener("click", () => { selectedWeek--; renderWeek(core.schoolNow()); });
    $("next-week").addEventListener("click", () => { selectedWeek++; renderWeek(core.schoolNow()); });
    $("current-week").addEventListener("click", () => { selectedWeek = core.weekOf(data, core.schoolNow().date); renderWeek(core.schoolNow()); });
    // 仅更新时钟状态，不做后台同步；离开页面后返回立即更新，避免过时的“正在上课”。
    setInterval(() => { try { render(); } catch (e) { showError(e); } }, 30000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { try { render(); } catch (e) { showError(e); } } });
  } catch (e) { showError(e); }
})();
