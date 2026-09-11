'use client';

import { useState } from 'react';
import { postJSON } from '@/lib/fetcher';
import { randomPassword } from '@/lib/random-password';
import { useToast } from './ToastProvider';

export default function ResetPasswordButton({ user }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const notify = useToast();

  const close = () => {
    setOpen(false);
    setPassword('');
    setShowPassword(false);
    setError('');
    setResult(null);
  };

  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await postJSON(`/api/users/${user.id}/reset-password`, { password: password || undefined });
      setResult(data);
      notify(`Password reset for ${user.name}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="secondary" onClick={() => setOpen(true)}>Reset password</button>
      {open && (
        <div className="backdrop" onClick={event => event.target === event.currentTarget && close()}>
          <div className="modal">
            <button className="close" onClick={close}>×</button>
            <span className="eyebrow">SECURITY</span>
            <h2>Reset password</h2>
            {result ? (
              <>
                <p>Share this new password with {user.name} securely.</p>
                <div className="temp-password-group">
                  <div className="temp-password">User ID: {user.username}</div>
                  <div className="temp-password">New password: {result.password}</div>
                </div>
                <div className="modal-actions">
                  <button className="primary" onClick={close}>Done</button>
                </div>
              </>
            ) : (
              <>
                <p>Set a new password for {user.name}, or leave blank to generate one.</p>
                <form onSubmit={submit}>
                  <label className="span-2">
                    New password
                    <div className="password-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        placeholder="Leave blank to auto-generate"
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowPassword(show => !show)}>
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setPassword(randomPassword());
                      setShowPassword(true);
                    }}
                  >
                    Generate a password
                  </button>
                  {error && <p className="form-error span-2">{error}</p>}
                  <button className="primary" type="submit" disabled={submitting}>
                    {submitting ? 'Resetting…' : 'Reset password'} <span>↗</span>
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
