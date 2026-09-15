/* ===================================================================
   Student Task Manager — script.js
   ===================================================================
   Fixes applied:
   1. listContainer now correctly targets "taskList" (was "tasktList").
   2. Theme storage key unified to "StudentTaskManagerTheme" everywhere.
   3. openEdit() no longer reads `tasks` before it's assigned.
   4. deleteTask() now saves the filtered array (was referencing an
      undefined `tasks` variable).
   =================================================================== */
 
// ---------------------------------------------------------------
// 1. STORAGE HELPERS
// ---------------------------------------------------------------
const STORAGE_KEY = "Student Task Manager";
const THEME_KEY = "StudentTaskManagerTheme";
 
function getTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
 
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
 
// ---------------------------------------------------------------
// 2. THEME TOGGLE (dark mode)
// ---------------------------------------------------------------
function applyStoredTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "light";
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}
 
function setupThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  btn.addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    btn.textContent = next === "dark" ? "☀️" : "🌙";
  });
}
 
applyStoredTheme();
document.addEventListener("DOMContentLoaded", setupThemeToggle);
 
// ---------------------------------------------------------------
// Everything below only runs on tasks.html (guarded by form check)
// ---------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("taskForm");
  if (!form) return; // not on tasks.html — stop here
 
  const titleInput = document.getElementById("taskTitle");
  const dateInput = document.getElementById("taskDate");
  const freqInput = document.getElementById("taskFrequency");
  const listContainer = document.getElementById("taskList"); // FIXED (was "tasktList")
  const searchBox = document.getElementById("searchBox");
  const clearAllBtn = document.getElementById("clearAllBtn");
 
  // ---------------------------------------------------------------
  // 3. RENDER
  // ---------------------------------------------------------------
  function render(filterText) {
    const tasks = getTasks();
    const term = (filterText || "").trim().toLowerCase();
 
    const visible = [];
    for (let i = 0; i < tasks.length; i++) {
      const h = tasks[i];
      if (term === "" || h.title.toLowerCase().includes(term)) {
        visible.push(h);
      }
    }
 
    if (visible.length === 0) {
      listContainer.innerHTML =
        '<div class="empty-state">No tasks yet. Add one above to get started.</div>';
      updateCounters(tasks);
      return;
    }
 
    let html = "";
    for (let i = 0; i < visible.length; i++) {
      const h = visible[i];
 
      let freqClass = "freq-daily";
      let badgeClass = "badge-freq-daily";
      if (h.frequency === "Weekly") {
        freqClass = "freq-weekly";
        badgeClass = "badge-freq-weekly";
      } else if (h.frequency === "Monthly") {
        freqClass = "freq-monthly";
        badgeClass = "badge-freq-monthly";
      }
 
      const completedClass = h.completed ? "completed" : "";
      const checkLabel = h.completed ? "↺" : "✓";
 
      html += `
        <div class="task-card ${freqClass} ${completedClass}">
          <div class="flex-grow-1">
            <div class="task-title">${escapeHtml(h.title)}</div>
            <div class="task-meta">
              Started ${formatDate(h.startDate)}
              &nbsp;•&nbsp;
              <span class="badge ${badgeClass}">${h.frequency}</span>
            </div>
          </div>
          <div class="task-actions">
            <button title="Toggle done" onclick="toggleTask('${h.id}')">${checkLabel}</button>
            <button title="Edit" onclick="openEdit('${h.id}')">✎</button>
            <button title="Delete" onclick="deleteTask('${h.id}')">🗑</button>
          </div>
        </div>
      `;
    }
 
    listContainer.innerHTML = html;
    updateCounters(tasks);
  }
 
  // ---------------------------------------------------------------
  // 4. COUNTERS
  // ---------------------------------------------------------------
  function updateCounters(tasks) {
    let done = 0;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].completed) done++;
    }
    document.getElementById("statTotal").textContent = tasks.length;
    document.getElementById("statDone").textContent = done;
    document.getElementById("statPending").textContent = tasks.length - done;
  }
 
  // ---------------------------------------------------------------
  // 5. VALIDATION
  // ---------------------------------------------------------------
  function validateForm() {
    let valid = true;
 
    if (titleInput.value.trim() === "") {
      titleInput.classList.add("is-invalid");
      valid = false;
    } else {
      titleInput.classList.remove("is-invalid");
    }
 
    if (dateInput.value === "") {
      dateInput.classList.add("is-invalid");
      valid = false;
    } else {
      dateInput.classList.remove("is-invalid");
    }
 
    return valid;
  }
 
  // ---------------------------------------------------------------
  // 6. ADD
  // ---------------------------------------------------------------
  form.addEventListener("submit", function (e) {
    e.preventDefault();
 
    if (!validateForm()) return;
 
    const tasks = getTasks();
    tasks.push({
      id: Date.now().toString(),
      title: titleInput.value.trim(),
      startDate: dateInput.value,
      frequency: freqInput.value,
      completed: false
    });
 
    saveTasks(tasks);
    form.reset();
    render(searchBox.value);
  });
 
  // ---------------------------------------------------------------
  // 7. SEARCH
  // ---------------------------------------------------------------
  searchBox.addEventListener("input", function () {
    render(searchBox.value);
  });
 
  // ---------------------------------------------------------------
  // 8. CLEAR ALL
  // ---------------------------------------------------------------
  clearAllBtn.addEventListener("click", function () {
    if (confirm("Remove all tasks? This can't be undone.")) {
      saveTasks([]);
      render("");
    }
  });
 
  // ---------------------------------------------------------------
  // 9. EDIT MODAL
  // ---------------------------------------------------------------
  const editModalEl = document.getElementById("editModal");
  const editModal = new bootstrap.Modal(editModalEl);
 
  window.openEdit = function (id) {
    const tasks = getTasks();                                    // FIXED
    const task = tasks.find(function (h) { return h.id === id; }); // FIXED
    if (!task) return;
 
    document.getElementById("editId").value = task.id;
    document.getElementById("editTitle").value = task.title;
    document.getElementById("editDate").value = task.startDate;
    document.getElementById("editFrequency").value = task.frequency;
 
    editModal.show();
  };
 
  document.getElementById("saveEditBtn").addEventListener("click", function () {
    const id = document.getElementById("editId").value;
    const newTitle = document.getElementById("editTitle").value.trim();
    const newDate = document.getElementById("editDate").value;
    const newFreq = document.getElementById("editFrequency").value;
 
    if (newTitle === "" || newDate === "") {
      alert("Task name and start date are required.");
      return;
    }
 
    const tasks = getTasks();
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        tasks[i].title = newTitle;
        tasks[i].startDate = newDate;
        tasks[i].frequency = newFreq;
        break;
      }
    }
 
    saveTasks(tasks);
    editModal.hide();
    render(searchBox.value);
  });
 
  // ---------------------------------------------------------------
  // 10. TOGGLE / DELETE
  // ---------------------------------------------------------------
  window.toggleTask = function (id) {
    const tasks = getTasks();
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        tasks[i].completed = !tasks[i].completed;
        break;
      }
    }
    saveTasks(tasks);
    render(searchBox.value);
  };
 
  window.deleteTask = function (id) {
    if (!confirm("Delete this task?")) return;
    let task = getTasks();
    task = task.filter(function (h) { return h.id !== id; });
    saveTasks(task); // FIXED (was saveTasks(tasks) — undefined)
    render(searchBox.value);
  };
 
  // ---------------------------------------------------------------
  // 11. UTILITIES
  // ---------------------------------------------------------------
  function formatDate(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
 
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
 
  // Initial render on page load
  render("");
});
 