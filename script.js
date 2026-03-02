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

let currentDayKey = 'standard';

function initApp() {
    setupDateAndReset();
    determineCurrentDayKey();
    if (currentDayKey === 'domenica') {
        renderRestDay();
    } else {
        renderSchedule();
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
    if (appState.completed[taskId]) {
        taskEl.classList.add('completed');
    } else {
        taskEl.classList.remove('completed');
    }

    updateProgress();
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

document.addEventListener('DOMContentLoaded', initApp);
