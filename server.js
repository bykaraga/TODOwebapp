const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Görev dosyasını oku
function readTodosFile() {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'todos.json'), 'utf8'));
    } catch (error) {
        return [];
    }
}

// Helper: Görev dosyasına yaz
function writeTodosFile(todos) {
    fs.writeFileSync(path.join(__dirname, 'data', 'todos.json'), JSON.stringify(todos, null, 2));
}

// API Routes
app.get('/api/todos', (req, res) => {
    try {
        const todos = readTodosFile();
        res.json(todos);
    } catch (error) {
        res.json([]);
    }
});

// Belirli bir görevi getir
app.get('/api/todos/:id', (req, res) => {
    try {
        const todos = readTodosFile();
        const todo = todos.find(todo => todo.id === req.params.id);
        
        if (!todo) {
            return res.status(404).json({ error: 'Görev bulunamadı' });
        }
        
        res.json(todo);
    } catch (error) {
        res.status(500).json({ error: 'Görev getirilirken bir hata oluştu' });
    }
});

app.post('/api/todos', (req, res) => {
    try {
        const todos = readTodosFile();
        const newTodo = {
            id: Date.now().toString(),
            ...req.body,
            completed: false,
            createdAt: new Date().toISOString()
        };
        todos.push(newTodo);
        writeTodosFile(todos);
        res.json(newTodo);
    } catch (error) {
        res.status(500).json({ error: 'Görev eklenirken bir hata oluştu' });
    }
});

app.put('/api/todos/:id', (req, res) => {
    try {
        const todos = readTodosFile();
        const index = todos.findIndex(todo => todo.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Görev bulunamadı' });
        }
        todos[index] = { ...todos[index], ...req.body };
        writeTodosFile(todos);
        res.json(todos[index]);
    } catch (error) {
        res.status(500).json({ error: 'Görev güncellenirken bir hata oluştu' });
    }
});

app.delete('/api/todos/:id', (req, res) => {
    try {
        const todos = readTodosFile();
        const filteredTodos = todos.filter(todo => todo.id !== req.params.id);
        writeTodosFile(filteredTodos);
        res.json({ message: 'Görev başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Görev silinirken bir hata oluştu' });
    }
});

// Ana sayfa route'u
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
}); 