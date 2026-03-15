const scheduleData = {
    standard: [
        { id: "task-template-1", time: "08:00", title: "Attività Mattutina", details: "Descrizione attività" },
        { id: "task-template-2", time: "13:00", title: "Pranzo", details: "Pausa pranzo" },
        { id: "task-template-3", time: "20:00", title: "Attività Serale", details: "Relax" }
    ],
    mercoledi: [
        { id: "task-wed-1", time: "09:00", title: "Attività del Mercoledì", details: "Programma speciale" }
    ],
    venerdi: [
        { id: "task-fri-1", time: "09:00", title: "Attività del Venerdì", details: "Chiusura settimana" }
    ]
};

const appDataKey = 'tabellaGiornataApp';
const specificEventsKey = 'tabellaGiornataEvents';

let appState = {
    date: null, // This is now used for completed tasks of a specific date
    completedByDate: {} // Format: { "YYYY-MM-DD": { "task-id": true } }
};

let specificEvents = {}; // Format: { "YYYY-MM-DD": [tasks] }
let selectedDate = new Date();

// Elements
const dateDisplay = document.getElementById('date-display');
const scheduleList = document.getElementById('schedule-list');
const progressCircle = document.getElementById('progress-circle');
const progressText = document.getElementById('progress-text');
const allDoneMessage = document.getElementById('all-done-message');

// Navigation Elements
const prevDayBtn = document.getElementById('prev-day');
const nextDayBtn = document.getElementById('next-day');
const todayBtn = document.getElementById('today-btn');
const calendarInput = document.getElementById('calendar-input');

// Modal Elements
const editBtn = document.getElementById('edit-btn');
const editModal = document.getElementById('edit-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveEditBtn = document.getElementById('save-edit-btn');
const modalTabBtns = document.querySelectorAll('.modal-tab-btn');
const editTasksContainer = document.getElementById('edit-tasks-container');
const addTaskBtn = document.getElementById('add-task-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');

let currentDayKey = 'standard';
let editingDayKey = 'standard';
let tempScheduleData = {};

let lastNotifiedTaskIndex = -1;
let audioContext = null;

function initApp() {
    loadCustomSchedule();
    loadSpecificEvents();
    loadAppState();

    updateDateDisplay();
    renderSchedule();
    attachNavListeners();
    attachModalListeners();

    // Start interval to check time-based updates every minute
    setInterval(() => {
        updateThemeBasedOnTime();
        if (isToday(selectedDate)) {
            checkCurrentTask();
        }
    }, 60000);

    updateThemeBasedOnTime();
}

function loadCustomSchedule() {
    const savedSchedule = localStorage.getItem('tabellaGiornataSchedule');
    if (savedSchedule) {
        Object.assign(scheduleData, JSON.parse(savedSchedule));
    }
}

function loadSpecificEvents() {
    const savedEvents = localStorage.getItem(specificEventsKey);
    if (savedEvents) {
        specificEvents = JSON.parse(savedEvents);
    }
}

function loadAppState() {
    const savedData = localStorage.getItem(appDataKey);
    if (savedData) {
        appState = JSON.parse(savedData);
        // Migration if old format
        if (!appState.completedByDate) {
            appState.completedByDate = {};
            if (appState.date && appState.completed) {
                appState.completedByDate[appState.date] = appState.completed;
            }
        }
    }
}

function saveAppState() {
    localStorage.setItem(appDataKey, JSON.stringify(appState));
}

function saveSpecificEvents() {
    localStorage.setItem(specificEventsKey, JSON.stringify(specificEvents));
}

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = selectedDate.toLocaleDateString('it-IT', options);
    dateDisplay.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // Sync calendar input
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    calendarInput.value = `${yyyy}-${mm}-${dd}`;
}

function getDayKey(date) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) return 'domenica';
    if (dayOfWeek === 3) return 'mercoledi';
    if (dayOfWeek === 5) return 'venerdi';
    return 'standard';
}

