// DOM Elementleri
const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todoList');
const calendarEl = document.getElementById('calendar');
const taskDetailModal = document.getElementById('taskDetailModal');
const closeTaskModal = document.getElementById('closeTaskModal');
const saveTaskDetail = document.getElementById('saveTaskDetail');
const deleteTaskDetail = document.getElementById('deleteTaskDetail');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalDueDate = document.getElementById('modal-dueDate');
const themeToggle = document.getElementById('themeToggle');

// Tema değiştirme
let isLightMode = false;

function setTheme(isLight) {
    const root = document.documentElement;
    if (isLight) {
        document.body.style.backgroundColor = '#f5f5f5';
        document.body.style.color = '#333';
        document.querySelectorAll('.bg-sidebar').forEach(el => el.style.backgroundColor = '#f0f0f0');
        document.querySelectorAll('.bg-card').forEach(el => el.style.backgroundColor = '#ffffff');
        document.querySelectorAll('.border-gray-800').forEach(el => el.style.borderColor = '#e0e0e0');
    } else {
        document.body.style.backgroundColor = '#121212';
        document.body.style.color = '#e0e0e0';
        document.querySelectorAll('.bg-sidebar').forEach(el => el.style.backgroundColor = '#1e1e1e');
        document.querySelectorAll('.bg-card').forEach(el => el.style.backgroundColor = '#252525');
        document.querySelectorAll('.border-gray-800').forEach(el => el.style.borderColor = '#333');
    }
}

themeToggle.addEventListener('change', () => {
    isLightMode = !themeToggle.checked;
    setTheme(isLightMode);
});

// Takvim başlatma
const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'tr',
    height: 'auto',
    headerToolbar: {
        left: 'prev,next',
        center: 'title',
        right: 'today'
    },
    buttonText: {
        today: 'Bugün'
    },
    dayHeaderFormat: { weekday: 'short' },
    titleFormat: { month: 'long' },
    themeSystem: 'standard',
    events: [], // Görevler buraya eklenecek
    eventClick: function(info) {
        // Görev detaylarını göster
        openTaskDetail(info.event.id);
    },
    // Koyu tema için
    eventBackgroundColor: '#ff9500',
    eventBorderColor: '#ff9500',
    eventTextColor: '#121212',
    // Diğer görünüm ayarları
    slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }
});
calendar.render();

// Modal işlevleri
let currentTaskId = null;

// Modal aç
function openTaskDetail(taskId) {
    currentTaskId = taskId;
    
    // Görevi getir
    fetch(`/api/todos/${taskId}`)
        .then(response => response.json())
        .then(task => {
            modalTitle.value = task.title;
            modalDescription.value = task.description || '';
            
            // Tarihi doğru formata dönüştür (YYYY-MM-DDTHH:MM)
            const dueDate = new Date(task.dueDate);
            const year = dueDate.getFullYear();
            const month = String(dueDate.getMonth() + 1).padStart(2, '0');
            const day = String(dueDate.getDate()).padStart(2, '0');
            const hours = String(dueDate.getHours()).padStart(2, '0');
            const minutes = String(dueDate.getMinutes()).padStart(2, '0');
            
            modalDueDate.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            // Modalı göster
            taskDetailModal.classList.remove('hidden');
            setTimeout(() => {
                taskDetailModal.classList.add('active');
            }, 10);
        })
        .catch(error => {
            console.error('Görev detayları getirilirken hata oluştu:', error);
        });
}

// Modal kapat
function closeTaskDetail() {
    taskDetailModal.classList.remove('active');
    setTimeout(() => {
        taskDetailModal.classList.add('hidden');
        currentTaskId = null;
    }, 300);
}

// Modal olayları
closeTaskModal.addEventListener('click', closeTaskDetail);

// Dışarı tıklayınca kapat
taskDetailModal.addEventListener('click', function(e) {
    if (e.target === taskDetailModal) {
        closeTaskDetail();
    }
});

