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