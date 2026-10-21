/* New CSS-first motion layer. Course data and schedule calculations stay independent. */
(function (global) {
  'use strict';
  var initialized = false, observer, heroObserver, scrollFrame = 0, weekVariant = false;
  var seen = [];
  var preference = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  var hero = document.querySelector('.hero-panel');
  // 每日打气文案集中维护；按北京时间日期轮换，同一天刷新不会换句子。
  var dailyMessages = [
    '先做一点，动力会在路上追上你。',
    '今天多弄懂一点，明天就轻松一点。',
    '不用一下子很厉害，先把今天过扎实。',
    '别等状态满分，现在就能开始。',
    '难题先拆小，做完一小步也算赢。',
    '你认真做过的事，都在给你攒底气。',
    '今天不求开挂，只求比昨天多会一点。',
    '先把书翻开，剩下的边做边来。',
    '累了就歇一会儿，回来接着往前走。',
    '别急着否定自己，你还在进步呢。',
    '把这一件做好，今天就有了好开头。',
    '慢一点没关系，脚下这一步很实在。',
    '今天的认真，会变成以后的从容。',
    '不会就问，不懂就学，你有的是机会。',
    '先试一次，结果可能比想的好。',
    '不用跟谁赶路，把自己的这步走稳。',
    '你已经走到这里了，再给自己一点信心。',
    '做完这一小段，就离目标近了一点。',
    '有点难才正常，你正在学新的东西。',
    '把手机放一会儿，给自己十分钟试试。',
    '今天少一点犹豫，多一个小行动。',
    '不用一口气跑完，向前一点也很好。',
    '犯错不丢人，改会了就是你的本事。',
    '今天学会的一点点，往后都用得上。',
    '没准备完也能出发，边走边变厉害。',
    '把眼前这页看懂，今天就没白努力。',
    '给自己点耐心，好多事都是慢慢会的。',
    '先完成，再慢慢打磨，你能行。',
    '你不需要满格电量，也能迈出第一步。',
    '别怕起步晚，现在开始也在往前。',
    '今天做一点，以后的自己会感谢你。',
    '不顺的时候，先把能做的那一步做好。',
    '把注意力放回自己，下一步你来定。',
    '努力不用很响亮，做出来就很好。',
    '从一道题开始，也能找回状态。',
    '这一次没弄懂，再来一次就有机会。',
    '不用每天都很猛，稳稳坚持也很有劲。',
    '好好吃饭，好好休息，也是在给前进蓄力。',
    '今天值得认真，你也值得被自己鼓励。',
    '先向前一步，再给自己一个肯定。'
  ];
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
    var dayNumber = Math.floor(Date.parse(now.date + 'T00:00:00Z') / 86400000);
    var messageIndex = ((dayNumber % dailyMessages.length) + dailyMessages.length) % dailyMessages.length;
    setText('daily-boost-text', dailyMessages[messageIndex]);
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
