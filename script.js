// ===== STORAGE KEY =====
const STORAGE_KEY = "bankTrackerTransactions";

// ===== STATE =====
let transactions = loadTransactions();
let currentType = "credit"; // credit or debit

// ===== DOM ELEMENTS =====
const balanceAmountEl = document.getElementById("balanceAmount");
const totalCreditedEl = document.getElementById("totalCredited");
const totalDebitedEl = document.getElementById("totalDebited");

const form = document.getElementById("transactionForm");
const amountInput = document.getElementById("amount");
const noteInput = document.getElementById("note");
const dateInput = document.getElementById("date");
const transactionTypeInput = document.getElementById("transactionType");

const creditBtn = document.getElementById("creditBtn");
const debitBtn = document.getElementById("debitBtn");
const submitBtn = document.getElementById("submitBtn");

const transactionList = document.getElementById("transactionList");
const emptyMessage = document.getElementById("emptyMessage");
const filterType = document.getElementById("filterType");
const clearAllBtn = document.getElementById("clearAllBtn");

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  dateInput.value = new Date().toISOString().split("T")[0]; // default to today
  render();
});

// ===== LOCAL STORAGE HELPERS =====
function loadTransactions() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// ===== TYPE TOGGLE (Credit / Debit) =====
creditBtn.addEventListener("click", () => setType("credit"));
debitBtn.addEventListener("click", () => setType("debit"));

function setType(type) {
  currentType = type;
  transactionTypeInput.value = type;

  creditBtn.classList.toggle("active", type === "credit");
  debitBtn.classList.toggle("active", type === "debit");

  if (type === "credit") {
    submitBtn.textContent = "Add Credit";
    submitBtn.classList.remove("debit-mode");
  } else {
    submitBtn.textContent = "Add Debit";
    submitBtn.classList.add("debit-mode");
  }
}

// ===== FORM SUBMIT (Add Transaction) =====
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const amount = parseFloat(amountInput.value);
  const note = noteInput.value.trim();
  const date = dateInput.value;

  if (!amount || amount <= 0 || !note || !date) {
    alert("Please fill all fields with valid values.");
    return;
  }

  const newTransaction = {
    id: Date.now(),
    type: currentType,
    amount: amount,
    note: note,
    date: date,
  };

  transactions.unshift(newTransaction); // newest first
  saveTransactions();
  render();

  // reset form (keep type selection as is)
  amountInput.value = "";
  noteInput.value = "";
  dateInput.value = new Date().toISOString().split("T")[0];
  amountInput.focus();
});

// ===== DELETE SINGLE TRANSACTION =====
function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  render();
}

// ===== CLEAR ALL =====
clearAllBtn.addEventListener("click", () => {
  if (transactions.length === 0) return;
  const confirmClear = confirm("This will delete ALL transactions and reset balance to ₹0. Continue?");
  if (confirmClear) {
    transactions = [];
    saveTransactions();
    render();
  }
});

// ===== FILTER =====
filterType.addEventListener("change", render);

// ===== RENDER EVERYTHING =====
function render() {
  renderBalanceAndSummary();
  renderTransactionList();
}

function renderBalanceAndSummary() {
  let totalCredited = 0;
  let totalDebited = 0;

  transactions.forEach((t) => {
    if (t.type === "credit") totalCredited += t.amount;
    else totalDebited += t.amount;
  });

  const balance = totalCredited - totalDebited;

  balanceAmountEl.textContent = formatCurrency(balance);
  totalCreditedEl.textContent = formatCurrency(totalCredited);
  totalDebitedEl.textContent = formatCurrency(totalDebited);
}

function renderTransactionList() {
  const filter = filterType.value;
  const filtered =
    filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  transactionList.innerHTML = "";

  if (filtered.length === 0) {
    emptyMessage.style.display = "block";
    return;
  } else {
    emptyMessage.style.display = "none";
  }

  filtered.forEach((t) => {
    const li = document.createElement("li");
    li.className = `transaction-item ${t.type}`;

    const sign = t.type === "credit" ? "+" : "−";

    li.innerHTML = `
      <div class="txn-left">
        <span class="txn-note">${escapeHtml(t.note)}</span>
        <span class="txn-date">${formatDate(t.date)} • ${t.type === "credit" ? "Credited" : "Debited"}</span>
      </div>
      <div class="txn-right">
        <span class="txn-amount ${t.type}">${sign} ${formatCurrency(t.amount)}</span>
        <button class="delete-btn" title="Delete" data-id="${t.id}">✕</button>
      </div>
    `;

    transactionList.appendChild(li);
  });

  // attach delete listeners
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-id"));
      deleteTransaction(id);
    });
  });
}

// ===== HELPERS =====
function formatCurrency(value) {
  return "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}