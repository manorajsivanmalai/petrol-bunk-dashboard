'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJSON } from '@/lib/fetcher';
import { useToast } from './ToastProvider';

export default function ApprovalActions({ id }) {
  const [loading, setLoading] = useState('');
  const router = useRouter();
  const notify = useToast();

  const decide = async action => {
    setLoading(action);
    try {
      await postJSON(`/api/approvals/${id}/decision`, { action });
      notify(action === 'approve' ? 'Approval updated and logged.' : 'Request rejected and logged.');
      router.refresh();
    } catch (err) {
      notify(err.message);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="row-actions">
      <button className="secondary" disabled={!!loading} onClick={() => decide('approve')}>
        {loading === 'approve' ? 'Approving…' : 'Approve'}
      </button>
      <button className="secondary" disabled={!!loading} onClick={() => decide('reject')}>
        {loading === 'reject' ? 'Rejecting…' : 'Reject'}
      </button>
    </div>
  );
}
