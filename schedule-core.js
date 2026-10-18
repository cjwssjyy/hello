/* 排课逻辑。课程内容只在 schedule.js 中维护。无依赖、无网络请求。 */
(function (global) {
  "use strict";
  const DAY = 86400000;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const stampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/;
  const weekdayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  function dateMs(date) { return Date.parse(date + "T00:00:00Z"); }
  function validDate(date) { return typeof date === "string" && datePattern.test(date) && Number.isFinite(dateMs(date)) && new Date(dateMs(date)).toISOString().slice(0, 10) === date; }
  function addDays(date, days) { return new Date(dateMs(date) + days * DAY).toISOString().slice(0, 10); }
  function weekday(date) { return new Date(dateMs(date)).getUTCDay() || 7; }
  function minutes(time) { const [h, m] = time.split(":").map(Number); return h * 60 + m; }
  function weekOf(data, date) { return Math.floor((dateMs(date) - dateMs(data.term.weekOneMonday)) / (DAY * 7)) + 1; }
  function weekMonday(data, week) { return addDays(data.term.weekOneMonday, (week - 1) * 7); }
  function mondayOf(date) { return addDays(date, 1 - weekday(date)); }
  function isPublished(data, date) { const w = weekOf(data, date); return w >= data.term.firstPublishedWeek && w <= data.term.lastPublishedWeek; }
  function shortDate(date) { return Number(date.slice(5, 7)) + "月" + Number(date.slice(8, 10)) + "日"; }
  function dayName(date) { return weekdayNames[weekday(date) % 7]; }
  function schoolNow(now) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now || new Date());
    const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, minute: Number(p.hour) * 60 + Number(p.minute) };
  }
  function overlap(a, b) { return a.start < b.end && b.start < a.end; }
  function occurrence(course, date) { return { ...course, date, adjusted: false, isStudy: false }; }
  function assert(ok, message) { if (!ok) throw new Error(message); }
  function validate(data) {
    assert(data && data.term && Array.isArray(data.courses) && Array.isArray(data.changes) && Array.isArray(data.studyExceptions), "课程数据结构不完整");
    assert(data.timezone === "Asia/Shanghai", "时区必须为 Asia/Shanghai");
    assert(typeof data.className === "string" && data.className.trim(), "页面名称不能为空");
    assert(stampPattern.test(data.updatedAt) && Number.isFinite(Date.parse(data.updatedAt)) && validDate(data.updatedAt.slice(0, 10)), "更新时间格式错误");
    assert(validDate(data.term.weekOneMonday) && weekday(data.term.weekOneMonday) === 1, "第1周起始日期必须为周一");
    assert(Number.isInteger(data.term.firstPublishedWeek) && Number.isInteger(data.term.lastPublishedWeek) && data.term.firstPublishedWeek > 0 && data.term.lastPublishedWeek >= data.term.firstPublishedWeek && data.term.lastPublishedWeek <= 53, "已发布教学周范围无效");
    function validateTime(item, name) { assert(timePattern.test(item.start) && timePattern.test(item.end) && item.start < item.end, name + "的开始/结束时间无效"); }
    const ids = new Set();
    for (const c of data.courses) {
      assert(typeof c.id === "string" && c.id && !ids.has(c.id), "课程 id 为空或重复"); ids.add(c.id);
      assert(Number.isInteger(c.weekday) && c.weekday >= 1 && c.weekday <= 7, c.id + "的星期无效");
      assert(Array.isArray(c.weeks) && c.weeks.length > 0 && c.weeks.every(w => Number.isInteger(w) && w >= 1 && w <= 53) && new Set(c.weeks).size === c.weeks.length, c.id + "的开课周次无效");
      assert(typeof c.name === "string" && c.name.trim() && typeof c.room === "string" && c.room.trim(), c.id + "缺少课程名或教室");
      for (const key of ["teacher", "note", "kind"]) assert(typeof c[key] === "string", c.id + "的 " + key + " 必须为文字");
      validateTime(c, c.id);
    }
    const study = data.study;
    assert(study && typeof study.enabled === "boolean" && Array.isArray(study.weekdays) && study.weekdays.every(d => Number.isInteger(d) && d >= 1 && d <= 7), "晚自习规则无效");
    validateTime(study, "晚自习");
    assert(typeof study.room === "string" && study.room.trim(), "晚自习教室不能为空");
    validateTime({start: study.checkStart, end: study.checkEnd}, "晚间检查时段");
    const changed = new Set(); const changeIds = new Set();
    for (const change of data.changes) {
      assert(typeof change.id === "string" && change.id && !changeIds.has(change.id), "调整 id 为空或重复"); changeIds.add(change.id);
      assert(validDate(change.date) && isPublished(data, change.date), "调整日期不在已发布范围内");
      assert(["modify", "cancel", "add"].includes(change.action), "调整类型应为 modify、cancel 或 add");
      assert(stampPattern.test(change.confirmedAt) && Number.isFinite(Date.parse(change.confirmedAt)) && validDate(change.confirmedAt.slice(0, 10)), "调整确认时间无效");
      assert(typeof change.note === "string" && change.note.trim(), "请填写调整说明");
      let earliest;
      if (change.action === "add") {
        assert(change.course && change.course.name && typeof change.course.name === "string" && change.course.room && typeof change.course.room === "string", "补课须填写课程名和教室");
        for (const key of ["teacher", "note", "kind"]) assert(typeof change.course[key] === "string", "补课字段 " + key + " 必须为文字");
        validateTime(change.course, "补课");
        earliest = Date.parse(change.date + "T" + change.course.start + ":00+08:00");
      } else {
        const c = data.courses.find(item => item.id === change.courseId);
        assert(c && c.weekday === weekday(change.date) && c.weeks.includes(weekOf(data, change.date)), "调整引用的原课程当天不存在");
        const key = change.courseId + "/" + change.date;
        assert(!changed.has(key), "同一课程当天只能有一条最终调整，请合并修改"); changed.add(key);
        earliest = Date.parse(change.date + "T" + c.start + ":00+08:00");
        if (change.action === "modify") {
          assert(change.to && validDate(change.to.date) && isPublished(data, change.to.date), "调整后日期不在已发布范围内");
          for (const key of ["start", "end", "room"]) assert(typeof change.to[key] === "string" && change.to[key], "修改课程须填写 " + key);
          validateTime(change.to, "调整后课程");
          earliest = Math.min(earliest, Date.parse(change.to.date + "T" + change.to.start + ":00+08:00"));
        }
      }
      assert(earliest - Date.parse(change.confirmedAt) > 12 * 3600000, "本页仅录入提前超过12小时确认的调整；临时变动请在班群通知");
      assert(Date.parse(change.confirmedAt) <= Date.parse(data.updatedAt), "调整确认时间不能晚于页面更新时间");
    }
    const exceptionDates = new Set();
    for (const ex of data.studyExceptions) {
      assert(validDate(ex.date) && isPublished(data, ex.date) && !exceptionDates.has(ex.date) && typeof ex.enabled === "boolean" && typeof ex.note === "string" && ex.note.trim(), "晚自习例外无效或日期重复"); exceptionDates.add(ex.date);
      assert(stampPattern.test(ex.confirmedAt) && Number.isFinite(Date.parse(ex.confirmedAt)) && validDate(ex.confirmedAt.slice(0, 10)), "晚自习调整确认时间无效");
      assert(Date.parse(ex.date + "T" + study.start + ":00+08:00") - Date.parse(ex.confirmedAt) > 12 * 3600000, "晚自习调整仅录入提前超过12小时确认的安排");
      assert(Date.parse(ex.confirmedAt) <= Date.parse(data.updatedAt), "晚自习确认时间不能晚于页面更新时间");
    }
    // 全范围检查，避免将冲突数据渲染成可用课表。
    const first = weekMonday(data, data.term.firstPublishedWeek);
    const last = addDays(weekMonday(data, data.term.lastPublishedWeek), 6);
    for (let d = first; d <= last; d = addDays(d, 1)) {
      const list = coursesFor(data, d).courses;
      for (let i = 1; i < list.length; i++) assert(!overlap(list[i - 1], list[i]), shortDate(d) + "的课程时间有冲突，请核对");
    }
    return data;
  }
  function coursesFor(data, date) {
    if (!isPublished(data, date)) return { published: false, courses: [], studyNote: "" };
    const week = weekOf(data, date);
    let list = data.courses.filter(c => c.weekday === weekday(date) && c.weeks.includes(week)).map(c => occurrence(c, date));
    for (const ch of data.changes) {
      if (ch.action !== "add" && ch.date === date) list = list.filter(c => c.id !== ch.courseId);
      if (ch.action === "modify" && ch.to.date === date) {
        const original = data.courses.find(c => c.id === ch.courseId);
        list.push({ ...occurrence(original, date), ...ch.to, adjusted: true, note: ch.note });
      }
      if (ch.action === "add" && ch.date === date) list.push({ ...ch.course, id: "added-" + ch.id, date, adjusted: true, isStudy: false, note: ch.note });
    }
    const rule = data.study;
    const exception = data.studyExceptions.find(ex => ex.date === date);
    const shouldStudy = (exception ? exception.enabled : rule.enabled) && rule.weekdays.includes(weekday(date));
    if (shouldStudy && !list.some(c => overlap(c, { start: rule.checkStart, end: rule.checkEnd }))) {
      list.push({ id: "study-" + date, date, start: rule.start, end: rule.end, name: "晚自习", kind: "自习", room: rule.room, teacher: "", note: exception ? exception.note : "", adjusted: Boolean(exception), isStudy: true });
    }
    list.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
    return { published: true, courses: list, studyNote: exception ? exception.note : "" };
  }
  function dayState(data, now) {
    const day = coursesFor(data, now.date);
    if (!day.published) return { type: "unpublished", label: "今日课表尚未发布", day };
    const current = day.courses.find(c => minutes(c.start) <= now.minute && now.minute < minutes(c.end));
    if (current) return { type: "ongoing", label: current.isStudy ? "正在晚自习" : "正在上课", current, day };
    const next = day.courses.find(c => minutes(c.start) > now.minute);
    if (next) return { type: "free", label: "当前空闲", next, day };
    return { type: day.courses.length ? "finished" : "empty", label: day.courses.length ? "今日安排已结束" : "今日无课", day };
  }
  function findNext(data, now) {
    const end = addDays(weekMonday(data, data.term.lastPublishedWeek), 6);
    const first = weekMonday(data, data.term.firstPublishedWeek);
    for (let date = now.date < first ? first : now.date; date <= end; date = addDays(date, 1)) {
      const c = coursesFor(data, date).courses.find(item => date !== now.date || minutes(item.start) > now.minute);
      if (c) return c;
    }
    return null;
  }
  global.ScheduleCore = { validate, addDays, weekday, minutes, weekOf, weekMonday, mondayOf, isPublished, shortDate, dayName, schoolNow, coursesFor, dayState, findNext };
})(window);
