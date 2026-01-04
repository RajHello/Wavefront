// ========== TODO LIST FUNCTIONALITY ==========
let subjects = [];

function loadFromStorage() {
    const saved = localStorage.getItem('wavefront_subjects');
    if (saved) {
        subjects = JSON.parse(saved);
    }
}

function saveToStorage() {
    localStorage.setItem('wavefront_subjects', JSON.stringify(subjects));
}

loadFromStorage();

window.onload = function() {
    renderSubjects();
    
    const container = document.getElementById('subjectsContainer');
    container.addEventListener('scroll', function() {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        container.classList.remove('scrolled-top', 'scrolled-middle', 'scrolled-bottom');
        
        if (scrollTop === 0) {
            if (scrollHeight > clientHeight) {
                container.classList.add('scrolled-top');
            }
        } else if (scrollTop + clientHeight >= scrollHeight - 5) {
            container.classList.add('scrolled-bottom');
        } else {
            container.classList.add('scrolled-middle');
        }
    });
    
    const tasksInput = document.getElementById('tasksInput');
    tasksInput.addEventListener('scroll', function() {
        const scrollTop = tasksInput.scrollTop;
        const scrollHeight = tasksInput.scrollHeight;
        const clientHeight = tasksInput.clientHeight;
        
        tasksInput.classList.remove('scrolled-top', 'scrolled-middle', 'scrolled-bottom');
        
        if (scrollTop === 0) {
            if (scrollHeight > clientHeight) {
                tasksInput.classList.add('scrolled-top');
            }
        } else if (scrollTop + clientHeight >= scrollHeight - 5) {
            tasksInput.classList.add('scrolled-bottom');
        } else {
            tasksInput.classList.add('scrolled-middle');
        }
    });
    
    // Initialize pomodoro
    initPomodoro();
    
    // Add scroll listener for pomodoro view
    const pomodoroContent = document.querySelector('.pomodoro-content');
    if (pomodoroContent) {
        pomodoroContent.addEventListener('scroll', function() {
            const scrollTop = pomodoroContent.scrollTop;
            const scrollHeight = pomodoroContent.scrollHeight;
            const clientHeight = pomodoroContent.clientHeight;
            
            pomodoroContent.classList.remove('scrolled-top', 'scrolled-middle', 'scrolled-bottom');
            
            if (scrollTop === 0) {
                if (scrollHeight > clientHeight) {
                    pomodoroContent.classList.add('scrolled-top');
                }
            } else if (scrollTop + clientHeight >= scrollHeight - 5) {
                pomodoroContent.classList.add('scrolled-bottom');
            } else {
                pomodoroContent.classList.add('scrolled-middle');
            }
        });
    }
    
    // Focus mode controls
    const focusStartBtn = document.getElementById("focusStartBtn");
    const focusExitBtn = document.getElementById("focusExitBtn");
    
    if (focusStartBtn) {
        focusStartBtn.onclick = () => {
            if (focusModeRunning) {
                clearInterval(focusModeTimer);
                focusModeRunning = false;
                focusStartBtn.textContent = "Start";
            } else {
                startFocusModeTimer();
                focusStartBtn.textContent = "Pause";
            }
        };
    }
    
    if (focusExitBtn) {
        focusExitBtn.onclick = () => {
            exitFocusMode();
        };
    }
};

function openModal() {
    document.getElementById('addSubjectModal').classList.add('active');
}

function closeModal() {
    document.getElementById('addSubjectModal').classList.remove('active');
    document.getElementById('addSubjectForm').reset();
    document.getElementById('tasksInput').innerHTML = `
        <div class="task-input-item">
            <input type="text" placeholder="Task 1" class="task-input" required>
            <button type="button" class="star-btn" onclick="toggleStar(this)">☆</button>
        </div>
    `;
}

function toggleStar(button) {
    button.classList.toggle('active');
    button.textContent = button.classList.contains('active') ? '★' : '☆';
}

function addTaskInput() {
    const tasksInput = document.getElementById('tasksInput');
    const taskCount = tasksInput.children.length + 1;
    const newTaskInput = document.createElement('div');
    newTaskInput.className = 'task-input-item';
    newTaskInput.innerHTML = `
        <input type="text" placeholder="Task ${taskCount}" class="task-input">
        <button type="button" class="star-btn" onclick="toggleStar(this)">☆</button>
        <button type="button" class="remove-task-btn" onclick="removeTaskInput(this)">✕</button>
    `;
    tasksInput.appendChild(newTaskInput);
}

