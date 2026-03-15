const scheduleData = {
    lunedi: [
        { id: "task-template-1", time: "08:00", title: "Attività Mattutina", details: "Descrizione attività" },
        { id: "task-template-2", time: "13:00", title: "Pranzo", details: "Pausa pranzo" },
        { id: "task-template-3", time: "20:00", title: "Attività Serale", details: "Relax" }
    ],
    martedi: [],
    mercoledi: [
        { id: "task-wed-1", time: "09:00", title: "Attività del Mercoledì", details: "Programma speciale" }
    ],
    giovedi: [],
    venerdi: [
        { id: "task-fri-1", time: "09:00", title: "Attività del Venerdì", details: "Chiusura settimana" }
    ],
    sabato: [],
    domenica: []
};

const appDataKey = 'tabellaGiornataApp';
const specificEventsKey = 'tabellaGiornataEvents';
const recurringEventsKey = 'tabellaGiornataRecurring';

let recurringEvents = []; // Array per eventi con regole di ripetizione

let appState = {
    date: null,
    completedByDate: {},
    gamification: {
        xp: 0,
        level: 1,
        totalCompleted: 0,
        streak: 0,
        lastActiveDate: null
    }
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
let focusInterval = null;
let focusSeconds = 0;
let activeFocusTaskId = null;

const quotes = [
    "Sii il cambiamento che vuoi vedere nel mondo. - Gandhi",
    "Il successo è l'abilità di passare da un fallimento all'altro senza perdere l'entusiasmo. - Churchill",
    "La felicità non è qualcosa di pronto. Viene dalle tue azioni. - Dalai Lama",
    "Fai oggi ciò che gli altri non faranno, così domani potrai fare ciò che gli altri non potranno. - Jerry Rice",
    "L'unica persona che sei destinato a diventare è la persona che decidi di essere. - Emerson",
    "Non contare i giorni, fai in modo che i giorni contino. - Muhammad Ali",
    "La disciplina è il ponte tra gli obiettivi e i risultati. - Jim Rohn",
    "La tua produttività è la tua libertà. - Anonimo"
];

function initApp() {
    loadCustomSchedule();
    loadSpecificEvents();
    loadAppState();
    loadRecurringEvents();

    updateDateDisplay();
    renderSchedule();
    attachNavListeners();
    attachModalListeners();
    initGamification();
    initStatsPanel();
    displayRandomQuote();

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
        const parsed = JSON.parse(savedSchedule);

        // Migration: if "standard" exists, copy its data to days that don't have a custom template yet
        if (parsed.standard) {
            const standardData = parsed.standard;
            ['lunedi', 'martedi', 'giovedi', 'sabato'].forEach(day => {
                if (!parsed[day] || parsed[day].length === 0) {
                    parsed[day] = JSON.parse(JSON.stringify(standardData));
                }
            });
            delete parsed.standard; // Clean up old format
            localStorage.setItem('tabellaGiornataSchedule', JSON.stringify(parsed));
        }

        Object.assign(scheduleData, parsed);
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
        const parsed = JSON.parse(savedData);
        appState = { ...appState, ...parsed };

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

function loadRecurringEvents() {
    const saved = localStorage.getItem(recurringEventsKey);
    if (saved) {
        recurringEvents = JSON.parse(saved);
    }
}

function saveRecurringEvents() {
    localStorage.setItem(recurringEventsKey, JSON.stringify(recurringEvents));
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
    const days = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
    return days[date.getDay()];
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

function getRecurringEventsForDate(date) {
    const matchedEvents = [];
    const dateCopy = new Date(date.getTime());
    dateCopy.setHours(0, 0, 0, 0);

    recurringEvents.forEach(event => {
        const start = new Date(event.startDate);
        start.setHours(0, 0, 0, 0);

        if (dateCopy < start) return;

        let isMatch = false;

        if (event.type === 'daily') {
            const diffDays = Math.floor((dateCopy - start) / (1000 * 60 * 60 * 24));
            if (diffDays % event.interval === 0) isMatch = true;
        } else if (event.type === 'monthly') {
            const months = (dateCopy.getFullYear() - start.getFullYear()) * 12 + (dateCopy.getMonth() - start.getMonth());
            if (months >= 0 && months % event.interval === 0 && dateCopy.getDate() === start.getDate()) isMatch = true;
        } else if (event.type === 'yearly') {
            const years = dateCopy.getFullYear() - start.getFullYear();
            if (years >= 0 && years % event.interval === 0 && dateCopy.getMonth() === start.getMonth() && dateCopy.getDate() === start.getDate()) isMatch = true;
        }

        if (isMatch) {
            matchedEvents.push({
                ...event,
                id: `recurring-${event.id}-${dateCopy.getTime()}`,
                isRecurring: true
            });
        }
    });

    return matchedEvents;
}

function renderSchedule() {
    scheduleList.innerHTML = '';
    const dateKey = getFormattedDate(selectedDate);
    const dayKey = getDayKey(selectedDate);

    let templateTasks = JSON.parse(JSON.stringify(scheduleData[dayKey] || []));

    const recurringForToday = getRecurringEventsForDate(selectedDate);
    const specificDateEvents = JSON.parse(JSON.stringify(specificEvents[dateKey] || []));

    // Merge and sort by time
    let tasks = [...templateTasks, ...recurringForToday, ...specificDateEvents];
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
            <div class="task-actions">
                <button class="focus-btn ${activeFocusTaskId === task.id ? 'active' : ''}" 
                        onclick="toggleFocusTimer('${task.id}', '${task.title.replace(/'/g, "\\'")}')" 
                        title="Focus Timer">
                    <i class='bx bx-stopwatch'></i>
                </button>
                <label class="checkbox-container">
                    <input type="checkbox" id="check-${task.id}" ${isCompleted ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                    <span class="checkmark"></span>
                </label>
            </div>
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

    const wasCompleted = !!appState.completedByDate[dateKey][taskId];
    if (wasCompleted) {
        delete appState.completedByDate[dateKey][taskId];
        addXP(-10);
    } else {
        appState.completedByDate[dateKey][taskId] = true;
        addXP(15); // Reward for completing
        appState.gamification.totalCompleted++;
        updateStreak();
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

    let templateTasks = scheduleData[dayKey] || [];
    const recurringForToday = getRecurringEventsForDate(selectedDate);
    const specificDateEvents = specificEvents[dateKey] || [];
    let tasks = [...templateTasks, ...recurringForToday, ...specificDateEvents];

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
    tempRecurringEvents = JSON.parse(JSON.stringify(recurringEvents));

    // Update specific date tab label
    const dateTab = document.getElementById('specific-date-tab');
    if (dateTab) {
        const dateStr = selectedDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
        dateTab.textContent = `Evento ${dateStr}`;
    }

    editingDayKey = getDayKey(selectedDate);
    updateModalTabsUI();
    renderEditTasks();
    editModal.classList.add('active');
}

let tempSpecificEvents = {};
let tempRecurringEvents = [];

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

    if (editingDayKey === 'specific') {
        const dateKey = getFormattedDate(selectedDate);
        renderStandardEditRows(tempSpecificEvents[dateKey] || []);
    } else if (editingDayKey === 'recurring') {
        renderRecurringEditRows(tempRecurringEvents);
    } else {
        renderStandardEditRows(tempScheduleData[editingDayKey] || []);
    }
}

function renderStandardEditRows(tasks) {
    tasks.forEach((task, index) => {
        const row = document.createElement('div');
        row.className = 'edit-task-row';
        row.dataset.taskId = task.id; // Store ID
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

function renderRecurringEditRows(events) {
    events.forEach((event, index) => {
        const row = document.createElement('div');
        row.className = 'recurring-row';
        row.dataset.taskId = event.id; // Store ID
        row.innerHTML = `
            <input type="time" class="rec-time" value="${event.time}" required>
            <input type="text" class="rec-title" value="${event.title}" placeholder="Titolo" required>
            <input type="date" class="rec-start" value="${event.startDate}" required>
            <div style="display:flex; gap:5px;">
                <select class="rec-type">
                    <option value="daily" ${event.type === 'daily' ? 'selected' : ''}>Ogni Giorno/i</option>
                    <option value="monthly" ${event.type === 'monthly' ? 'selected' : ''}>Ogni Mese/i</option>
                    <option value="yearly" ${event.type === 'yearly' ? 'selected' : ''}>Ogni Anno/i</option>
                </select>
                <input type="number" class="rec-interval" value="${event.interval}" min="1" style="width:50px;">
            </div>
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
            time: "12:00", title: "Nuovo Evento Speciale", details: ""
        });
    } else if (editingDayKey === 'recurring') {
        tempRecurringEvents.push({
            id: `rec-${Date.now()}`,
            time: "12:00", title: "Nuova Ricorrenza", startDate: getFormattedDate(new Date()),
            type: "daily", interval: 1
        });
    } else {
        if (!tempScheduleData[editingDayKey]) tempScheduleData[editingDayKey] = [];
        tempScheduleData[editingDayKey].push({
            id: `task-${Date.now()}`,
            time: "12:00", title: "Nuovo Evento", details: ""
        });
    }
    renderEditTasks();
}

window.removeEditTask = function (index) {
    saveCurrentEditTab();
    if (editingDayKey === 'specific') {
        const dateKey = getFormattedDate(selectedDate);
        tempSpecificEvents[dateKey].splice(index, 1);
    } else if (editingDayKey === 'recurring') {
        tempRecurringEvents.splice(index, 1);
    } else {
        tempScheduleData[editingDayKey].splice(index, 1);
    }
    renderEditTasks();
};

function saveCurrentEditTab() {
    if (editingDayKey === 'recurring') {
        const rows = editTasksContainer.querySelectorAll('.recurring-row');
        tempRecurringEvents = [];
        rows.forEach(row => {
            const existingId = row.dataset.taskId;
            tempRecurringEvents.push({
                id: existingId || `rec-${Date.now()}-${Math.random()}`,
                time: row.querySelector('.rec-time').value,
                title: row.querySelector('.rec-title').value,
                startDate: row.querySelector('.rec-start').value,
                type: row.querySelector('.rec-type').value,
                interval: parseInt(row.querySelector('.rec-interval').value) || 1
            });
        });
        return;
    }

    const rows = editTasksContainer.querySelectorAll('.edit-task-row');
    const newTasks = [];

    rows.forEach(row => {
        const time = row.querySelector('.edit-time').value;
        const title = row.querySelector('.edit-title').value;
        const details = row.querySelector('.edit-details').value;
        const existingId = row.dataset.taskId;

        newTasks.push({
            id: existingId || `${editingDayKey === 'specific' ? 'event' : 'task'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
    recurringEvents = JSON.parse(JSON.stringify(tempRecurringEvents));

    localStorage.setItem('tabellaGiornataSchedule', JSON.stringify(scheduleData));
    localStorage.setItem(specificEventsKey, JSON.stringify(specificEvents));
    saveRecurringEvents();

    closeEditModal();
    renderSchedule();
}

// --- Export / Import ---
function exportScheduleData() {
    const fullData = {
        template: scheduleData,
        events: specificEvents,
        recurring: recurringEvents
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

            if (parsedData.recurring) {
                recurringEvents = parsedData.recurring;
                saveRecurringEvents();
            }

            // Refresh UI
            if (editModal.classList.contains('active')) {
                tempScheduleData = JSON.parse(JSON.stringify(scheduleData));
                tempSpecificEvents = JSON.parse(JSON.stringify(specificEvents));
                tempRecurringEvents = JSON.parse(JSON.stringify(recurringEvents));
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

// --- Gamification Logic ---
function initGamification() {
    updateXPUI();
}

function addXP(amount) {
    appState.gamification.xp += amount;
    if (appState.gamification.xp < 0) appState.gamification.xp = 0;

    const xpToNextLevel = appState.gamification.level * 100;
    if (appState.gamification.xp >= xpToNextLevel) {
        appState.gamification.xp -= xpToNextLevel;
        appState.gamification.level++;
        showNotification("LEVEL UP!", `Grande! Sei arrivato al livello ${appState.gamification.level}`);
        playLevelUpSound();
    }
    updateXPUI();
    saveAppState();
}

function updateXPUI() {
    const xpBar = document.getElementById('xp-bar-fill');
    const xpText = document.getElementById('xp-text');
    const levelBadge = document.getElementById('level-badge');

    if (!xpBar || !xpText || !levelBadge) return;

    const xpToNextLevel = appState.gamification.level * 100;
    const percentage = (appState.gamification.xp / xpToNextLevel) * 100;

    xpBar.style.width = `${percentage}%`;
    xpText.textContent = `${appState.gamification.xp} / ${xpToNextLevel} XP`;
    levelBadge.textContent = `LV. ${appState.gamification.level}`;
}

function updateStreak() {
    const today = getFormattedDate(new Date());
    const lastDate = appState.gamification.lastActiveDate;

    if (lastDate === today) return;

    if (lastDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getFormattedDate(yesterday);

        if (lastDate === yesterdayStr) {
            appState.gamification.streak++;
        } else {
            appState.gamification.streak = 1;
        }
    } else {
        appState.gamification.streak = 1;
    }

    appState.gamification.lastActiveDate = today;
}

// --- Stats Logic ---
function initStatsPanel() {
    const toggleBtn = document.getElementById('stats-toggle-btn');
    const panel = document.getElementById('stats-panel');

    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            updateStatsUI();
        }
    });
}

function updateStatsUI() {
    document.getElementById('stat-total-completed').textContent = appState.gamification.totalCompleted;
    document.getElementById('stat-streak').textContent = appState.gamification.streak;

    const rank = document.getElementById('stat-rank');
    if (appState.gamification.level < 5) rank.textContent = "Bronzo";
    else if (appState.gamification.level < 10) rank.textContent = "Argento";
    else if (appState.gamification.level < 20) rank.textContent = "Oro";
    else rank.textContent = "Platino";

    renderWeeklyChart();
}

function renderWeeklyChart() {
    const chart = document.getElementById('week-chart');
    if (!chart) return;

    chart.innerHTML = '';
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateKey = getFormattedDate(d);
        const completedCount = Object.keys(appState.completedByDate[dateKey] || {}).length;

        const col = document.createElement('div');
        col.className = 'chart-column';

        const barHeight = Math.min(completedCount * 10, 100);
        col.innerHTML = `
            <div class="chart-bar" style="height: ${barHeight}%" title="${completedCount} task"></div>
            <span class="chart-day">${days[d.getDay()]}</span>
        `;
        chart.appendChild(col);
    }
}

// --- Quote Logic ---
function displayRandomQuote() {
    const quoteTxt = document.getElementById('quote-text');
    if (!quoteTxt) return;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteTxt.textContent = randomQuote;
}

// --- Pomodoro Focus Timer ---
function toggleFocusTimer(taskId, title) {
    if (activeFocusTaskId === taskId) {
        stopFocusTimer();
    } else {
        startFocusTimer(taskId, title);
    }
}

function startFocusTimer(taskId, title) {
    stopFocusTimer(); // Clean up existing
    activeFocusTaskId = taskId;
    focusSeconds = 25 * 60; // 25 minutes

    const overlay = document.createElement('div');
    overlay.id = 'timer-overlay';
    overlay.className = 'timer-overlay';
    overlay.innerHTML = `
        <div class="timer-icon"><i class='bx bxs-hot'></i></div>
        <div class="timer-info">
            <div class="timer-label">Focus: ${title}</div>
            <div class="timer-display" id="timer-display">25:00</div>
        </div>
        <button class="timer-close" onclick="stopFocusTimer()"><i class='bx bx-x'></i></button>
    `;
    document.body.appendChild(overlay);

    focusInterval = setInterval(() => {
        focusSeconds--;
        updateTimerDisplay();
        if (focusSeconds <= 0) {
            stopFocusTimer();
            showNotification("Time's up!", `Sessione di focus su "${title}" completata.`);
            addXP(30); // Big reward for focus session
            playNotificationSound();
        }
    }, 1000);

    renderSchedule(); // Refresh focus buttons
}

function stopFocusTimer() {
    clearInterval(focusInterval);
    focusInterval = null;
    activeFocusTaskId = null;
    const overlay = document.getElementById('timer-overlay');
    if (overlay) document.body.removeChild(overlay);
    renderSchedule();
}

function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;
    const m = Math.floor(focusSeconds / 60);
    const s = focusSeconds % 60;
    display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playLevelUpSound() {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
        osc.frequency.exponentialRampToValueAtTime(523.25, audioContext.currentTime + 0.2); // C5
        gain.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        osc.stop(audioContext.currentTime + 0.5);
    } catch (e) { }
}

document.addEventListener('DOMContentLoaded', initApp);
window.toggleTask = toggleTask;
window.toggleFocusTimer = toggleFocusTimer;
window.stopFocusTimer = stopFocusTimer;
