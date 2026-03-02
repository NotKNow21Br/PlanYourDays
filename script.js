const scheduleData = {
    standard: [
        { id: "task-0", time: "06:40", title: "Sveglia", details: "Sveglia, Doccia, Colazione" },
        { id: "task-1", time: "07:35", title: "Uscita di Casa", details: "Vado a Prendere il Treno" },
        { id: "task-2", time: "08:10", title: "Inizio Lezioni/Lavoro", details: "Scuola/Lavoro" },
        { id: "task-3", time: "13:45", title: "Arrivo a Casa e Pranzo", details: "Ritorno e Pranzo Leggero" },
        { id: "task-4", time: "14:25", title: "Tempo Libero", details: "Giocare/Fare una Camminata" },
        { id: "task-5", time: "16:00", title: "Studio e Compiti", details: "Compiti e Studiare Qualcosa di Piacevole" },
        { id: "task-6", time: "17:00", title: "Tempo Libero 2", details: "Preparazione Cena, Hobby Breve" },
        { id: "task-7", time: "20:00", title: "Cena", details: "Pasto con la Famiglia" },
        { id: "task-8", time: "20:30", title: "Tempo Libero 3", details: "Giocare/Guardare Serie TV" },
        { id: "task-9", time: "22:00", title: "Dormire", details: "Doccia, Igiene orale, Dormire" }
    ],
    mercoledi: [
        { id: "task-10", time: "06:40", title: "Sveglia", details: "Sveglia, Doccia, Colazione" },
        { id: "task-11", time: "07:35", title: "Uscita di Casa", details: "Vado a Prendere il Treno" },
        { id: "task-12", time: "08:10", title: "Inizio Lezioni/Lavoro", details: "Scuola/Lavoro" },
        { id: "task-13", time: "14:45", title: "Arrivo a Casa e Pranzo", details: "Ritorno e Pranzo Leggero" },
        { id: "task-14", time: "15:30", title: "Tempo Libero", details: "Giocare/Fare una Camminata" },
        { id: "task-15", time: "17:00", title: "Studio e Compiti", details: "Compiti e Studiare Qualcosa di Piacevole" },
        { id: "task-16", time: "19:00", title: "Tempo Libero 2", details: "Preparazione Cena, Hobby Breve" },
        { id: "task-17", time: "20:00", title: "Cena", details: "Pasto con la Famiglia" },
        { id: "task-18", time: "21:00", title: "Tempo Libero 3", details: "Giocare/Guardare Serie TV" },
        { id: "task-19", time: "22:00", title: "Dormire", details: "Doccia, Igiene orale, Dormire" }
    ],
    venerdi: [
        { id: "task-20", time: "06:40", title: "Sveglia", details: "Sveglia, Doccia, Colazione" },
        { id: "task-21", time: "07:35", title: "Uscita di Casa", details: "Vado a Prendere il Treno" },
        { id: "task-22", time: "08:10", title: "Inizio Lezioni/Lavoro", details: "Scuola/Lavoro" },
        { id: "task-23", time: "17:00", title: "Arrivo a Casa e Pranzo", details: "Ritorno e Pranzo Leggero" },
        { id: "task-24", time: "17:30", title: "Tempo Libero", details: "Giocare/Fare una Camminata" },
        { id: "task-25", time: "18:00", title: "Studio e Compiti", details: "Compiti e Studiare Qualcosa di Piacevole" },
        { id: "task-26", time: "19:00", title: "Tempo Libero 2", details: "Preparazione Cena, Hobby Breve" },
        { id: "task-27", time: "20:00", title: "Cena", details: "Pasto con la Famiglia" },
        { id: "task-28", time: "20:30", title: "Tempo Libero 3", details: "Giocare/Guardare Serie TV" },
        { id: "task-29", time: "22:00", title: "Dormire", details: "Doccia, Igiene orale, Dormire" }
    ]
};

const appDataKey = 'tabellaGiornataApp';
let appState = {
    date: null,
    completed: {}
};

// Elements
const dateDisplay = document.getElementById('date-display');
const scheduleList = document.getElementById('schedule-list');
const tabBtns = document.querySelectorAll('.tab-btn');
const progressCircle = document.getElementById('progress-circle');
const progressText = document.getElementById('progress-text');
const allDoneMessage = document.getElementById('all-done-message');

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
    setupDateAndReset();
    determineCurrentDayKey();
    updateThemeBasedOnTime();

    if (currentDayKey === 'domenica') {
        renderRestDay();
    } else {
        renderSchedule();
    }
    attachModalListeners();

    // Start interval to check time-based updates every minute
    setInterval(() => {
        updateThemeBasedOnTime();
        if (currentDayKey !== 'domenica') {
            checkCurrentTask();
        }
    }, 60000);
}

function loadCustomSchedule() {
    const savedSchedule = localStorage.getItem('tabellaGiornataSchedule');
    if (savedSchedule) {
        Object.assign(scheduleData, JSON.parse(savedSchedule));
    }
}