function removeTaskInput(button) {
    button.parentElement.remove();
}

function handleSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('subjectName').value;
    const deadline = document.getElementById('subjectDeadline').value;
    const taskInputs = document.querySelectorAll('.task-input-item');
    const tasks = [];
    
    taskInputs.forEach(item => {
        const input = item.querySelector('.task-input');
        const starBtn = item.querySelector('.star-btn');
        if (input.value.trim() !== '') {
            tasks.push({
                text: input.value,
                completed: false,
                important: starBtn.classList.contains('active')
            });
        }
    });

    subjects.push({
        id: Date.now(),
        name: name,
        deadline: deadline,
        tasks: tasks
    });
    
    saveToStorage();
    renderSubjects();
    closeModal();
}

function renderSubjects() {
    const container = document.getElementById('subjectsContainer');
    container.innerHTML = '';
    
    subjects.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        
        const completedTasks = subject.tasks.filter(t => t.completed).length;
        const totalTasks = subject.tasks.length;
        
        let timerHTML = '';
        if (subject.deadline) {
            const daysLeft = calculateDaysLeft(subject.deadline);
            const timerClass = getTimerClass(daysLeft);
            timerHTML = `
                <div class="subject-timer-box">
                    <div class="subject-timer ${timerClass}">${daysLeft}d left</div>
                </div>
            `;
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-subject-btn';
        deleteBtn.textContent = '✕';
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            subjects = subjects.filter(s => s.id !== subject.id);
            saveToStorage();
            renderSubjects();
        };
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'subject-card-content';
        contentDiv.onclick = function() {
            openViewModal(subject.id);
        };
        contentDiv.innerHTML = `
            <div class="subject-name">${subject.name}</div>
            <div class="subject-vertical-line"></div>
            <div class="subject-right-section">
                <div class="subject-completion">${completedTasks}/${totalTasks} completed</div>
                ${timerHTML}
            </div>
        `;
        
        card.appendChild(deleteBtn);
        card.appendChild(contentDiv);
        container.appendChild(card);
    });
    
    updateOverallProgress();
}

function calculateDaysLeft(deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function getTimerClass(daysLeft) {
    if (daysLeft >= 20) return 'timer-green';
    if (daysLeft >= 7) return 'timer-orange';
    return 'timer-red';
}

function openViewModal(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    document.getElementById('viewSubjectName').textContent = subject.name;
    
    const sortedTasks = [...subject.tasks].sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return 0;
    });
    
    const tasksHTML = sortedTasks.map((task) => {
        const originalIndex = subject.tasks.indexOf(task);
        return `
            <div class="view-task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="toggleTaskInView(${subjectId}, ${originalIndex})">
                <label>${task.text}</label>
                ${task.important ? '<span class="task-star">★</span>' : ''}
            </div>
        `;
    }).join('');
    
    document.getElementById('viewSubjectTasks').innerHTML = tasksHTML;
    document.getElementById('viewSubjectModal').classList.add('active');
}

function closeViewModal() {
    document.getElementById('viewSubjectModal').classList.remove('active');
}

function toggleTaskInView(subjectId, taskIndex) {
    const subject = subjects.find(s => s.id === subjectId);
    subject.tasks[taskIndex].completed = !subject.tasks[taskIndex].completed;
    saveToStorage();
    renderSubjects();
    openViewModal(subjectId);
}

function updateOverallProgress() {
    let totalTasks = 0;
    let completedTasks = 0;
    
    subjects.forEach(subject => {
        totalTasks += subject.tasks.length;
        completedTasks += subject.tasks.filter(t => t.completed).length;
    });
    
    document.getElementById('total').textContent = totalTasks;
    document.getElementById('completed').textContent = completedTasks;
    
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = progress + '%';
    
    if (progress === 0) {
        progressBar.style.background = 'rgba(255, 68, 68, 0.7)';
        progressBar.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
    } else if (progress === 100) {
        progressBar.style.background = 'rgba(68, 255, 68, 0.7)';
        progressBar.style.boxShadow = '0 0 15px rgba(68, 255, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
    } else {
        progressBar.style.background = 'rgba(255, 170, 68, 0.7)';
        progressBar.style.boxShadow = '0 0 15px rgba(255, 170, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
    }
}