function getFormattedDate(date) {
    return date.toISOString().split('T')[0];
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

function renderSchedule() {
    scheduleList.innerHTML = '';
    const dateKey = getFormattedDate(selectedDate);
    const dayKey = getDayKey(selectedDate);

    let templateTasks = [];
    if (dayKey !== 'domenica') {
        templateTasks = JSON.parse(JSON.stringify(scheduleData[dayKey] || []));
    }

    const specificDateEvents = JSON.parse(JSON.stringify(specificEvents[dateKey] || []));

    // Merge and sort by time
    let tasks = [...templateTasks, ...specificDateEvents];
    tasks.sort((a, b) => a.time.localeCompare(b.time));

    if (tasks.length === 0 && dayKey === 'domenica') {
        renderRestDay();
        return;
    }

    const completedTasks = appState.completedByDate[dateKey] || {};

    tasks.forEach((task, index) => {
        const isCompleted = !!completedTasks[task.id];
        const isSpecific = task.id.startsWith('event');
        const delay = index * 0.05;

        const card = document.createElement('div');
        card.className = `task-card ${isCompleted ? 'completed' : ''} ${isSpecific ? 'specific-event' : ''}`;
        card.id = `card-${task.id}`;
        card.style.animationDelay = `${delay}s`;

        card.innerHTML = `
            <div class="task-time">
                ${task.time}
            </div>
            <div class="task-info">
                <h3 class="task-title">
                    ${isSpecific ? '<i class="bx bx-calendar-event"></i> ' : ''}${task.title}
                </h3>
                <p class="task-details">${task.details}</p>
            </div>
            <label class="checkbox-container">
                <input type="checkbox" id="check-${task.id}" ${isCompleted ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                <span class="checkmark"></span>
            </label>
        `;

        scheduleList.appendChild(card);
    });

    if (isToday(selectedDate)) {
        checkCurrentTask();
    }
    updateProgress();
}

function toggleTask(taskId) {
    const dateKey = getFormattedDate(selectedDate);
    if (!appState.completedByDate[dateKey]) {
        appState.completedByDate[dateKey] = {};
    }

    if (appState.completedByDate[dateKey][taskId]) {
        delete appState.completedByDate[dateKey][taskId];
    } else {
        appState.completedByDate[dateKey][taskId] = true;
    }

    saveAppState();

    const taskEl = document.getElementById(`card-${taskId}`);
    if (taskEl) {
        if (appState.completedByDate[dateKey][taskId]) {
            taskEl.classList.add('completed');
        } else {
            taskEl.classList.remove('completed');
        }
    }

    updateProgress();
}

function updateProgress() {
    const dateKey = getFormattedDate(selectedDate);
    const dayKey = getDayKey(selectedDate);

    let templateTasks = [];
    if (dayKey !== 'domenica') {
        templateTasks = scheduleData[dayKey] || [];
    }
    const specificDateEvents = specificEvents[dateKey] || [];
    let tasks = [...templateTasks, ...specificDateEvents];

    if (tasks.length === 0 && dayKey === 'domenica') {
        progressText.textContent = `100%`;
        updateCircleProgress(100);
        return;
    }

    const total = tasks.length;
    let completedCount = 0;
    const completedTasks = appState.completedByDate[dateKey] || {};

    tasks.forEach(task => {
        if (completedTasks[task.id]) {
            completedCount++;
        }
    });

    let percentage = 0;
    if (total > 0) {
        percentage = Math.round((completedCount / total) * 100);
    }

    progressText.textContent = `${percentage}%`;
    updateCircleProgress(percentage);

    if (percentage === 100 && total > 0) {
        allDoneMessage.classList.add('visible');
    } else {
        allDoneMessage.classList.remove('visible');
    }
}

function updateCircleProgress(percentage) {
    const circumference = 2 * Math.PI * 26;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    if (percentage === 100) {
        progressCircle.setAttribute('stroke', '#10b981'); // success color
    } else {
        progressCircle.setAttribute('stroke', '#3b82f6'); // accent color
    }
}

function renderRestDay() {
    scheduleList.innerHTML = `
        <div class="all-done-message visible" style="margin-top: 0;">
            <i class='bx bxs-sun'></i>
            <h3>Oggi è Domenica!</h3>
            <p>È un giorno di riposo. Rilassati e ricarica le energie per la nuova settimana.</p>
        </div>
    `;
    progressText.textContent = `100%`;
    updateCircleProgress(100);
    allDoneMessage.classList.remove('visible');
}

function attachNavListeners() {
    prevDayBtn.addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() - 1);
        updateAppAfterDateChange();
    });

    nextDayBtn.addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() + 1);
        updateAppAfterDateChange();
    });

    todayBtn.addEventListener('click', () => {
        selectedDate = new Date();
        updateAppAfterDateChange();
    });

    calendarInput.addEventListener('change', (e) => {
        const newDate = new Date(e.target.value);
        if (!isNaN(newDate.getTime())) {
            selectedDate = newDate;
            updateAppAfterDateChange();
        }
    });
}

