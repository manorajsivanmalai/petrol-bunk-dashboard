'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJSON } from '@/lib/fetcher';
import { ROLES, roleLabels } from '@/lib/rbac';

const initialForm = { name: '', username: '', role: 'ATTENDANT', phone: '' };

export default function InviteUserButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const router = useRouter();

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const close = () => {
    setOpen(false);
    setForm(initialForm);
    setError('');
    setResult(null);
    router.refresh();
  };

  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await postJSON('/api/users', form);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="primary compact" onClick={() => setOpen(true)}>+ Invite member</button>
      {open && (
        <div className="backdrop" onClick={event => event.target === event.currentTarget && close()}>
          <div className="modal">
            <button className="close" onClick={close}>×</button>
            <span className="eyebrow">TEAM</span>
            <h2>Invite team member</h2>
            {result ? (
              <>
                <p>Share these credentials with {result.user.name} securely. They should change the password after signing in.</p>
                <div className="temp-password-group">
                  <div className="temp-password">User ID: {result.user.username}</div>
                  <div className="temp-password">Temp password: {result.tempPassword}</div>
                </div>
                <div className="modal-actions">
                  <button className="primary" onClick={close}>Done</button>
                </div>
              </>
            ) : (
              <>
                <p>Create a login for a colleague and assign their access level.</p>
                <form onSubmit={submit}>
                  <label className="span-2">
                    Full name
                    <input required value={form.name} onChange={event => update('name', event.target.value)} />
                  </label>
                  <label>
                    User ID
                    <input required value={form.username} onChange={event => update('username', event.target.value)} placeholder="e.g. karthik.r" />
                  </label>
                  <label>
                    Access level
                    <select value={form.role} onChange={event => update('role', event.target.value)}>
                      {ROLES.map(role => (
                        <option key={role} value={role}>{roleLabels[role]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="span-2">
                    Phone (optional)
                    <input value={form.phone} onChange={event => update('phone', event.target.value)} />
                  </label>
                  {error && <p className="form-error span-2">{error}</p>}
                  <button className="primary" type="submit" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create login'} <span>↗</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
