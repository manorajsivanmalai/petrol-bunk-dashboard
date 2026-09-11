'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { patchJSON } from '@/lib/fetcher';
import { ROLES, roleLabels } from '@/lib/rbac';
import { useToast } from './ToastProvider';

export default function UserRoleControls({ user, isSelf }) {
  const [role, setRole] = useState(user.role);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const notify = useToast();

  const changeRole = async event => {
    const nextRole = event.target.value;
    setRole(nextRole);
    setBusy(true);
    try {
      await patchJSON(`/api/users/${user.id}`, { role: nextRole });
      notify(`${user.name}'s access updated to ${roleLabels[nextRole]}.`);
      router.refresh();
    } catch (err) {
      notify(err.message);
      setRole(user.role);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    setBusy(true);
    try {
      await patchJSON(`/api/users/${user.id}`, { active: !user.active });
      notify(user.active ? `${user.name} deactivated.` : `${user.name} reactivated.`);
      router.refresh();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (isSelf) return null;

  return (
    <div className="field-row">
      <select value={role} disabled={busy} onChange={changeRole}>
        {ROLES.map(item => (
          <option key={item} value={item}>{roleLabels[item]}</option>
        ))}
      </select>
      <button className="secondary" disabled={busy} onClick={toggleActive}>
        {user.active ? 'Deactivate' : 'Reactivate'}
      </button>
    </div>
  );
}
