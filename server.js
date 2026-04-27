const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

// Data storage (JSON file)
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'todos.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readTodos() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    // If the file is corrupted, reset it
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
}

function writeTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf8');
}

// Helper to generate a new incremental ID
function getNextId(todos) {
  if (todos.length === 0) return 1;
  return Math.max(...todos.map(t => t.id)) + 1;
}

// ---------- API Routes ----------

// Get all todos
app.get('/api/todos', (req, res) => {
  const todos = readTodos();
  res.json(todos);
});

// Get a single todo by id
app.get('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todos = readTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.json(todo);
});

// Create a new todo
app.post('/api/todos', (req, res) => {
  const { title, completed = false } = req.body;
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  const todos = readTodos();
  const newTodo = {
    id: getNextId(todos),
    title: title.trim(),
    completed: Boolean(completed)
  };
  todos.push(newTodo);
  writeTodos(todos);
  res.status(201).json(newTodo);
});

// Update an existing todo
app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, completed } = req.body;
  const todos = readTodos();
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Invalid title' });
    }
    todos[index].title = title.trim();
  }
  if (completed !== undefined) {
    todos[index].completed = Boolean(completed);
  }
  writeTodos(todos);
  res.json(todos[index]);
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  let todos = readTodos();
  const exists = todos.some(t => t.id === id);
  if (!exists) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  todos = todos.filter(t => t.id !== id);
  writeTodos(todos);
  res.status(204).send();
});

// Global error handler (fallback)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
