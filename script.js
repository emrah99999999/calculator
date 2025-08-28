(() => {
  const display = document.getElementById("display");
  const keys = document.querySelector(".keys");

  let current = "0";
  let previous = "";
  let operator = null;
  let justEvaluated = false;

  function updateDisplay(text = current) {
    display.value = text;
  }

  function clearAll() {
    current = "0";
    previous = "";
    operator = null;
    justEvaluated = false;
    updateDisplay();
  }

  function backspace() {
    if (justEvaluated) return; // بعد از مساوی، بک‌اسپیس نزنیم
    if (current.length <= 1 || (current.length === 2 && current.startsWith("-"))) {
      current = "0";
    } else {
      current = current.slice(0, -1);
    }
    updateDisplay();
  }

  function appendDigit(d) {
    if (justEvaluated) {
      current = d;
      justEvaluated = false;
      updateDisplay();
      return;
    }
    if (current === "0") {
      current = d;
    } else {
      current += d;
    }
    updateDisplay();
  }

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

  function percent() {
    const n = parseFloat(current) || 0;
    current = String(+((n / 100).toFixed(12)));
    updateDisplay();
  }

  function setOperator(op) {
    // اگر قبلا عملگر داشتیم و کاربر عدد جدید وارد کرده، قبلی رو حساب کنیم
    if (operator && previous !== "" && !justEvaluated) {
      compute();
    } else {
      previous = current;
    }
    operator = op;
    justEvaluated = false;
    current = "0";
  }

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
          updateDisplay("خطای تقسیم بر صفر");
          current = "0";
          previous = "";
          operator = null;
          justEvaluated = true;
          return;
        }
        result = a / b;
        break;
    }
    // کنترل خطای اعشار
    result = +result.toFixed(12);
    current = String(result);
    previous = "";
    operator = null;
    justEvaluated = true;
    updateDisplay();
  }

  // رویداد کلیک روی دکمه‌ها
  keys.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.classList.contains("num")) {
      appendDigit(btn.dataset.num);
      return;
    }
    if (btn.classList.contains("op")) {
      setOperator(btn.dataset.op);
      return;
    }
    const action = btn.dataset.action;
    if (action === "clear") clearAll();
    else if (action === "backspace") backspace();
    else if (action === "dot") appendDot();
    else if (action === "percent") percent();
    else if (action === "equal") compute();
  });

  // پشتیبانی از کیبورد
  window.addEventListener("keydown", (e) => {
    const k = e.key;

    if (/^\d$/.test(k)) { appendDigit(k); return; }
    if (k === ".") { appendDot(); return; }
    if (k === "Backspace") { backspace(); return; }
    if (k === "Escape") { clearAll(); return; }
    if (k === "Enter" || k === "=") { e.preventDefault(); compute(); return; }

    if (k === "+" ) { setOperator("plus"); return; }
    if (k === "-" ) { setOperator("minus"); return; }
    if (k === "*" ) { setOperator("multiply"); return; }
    if (k === "/" ) { setOperator("divide"); return; }
    if (k === "%")  { percent(); return; }
  });

  // مقدار اولیه
  updateDisplay();
})();
