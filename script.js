(() => {
  // عناصر
  const html = document.documentElement;
  const display = document.getElementById("display");
  const keys = document.querySelector(".app");
  const memIndicator = document.querySelector(".memory-indicator");
  const themeToggle = document.getElementById("theme-toggle");

  // قفل پین
  const lock = document.getElementById("lock-screen");
  const pinForm = document.getElementById("pin-form");
  const pinInput = document.getElementById("pin-input");
  const pinReset = document.getElementById("pin-reset");
  const PIN = "2580"; // پین ساده (سمت کاربر)

  // وضعیت ماشین‌حساب
  let current = "0";
  let previous = "";
  let operator = null;
  let justEvaluated = false;

  // حافظه
  let memory = 0;

  // به‌روزرسانی نمایش
  function updateDisplay(text = current) { display.value = text; }
  function updateMemIndicator() { memIndicator.style.opacity = memory !== 0 ? 1 : 0; }

  // پاک‌سازی
  function clearAll() {
    current = "0";
    previous = "";
    operator = null;
    justEvaluated = false;
    updateDisplay();
  }

  // حذف یک رقم
  function backspace() {
    if (justEvaluated) return;
    if (current.length <= 1 || (current.length === 2 && current.startsWith("-"))) {
      current = "0";
    } else {
      current = current.slice(0, -1);
    }
    updateDisplay();
  }

  // اضافه کردن رقم
  function appendDigit(d) {
    if (justEvaluated) {
      current = d;
      justEvaluated = false;
      updateDisplay();
      return;
    }
    if (current === "0") current = d;
    else current += d;
    updateDisplay();
  }

  // ممیز
  function appendDot() {
    if (justEvaluated) {
      current = "0.";
      justEvaluated = false;
      updateDisplay();
      return;
    }
    if (!current.includes(".")) {
      current += ".";
      updateDisplay();
    }
  }

  // درصد
  function percent() {
    const n = parseFloat(current) || 0;
    current = String(+((n / 100).toFixed(12)));
    updateDisplay();
  }

  // ± تغییر علامت
  function plusMinus() {
    if (current === "0") return;
    if (current.startsWith("-")) current = current.slice(1);
    else current = "-" + current;
    updateDisplay();
  }

  // تنظیم عملگر
  function setOperator(op) {
    if (operator && previous !== "" && !justEvaluated) {
      compute();
    } else {
      previous = current;
    }
    operator = op;
    justEvaluated = false;
    current = "0";
  }

  // محاسبه
  function compute() {
    const a = parseFloat(previous);
    const b = parseFloat(current);
    if (isNaN(a) || isNaN(b) || !operator) return;

    let result = 0;
    switch (operator) {
      case "plus":      result = a + b; break;
      case "minus":     result = a - b; break;
      case "multiply":  result = a * b; break;
      case "divide":
        if (b === 0) {
          updateDisplay("خطا: تقسیم بر صفر");
          current = "0"; previous = ""; operator = null; justEvaluated = true;
          return;
        }
        result = a / b;
        break;
    }
    result = +result.toFixed(12);
    current = String(result);
    previous = "";
    operator = null;
    justEvaluated = true;
    updateDisplay();
  }

  // حافظه: MC, MR, M+, M-
  function memOp(kind) {
    const n = parseFloat(current) || 0;
    if (kind === "mc") memory = 0;
    else if (kind === "mr") {
      current = String(memory);
      justEvaluated = false;
      updateDisplay();
      return;
    } else if (kind === "mplus") memory += n;
    else if (kind === "mminus") memory -= n;
    updateMemIndicator();
  }

  // هندل کلیک‌ها (event delegation)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    // Ripple موقعیت
    if (btn.classList.contains("btn")) {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty("--x", `${e.clientX - rect.left}px`);
      btn.style.setProperty("--y", `${e.clientY - rect.top}px`);
    }

    // کلیدهای حافظه
    if (btn.dataset.mem) { memOp(btn.dataset.mem); return; }

    // عملگرها
    if (btn.classList.contains("op")) { setOperator(btn.dataset.op); return; }

    // اعداد
    if (btn.classList.contains("num")) { appendDigit(btn.dataset.num); return; }

    // اکشن‌ها
    const action = btn.dataset.action;
    if (!action) return;
    if (action === "clear") clearAll();
    else if (action === "backspace") backspace();
    else if (action === "dot") appendDot();
    else if (action === "percent") percent();
    else if (action === "equal") compute();
    else if (action === "plusminus") plusMinus();
  });

  // کیبورد
  window.addEventListener("keydown", (e) => {
    const k = e.key;

    // اگر قفل باز نشده، ورودی مستقیم به پین برود
    if (!isUnlocked()) {
      if (/^\d$/.test(k)) { pinInput.value = (pinInput.value + k).slice(0,4); }
      if (k === "Backspace") pinInput.value = pinInput.value.slice(0,-1);
      if (k === "Enter") tryUnlock();
      return;
    }

    if (/^\d$/.test(k)) { appendDigit(k); return; }
    if (k === ".") { appendDot(); return; }
    if (k === "Backspace") { backspace(); return; }
    if (k === "Escape") { clearAll(); return; }
    if (k === "Enter" || k === "=") { e.preventDefault(); compute(); return; }

    if (k === "+") { setOperator("plus"); return; }
    if (k === "-") { setOperator("minus"); return; }
    if (k === "*") { setOperator("multiply"); return; }
    if (k === "/") { setOperator("divide"); return; }
    if (k === "%") { percent(); return; }

    // Alt+P برای ±
    if ((e.altKey || e.metaKey) && (k.toLowerCase() === "p")) { plusMinus(); return; }
  });

  // تم: auto / light / dark با ذخیره‌سازی
  function applyTheme(mode) {
    // mode: "light" | "dark" | "auto"
    if (mode === "auto") {
      html.removeAttribute("data-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      html.setAttribute("data-theme", mode);
    }
  }
  function toggleTheme() {
    const now = html.getAttribute("data-theme");
    const next = now === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    themeToggle.setAttribute("aria-pressed", String(next === "dark"));
  }
  themeToggle.addEventListener("click", toggleTheme);

  // مقداردهی اولیه تم
  (function initTheme(){
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      html.setAttribute("data-theme", saved);
      themeToggle.setAttribute("aria-pressed", String(saved === "dark"));
    } else {
      applyTheme("auto");
      themeToggle.setAttribute("aria-pressed", String(html.getAttribute("data-theme") === "dark"));
    }
    // واکنش به تغییر سیستم
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (!localStorage.getItem("theme")) applyTheme("auto");
    });
  })();

  // قفل: ذخیره در sessionStorage (باز تا بستن تب)
  function isUnlocked() { return sessionStorage.getItem("unlocked") === "1"; }
  function showLock() {
    lock.classList.remove("hidden");
    lock.setAttribute("aria-hidden", "false");
    setTimeout(() => pinInput?.focus(), 0);
  }
  function hideLock() {
    lock.classList.add("hidden");
    lock.setAttribute("aria-hidden", "true");
  }
  function tryUnlock() {
    const v = pinInput.value.trim();
    if (v === PIN) {
      sessionStorage.setItem("unlocked", "1");
      hideLock();
    } else {
      pinInput.value = "";
      pinInput.placeholder = "اشتباه! دوباره";
      pinInput.classList.add("shake");
      setTimeout(() => pinInput.classList.remove("shake"), 300);
    }
  }

  pinForm.addEventListener("submit", (e) => { e.preventDefault(); tryUnlock(); });
  pinReset.addEventListener("click", () => { pinInput.value = ""; pinInput.focus(); });

  // ابتدا اگر باز نشده، قفل را نشان بده
  if (!isUnlocked()) showLock();

  // مقدار اولیه
  updateDisplay();
  updateMemIndicator();
})();
