(() => {
  // عناصر اصلی
  const display = document.getElementById("display");
  const app = document.querySelector(".app");
  const fx = document.getElementById("fx-layer");

  // قفل
  const lock = document.getElementById("lock-screen");
  const pinForm = document.getElementById("pin-form");
  const pinInput = document.getElementById("pin-input");
  const pinReset = document.getElementById("pin-reset");

  // تنظیمات رمز: یکی از این دو را استفاده کن
  // 1) ساده و آماده: رشتهٔ رمز به‌صورت متن (پیش‌فرض 2580). امنیت پایین.
  const PIN_PLAIN = "2580";

  // 2) گزینهٔ بهتر: مقایسه هش SHA-256 (اختیاری). اگر فعال می‌کنی، PIN_PLAIN را null بگذار.
  // مقدار زیر باید هش SHA-256 رمز باشد (hex). راهنما در پایین فایل آمده.
  const PIN_HASH = null; // مثال: "6cf615d5d1...<hash>"

  // وضعیت ماشین‌حساب
  let current = "0";
  let previous = "";
  let operator = null;
  let justEvaluated = false;

  // به‌روزرسانی نمایش
  function updateDisplay(text = current){ display.value = text; }

  // پاک‌سازی
  function clearAll(){
    current = "0"; previous = ""; operator = null; justEvaluated = false;
    updateDisplay();
  }

  // حذف یک رقم
  function backspace(){
    if (justEvaluated) return;
    if (current.length <= 1 || (current.length === 2 && current.startsWith("-"))) current = "0";
    else current = current.slice(0, -1);
    updateDisplay();
  }

  // اضافه کردن رقم
  function appendDigit(d){
    flyDigit(d);
    if (justEvaluated){ current = d; justEvaluated = false; updateDisplay(); return; }
    current = (current === "0") ? d : current + d;
    updateDisplay();
  }

  // ممیز
  function appendDot(){
    if (justEvaluated){ current = "0."; justEvaluated = false; updateDisplay(); return; }
    if (!current.includes(".")){ current += "."; updateDisplay(); }
  }

  // درصد
  function percent(){
    const n = parseFloat(current) || 0;
    current = String(+((n / 100).toFixed(12)));
    updateDisplay();
  }

  // تنظیم عملگر
  function setOperator(op, btnEl){
    if (operator && previous !== "" && !justEvaluated) compute();
    else previous = current;
    operator = op;
    justEvaluated = false;
    current = "0";
    markActiveOperator(btnEl);
  }

  // محاسبه
  function compute(){
    const a = parseFloat(previous);
    const b = parseFloat(current);
    if (isNaN(a) || isNaN(b) || !operator) return;

    let result = 0;
    switch (operator) {
      case "plus": result = a + b; break;
      case "minus": result = a - b; break;
      case "multiply": result = a * b; break;
      case "divide":
        if (b === 0){
          updateDisplay("خطا: تقسیم بر صفر");
          vibrate(40);
          current = "0"; previous = ""; operator = null; justEvaluated = true;
          unmarkOperators();
          return;
        }
        result = a / b;
        break;
    }
    result = +result.toFixed(12);
    current = String(result);
    previous = ""; operator = null; justEvaluated = true;
    updateDisplay();
    highlightResult();
    celebrate();
    unmarkOperators();
  }

  // هایلایت نتیجه
  function highlightResult(){
    display.classList.add("highlight");
    setTimeout(() => display.classList.remove("highlight"), 500);
    vibrate(10);
  }

  // نشانه‌گذاری عملگر فعال
  function unmarkOperators(){
    document.querySelectorAll(".btn.op.active").forEach(b => b.classList.remove("active"));
  }
  function markActiveOperator(btn){
    unmarkOperators();
    if (btn) btn.classList.add("active");
  }

  // Ripple: جای‌گذاری مختصات کلیک در CSS vars
  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty("--x", `${e.clientX - rect.left}px`);
    btn.style.setProperty("--y", `${e.clientY - rect.top}px`);
  });

  // پرتاب رقم به نمایشگر
  function flyDigit(ch){
    const btn = document.querySelector(`.btn.num[data-num="${CSS.escape(ch)}"]`);
    if (!btn) return;
    const start = btn.getBoundingClientRect();
    const end = display.getBoundingClientRect();

    const el = document.createElement("span");
    el.textContent = ch;
    Object.assign(el.style, {
      position: "fixed",
      left: `${start.left + start.width/2}px`,
      top: `${start.top + start.height/2}px`,
      transform: "translate(-50%,-50%)",
      fontSize: "18px",
      color: "rgba(255,255,255,.9)",
      zIndex: 5,
      pointerEvents: "none",
      transition: "transform .45s cubic-bezier(.2,.6,.2,1), opacity .45s ease",
      opacity: "1",
      willChange: "transform, opacity"
    });
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      const dx = (end.left + end.width - start.left) * 0.4;
      const dy = (end.top - start.top) * 0.6;
      el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.6)`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 480);
  }

  // ذره‌افشانی کوچک روی مساوی
  function celebrate(){
    const center = display.getBoundingClientRect();
    const cx = center.left + center.width - 18;
    const cy = center.top + 18;

    for (let i=0;i<10;i++){
      const p = document.createElement("i");
      const angle = Math.random()*2*Math.PI;
      const dist = 30 + Math.random()*30;
      const x = Math.cos(angle)*dist;
      const y = Math.sin(angle)*dist;
      const hue = 120 + Math.random()*120;
      Object.assign(p.style, {
        position:"fixed", left:`${cx}px`, top:`${cy}px`,
        width:"6px", height:"6px", borderRadius:"999px",
        background:`hsl(${hue} 90% 50%)`,
        transform:"translate(-50%,-50%)",
        opacity:"1", pointerEvents:"none",
        transition:"transform .6s ease, opacity .6s ease",
        zIndex: 6
      });
      fx.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        p.style.opacity = "0";
      });
      setTimeout(() => p.remove(), 700);
    }
  }

  // ویبره اختیاری (پشتیبانی‌دار)
  function vibrate(ms){ if (navigator.vibrate) navigator.vibrate(ms); }

  // رویداد کلیک‌ها
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn || lockIsVisible()) return;

    if (btn.classList.contains("num")){ appendDigit(btn.dataset.num); return; }
    if (btn.classList.contains("op")){ setOperator(btn.dataset.op, btn); return; }

    const action = btn.dataset.action;
    if (!action) return;
    if (action === "clear") clearAll();
    else if (action === "backspace") backspace();
    else if (action === "dot") appendDot();
    else if (action === "percent") percent();
    else if (action === "equal") compute();
  });

  // کیبورد
  window.addEventListener("keydown", (e) => {
    const k = e.key;

    // اگر قفل باز نشده، ورودی به فرم قفل برود
    if (lockIsVisible()){
      if (/^.$/.test(k) && !["Shift","Alt","Meta","Control"].includes(k)){
        // اجازه تایپ و بک‌اسپیس
      }
      if (k === "Enter") { e.preventDefault(); tryUnlock(); }
      return;
    }

    if (/^\d$/.test(k)) { appendDigit(k); return; }
    if (k === ".") { appendDot(); return; }
    if (k === "Backspace") { backspace(); return; }
    if (k === "Escape") { clearAll(); return; }
    if (k === "Enter" || k === "=") { e.preventDefault(); compute(); return; }

    if (k === "+") { setOperator("plus", document.querySelector('.btn.op[data-op="plus"]')); return; }
    if (k === "-") { setOperator("minus", document.querySelector('.btn.op[data-op="minus"]')); return; }
    if (k === "*") { setOperator("multiply", document.querySelector('.btn.op[data-op="multiply"]')); return; }
    if (k === "/") { setOperator("divide", document.querySelector('.btn.op[data-op="divide"]')); return; }
    if (k === "%") { percent(); return; }
  });

  // قفل: باز/بسته
  function lockIsVisible(){ return !lock.classList.contains("hidden"); }
  function showLock(){
    lock.classList.remove("hidden");
    lock.setAttribute("aria-hidden", "false");
    setTimeout(() => pinInput.focus(), 0);
  }
  function hideLock(){
    lock.classList.add("hidden");
    lock.setAttribute("aria-hidden", "true");
  }

  // باز کردن قفل
  pinForm.addEventListener("submit", (e) => { e.preventDefault(); tryUnlock(); });
  pinReset.addEventListener("click", () => { pinInput.value = ""; pinInput.focus(); });

  async function tryUnlock(){
    const input = pinInput.value.trim();

    // حالت هش فعال است؟
    if (!PIN_PLAIN && PIN_HASH){
      try{
        const ok = (await sha256Hex(input)) === PIN_HASH.toLowerCase();
        if (ok){ sessionStorage.setItem("unlocked","1"); hideLock(); return; }
      } catch {}
      wrongPin();
      return;
    }

    // حالت ساده‌ی پیش‌فرض
    if (input === PIN_PLAIN){
      sessionStorage.setItem("unlocked","1");
      hideLock();
    } else {
      wrongPin();
    }
  }

  function wrongPin(){
    pinInput.value = "";
    pinInput.placeholder = "اشتباه! دوباره";
    pinInput.classList.add("shake");
    vibrate(40);
    setTimeout(() => pinInput.classList.remove("shake"), 300);
  }

  // اگر تب تازه باز شده و هنوز unlock نشده، قفل را نشان بده
  if (sessionStorage.getItem("unlocked") !== "1"){ showLock(); }
  else { hideLock(); }

  // ابزار: محاسبه SHA-256 در مرورگر و خروجی hex
  async function sha256Hex(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map(b => b.toString(16).padStart(2,"0")).join("");
  }

  // مقدار اولیه
  updateDisplay();
})();