// ========== VIEW SWITCHING ==========
function switchView(view) {
    // Hide all views
    document.getElementById('todoView').style.display = 'none';
    document.getElementById('pomodoroView').style.display = 'none';
    document.getElementById('placeholderView').style.display = 'none';
    document.getElementById('focusModeView').style.display = 'none';
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.container-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected view and activate corresponding button
    if (view === 'todo') {
        document.getElementById('todoView').style.display = 'flex';
        document.getElementById('containerNavTodo').classList.add('active');
    } else if (view === 'pomodoro') {
        document.getElementById('pomodoroView').style.display = 'flex';
        document.getElementById('containerNavPomodoro2').classList.add('active');
    } else if (view === 'placeholder') {
        document.getElementById('placeholderView').style.display = 'flex';
        document.getElementById('containerNavPlaceholder3').classList.add('active');
    }
}

// ========== POMODORO FUNCTIONALITY ==========
let workTime = 25 * 60;
let breakTime = 5 * 60;
let timeLeft = workTime;
let timer = null;
let running = false;
let isBreakTime = false;
let focusSeconds = 0;
let audio = null;
let focusModeTimer = null;
let focusModeRunning = false;
let focusModeTimeLeft = 25 * 60;

function initPomodoro() {
    const minEl = document.getElementById("min");
    const secEl = document.getElementById("sec");
    const startBtn = document.getElementById("startBtn");
    const resetBtn = document.getElementById("resetBtn");
    const workSlider = document.getElementById("workSlider");
    const breakSlider = document.getElementById("breakSlider");
    const workLabel = document.getElementById("workLabel");
    const breakLabel = document.getElementById("breakLabel");
    const focusToggle = document.getElementById("focusToggle");
    const focusTimeEl = document.getElementById("focusTime");

    function updateDisplay() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        minEl.textContent = String(m).padStart(2, "0");
        secEl.textContent = String(s).padStart(2, "0");
    }

    function startTimer() {
        if (running) return;
        running = true;

        timer = setInterval(() => {
            timeLeft--;
            if (!isBreakTime) {
                focusSeconds++;
            }
            updateDisplay();
            focusTimeEl.textContent = Math.floor(focusSeconds / 60);

            if (timeLeft <= 0) {
                clearInterval(timer);
                running = false;
                startBtn.textContent = "Start";
                
                // Switch between work and break
                if (isBreakTime) {
                    // Break finished, start work time
                    isBreakTime = false;
                    timeLeft = workTime;
                    alert("Break finished! Time to work!");
                } else {
                    // Work finished, start break time
                    isBreakTime = true;
                    timeLeft = breakTime;
                    alert("Work session complete! Time for a break!");
                }
                updateDisplay();
                updateSkipButtons();
            }
        }, 1000);
    }

    function resetTimer() {
        clearInterval(timer);
        running = false;
        isBreakTime = false;
        timeLeft = workTime;
        updateDisplay();
        updateSkipButtons();
    }

    startBtn.onclick = () => {
        if (running) {
            clearInterval(timer);
            running = false;
            startBtn.textContent = "Start";
        } else {
            startTimer();
            startBtn.textContent = "Pause";
        }
    };

    resetBtn.onclick = () => {
        resetTimer();
        startBtn.textContent = "Start";
    };

    // Update skip button visibility based on current state
    function updateSkipButtons() {
        const skipToBreakBtn = document.getElementById("skipToBreakBtn");
        const skipToWorkBtn = document.getElementById("skipToWorkBtn");
        if (skipToBreakBtn && skipToWorkBtn) {
            if (isBreakTime) {
                skipToBreakBtn.style.display = 'none';
                skipToWorkBtn.style.display = 'block';
            } else {
                skipToBreakBtn.style.display = 'block';
                skipToWorkBtn.style.display = 'none';
            }
        }
    }

    // Skip buttons
    const skipToBreakBtn = document.getElementById("skipToBreakBtn");
    const skipToWorkBtn = document.getElementById("skipToWorkBtn");

    if (skipToBreakBtn) {
        skipToBreakBtn.onclick = () => {
            if (!isBreakTime && running) {
                clearInterval(timer);
                running = false;
                startBtn.textContent = "Start";
            }
            isBreakTime = true;
            timeLeft = breakTime;
            updateDisplay();
            updateSkipButtons();
        };
    }

    if (skipToWorkBtn) {
        skipToWorkBtn.onclick = () => {
            if (isBreakTime && running) {
                clearInterval(timer);
                running = false;
                startBtn.textContent = "Start";
            }
            isBreakTime = false;
            timeLeft = workTime;
            updateDisplay();
            updateSkipButtons();
        };
    }

    updateSkipButtons();

    workSlider.oninput = e => {
        workTime = e.target.value * 60;
        workLabel.textContent = e.target.value;
        resetTimer();
    };

    breakSlider.oninput = e => {
        breakTime = e.target.value * 60;
        breakLabel.textContent = e.target.value;
    };

    const musicToggleBtn = document.getElementById("musicToggleBtn");
    const musicVolumeBtn = document.getElementById("musicVolumeBtn");
    const musicPlayerContainer = document.getElementById("musicPlayerContainer");
    const musicVolumeControl = document.getElementById("musicVolumeControl");
    const musicVolumeSlider = document.getElementById("musicVolumeSlider");
    const volumeValue = document.getElementById("volumeValue");
    const spotifyPlayer = document.getElementById("spotifyPlayer");
    
    // Create background audio element for volume control
    let backgroundAudio = null;
    
    // Initialize audio with a lofi stream
    function initBackgroundAudio() {
        if (!backgroundAudio) {
            backgroundAudio = new Audio('https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one');
            backgroundAudio.loop = true;
            backgroundAudio.volume = 0.5;
            backgroundAudio.crossOrigin = "anonymous";
        }
        return backgroundAudio;
    }

    if (musicToggleBtn) {
        musicToggleBtn.onclick = () => {
            if (musicPlayerContainer.style.display === 'none') {
                // Show and load Spotify embed
                musicPlayerContainer.style.display = 'block';
                spotifyPlayer.src = 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0';
                musicToggleBtn.textContent = 'Hide Player';
                
                // Start background audio
                const audio = initBackgroundAudio();
                audio.play().catch(err => {
                    console.log("Audio play failed:", err);
                });
            } else {
                // Hide player and pause audio
                musicPlayerContainer.style.display = 'none';
                spotifyPlayer.src = '';
                musicToggleBtn.textContent = 'Show Player';
                
                if (backgroundAudio) {
                    backgroundAudio.pause();
                }
            }
        };
    }

    if (musicVolumeBtn) {
        musicVolumeBtn.onclick = () => {
            if (musicVolumeControl.style.display === 'none') {
                musicVolumeControl.style.display = 'flex';
            } else {
                musicVolumeControl.style.display = 'none';
            }
        };
    }

    if (musicVolumeSlider) {
        // Initialize volume on page load
        musicVolumeSlider.value = 50;
        if (volumeValue) {
            volumeValue.textContent = '50%';
        }
        
        musicVolumeSlider.oninput = (e) => {
            const volume = parseInt(e.target.value) / 100;
            if (volumeValue) {
                volumeValue.textContent = e.target.value + '%';
            }
            
            // Control background audio volume
            if (!backgroundAudio) {
                initBackgroundAudio();
            }
            if (backgroundAudio) {
                backgroundAudio.volume = volume;
            }
        };
    }

    if (focusToggle) {
        focusToggle.onchange = e => {
            if (e.target.checked) {
                // Switch to focus mode view
                document.getElementById('pomodoroView').style.display = 'none';
                document.getElementById('focusModeView').style.display = 'flex';
                focusModeTimeLeft = workTime;
                updateFocusModeDisplay();
            } else {
                // Exit focus mode
                exitFocusMode();
            }
        };
    }

    updateDisplay();
}

