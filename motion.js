/* 仅负责视觉效果；无依赖，不读取网络，不修改任何课程数据。 */
(function (global) {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const revealed = new WeakSet();
  let initialized = false, observer, scrollPending = false, suspended = false, weekAnimation;
  let opened = false, openingAnimation, resumeFrame;
  const allowed = () => !preference.matches && !suspended && !document.hidden;
  const byId = id => document.getElementById(id);
  function play(element, frames, options) {
    if (!allowed() || !element || typeof element.animate !== 'function') return;
    try {
      const animation = element.animate(frames, options);
      animations.add(animation);
      const clear = () => animations.delete(animation);
      animation.addEventListener('finish', clear, { once: true });
      animation.addEventListener('cancel', clear, { once: true });
      return animation;
    } catch (_) {}
  }
  function stop() {
    if (resumeFrame) { cancelAnimationFrame(resumeFrame); resumeFrame = undefined; }
    // An interrupted opening should still be available when the page is shown.
    if (openingAnimation && openingAnimation.playState !== 'finished') opened = false;
    openingAnimation = undefined;
    for (const animation of animations) animation.cancel();
    animations.clear();
    if (observer) observer.disconnect();
    document.querySelectorAll('.next-panel').forEach(el => { el.style.removeProperty('--tilt-x'); el.style.removeProperty('--tilt-y'); });
  }
  function syncMotion() {
    document.body.classList.toggle('motion-running', allowed() && !document.hidden);
  }
  function reveal(element, index) {
    if (!allowed() || revealed.has(element)) return;
    revealed.add(element);
    const side = index % 2 ? 1 : -1;
    play(element, [
      { opacity: .12, transform: `translateY(48px) translateX(${side * 10}px) scale(.94) rotate(${side * .9}deg)` },
      { opacity: 1, transform: 'translateY(-4px) scale(1.006) rotate(0deg)', offset: .78 },
      { opacity: 1, transform: 'translateY(0) translateX(0) scale(1) rotate(0deg)' }
    ], { duration: 900, delay: Math.min(index * 110, 440), easing: 'cubic-bezier(.16,.8,.22,1)', fill: 'backwards' });
  }
  function calendarOpen() {
    play(document.querySelector('.hero-calendar'), [
      { transform: 'translateY(38px) rotate(16deg) scale(.6)', opacity: .1 },
      { transform: 'translateY(-8px) rotate(-8deg) scale(1.06)', opacity: 1, offset: .7 },
      { transform: 'translateY(0) rotate(-4deg) scale(1)', opacity: 1 }
    ], { duration: 1100, easing: 'cubic-bezier(.18,.75,.25,1)' });
    openingAnimation = play(document.querySelector('.calendar-leaf'), [
      { transform: 'rotateX(0deg)', opacity: 1 },
      { transform: 'rotateX(-15deg)', opacity: 1, offset: .22 },
      { transform: 'rotateX(-145deg)', opacity: .6, offset: .82 },
      { transform: 'rotateX(-175deg)', opacity: 0 }
    ], { duration: 1250, delay: 200, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'backwards' });
    document.querySelectorAll('.title-line').forEach((line, i) => play(line, [
      { opacity: .05, transform: 'translateY(32px) rotate(4deg)' },
      { opacity: 1, transform: 'translateY(0) rotate(0deg)' }
    ], { duration: 850, delay: 140 + i * 160, easing: 'cubic-bezier(.16,.8,.22,1)', fill: 'backwards' }));
    play(document.querySelector('.calendar-week-chip'), [
      { transform: 'translateY(16px) rotate(-10deg) scale(.6)', opacity: 0 },
      { transform: 'translateY(0) rotate(4deg) scale(1.08)', opacity: 1, offset: .75 },
      { transform: 'translateY(0) rotate(4deg) scale(1)', opacity: 1 }
    ], { duration: 700, delay: 650, easing: 'ease-out', fill: 'backwards' });
    play(document.querySelector('.brand-icon'), [
      { transform: 'rotate(-35deg) scale(.65)' },
      { transform: 'rotate(12deg) scale(1.14)', offset: .65 },
      { transform: 'rotate(0deg) scale(1)' }
    ], { duration: 1000, easing: 'ease-out' });
  }
  function entrance() {
    if (!allowed()) return;
    if (observer) observer.disconnect();
    if (!opened) { opened = true; calendarOpen(); }
    const elements = [...document.querySelectorAll('.notice,.next-panel,.today-panel,.tomorrow-panel,.week-toolbar,.changes-panel,footer')].filter(el => !revealed.has(el));
    elements.sort((a,b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    if ('IntersectionObserver' in global) {
      observer = new IntersectionObserver(entries => {
        let index = 0;
        entries.forEach(entry => { if (entry.isIntersecting) { reveal(entry.target, index++); observer.unobserve(entry.target); } });
      }, { threshold: .04 });
    }
    let index = 0;
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) reveal(el, index++);
      else if (observer) observer.observe(el);
    });
  }
  function resume() {
    syncMotion();
    if (!allowed()) return;
    if (resumeFrame) cancelAnimationFrame(resumeFrame);
    // Wait until the restored mobile page has a visible rendering frame.
    resumeFrame = requestAnimationFrame(() => {
      resumeFrame = requestAnimationFrame(() => {
        resumeFrame = undefined;
        if (allowed()) { syncMotion(); updateScroll(); entrance(); }
      });
    });
  }
  function week() {
    // Keep rapid navigation responsive: replace the previous transition immediately.
    if (weekAnimation) weekAnimation.cancel();
    weekAnimation = play(byId('week-grid'), [{ opacity: .72 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
  }
  function update(now, core, data) {
    const hour = Math.floor(now.minute / 60);
    const greeting = hour < 6 ? '夜深了，明天也要从容一点。' : hour < 11 ? '早上好，把今天慢慢展开。' : hour < 14 ? '中午好，给自己一点休息时间。' : hour < 18 ? '下午好，按自己的节奏前进。' : '晚上好，给今天一个漂亮的收尾。';
    const date = new Date(now.date + 'T00:00:00+08:00');
    const month = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Shanghai', month:'short' }).format(date).toUpperCase();
    const values = { 'hero-greeting': greeting, 'calendar-month': `${month} · ${Number(now.date.slice(5,7))}月`, 'calendar-day': String(Number(now.date.slice(8,10))).padStart(2,'0'), 'calendar-leaf-day': String(Number(core.addDays(now.date,-1).slice(8,10))).padStart(2,'0'), 'calendar-weekday': core.dayName(now.date), 'hero-week': core.isPublished(data,now.date) ? `第 ${core.weekOf(data,now.date)} 周 · 好好上课` : '课表待更新' };
    Object.entries(values).forEach(([id,value]) => { const el=byId(id); if(el && el.textContent!==value) el.textContent=value; });
  }
  function updateScroll() {
    scrollPending = false;
    const range = document.documentElement.scrollHeight - innerHeight;
    const progress = range > 0 ? Math.min(1,Math.max(0,scrollY/range)) : 0;
    const bar = document.querySelector('.reading-progress');
    if(bar) bar.style.transform=`scaleX(${progress})`;
  }
  function init() {
    if (initialized) return;
    initialized = true;
    const preferenceChanged = () => { stop(); resume(); };
    if(typeof preference.addEventListener === 'function') preference.addEventListener('change', preferenceChanged);
    else if(typeof preference.addListener === 'function') preference.addListener(preferenceChanged);
    global.addEventListener('scroll',()=>{ if(!scrollPending) {scrollPending=true;requestAnimationFrame(updateScroll);} },{passive:true});
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) { stop(); syncMotion(); } else resume(); });
    global.addEventListener('pagehide',()=>{ suspended=true;stop();syncMotion(); });
    global.addEventListener('pageshow',()=>{ suspended=false;resume(); });
    global.addEventListener('beforeprint',()=>{suspended=true;stop();syncMotion();});
    global.addEventListener('afterprint',()=>{suspended=false;resume();});
    if(matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const card=document.querySelector('.next-panel');
      if(card){
        card.addEventListener('pointermove',e=>{if(!allowed())return;const r=card.getBoundingClientRect();card.style.setProperty('--tilt-x',`${-(e.clientY-r.top-r.height/2)/r.height*5}deg`);card.style.setProperty('--tilt-y',`${(e.clientX-r.left-r.width/2)/r.width*5}deg`);});
        card.addEventListener('pointerleave',()=>{card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');});
      }
    }
    syncMotion(); updateScroll(); entrance();
  }
  global.CalendarMotion={init,update,week};
})(window);