function updateAppAfterDateChange() {
    updateDateDisplay();
    renderSchedule();
    updateThemeBasedOnTime();
    // Reset last notified to allow notifications for new day
    lastNotifiedTaskIndex = -1;
}

function updateThemeBasedOnTime() {
    // Only update theme if it's today, otherwise use a neutral "day" theme?
    // Let's keep the real-time theme as it's atmospheric.
    const hour = new Date().getHours();
    document.body.className = ''; // reset themes

    if (hour >= 6 && hour < 12) {
        document.body.classList.add('theme-morning');
    } else if (hour >= 12 && hour < 18) {
        document.body.classList.add('theme-afternoon');
    } else if (hour >= 18 && hour < 22) {
        document.body.classList.add('theme-evening');
    } else {
        document.body.classList.add('theme-night');
    }
}

function checkCurrentTask() {
    const dayKey = getDayKey(selectedDate);
    const dateKey = getFormattedDate(selectedDate);
    const tasks = specificEvents[dateKey] || scheduleData[dayKey];

    if (!tasks || tasks.length === 0) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentTaskIndex = -1;

    for (let i = 0; i < tasks.length; i++) {
        const [hours, minutes] = tasks[i].time.split(':').map(Number);
        const taskMinutes = hours * 60 + minutes;

        if (currentMinutes >= taskMinutes) {
            currentTaskIndex = i;
        } else {
            break;
        }
    }

    tasks.forEach((task, index) => {
        const cardEl = document.getElementById(`card-${task.id}`);
        if (!cardEl) return;

        if (index === currentTaskIndex) {
            cardEl.classList.add('current-task');
        } else {
            cardEl.classList.remove('current-task');
        }
    });

    if (currentTaskIndex !== -1 && currentTaskIndex !== lastNotifiedTaskIndex) {
        if (lastNotifiedTaskIndex !== -1) {
            const currentTask = tasks[currentTaskIndex];
            showNotification(currentTask.title, currentTask.time);
            playNotificationSound();
        }
        lastNotifiedTaskIndex = currentTaskIndex;
    }
}

