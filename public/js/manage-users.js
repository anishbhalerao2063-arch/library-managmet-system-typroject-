document.addEventListener('DOMContentLoaded', async () => {
  const user = initPage('manage-users.html');
  if (!user || user.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }
  loadUsersList();
});

async function loadUsersList() {
  const main = document.getElementById('mainContent');

  try {
    const data = await apiGet('/api/users');
    if (!data) return;
    const users = data.users;

    main.innerHTML = `
      <div class="page-header">
        <h1>Users</h1>
        <p>Manage all registered users</p>
      </div>

      <div class="card">
        <div class="card-header"><h2>All Users (${users.length})</h2></div>
        ${users.length > 0 ? `
          <div class="table-wrapper"><table>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              ${users.map(u => `<tr>
                <td>#${u.user_id}</td>
                <td><strong>${esc(u.name)}</strong></td>
                <td>${esc(u.email)}</td>
                <td><span class="badge badge-${u.role}">${u.role}</span></td>
                <td>${formatDate(u.created_at)}</td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn-icon" onclick='openEditUser(${JSON.stringify(u)})' title="Edit">✏️</button>
                    <button class="btn-icon danger" onclick="deleteUser(${u.user_id}, '${esc(u.name).replace(/'/g, "\\'")}')" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        ` : '<div class="empty-state"><div class="empty-icon">👥</div><h3>No users found</h3></div>'}
      </div>
    `;
  } catch (err) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading users</h3></div>';
  }
}

function openEditUser(user) {
  document.getElementById('userModalTitle').textContent = 'Edit User';
  document.getElementById('editUserId').value = user.user_id;
  document.getElementById('userName').value = user.name;
  document.getElementById('userEmail').value = user.email;
  document.getElementById('userRole').value = user.role;
  document.getElementById('userModal').classList.remove('hidden');
}

function closeUserModal() {
  document.getElementById('userModal').classList.add('hidden');
}

async function saveUser(e) {
  e.preventDefault();
  const btn = document.getElementById('saveUserBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const userId = document.getElementById('editUserId').value;
  const body = {
    name: document.getElementById('userName').value.trim(),
    email: document.getElementById('userEmail').value.trim(),
    role: document.getElementById('userRole').value
  };

  try {
    const result = await apiPut(`/api/users/${userId}`, body);
    if (!result) return;
    if (result.ok) {
      showToast(result.data.message, 'success');
      closeUserModal();
      loadUsersList();
    } else {
      showToast(result.data.error || 'Failed to update user.', 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save User';
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
  try {
    const result = await apiDelete(`/api/users/${id}`);
    if (!result) return;
    if (result.ok) {
      showToast(result.data.message, 'success');
      loadUsersList();
    } else {
      showToast(result.data.error || 'Failed to delete user.', 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  }
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