// Kaydet butonu
saveTaskDetail.addEventListener('click', function() {
    if (!currentTaskId) return;
    
    const updatedTask = {
        title: modalTitle.value,
        description: modalDescription.value,
        dueDate: modalDueDate.value
    };
    
    fetch(`/api/todos/${currentTaskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask)
    })
    .then(response => {
        if (response.ok) {
            closeTaskDetail();
            loadTodos();
            showNotification('Görev güncellendi!');
        }
    })
    .catch(error => {
        console.error('Görev güncellenirken hata oluştu:', error);
    });
});

// Sil butonu
deleteTaskDetail.addEventListener('click', function() {
    if (!currentTaskId) return;
    
    fetch(`/api/todos/${currentTaskId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            closeTaskDetail();
            loadTodos();
            showNotification('Görev silindi!');
        }
    })
    .catch(error => {
        console.error('Görev silinirken hata oluştu:', error);
    });
});

// Görevleri yükle
async function loadTodos() {
    try {
        const response = await fetch('/api/todos');
        const todos = await response.json();
        
        // Görev listesini güncelle
        todoList.innerHTML = '';
        todos.forEach(todo => {
            const todoElement = createTodoElement(todo);
            todoList.appendChild(todoElement);
        });

        // Takvimi güncelle
        updateCalendar(todos);
        
        // Yaklaşan görevleri güncelle
        updateUpcomingTasks(todos);
    } catch (error) {
        console.error('Görevler yüklenirken hata oluştu:', error);
    }
}

// Yaklaşan görevleri güncelle
function updateUpcomingTasks(todos) {
    const upcomingContainer = document.querySelector('.mt-8 .space-y-3');
    if (!upcomingContainer) return;
    
    upcomingContainer.innerHTML = '';
    
    // Bugünün tarihi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Yarının tarihi
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Gelecek 7 günün tarihi
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Tarihe göre sırala
    const sortedTodos = [...todos].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Yaklaşan 3 görevi göster
    const upcomingTodos = sortedTodos
        .filter(todo => !todo.completed && new Date(todo.dueDate) >= today && new Date(todo.dueDate) <= nextWeek)
        .slice(0, 3);
    
    if (upcomingTodos.length === 0) {
        upcomingContainer.innerHTML = `
            <div class="bg-card p-3 rounded-lg">
                <div class="text-gray-400 text-center">Yaklaşan görev yok</div>
            </div>
        `;
        return;
    }
    
    upcomingTodos.forEach(todo => {
        const todoDate = new Date(todo.dueDate);
        let dateLabel;
        let dateColor;
        
        if (todoDate.toDateString() === today.toDateString()) {
            dateLabel = 'Bugün';
            dateColor = 'text-yellow-500';
        } else if (todoDate.toDateString() === tomorrow.toDateString()) {
            dateLabel = 'Yarın';
            dateColor = 'text-blue-500';
        } else {
            dateLabel = formatDate(todoDate);
            dateColor = 'text-purple-500';
        }
        
        const element = document.createElement('div');
        element.className = 'bg-card p-3 rounded-lg cursor-pointer hover:bg-[#2c2c2c] transition-colors';
        element.innerHTML = `
            <div class="text-xs ${dateColor} mb-1">${dateLabel}</div>
            <div class="font-medium">${todo.title}</div>
        `;
        
        element.addEventListener('click', () => {
            openTaskDetail(todo.id);
        });
        
        upcomingContainer.appendChild(element);
    });
}