// Reuse existing Notification and Modal logic with minimal changes
function showNotification(title, timeMsg) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-title">È ora di: ${title}</div>
        <div class="toast-details">Iniziato alle ${timeMsg}</div>
    `;

    container.appendChild(toast);
    toast.addEventListener('click', () => removeToast(toast));
    setTimeout(() => removeToast(toast), 5000);
}

function removeToast(toast) {
    if (toast.classList.contains('fade-out')) return;
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
}

function playNotificationSound() {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.warn('Audio Context not supported', e);
    }
}

// Modal Logic
function attachModalListeners() {
    editBtn.addEventListener('click', openEditModal);
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    saveEditBtn.addEventListener('click', saveEditedSchedule);
    addTaskBtn.addEventListener('click', addNewEditTask);
    exportBtn.addEventListener('click', exportScheduleData);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importScheduleData);

    modalTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            saveCurrentEditTab();
            editingDayKey = e.target.dataset.editDay;
            updateModalTabsUI();
            renderEditTasks();
        });
    });
}

function openEditModal() {
    tempScheduleData = JSON.parse(JSON.stringify(scheduleData));
    tempSpecificEvents = JSON.parse(JSON.stringify(specificEvents));

    // Update specific date tab label
    const dateTab = document.getElementById('specific-date-tab');
    if (dateTab) {
        const dateStr = selectedDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
        dateTab.textContent = `Evento ${dateStr}`;
    }

    const currentDay = getDayKey(selectedDate);
    editingDayKey = currentDay === 'domenica' ? 'standard' : currentDay;
    updateModalTabsUI();
    renderEditTasks();
    editModal.classList.add('active');
}

let tempSpecificEvents = {};

function closeEditModal() {
    editModal.classList.remove('active');
}

function updateModalTabsUI() {
    modalTabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.editDay === editingDayKey);
    });
}

function renderEditTasks() {
    editTasksContainer.innerHTML = '';
    let tasks = [];

    if (editingDayKey === 'specific') {
        const dateKey = getFormattedDate(selectedDate);
        tasks = tempSpecificEvents[dateKey] || [];
    } else {
        tasks = tempScheduleData[editingDayKey] || [];
    }

    tasks.forEach((task, index) => {
        const row = document.createElement('div');
        row.className = 'edit-task-row';
        row.innerHTML = `
            <div class="drag-handle"><i class='bx bx-menu'></i></div>
            <input type="time" class="edit-time" value="${task.time}" required>
            <input type="text" class="edit-title" value="${task.title}" placeholder="Titolo" required>
            <input type="text" class="edit-details" value="${task.details}" placeholder="Dettagli">
            <button class="remove-task-btn" onclick="removeEditTask(${index})">
                <i class='bx bx-trash'></i>
            </button>
        `;
        editTasksContainer.appendChild(row);
    });
}

function addNewEditTask() {
    saveCurrentEditTab();
    if (editingDayKey === 'specific') {
        const dateKey = getFormattedDate(selectedDate);
        if (!tempSpecificEvents[dateKey]) tempSpecificEvents[dateKey] = [];
        tempSpecificEvents[dateKey].push({
            id: `event-${dateKey}-${Date.now()}`,
            time: "12:00",
            title: "Nuovo Evento Speciale",
            details: ""
        });
    } else {
        if (!tempScheduleData[editingDayKey]) tempScheduleData[editingDayKey] = [];
        tempScheduleData[editingDayKey].push({
            id: `task-${Date.now()}`,
            time: "12:00",
            title: "Nuovo Evento",
            details: ""
        });
    }
    renderEditTasks();
}

window.removeEditTask = function (index) {
    saveCurrentEditTab();
    if (editingDayKey === 'specific') {
        const dateKey = getFormattedDate(selectedDate);
        tempSpecificEvents[dateKey].splice(index, 1);
    } else {
        tempScheduleData[editingDayKey].splice(index, 1);
    }
    renderEditTasks();
};

function saveCurrentEditTab() {
    const rows = editTasksContainer.querySelectorAll('.edit-task-row');
    const newTasks = [];

    rows.forEach(row => {
        const time = row.querySelector('.edit-time').value;
        const title = row.querySelector('.edit-title').value;
        const details = row.querySelector('.edit-details').value;

        const idPrefix = editingDayKey === 'specific' ? 'event' : 'task';
        newTasks.push({
            id: `${idPrefix}-${editingDayKey}-${time.replace(':', '')}-${Math.random().toString(36).substr(2, 9)}`,
            time: time || "00:00",
            title: title || "Senza Titolo",
            details: details || ""
        });
    });

    newTasks.sort((a, b) => a.time.localeCompare(b.time));

    if (editingDayKey === 'specific') {
        const dateKey = getFormattedDate(selectedDate);
        tempSpecificEvents[dateKey] = newTasks;
    } else {
        tempScheduleData[editingDayKey] = newTasks;
    }
}

function saveEditedSchedule() {
    saveCurrentEditTab();
    Object.assign(scheduleData, tempScheduleData);
    Object.assign(specificEvents, tempSpecificEvents);

    localStorage.setItem('tabellaGiornataSchedule', JSON.stringify(scheduleData));
    localStorage.setItem(specificEventsKey, JSON.stringify(specificEvents));

    closeEditModal();
    renderSchedule();
}

// --- Export / Import ---
function exportScheduleData() {
    const fullData = {
        template: scheduleData,
        events: specificEvents
    };
    const dataStr = JSON.stringify(fullData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `agenda_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
    showNotification("Esportazione Completata", "File scaricato con successo!");
}

function importScheduleData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const parsedData = JSON.parse(event.target.result);
            if (parsedData.template) {
                Object.assign(scheduleData, parsedData.template);
                localStorage.setItem('tabellaGiornataSchedule', JSON.stringify(scheduleData));
            }
            if (parsedData.events) {
                Object.assign(specificEvents, parsedData.events);
                localStorage.setItem(specificEventsKey, JSON.stringify(specificEvents));
            }

            // Refresh UI
            if (editModal.classList.contains('active')) {
                tempScheduleData = JSON.parse(JSON.stringify(scheduleData));
                tempSpecificEvents = JSON.parse(JSON.stringify(specificEvents));
                renderEditTasks();
            }
            renderSchedule();
            showNotification("Importazione Completata", "Dati caricati!");
        } catch (error) {
            alert("Errore durante l'importazione: " + error.message);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
}

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(console.error);
    });
}

document.addEventListener('DOMContentLoaded', initApp);
window.toggleTask = toggleTask;