// ========== FOCUS MODE FUNCTIONALITY ==========
function updateFocusModeDisplay() {
    const focusMinEl = document.getElementById("focusMin");
    const focusSecEl = document.getElementById("focusSec");
    const m = Math.floor(focusModeTimeLeft / 60);
    const s = focusModeTimeLeft % 60;
    focusMinEl.textContent = String(m).padStart(2, "0");
    focusSecEl.textContent = String(s).padStart(2, "0");
}

function startFocusModeTimer() {
    if (focusModeRunning) return;
    focusModeRunning = true;
    
    focusModeTimer = setInterval(() => {
        focusModeTimeLeft--;
        focusSeconds++;
        updateFocusModeDisplay();
        
        if (focusModeTimeLeft <= 0) {
            clearInterval(focusModeTimer);
            focusModeRunning = false;
            document.getElementById("focusStartBtn").textContent = "Start";
            // Timer finished
            alert("Focus session complete!");
        }
    }, 1000);
}

function exitFocusMode() {
    clearInterval(focusModeTimer);
    focusModeRunning = false;
    document.getElementById('focusModeView').style.display = 'none';
    document.getElementById('pomodoroView').style.display = 'flex';
    const focusToggle = document.getElementById('focusToggle');
    if (focusToggle) {
        focusToggle.checked = false;
    }
    focusModeTimeLeft = workTime;
    updateFocusModeDisplay();
}
