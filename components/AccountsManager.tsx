'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function AccountsManager() {
  const [users, setUsers] = useState<Array<{ id: number; email: string; role: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<{ id: number; email: string; role: string } | null>(null);
  const [editForm, setEditForm] = useState({ email: '', password: '', role: 'user' });

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch('/api/users', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error('Unable to load users');
      const data = await res.json();
      setUsers(data.users ?? []);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function handleFormChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to add user');
      }
      setForm({ email: '', password: '', role: 'user' });
      await fetchUsers();
    } catch (err: any) {
      setError(err.message ?? 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function startEdit(user: { id: number; email: string; role: string }) {
    setEditing(user);
    setEditForm({ email: user.email, password: '', role: user.role });
  }

  async function handleUpdateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    try {
      const payload: Record<string, string> = { role: editForm.role, email: editForm.email };
      if (editForm.password) payload.password = editForm.password;
      const res = await fetch(`/api/users/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update user');
      }
      setEditing(null);
      setEditForm({ email: '', password: '', role: 'user' });
      await fetchUsers();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update user');
    }
  }

  async function deleteUser(id: number) {
    if (!confirm('Remove this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete user');
    }
  }

  return (
    <div className="accounts">
      <div className="actions">
        <Link className="pill ghost" href="/">
          Home
        </Link>
      </div>

      {!editing && (
        <section className="accountCard">
          <h2>Add User</h2>
          <form className="accountForm" onSubmit={handleAddUser}>
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleFormChange} required />
            <input
              name="password"
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={handleFormChange}
              required
            />
            <select name="role" value={form.role} onChange={handleFormChange}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add User'}
            </button>
          </form>
        </section>
      )}

      {editing && (
        <section className="accountCard">
          <h2>Edit User</h2>
          <form className="accountForm" onSubmit={handleUpdateUser}>
            <input name="email" type="email" placeholder="Email" value={editForm.email} onChange={handleEditChange} required />
            <input
              name="password"
              type="password"
              placeholder="New password (optional)"
              value={editForm.password}
              onChange={handleEditChange}
            />
            <select name="role" value={editForm.role} onChange={handleEditChange}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="accountActions">
              <button type="submit">Update User</button>
              <button type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="accountCard">
        <h2>Users</h2>
        {loading ? (
          <p>Loading users…</p>
        ) : users.length === 0 ? (
          <p>No users yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td className="roleTag">{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="accountActions">
                    <button type="button" onClick={() => startEdit(user)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteUser(user.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {error && <p className="status error">{error}</p>}
      </section>
    </div>
  );
}
