'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJSON } from '@/lib/fetcher';

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postJSON('/api/auth/login', { identifier, password });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login">
      <div className="login-visual">
        <div className="brand-lockup">
          <div className="brand-mark"><span>iocl</span></div>
          <div>
            <strong>KANNUSAMY</strong>
            <small>AGENCY / KALLAKURICHI</small>
          </div>
        </div>
        <div className="visual-copy">
          <span className="eyebrow">INDIANOIL OPERATIONS</span>
          <h1>Every litre,<br /><em>accounted for.</em></h1>
          <p>A clearer way to run your station, move fuel, and keep every team aligned.</p>
        </div>
        <div className="visual-footer">
          <span>TN 32 · EST. 2008</span>
          <span>v2.4.0</span>
        </div>
      </div>
      <div className="login-panel">
        <div className="mobile-brand">
          <div className="brand-mark"><span>iocl</span></div>
          <strong>KANNUSAMY AGENCY</strong>
        </div>
        <div className="login-heading">
          <span className="eyebrow">SECURE WORKSPACE</span>
          <h2>Welcome back<span>.</span></h2>
          <p>Sign in to continue to the agency portal. Your access level is set by your admin.</p>
        </div>
        <form onSubmit={login} className="login-form">
          <label>
            Username or email
            <input
              value={identifier}
              onChange={event => setIdentifier(event.target.value)}
              autoComplete="username"
              placeholder="e.g. karthik.r or you@kannusamyagency.com"
              required
            />
          </label>
          <label>
            Password
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPassword(show => !show)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Enter workspace'} <span>↗</span>
          </button>
        </form>
        <div className="demo-note">
          <span className="dot" />
          New here? Ask your Super Admin to create your login from the Access page.
        </div>
      </div>
    </section>
  );
}
