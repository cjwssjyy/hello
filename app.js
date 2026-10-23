(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let data, core, selectedWeek, lastDate;
  const weekCache = new Map();
  let renderedWeekKey;
  let selectedWeekday, fullWeek = false, refreshing = false;
  const mobileView = window.matchMedia('(max-width:700px)');
  function courseTitle(c) {
    return c.name.replace(/（实验·[一二]组）$/, '（实验）').replace(/（日语生注意）$/, '').replace(/^(英语课)[（(].*[）)]$/, '$1');
  }
  function audienceMarkup(c) {
    const labels = [];
    if (c.labGroups && c.labGroups.length) labels.push({ label: c.labGroups.length > 1 ? '所有人' : c.labGroups[0] === 1 ? '一组' : '二组', style: 'lab' });
    if (c.audience === 'japanese') labels.push({ label: '仅日语生', style: 'language' });
    if (c.audience === 'non-japanese') labels.push({ label: '其他同学（非日语生）', style: 'language' });
    const english = c.name.match(/^英语课[（(](.*)[）)]$/);
    if (english) labels.push({ label: '适用：' + english[1].split(/[，,、]\s*/).join('、'), style: 'english' });
    return labels.length ? '<div class="audience-labels">' + labels.map(x => '<span class="audience-badge audience-' + x.style + '">' + esc(x.label) + '</span>').join('') + '</div>' : '';
  }
  function titleMarkup(c) { return '<div class="course-title"><h3>' + esc(courseTitle(c)) + '</h3>' + audienceMarkup(c) + '</div>'; }
  function renderQuick(now, state) {
    const list = state.currents && state.currents.length ? state.currents : [core.findNext(data, now)].filter(Boolean);
    $('quick-course').hidden = false;
    const targetDate = list.length ? list[0].date : now.date;
    document.querySelector('.quick-link').setAttribute('href', targetDate === now.date ? '#today' : targetDate === core.addDays(now.date, 1) ? '#tomorrow' : '#week');
    text('quick-label', state.current ? '正在进行' : '下一次安排');
    $('quick-detail').innerHTML = list.length ? list.map(c => {
      const date = c.date === now.date ? '今天' : c.date === core.addDays(now.date, 1) ? '明天' : core.shortDate(c.date);
      return '<div class="quick-item"><span class="quick-time">' + esc(date) + ' ' + esc(c.start) + '–' + esc(c.end) + '</span><strong>' + esc(courseTitle(c)) + '</strong>' + audienceMarkup(c) + '<span class="quick-room">' + esc(c.room || '教室按本人分班安排') + '</span></div>';
    }).join('') : '<strong>暂无后续已发布安排</strong><p class="quick-empty">未发布不代表没有课，请留意班群通知。</p>';
  }
  function applyWeekView() {
    const single = mobileView.matches && !fullWeek;
    document.querySelectorAll('#week-grid .week-day').forEach(day => { day.hidden = single && Number(day.dataset.weekday) !== selectedWeekday; });
    document.querySelectorAll('#weekday-nav button').forEach(button => { button.setAttribute('aria-pressed', String(Number(button.dataset.weekday) === selectedWeekday)); });
    text('toggle-full-week', fullWeek ? '收起整周' : '展开整周');
    $('toggle-full-week').setAttribute('aria-expanded', String(fullWeek));
  }
  function buildWeekdayNav(monday, now) {
    if (selectedWeekday == null) selectedWeekday = core.weekday(now.date);
    $('weekday-nav').innerHTML = Array.from({ length: 7 }, (_, i) => {
      const date = core.addDays(monday, i);
      return '<button type="button" data-weekday="' + (i + 1) + '" aria-controls="week-day-' + (i + 1) + '" aria-label="' + esc(core.shortDate(date) + core.dayName(date)) + '" aria-pressed="' + (i + 1 === selectedWeekday) + '"><span>' + (date === now.date ? '今天' : core.dayName(date).replace('星期', '周')) + '</span><small>' + esc(date.slice(5).replace('-', '/')) + '</small></button>';
    }).join('');
  }
  function animateWeekChange() {
    try { if (window.CalendarMotion) window.CalendarMotion.week(); } catch (_) {}
  }
  function startEntrance() {
    if (window.CalendarMotion) window.CalendarMotion.init();
  }
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
    return `<article class="course-row${c.isStudy ? " is-study" : ""}${past ? " is-past" : ""}${current ? " is-current" : ""}"><div class="course-time"><time datetime="${esc(c.date)}T${esc(c.start)}:00+08:00">${esc(c.start)}</time><time class="end-time" datetime="${esc(c.date)}T${esc(c.end)}:00+08:00">– ${esc(c.end)}</time></div><div class="course-info">${titleMarkup(c)}${c.room || c.teacher ? `<p class="course-meta">${courseMeta(c, " · ")}</p>` : ""}${c.note ? `<p class="course-note">${esc(c.note)}</p>` : ""}${tags(c, current ? "current" : "")}</div></article>`;
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
    if (state.currents && state.currents.length > 1) {
      text("next-label", "RIGHT NOW · 分组安排");
      text("next-title", "日语课与晚自习");
      text("next-date", "今天 · " + core.dayName(now.date));
      $("next-detail").innerHTML = state.currents.map(c => `<div class="next-meta">${titleMarkup(c)}<p>${esc(c.start)}–${esc(c.end)} · ${courseMeta(c, " · ")}</p>${c.note ? `<p>${esc(c.note)}</p>` : ""}</div>`).join("");
      text("next-footer", "请按对应人群查看各自的时间和教室。");
      return;
    }
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
    text("next-title", courseTitle(c));
    const relativeDate = c.date === now.date ? "今天" : c.date === core.addDays(now.date, 1) ? "明天" : core.shortDate(c.date);
    text("next-date", relativeDate + " · " + core.dayName(c.date) + (c.adjusted ? " · 已调整" : ""));
    $("next-detail").innerHTML = `${audienceMarkup(c)}<p class="next-detail-time">${esc(c.start)} <span aria-hidden="true">–</span> ${esc(c.end)}</p>${c.room || c.teacher ? `<p class="next-meta">${courseMeta(c, " · ")}</p>` : ""}${c.note ? `<p class="next-meta">${esc(c.note)}</p>` : ""}`;
    const gap = core.minutes(c.start) - now.minute;
    text("next-footer", state.current ? `距结束还有 ${core.minutes(c.end) - now.minute} 分钟` : c.date === now.date ? `当前空闲 · 距开始还有 ${gap >= 60 ? Math.floor(gap / 60) + " 小时" + (gap % 60 ? " " + gap % 60 + " 分钟" : "") : gap + " 分钟"}` : `今天${state.type === "unpublished" ? "课表未发布" : "没有后续安排"} · 下一次安排在${relativeDate}`);
  }
  function availableWeeks(now) {
    const current = core.weekOf(data, now.date);
    const weeks = [current];
    for (let w = Math.max(current + 1, data.term.firstPublishedWeek); w <= data.term.lastPublishedWeek; w++) weeks.push(w);
    return weeks;
  }
  function buildWeekSelect(now) {
    const current = core.weekOf(data, now.date);
    $("week-select").innerHTML = availableWeeks(now).map(w => `<option value="${w}">${w === current && !core.isPublished(data, now.date) ? "本周 · 未发布" : `第 ${w} 周${w === current ? " · 本周" : ""}`}</option>`).join("");
  }
  function weekCourse(c) {
    return `<article class="week-course${c.isStudy ? " is-study" : ""}"><p class="week-course-time">${esc(c.start)}–${esc(c.end)}</p>${titleMarkup(c)}${c.room || c.teacher || c.note ? `<p class="week-course-meta">${[courseMeta(c, "<br>"), esc(c.note)].filter(Boolean).join("<br>")}</p>` : ""}${c.adjusted ? '<span class="tag adjusted">已调整</span>' : ""}</article>`;
  }
  function renderWeek(now) {
    const weeks = availableWeeks(now);
    if (!weeks.includes(selectedWeek)) selectedWeek = weeks[0];
    $("week-select").value = String(selectedWeek);
    const key = now.date + ':' + selectedWeek;
    if (renderedWeekKey === key) return false;
    const currentWeek = core.weekOf(data, now.date);
    const isCurrent = selectedWeek === currentWeek;
    const monday = core.weekMonday(data, selectedWeek);
    buildWeekdayNav(monday, now);
    const last = core.addDays(monday, 6);
    text("week-title", isCurrent ? "本周课表" : "第 " + selectedWeek + " 周课表");
    text("week-range", (selectedWeek > 0 ? "第 " + selectedWeek + " 周 · " : "") + monday.slice(0, 4) + "年 " + core.shortDate(monday) + "—" + (monday.slice(0, 4) !== last.slice(0, 4) ? last.slice(0, 4) + "年 " : "") + core.shortDate(last));
    $("prev-week").disabled = weeks.indexOf(selectedWeek) === 0;
    $("next-week").disabled = weeks.indexOf(selectedWeek) === weeks.length - 1;
    $("current-week").disabled = isCurrent;
    let cached = weekCache.get(key);
    if (!cached) {
      let regular = 0, morning = 0, study = 0, published = true;
      let html = "";
      for (let i = 0; i < 7; i++) {
        const date = core.addDays(monday, i);
        const day = core.coursesFor(data, date);
        published = published && day.published;
        regular += day.courses.filter(c => !c.isStudy).length;
        morning += day.courses.filter(c => c.isStudy && c.name === "早自习").length;
        study += day.courses.filter(c => c.isStudy && c.name !== "早自习").length;
        html += `<section id="week-day-${i + 1}" data-weekday="${i + 1}" class="week-day${date === now.date ? " is-today" : ""}" aria-label="${esc(core.shortDate(date) + core.dayName(date))}"><header class="week-day-header"><h3>${esc(core.dayName(date))}${date === now.date ? " · 今天" : ""}</h3><span>${esc(date.slice(5).replace("-", "/"))}</span></header><div class="week-day-body">${day.courses.length ? day.courses.map(weekCourse).join("") : `<p class="day-empty">${day.published ? "无课程安排" : "尚未发布"}</p>`}${day.studyNote && !day.courses.some(c => c.isStudy) ? `<p class="day-empty">${esc(day.studyNote)}</p>` : ""}</div></section>`;
      }
      cached = { regular, morning, study, published, html };
      weekCache.set(key, cached);
    }
    const { regular, morning, study, published, html } = cached;
    text("week-summary", published ? `${isCurrent ? "本周" : "这一周"}共 ${regular} 次课程 · ${morning} 次早自习 · ${study} 次晚自习　/　按实际时间显示` : "本周数据未发布，请向学习委员确认。");
    $("week-grid").innerHTML = html;
    renderedWeekKey = key;
    applyWeekView();
    return true;
  }
  function changeCard(ch) {
    const original = ch.action === 'add' ? ch.course : data.courses.find(c => c.id === ch.courseId);
    const status = { modify: '已调整', cancel: '已取消', add: '新增课程' }[ch.action];
    const oldLine = core.shortDate(ch.date) + ' ' + original.start + '–' + original.end + (original.room ? ' · ' + original.room : '');
    const newLine = ch.action === 'modify' ? core.shortDate(ch.to.date) + ' ' + ch.to.start + '–' + ch.to.end + ((ch.to.room ?? original.room) ? ' · ' + (ch.to.room ?? original.room) : '') : '';
    return '<article class="change-item"><h3>' + esc(courseTitle(original)) + '<span class="change-status">' + status + '</span></h3>' + audienceMarkup(original) + '<p>' + (ch.action === 'add' ? '安排：' : '原安排：') + esc(oldLine) + '</p>' + (newLine ? '<p>调整为：' + esc(newLine) + '</p>' : '') + '<p class="change-reason">' + esc(ch.note) + '</p><p>确认于 ' + esc(fullStamp(ch.confirmedAt)) + '（北京时间）</p></article>';
  }
  function renderChanges(now) {
    const first = core.mondayOf(now.date);
    const changes = data.changes.filter(ch => ch.date >= first || (ch.action === 'modify' && ch.to.date >= first)).sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt));
    const exceptions = data.studyExceptions.filter(ex => ex.date >= first);
    const groups = [];
    changes.forEach(ch => {
      // 同日期、同确认时间且有完全相同的整日调课说明，才合并；其他调整独立保留。
      const prefix = ch.action === 'add' && ch.note.match(/^(本周日（\d+月\d+日）按本周一（\d+月\d+日）课表上课，时间、教室、老师相同，早晚自习照常。)/);
      const key = prefix ? ch.date + '/' + ch.confirmedAt + '/' + prefix[1] : ch.id;
      let group = groups.find(g => g.key === key);
      if (!group) { group = { key, note: prefix ? prefix[1] : '', items: [] }; groups.push(group); }
      group.items.push(ch);
    });
    text('changes-count', groups.length + exceptions.length + ' 条');
    if (!groups.length && !exceptions.length) {
      $('changes-list').innerHTML = '<p class="changes-empty">暂无已录入的课程调整。当天临时变动、临时换教室等，请查看班群和教师通知。</p>';
      return;
    }
    let html = groups.map(group => {
      if (group.items.length < 2 || !group.note) return group.items.map(changeCard).join('');
      const firstChange = group.items[0];
      const title = group.note.split('课表上课')[0] + '课表上课';
      const rows = group.items.slice().sort((a, b) => a.course.start.localeCompare(b.course.start)).map(ch => '<li><span class="change-course-time">' + esc(ch.course.start) + '–' + esc(ch.course.end) + '</span>' + titleMarkup(ch.course) + '<p>' + courseMeta(ch.course, ' · ') + '</p>' + (ch.note.slice(group.note.length) ? '<p>' + esc(ch.note.slice(group.note.length)) + '</p>' : '') + '</li>').join('');
      return '<article class="change-item change-group"><h3>' + esc(title) + '<span class="change-status">已调整</span></h3><p class="change-reason">' + esc(group.note) + '</p><details><summary>展开查看 ' + group.items.length + ' 项课程</summary><ul class="change-course-list">' + rows + '</ul></details><p>确认于 ' + esc(fullStamp(firstChange.confirmedAt)) + '（北京时间）</p></article>';
    }).join('');
    html += exceptions.map(ex => '<article class="change-item"><h3>' + esc(core.shortDate(ex.date)) + ' 晚自习<span class="change-status">' + (ex.enabled ? '已安排' : '已取消') + '</span></h3><p class="change-reason">' + esc(ex.note) + '</p><p>确认于 ' + esc(fullStamp(ex.confirmedAt)) + '（北京时间）</p></article>').join('');
    $('changes-list').innerHTML = html;
  }
  function updateStamp() {
    const updated = fullStamp(data.updatedAt);
    text('updated-top', '最近更新于 ' + updated);
    text('updated-bottom', '最近更新于：' + updated + '（北京时间；点击“刷新课表”获取已发布更新）');
  }
  async function refreshSchedule() {
    if (refreshing) return;
    refreshing = true;
    const button = $('refresh-schedule');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = '正在刷新…';
    text('refresh-status', '正在读取已发布的课表…');
    let timer, script, previous = window.COURSE_DATA;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    try {
      const url = new URL('schedule.js', window.location.href);
      url.searchParams.set('refresh', String(Date.now()));
      const load = window.location.protocol === 'file:' ? new Promise((resolve, reject) => {
        script = document.createElement('script');
        script.src = url.href;
        script.onload = () => { const candidate = window.COURSE_DATA; window.COURSE_DATA = previous; resolve(candidate); };
        script.onerror = () => reject(new Error('课程文件无法读取'));
        document.head.appendChild(script);
      }) : fetch(url.href, { cache: 'no-store', credentials: 'same-origin', ...(controller ? { signal: controller.signal } : {}) }).then(response => {
        if (!response.ok) throw new Error('服务器返回 ' + response.status);
        return response.text();
      }).then(source => {
        const match = source.match(/window\.COURSE_DATA\s*=\s*(\{[\s\S]*\});\s*$/);
        if (!match) throw new Error('课程文件格式错误');
        return JSON.parse(match[1]);
      });
      const candidate = await Promise.race([load, new Promise((_, reject) => { timer = setTimeout(() => { if (controller) controller.abort(); reject(new Error('读取超时')); }, 12000); })]);
      core.validate(candidate);
      if (Date.parse(candidate.updatedAt) < Date.parse(data.updatedAt)) throw new Error('服务器返回旧版本，请稍后再试');
      const changed = JSON.stringify(candidate) !== JSON.stringify(data);
      data = candidate;
      window.COURSE_DATA = data;
      text('site-name', data.className);
      document.title = data.className + ' · 班级课表';
      weekCache.clear(); renderedWeekKey = undefined; lastDate = undefined;
      // 刷新课程后保持已选周次，跨周或范围变化由 renderWeek 校正。
      const keptWeek = selectedWeek;
      updateStamp(); render();
      selectedWeek = keptWeek; renderWeek(core.schoolNow());
      $('load-error').hidden = true;
      $('schedule-content').hidden = false;
      text('refresh-status', changed ? '课表已更新，当前显示最新发布版本。' : '已是最新课表，已重新核对。');
    } catch (_) {
      window.COURSE_DATA = data || previous;
      text('refresh-status', '刷新失败，仍显示上次读取的课表。请稍后重试，临时安排以班群通知为准。');
    } finally {
      clearTimeout(timer);
      if (script) script.remove();
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = '刷新课表';
      refreshing = false;
    }
  }
  function render() {
    const now = core.schoolNow();
    try { if (window.CalendarMotion) window.CalendarMotion.update(now, core, data); } catch (_) {}
    if (lastDate !== now.date) {
      weekCache.clear();
      if (lastDate != null) selectedWeekday = core.weekday(now.date);
      if (lastDate == null || selectedWeek === core.weekOf(data, lastDate)) selectedWeek = core.weekOf(data, now.date);
      buildWeekSelect(now);
      renderChanges(now);
      const firstVisible = Math.max(core.weekOf(data, now.date), data.term.firstPublishedWeek);
      text("coverage-note", (firstVisible <= data.term.lastPublishedWeek ? `可查看：第 ${firstVisible}—${data.term.lastPublishedWeek} 周。` : "暂无本周及以后的已发布课表。") + "已结束的周不再显示。" + data.term.note);
      lastDate = now.date;
    }
    const currentWeek = core.weekOf(data, now.date);
    text("date-line", now.date.slice(0, 4) + "年 " + core.shortDate(now.date) + " · " + core.dayName(now.date) + (currentWeek > 0 ? " · 第 " + currentWeek + " 周" : "") + " · 北京时间");
    dayList("today", now.date, now);
    dayList("tomorrow", core.addDays(now.date, 1), now);
    const state = core.dayState(data, now);
    const suffix = state.currents && state.currents.length > 1 ? " · 请按适用人群查看" : state.type === "free" ? ` · 今日下一次安排 ${state.next.start} 开始` : state.type === "ongoing" ? ` · ${state.current.end} 结束` : "";
    text("today-state", state.label + suffix);
    renderQuick(now, state);
    renderNext(now, state);
    renderWeek(now);
  }
  function showError(error) {
    $("schedule-content").hidden = true;
    $("quick-course").hidden = true;
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
    updateStamp();
    render();
    $("schedule-content").hidden = false;
    $('refresh-schedule').addEventListener('click', refreshSchedule);
    $('weekday-nav').addEventListener('click', e => {
      const button = e.target.closest('button[data-weekday]');
      if (!button || !$('weekday-nav').contains(button)) return;
      selectedWeekday = Number(button.dataset.weekday); fullWeek = false; applyWeekView();
    });
    $('toggle-full-week').addEventListener('click', () => { fullWeek = !fullWeek; applyWeekView(); });
    if (mobileView.addEventListener) mobileView.addEventListener('change', applyWeekView);
    else if (mobileView.addListener) mobileView.addListener(applyWeekView);
    $("week-select").addEventListener("change", e => { selectedWeek = Number(e.target.value); if (renderWeek(core.schoolNow())) animateWeekChange(); });
    function moveWeek(step) {
      const now = core.schoolNow(), weeks = availableWeeks(now);
      const index = Math.max(0, weeks.indexOf(selectedWeek));
      selectedWeek = weeks[Math.max(0, Math.min(weeks.length - 1, index + step))];
      if (renderWeek(now)) animateWeekChange();
    }
    $("prev-week").addEventListener("click", () => moveWeek(-1));
    $("next-week").addEventListener("click", () => moveWeek(1));
    $("current-week").addEventListener("click", () => { selectedWeek = core.weekOf(data, core.schoolNow().date); selectedWeekday = core.weekday(core.schoolNow().date); if (renderWeek(core.schoolNow())) animateWeekChange(); else applyWeekView(); });
    // 仅更新时钟状态，不做后台同步；离开页面后返回立即更新，避免过时的“正在上课”。
    setInterval(() => { try { render(); } catch (e) { showError(e); } }, 30000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { try { render(); } catch (e) { showError(e); } } });
    try { startEntrance(); } catch (_) { /* 动效异常不影响查课和时间刷新。 */ }
  } catch (e) { showError(e); }
})();
