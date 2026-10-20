/* New CSS-first motion layer. Course data and schedule calculations stay independent. */
(function (global) {
  'use strict';
  var initialized = false, observer, heroObserver, scrollFrame = 0, weekVariant = false;
  var seen = [];
  var preference = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  var hero = document.querySelector('.hero-panel');
  function setText(id, value) { var el = document.getElementById(id); if (el && el.textContent !== value) el.textContent = value; }
  function visible() { return document.visibilityState !== 'hidden'; }
  function arrive(el) {
    if (seen.indexOf(el) !== -1) return;
    el.style.setProperty('--stage-arrive-delay', Math.min(seen.length, 3) * 60 + 'ms');
    seen.push(el);
    if (!preference.matches) el.classList.add('stage-card-arrive');
    if (observer) observer.unobserve(el);
  }
  function connectCards() {
    if (observer) observer.disconnect();
    if (!visible()) return;
    var cards = document.querySelectorAll('.notice,.next-panel,.today-panel,.tomorrow-panel,.week-toolbar,.changes-panel,footer');
    if (typeof global.IntersectionObserver === 'function') {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) arrive(entry.target); });
      }, { threshold:0.03 });
    }
    Array.prototype.forEach.call(cards, function (el) {
      if (seen.indexOf(el) !== -1) return;
      if (observer) observer.observe(el);
      else { var r = el.getBoundingClientRect(); if (r.top < global.innerHeight && r.bottom > 0) arrive(el); }
    });
  }
  function lifecycle() {
    document.body.classList.toggle('stage-page-hidden', !visible());
    if (visible()) connectCards();
    else if (observer) observer.disconnect();
  }
  function checkScroll() {
    scrollFrame = 0;
    if (!visible() || (typeof global.IntersectionObserver === 'function')) return;
    connectCards();
  }
  function week() {
    var grid = document.getElementById('week-grid');
    if (!grid) return;
    grid.classList.remove('stage-week-a','stage-week-b');
    if (preference.matches) return;
    weekVariant = !weekVariant;
    grid.classList.add(weekVariant ? 'stage-week-a' : 'stage-week-b');
  }
  function update(now, core, data) {
    var hour = Math.floor(now.minute / 60);
    var greeting = hour < 6 ? '夜深了，明天也要从容一点。' : hour < 11 ? '早上好，把今天慢慢展开。' : hour < 14 ? '中午好，给自己一点休息时间。' : hour < 18 ? '下午好，按自己的节奏前进。' : '晚上好，给今天一个漂亮的收尾。';
    var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    var month = Number(now.date.slice(5,7));
    setText('hero-greeting', greeting);
    setText('calendar-month', months[month-1] + ' · ' + month + '月');
    setText('calendar-day', now.date.slice(8,10));
    setText('calendar-weekday', core.dayName(now.date));
    setText('hero-week', core.isPublished(data,now.date) ? '第 ' + core.weekOf(data,now.date) + ' 周 · 好好上课' : '课表待更新');
  }
  function init() {
    if (initialized) return;
    initialized = true;
    document.body.setAttribute('data-stage-ready','true');
    lifecycle();
    document.addEventListener('visibilitychange',lifecycle);
    global.addEventListener('pagehide',function () { document.body.classList.add('stage-page-hidden'); if (observer) observer.disconnect(); });
    global.addEventListener('pageshow',function () { document.body.classList.remove('stage-page-hidden'); lifecycle(); });
    global.addEventListener('scroll',function () { if (!scrollFrame && !(typeof global.IntersectionObserver === 'function')) scrollFrame = requestAnimationFrame(checkScroll); },{ passive:true });
    var changed = function () {
      if (preference.matches) {
        document.querySelectorAll('.stage-card-arrive,.stage-week-a,.stage-week-b').forEach(function (el) { el.classList.remove('stage-card-arrive','stage-week-a','stage-week-b'); });
      }
      lifecycle();
    };
    if (typeof preference.addEventListener === 'function') preference.addEventListener('change',changed);
    else if (typeof preference.addListener === 'function') preference.addListener(changed);
    if (hero && typeof global.IntersectionObserver === 'function') {
      heroObserver = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { hero.classList.toggle('stage-away',!entry.isIntersecting); }); },{ rootMargin:'160px' });
      heroObserver.observe(hero);
    }
  }
  global.CalendarMotion = { init:init, update:update, week:week, version:'mobile-stage-1' };
})(window);