function setupDateAndReset() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStrItalian = today.toLocaleDateString('it-IT', options);

    // Capitalize first letter
    dateDisplay.textContent = dateStrItalian.charAt(0).toUpperCase() + dateStrItalian.slice(1);

    const currentDateString = today.toISOString().split('T')[0];

    const savedData = localStorage.getItem(appDataKey);
    if (savedData) {
        appState = JSON.parse(savedData);
    }

    // Reset if new day
    if (appState.date !== currentDateString) {
        appState = {
            date: currentDateString,
            completed: {}
        };
        saveState();
    }
}

function determineCurrentDayKey() {
    const dayOfWeek = new Date().getDay(); // 0 is Sunday, 3 is Wed, 5 is Fri
    if (dayOfWeek === 0) {
        currentDayKey = 'domenica';
    } else if (dayOfWeek === 3) {
        currentDayKey = 'mercoledi';
    } else if (dayOfWeek === 5) {
        currentDayKey = 'venerdi';
    } else {
        currentDayKey = 'standard';
    }
}

function saveState() {
    localStorage.setItem(appDataKey, JSON.stringify(appState));
}


function toggleTask(taskId) {
    if (appState.completed[taskId]) {
        delete appState.completed[taskId];
    } else {
        appState.completed[taskId] = true;
    }
    saveState();

    const taskEl = document.getElementById(`card-${taskId}`);
    if (taskEl) {
        if (appState.completed[taskId]) {
            taskEl.classList.add('completed');
        } else {
            taskEl.classList.remove('completed');
        }
    }

    updateProgress();
}

function updateThemeBasedOnTime() {
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
    const tasks = scheduleData[currentDayKey];
    if (!tasks || tasks.length === 0) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentTaskIndex = -1;

    // Find the task that has started but not yet superseded by the next task
    for (let i = 0; i < tasks.length; i++) {
        const [hours, minutes] = tasks[i].time.split(':').map(Number);
        const taskMinutes = hours * 60 + minutes;

        if (currentMinutes >= taskMinutes) {
            currentTaskIndex = i;
        } else {
            break;
        }
    }

    // Update UI and trigger notifications if task changed
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
        // Only notify if it's not the first load of the page, or if we want to notify on load as well
        // We'll skip notification on exact first load if lastNotifiedTaskIndex is -1 by setting it quietly on first run.
        if (lastNotifiedTaskIndex !== -1) {
            const currentTask = tasks[currentTaskIndex];
            showNotification(currentTask.title, currentTask.time);
            playNotificationSound();
        }
        lastNotifiedTaskIndex = currentTaskIndex;
    }
}

// --- Notification Logic ---
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

    // Remove on click
    toast.addEventListener('click', () => {
        removeToast(toast);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
}

function removeToast(toast) {
    if (toast.classList.contains('fade-out')) return;
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

function playNotificationSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.1); // C6

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.warn('Audio Context not supported or blocked', e);
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
    progressCircle.style.strokeDasharray = `${2 * Math.PI * 26} ${2 * Math.PI * 26}`;
    progressCircle.style.strokeDashoffset = 0;
    progressCircle.setAttribute('stroke', '#10b981'); // success color
    allDoneMessage.classList.remove('visible'); // already showing message in scheduleList
}

function renderSchedule() {
    scheduleList.innerHTML = '';
    const tasks = scheduleData[currentDayKey];

    tasks.forEach((task, index) => {
        const isCompleted = !!appState.completed[task.id];
        const delay = index * 0.05;

        const card = document.createElement('div');
        card.className = `task-card ${isCompleted ? 'completed' : ''}`;
        card.id = `card-${task.id}`;
        card.style.animationDelay = `${delay}s`;

        card.innerHTML = `
            <div class="task-time">
                ${task.time}
            </div>
            <div class="task-info">
                <h3 class="task-title">${task.title}</h3>
                <p class="task-details">${task.details}</p>
            </div>
            <label class="checkbox-container">
                <input type="checkbox" id="check-${task.id}" ${isCompleted ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                <span class="checkmark"></span>
            </label>
        `;

        scheduleList.appendChild(card);
    });

    checkCurrentTask();
    updateProgress();
}

function updateProgress() {
    const tasks = scheduleData[currentDayKey];
    const total = tasks.length;
    let completedCount = 0;

    tasks.forEach(task => {
        if (appState.completed[task.id]) {
            completedCount++;
        }
    });

    let percentage = 0;
    if (total > 0) {
        percentage = Math.round((completedCount / total) * 100);
    }

    progressText.textContent = `${percentage}%`;

    // Circle circumference = 2 * pi * r = 2 * 3.14159 * 26 ≈ 163.36
    const circumference = 2 * Math.PI * 26;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;

    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    if (percentage === 100) {
        progressCircle.setAttribute('stroke', '#10b981'); // success color
        allDoneMessage.classList.add('visible');
    } else {
        progressCircle.setAttribute('stroke', '#3b82f6'); // accent color
        allDoneMessage.classList.remove('visible');
    }
}

// Attach functions to global scope for HTML inline handlers
window.toggleTask = toggleTask;

