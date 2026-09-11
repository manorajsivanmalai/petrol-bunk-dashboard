'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJSON } from '@/lib/fetcher';
import { useToast } from './ToastProvider';

const initialForm = { name: '', contactPhone: '', creditLimit: 50000 };

export default function AddCustomerButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const notify = useToast();

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const close = () => {
    setOpen(false);
    setForm(initialForm);
    setError('');
  };

  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await postJSON('/api/customers', form);
      close();
      notify('Customer added.');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="primary compact" onClick={() => setOpen(true)}>+ Add customer</button>
      {open && (
        <div className="backdrop" onClick={event => event.target === event.currentTarget && close()}>
          <div className="modal">
            <button className="close" onClick={close}>×</button>
            <span className="eyebrow">NEW ACCOUNT</span>
            <h2>Add customer</h2>
            <p>Set up a credit account for a transport partner or regular customer.</p>
            <form onSubmit={submit}>
              <label className="span-2">
                Business / customer name
                <input required value={form.name} onChange={event => update('name', event.target.value)} placeholder="e.g. ABC Transport" />
              </label>
              <label>
                Contact phone
                <input value={form.contactPhone} onChange={event => update('contactPhone', event.target.value)} placeholder="10-digit number" />
              </label>
              <label>
                Credit limit (₹)
                <input type="number" min="0" value={form.creditLimit} onChange={event => update('creditLimit', event.target.value)} />
              </label>
              {error && <p className="form-error span-2">{error}</p>}
              <button className="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Add customer'} <span>↗</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