// Görev elementi oluştur
function createTodoElement(todo) {
    const div = document.createElement('div');
    const date = new Date(todo.dueDate);
    
    // Tarihi biçimlendir
    const formattedDate = formatDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Tarih etiketini belirle (bugün, yarın veya tarih)
    let dateLabel;
    let dateColor;
    
    if (date.toDateString() === today.toDateString()) {
        dateLabel = 'Bugün';
        dateColor = 'text-yellow-500';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        dateLabel = 'Yarın';
        dateColor = 'text-blue-500';
    } else {
        dateLabel = formattedDate;
        dateColor = 'text-gray-400';
    }
    
    div.className = `bg-card rounded-lg p-4 task-item transition-all duration-200 ${todo.completed ? 'opacity-60' : ''}`;
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <button onclick="toggleTodo('${todo.id}')" class="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${todo.completed ? 'bg-gradient-to-r from-yellow-500 to-red-500' : 'border-2 border-gray-600 hover:border-yellow-500'}">
                    ${todo.completed ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                </button>
                <div>
                    <h3 class="font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-white'}">${todo.title}</h3>
                    <div class="flex items-center mt-1">
                        <span class="text-xs ${dateColor} flex items-center">
                            <i class="far fa-calendar-alt mr-1.5"></i>${dateLabel}
                        </span>
                        ${todo.description ? `<span class="text-xs text-gray-500 ml-3 flex items-center"><i class="far fa-file-alt mr-1.5"></i>Not</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="editTodo('${todo.id}')" class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors">
                    <i class="fas fa-pencil-alt text-sm"></i>
                </button>
                <button onclick="deleteTodo('${todo.id}')" class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <i class="fas fa-trash-alt text-sm"></i>
                </button>
            </div>
        </div>
    `;
    return div;
}

// Görevi düzenle
function editTodo(id) {
    openTaskDetail(id);
}

// Tarihi biçimlendir
function formatDate(date) {
    const day = date.getDate();
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const month = monthNames[date.getMonth()];
    return `${day} ${month}`;
}

// Takvimi güncelle
function updateCalendar(todos) {
    const events = todos.map(todo => ({
        id: todo.id,
        title: todo.title,
        start: todo.dueDate,
        description: todo.description,
        backgroundColor: todo.completed ? '#6B7280' : '#ff9500',
        borderColor: todo.completed ? '#6B7280' : '#ff9500',
        textColor: '#121212',
        classNames: ['calendar-event']
    }));
    calendar.removeAllEvents();
    calendar.addEventSource(events);
}

// Yeni görev ekle
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    if (!title.trim()) return;

    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);

    const todo = {
        title: title,
        description: '',
        dueDate: dueDate.toISOString()
    };

    try {
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(todo)
        });

        if (response.ok) {
            todoForm.reset();
            loadTodos();
            // Başarılı feedback
            showNotification('Görev başarıyla eklendi!');
        }
    } catch (error) {
        console.error('Görev eklenirken hata oluştu:', error);
    }
});

// Görev durumunu değiştir
async function toggleTodo(id) {
    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: true })
        });

        if (response.ok) {
            loadTodos();
            showNotification('Görev tamamlandı olarak işaretlendi!');
        }
    } catch (error) {
        console.error('Görev güncellenirken hata oluştu:', error);
    }
}

// Görev sil
async function deleteTodo(id) {
    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTodos();
            showNotification('Görev silindi!');
        }
    } catch (error) {
        console.error('Görev silinirken hata oluştu:', error);
    }
}

// Bildirim göster
function showNotification(message) {
    // Bildirim elementi var mı kontrol et
    let notification = document.getElementById('notification');
    
    // Yoksa oluştur
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-yellow-500 to-red-500 text-white py-2 px-4 rounded-lg shadow-lg transform translate-y-10 opacity-0 transition-all duration-300';
        document.body.appendChild(notification);
    }
    
    // Mesajı ayarla ve göster
    notification.textContent = message;
    setTimeout(() => {
        notification.classList.remove('translate-y-10', 'opacity-0');
    }, 100);
    
    // 3 saniye sonra kaldır
    setTimeout(() => {
        notification.classList.add('translate-y-10', 'opacity-0');
    }, 3000);
}

// Sayfa yüklendiğinde görevleri yükle
loadTodos(); 