// --- Edit Modal Logic ---
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
    editingDayKey = currentDayKey === 'domenica' ? 'standard' : currentDayKey;
    updateModalTabsUI();
    renderEditTasks();
    editModal.classList.add('active');
}

function closeEditModal() {
    editModal.classList.remove('active');
}

function updateModalTabsUI() {
    modalTabBtns.forEach(btn => {
        if (btn.dataset.editDay === editingDayKey) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function renderEditTasks() {
    editTasksContainer.innerHTML = '';
    const tasks = tempScheduleData[editingDayKey] || [];
    let draggedRowIndex = null;

    tasks.forEach((task, index) => {
        const row = document.createElement('div');
        row.className = 'edit-task-row';
        row.draggable = true;

        row.innerHTML = `
            <div class="drag-handle" title="Trascina per spostare"><i class='bx bx-menu'></i></div>
            <input type="time" class="edit-time" value="${task.time}" required>
            <input type="text" class="edit-title" value="${task.title}" placeholder="Titolo" required>
            <input type="text" class="edit-details" value="${task.details}" placeholder="Dettagli">
            <button class="remove-task-btn" onclick="removeEditTask(${index})">
                <i class='bx bx-trash'></i>
            </button>
        `;

        // Drag logic
        row.addEventListener('dragstart', (e) => {
            draggedRowIndex = index;
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        row.addEventListener('dragend', () => {
            draggedRowIndex = null;
            row.classList.remove('dragging');
            document.querySelectorAll('.edit-task-row').forEach(r => r.classList.remove('drag-over'));
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedRowIndex !== null && draggedRowIndex !== index) {
                row.classList.add('drag-over');
            }
        });

        row.addEventListener('dragleave', () => {
            row.classList.remove('drag-over');
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.classList.remove('drag-over');

            if (draggedRowIndex !== null && draggedRowIndex !== index) {
                const rows = editTasksContainer.querySelectorAll('.edit-task-row');
                const draggedTimeInput = rows[draggedRowIndex].querySelector('.edit-time');
                const targetTimeInput = rows[index].querySelector('.edit-time');

                // Swap purely the displayed times, causing chronological sort to swap their logical order
                const tempTime = draggedTimeInput.value;
                draggedTimeInput.value = targetTimeInput.value;
                targetTimeInput.value = tempTime;

                saveCurrentEditTab();
                renderEditTasks();
            }
        });

        editTasksContainer.appendChild(row);
    });
}

function addNewEditTask() {
    saveCurrentEditTab();
    if (!tempScheduleData[editingDayKey]) {
        tempScheduleData[editingDayKey] = [];
    }
    tempScheduleData[editingDayKey].push({
        id: `task-${Date.now()}`,
        time: "12:00",
        title: "Nuova Attività",
        details: ""
    });
    renderEditTasks();
}

window.removeEditTask = function (index) {
    saveCurrentEditTab();
    tempScheduleData[editingDayKey].splice(index, 1);
    renderEditTasks();
}

function saveCurrentEditTab() {
    const rows = editTasksContainer.querySelectorAll('.edit-task-row');
    const newTasks = [];

    rows.forEach(row => {
        const time = row.querySelector('.edit-time').value;
        const title = row.querySelector('.edit-title').value;
        const details = row.querySelector('.edit-details').value;

        newTasks.push({
            id: `task-${editingDayKey}-${time.replace(':', '')}-${Date.now() + Math.random()}`,
            time: time || "00:00",
            title: title || "Senza Titolo",
            details: details || ""
        });
    });

    newTasks.sort((a, b) => a.time.localeCompare(b.time));
    tempScheduleData[editingDayKey] = newTasks;
}

function saveEditedSchedule() {
    saveCurrentEditTab();
    Object.assign(scheduleData, tempScheduleData);
    localStorage.setItem('tabellaGiornataSchedule', JSON.stringify(scheduleData));
    closeEditModal();
    if (currentDayKey === 'domenica') {
        renderRestDay();
    } else {
        renderSchedule();
    }
}

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registrato con successo: ', registration.scope);
            })
            .catch(error => {
                console.log('Registrazione ServiceWorker fallita: ', error);
            });
    });
}
function exportScheduleData() {
    const dataStr = JSON.stringify(scheduleData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `tabella_giornata_export_${new Date().toISOString().split('T')[0]}.json`;
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
            if (parsedData && parsedData.standard) {
                Object.assign(scheduleData, parsedData);
                localStorage.setItem('tabellaGiornataSchedule', JSON.stringify(scheduleData));

                // Refresh UI
                if (editModal.classList.contains('active')) {
                    tempScheduleData = JSON.parse(JSON.stringify(scheduleData));
                    renderEditTasks();
                }

                if (currentDayKey === 'domenica') {
                    renderRestDay();
                } else {
                    renderSchedule();
                }
                showNotification("Importazione Completata", "Tabella caricata con successo!");
            } else {
                alert("Il file non sembra essere un file di configurazione valido.");
            }
        } catch (error) {
            alert("Errore durante la lettura del file: " + error.message);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}

document.addEventListener('DOMContentLoaded', initApp);
