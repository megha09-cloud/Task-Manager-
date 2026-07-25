const taskInput = document.querySelector('#taskInput');
const addTaskBtn = document.querySelector('#addTaskBtn');
const errorMessage = document.querySelector('#errorMessage');
const taskList = document.querySelector('#taskList');
const emptyState = document.querySelector('#emptyState');
const searchInput = document.querySelector('#searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.querySelector('#clearCompletedBtn');
const footerHint = document.querySelector('#footerHint');

const totalCountEl = document.querySelector('#totalCount');
const activeCountEl = document.querySelector('#activeCount');
const completedCountEl = document.querySelector('#completedCount');

let tasks = [];
let currentFilter = 'all';
let searchTerm = '';

function loadTasks() {
  const storedTasks = localStorage.getItem('taskflowTasks');
  tasks = storedTasks ? JSON.parse(storedTasks) : [];
}

function saveTasks() {
  localStorage.setItem('taskflowTasks', JSON.stringify(tasks));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
  setTimeout(() => {
    errorMessage.classList.remove('show');
  }, 2200);
}

function addTask() {
  const taskText = taskInput.value.trim();

  if (taskText === '') {
    showError('Please type a task before adding it.');
    return;
  }

  const newTask = {
    id: generateId(),
    text: taskText,
    completed: false
  };

  tasks.unshift(newTask);
  saveTasks();
  taskInput.value = '';
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function toggleTaskCompleted(taskId) {
  tasks = tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveTasks();
  renderTasks();
}

function startEditingTask(taskId) {
  tasks = tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, isEditing: true };
    }
    return { ...task, isEditing: false };
  });
  renderTasks();
}

function saveEditedTask(taskId, newText) {
  const trimmedText = newText.trim();

  if (trimmedText === '') {
    showError('Task cannot be empty.');
    return;
  }

  tasks = tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, text: trimmedText, isEditing: false };
    }
    return task;
  });
  saveTasks();
  renderTasks();
}

function clearCompletedTasks() {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
}

function getFilteredTasks() {
  let filteredTasks = tasks;

  if (currentFilter === 'active') {
    filteredTasks = filteredTasks.filter(task => !task.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = filteredTasks.filter(task => task.completed);
  }

  if (searchTerm !== '') {
    filteredTasks = filteredTasks.filter(task =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return filteredTasks;
}

function createTaskElement(task) {
  const listItem = document.createElement('li');
  listItem.classList.add('task-item');
  if (task.completed) {
    listItem.classList.add('completed');
  }
  listItem.dataset.id = task.id;

  if (task.isEditing) {
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.classList.add('task-edit-input');
    editInput.value = task.text;
    editInput.maxLength = 120;

    const saveButton = document.createElement('button');
    saveButton.classList.add('icon-btn', 'save-btn');
    saveButton.dataset.action = 'save';
    saveButton.textContent = '✔';

    listItem.appendChild(editInput);
    listItem.appendChild(saveButton);
  } else {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = task.completed;
    checkbox.dataset.action = 'toggle';

    const taskName = document.createElement('span');
    taskName.classList.add('task-name');
    taskName.textContent = task.text;

    const actionsWrapper = document.createElement('div');
    actionsWrapper.classList.add('task-actions');

    const editButton = document.createElement('button');
    editButton.classList.add('icon-btn', 'edit-btn');
    editButton.dataset.action = 'edit';
    editButton.textContent = '✎';

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('icon-btn', 'delete-btn');
    deleteButton.dataset.action = 'delete';
    deleteButton.textContent = '🗑';

    actionsWrapper.appendChild(editButton);
    actionsWrapper.appendChild(deleteButton);

    listItem.appendChild(checkbox);
    listItem.appendChild(taskName);
    listItem.appendChild(actionsWrapper);
  }

  return listItem;
}

function renderTasks() {
  taskList.innerHTML = '';

  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    emptyState.classList.add('show');
  } else {
    emptyState.classList.remove('show');
  }

  filteredTasks.forEach(task => {
    const taskElement = createTaskElement(task);
    taskList.appendChild(taskElement);
  });

  const editingTask = taskList.querySelector('.task-edit-input');
  if (editingTask) {
    editingTask.focus();
  }

  updateStats();
}

function updateStats() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const activeTasks = totalTasks - completedTasks;

  totalCountEl.textContent = totalTasks;
  activeCountEl.textContent = activeTasks;
  completedCountEl.textContent = completedTasks;

  if (totalTasks === 0) {
    footerHint.textContent = 'No tasks yet';
  } else {
    footerHint.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} remaining`;
  }
}

function handleTaskListClick(event) {
  const listItem = event.target.closest('.task-item');
  if (!listItem) return;

  const taskId = listItem.dataset.id;
  const action = event.target.dataset.action;

  if (action === 'toggle') {
    toggleTaskCompleted(taskId);
  } else if (action === 'delete') {
    listItem.style.opacity = '0';
    listItem.style.transform = 'translateX(20px)';
    setTimeout(() => deleteTask(taskId), 150);
  } else if (action === 'edit') {
    startEditingTask(taskId);
  } else if (action === 'save') {
    const editInput = listItem.querySelector('.task-edit-input');
    saveEditedTask(taskId, editInput.value);
  }
}

function handleTaskListKeydown(event) {
  if (event.key === 'Enter' && event.target.classList.contains('task-edit-input')) {
    const listItem = event.target.closest('.task-item');
    saveEditedTask(listItem.dataset.id, event.target.value);
  }
}

function handleFilterClick(event) {
  filterButtons.forEach(button => button.classList.remove('active'));
  event.target.classList.add('active');
  currentFilter = event.target.dataset.filter;
  renderTasks();
}

function handleSearchInput(event) {
  searchTerm = event.target.value;
  renderTasks();
}

addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    addTask();
  }
});

taskList.addEventListener('click', handleTaskListClick);
taskList.addEventListener('keydown', handleTaskListKeydown);

filterButtons.forEach(button => {
  button.addEventListener('click', handleFilterClick);
});

searchInput.addEventListener('input', handleSearchInput);
clearCompletedBtn.addEventListener('click', clearCompletedTasks);

loadTasks();
renderTasks();
