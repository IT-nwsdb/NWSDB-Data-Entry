/* Project Data Entry - Firebase Firestore backend (ESM module) */

// Firebase (browser modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
// (This config is public. Do NOT put Admin SDK keys or service accounts in client code.)
const firebaseConfig = {
  apiKey: "AIzaSyCjRd-bHpMwHXjXMYu9PgXFcHiLXXGW8bE",
  authDomain: "project-data-entry-198d0.firebaseapp.com",
  projectId: "project-data-entry-198d0",
  storageBucket: "project-data-entry-198d0.firebasestorage.app",
  messagingSenderId: "756259806254",
  appId: "1:756259806254:web:65762883c470107e6c93bf",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(function(){
  const SHEETS = {
    proposed: {
      title: "Proposed Projects",
      subtitle: "",
      storageKey: "pde_sheet_proposed_v1",
      autoNumber: true,
      columns: [
        { key: "No", label: "No", type: "number", className: "numeric", placeholder: "1" },
        { key: "ProjectName", label: "Project Name", type: "text", placeholder: "e.g., Kundasale Haragama WSP" },
        { key: "District", label: "District", type: "text", placeholder: "e.g., Kandy" },
        { key: "Connections", label: "No of Connections", type: "text", placeholder: "e.g., 39000" },
        { key: "TEC", label: "TEC (Rs. Mn)", type: "number", className: "numeric", placeholder: "0" },
        { key: "PACApproval", label: "PAC Approval", type: "text", placeholder: "e.g., 01.10.2014" },
        { key: "BoardApproval", label: "Board Approval", type: "text", placeholder: "e.g., 05.11.2014" },
        { key: "NPDApproval", label: "NPD Approval", type: "text", placeholder: "e.g., No / Sent to Ministry" },
        { key: "PresentStatus", label: "Present Status", type: "textarea", placeholder: "Enter current status…" }
      ]
    },
    feasibility: {
      title: "Under Feasibility",
      subtitle: "",
      storageKey: "pde_sheet_feasibility_v1",
      autoNumber: true,
      columns: [
        { key: "No", label: "No", type: "number", className: "numeric", placeholder: "1" },
        { key: "Project", label: "Project", type: "text", placeholder: "e.g., Norwood Water Supply Project" },
        { key: "WaterSource", label: "Water Source", type: "text", placeholder: "e.g., Kehelgamu oya" },
        { key: "PresentStatus", label: "Present Status", type: "textarea", placeholder: "Enter present status…" },
        { key: "ExpectedCompletion", label: "Expected Completion Date of Feasibility", type: "date", placeholder: "" }
      ]
    },
    rechargable: {
      title: "Rechargable",
      subtitle: "",
      storageKey: "pde_sheet_rechargable_v1",
      autoNumber: true,
      columns: [
        { key: "No", label: "No", type: "number", className: "numeric", placeholder: "1" },
        { key: "Scheme", label: "Scheme", type: "text", placeholder: "e.g., Thennelanda CBO" },
        { key: "ScopeOfWork", label: "Scope of work", type: "textarea", placeholder: "Describe scope of work…" },
        { key: "Progess", label: "Progess", type: "textarea", placeholder: "Progress updates…" },
        { key: "PaymentReceived", label: "Payment Received (Rs)", type: "number", className: "numeric", placeholder: "0" },
        { key: "NWSDBCharges", label: "NWSDB Charges (Rs)", type: "number", className: "numeric", placeholder: "0" }
      ]
    }
  };

  // DOM
  const homeView = document.getElementById("homeView");
  const sheetView = document.getElementById("sheetView");
  const sheetTitle = document.getElementById("sheetTitle");
  const sheetSubtitle = document.getElementById("sheetSubtitle");
  const dataTable = document.getElementById("dataTable");
  const thead = dataTable.querySelector("thead");
  const tbody = dataTable.querySelector("tbody");
  const rowCountBadge = document.getElementById("rowCountBadge");

  const btnAddRow = document.getElementById("btnAddRow");
  const btnSave = document.getElementById("btnSave");
  const btnClear = document.getElementById("btnClear");

  const toastEl = document.getElementById("appToast");
  const toastBody = document.getElementById("toastBody");
  const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 2200 }) : null;

  let currentSheetKey = null;
  let currentRows = [];

  function showToast(message){
    if(!toast) return;
    toastBody.textContent = message;
    toast.show();
  }

  function setControlsEnabled(enabled){
    btnAddRow.disabled = !enabled;
    btnSave.disabled = !enabled;
    btnClear.disabled = !enabled;
  }

  async function loadSheetRows(sheetKey){
    // Firestore data model:
    //   pde_sheets/{sheetKey}
    //     - rows: Array<Object>
    //     - updatedAt: timestamp
    const ref = doc(db, "pde_sheets", sheetKey);
    const snap = await getDoc(ref);
    if(!snap.exists()) return [];
    const data = snap.data();
    const rows = data?.rows;
    return Array.isArray(rows) ? rows : [];
  }

  async function saveSheetRows(sheetKey, rows){
    const ref = doc(db, "pde_sheets", sheetKey);
    await setDoc(ref, {
      rows,
      updatedAt: serverTimestamp(),
      schemaVersion: 1,
    }, { merge: true });
  }

  function nextAutoNo(rows){
    // Find max numeric No and add 1
    let maxNo = 0;
    for(const r of rows){
      const n = Number(r.No);
      if(Number.isFinite(n)) maxNo = Math.max(maxNo, n);
    }
    return maxNo + 1;
  }

  function makeInput(col, value, rowIndex){
    const v = value ?? "";
    let el;
    if(col.type === "textarea"){
      el = document.createElement("textarea");
      el.className = "form-control form-control-sm cell-textarea";
      el.placeholder = col.placeholder || "";
      el.value = v;
    } else {
      el = document.createElement("input");
      el.type = col.type === "date" ? "date" : (col.type || "text");
      el.className = "form-control form-control-sm cell-input";
      el.placeholder = col.placeholder || "";
      el.value = v;
      if(col.type === "number"){
        el.inputMode = "decimal";
      }
    }
    if(col.className) el.classList.add(col.className);
    el.dataset.rowIndex = String(rowIndex);
    el.dataset.key = col.key;

    el.addEventListener("input", (e) => {
      const ri = Number(e.target.dataset.rowIndex);
      const key = e.target.dataset.key;
      currentRows[ri] = currentRows[ri] || {};
      currentRows[ri][key] = e.target.value;
      markDirty(true);
    });

    return el;
  }

  let isDirty = false;
  function markDirty(v){
    isDirty = v;
    btnSave.classList.toggle("btn-warning", isDirty);
    btnSave.classList.toggle("btn-outline-light", !isDirty);
    btnSave.classList.toggle("btn-light", !isDirty);
    if(isDirty){
      btnSave.textContent = "Save*";
    } else {
      btnSave.textContent = "Save";
    }
  }

  function renderTable(sheetKey){
    const cfg = SHEETS[sheetKey];
    // Header
    thead.innerHTML = "";

    // Special grouped header for Proposed Projects to match Excel ("Previous Approval" over TEC + approvals)
    if(sheetKey === "proposed"){
      const trTop = document.createElement("tr");
      const trSub = document.createElement("tr");

      // Action column (rowspan 2)
      const thAction = document.createElement("th");
      thAction.textContent = "";
      thAction.style.width = "1%";
      thAction.rowSpan = 2;
      trTop.appendChild(thAction);

      // Rowspan headers for the first 4 data columns
      const topKeys = ["No","ProjectName","District","Connections"];
      for(const k of topKeys){
        const col = cfg.columns.find(c => c.key === k);
        const th = document.createElement("th");
        th.textContent = col ? col.label : "";
        th.rowSpan = 2;
        trTop.appendChild(th);
      }

      // Group header
      const thGroup = document.createElement("th");
      thGroup.textContent = "Previous Approval";
      thGroup.colSpan = 4;
      thGroup.className = "text-center group-header";
      trTop.appendChild(thGroup);

      // Present Status (rowspan 2)
      const colPS = cfg.columns.find(c => c.key === "PresentStatus");
      const thPS = document.createElement("th");
      thPS.textContent = colPS ? colPS.label : "Present Status";
      thPS.rowSpan = 2;
      trTop.appendChild(thPS);

      // Sub headers under group
      const subKeys = ["TEC","PACApproval","BoardApproval","NPDApproval"];
      for(const k of subKeys){
        const col = cfg.columns.find(c => c.key === k);
        const th = document.createElement("th");
        th.textContent = col ? col.label : "";
        trSub.appendChild(th);
      }

      thead.appendChild(trTop);
      thead.appendChild(trSub);
    } else {
      const trh = document.createElement("tr");

      // Action column
      const thAction = document.createElement("th");
      thAction.textContent = "";
      thAction.style.width = "1%";
      trh.appendChild(thAction);

      for(const col of cfg.columns){
        const th = document.createElement("th");
        th.textContent = col.label;
        trh.appendChild(th);
      }
      thead.appendChild(trh);
    }

    // Body
    tbody.innerHTML = "";
    currentRows.forEach((row, idx) => {
      const tr = document.createElement("tr");

      // Delete button
      const tdDel = document.createElement("td");
      tdDel.className = "text-nowrap";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-outline-danger btn-sm";
      btn.textContent = "Delete";
      btn.addEventListener("click", () => {
        if(!confirm("Delete this row?")) return;
        currentRows.splice(idx, 1);
        renderTable(sheetKey);
        markDirty(true);
        updateRowCount();
      });
      tdDel.appendChild(btn);
      tr.appendChild(tdDel);

      cfg.columns.forEach((col) => {
        const td = document.createElement("td");
        const input = makeInput(col, row[col.key], idx);
        td.appendChild(input);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    updateRowCount();
    markDirty(false);
  }

  function updateRowCount(){
    rowCountBadge.textContent = `${currentRows.length} row${currentRows.length === 1 ? "" : "s"}`;
  }

  async function openSheet(sheetKey){
    const cfg = SHEETS[sheetKey];
    currentSheetKey = sheetKey;
    sheetTitle.textContent = cfg.title;
    sheetSubtitle.textContent = cfg.subtitle || "";
    sheetSubtitle.classList.toggle("d-none", !cfg.subtitle);

    setControlsEnabled(false);
    btnSave.textContent = "Loading…";
    try {
      currentRows = await loadSheetRows(sheetKey);
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to load data.");
      currentRows = [];
    }

    homeView.classList.add("d-none");
    sheetView.classList.remove("d-none");
    setControlsEnabled(true);

    // Highlight nav link
    document.querySelectorAll("[data-sheet]").forEach(a => {
      a.classList.toggle("active", a.dataset.sheet === sheetKey && a.classList.contains("nav-link"));
    });

    renderTable(sheetKey);
  }

  function goHome(){
    if(isDirty){
      if(!confirm("You have unsaved changes. Go back anyway?")) return;
    }
    currentSheetKey = null;
    currentRows = [];
    homeView.classList.remove("d-none");
    sheetView.classList.add("d-none");
    setControlsEnabled(false);

    document.querySelectorAll(".nav-link[data-sheet]").forEach(a => a.classList.remove("active"));
  }

  function addRow(){
    const cfg = SHEETS[currentSheetKey];
    const row = {};
    if(cfg.autoNumber){
      row.No = String(nextAutoNo(currentRows));
    }
    currentRows.push(row);
    renderTable(currentSheetKey);
    markDirty(true);

    // focus first editable cell
    const firstInput = tbody.querySelector("tr:last-child td:nth-child(3) input, tr:last-child td:nth-child(3) textarea");
    if(firstInput) firstInput.focus();
  }

  async function clearSheet(){
    const cfg = SHEETS[currentSheetKey];
    if(!confirm(`Clear all rows in "${cfg.title}"?`)) return;
    currentRows = [];
    try {
      setControlsEnabled(false);
      await saveSheetRows(currentSheetKey, currentRows);
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to clear.");
    } finally {
      setControlsEnabled(true);
    }
    renderTable(currentSheetKey);
    showToast("Cleared.");
  }

  async function save(){
    try {
      setControlsEnabled(false);
      btnSave.textContent = "Saving…";
      await saveSheetRows(currentSheetKey, currentRows);
      markDirty(false);
      showToast("Saved.");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Save failed (check Firestore rules). ");
    } finally {
      btnSave.textContent = isDirty ? "Save*" : "Save";
      setControlsEnabled(true);
    }
  }

  // Wire up events
  document.querySelectorAll("button[data-sheet], a.nav-link[data-sheet]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const sheetKey = el.dataset.sheet;
      if(!SHEETS[sheetKey]) return;
      openSheet(sheetKey);
    });
  });

  document.getElementById("homeLink").addEventListener("click", (e) => { e.preventDefault(); goHome(); });

  btnAddRow.addEventListener("click", addRow);
  btnSave.addEventListener("click", save);
  btnClear.addEventListener("click", clearSheet);

  // Warn before refresh/close if dirty
  window.addEventListener("beforeunload", (e) => {
    if(!isDirty) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // Start at home
  goHome();

})();
