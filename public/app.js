const userForm = document.querySelector('#user-form');
const exerciseForm = document.querySelector('#exercise-form');
const userSelect = document.querySelector('#user-select');
const historyList = document.querySelector('#history-list');
const emptyState = document.querySelector('#empty-state');

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function showMessage(selector, message) { document.querySelector(selector).textContent = message; }

async function loadUsers() {
  const users = await request('/api/users');
  userSelect.innerHTML = '<option value="">Select an athlete</option>';
  users.forEach((user) => userSelect.add(new Option(user.username, user._id)));
  return users;
}

async function loadHistory() {
  const users = await loadUsers();
  const logs = (await Promise.all(users.map(async (user) => {
    const result = await request(`/api/users/${user._id}/logs`);
    return result.log.map((exercise) => ({ ...exercise, username: user.username }));
  }))).flat();
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  emptyState.hidden = logs.length > 0;
  historyList.innerHTML = logs.map((item) => `<article class="history-item"><div><strong>${escapeHtml(item.description)}</strong><small>${item.date}</small></div><div class="duration">${item.duration} min</div><div class="athlete">${escapeHtml(item.username)}</div></article>`).join('');
}

function escapeHtml(value) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await request('/api/users', { method: 'POST', body: new URLSearchParams(new FormData(userForm)) }); userForm.reset(); showMessage('#user-message', 'Athlete created.'); await loadHistory(); } catch (error) { showMessage('#user-message', error.message); }
});

exerciseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = new URLSearchParams(new FormData(exerciseForm));
  body.delete('user-select');
  try { await request(`/api/users/${userSelect.value}/exercises`, { method: 'POST', body }); exerciseForm.reset(); showMessage('#exercise-message', 'Session recorded.'); await loadHistory(); } catch (error) { showMessage('#exercise-message', error.message); }
});

document.querySelector('#refresh').addEventListener('click', loadHistory);
loadHistory().catch((error) => showMessage('#exercise-message', error.message));