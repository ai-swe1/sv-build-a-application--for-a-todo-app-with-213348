document.addEventListener('DOMContentLoaded', () => {
  const appDiv = document.getElementById('app');

  const refresh = async () => {
    const resp = await fetch('/api/todos');
    const todos = await resp.json();
    render(todos);
  };

  const render = (todos) => {
    appDiv.innerHTML = '';
    const list = document.createElement('ul');
    todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.completed ? ' completed' : '');
      li.textContent = todo.title;
      li.addEventListener('click', () => toggle(todo.id, !todo.completed));
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', (e) => { e.stopPropagation(); remove(todo.id); });
      li.appendChild(delBtn);
      list.appendChild(li);
    });
    appDiv.appendChild(list);
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'New todo title';
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.addEventListener('click', () => add(input.value));
    appDiv.appendChild(input);
    appDiv.appendChild(addBtn);
  };

  const add = async (title) => {
    if (!title.trim()) return;
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    await refresh();
  };

  const toggle = async (id, completed) => {
    await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    await refresh();
  };

  const remove = async (id) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    await refresh();
  };

  refresh();
});