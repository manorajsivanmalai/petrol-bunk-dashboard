'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher, postJSON } from '@/lib/fetcher';
import { useToast } from './ToastProvider';

const fuelTypes = ['DIESEL', 'PETROL', 'XP95'];
const initialForm = { fuelType: 'DIESEL', quantityL: 240, amount: 24000, vehicleNumber: '', paymentMode: 'CASH', customerId: '' };

export default function NewFuelEntryButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const notify = useToast();
  const { data } = useSWR(open ? '/api/customers' : null, fetcher);
  const customers = data?.customers || [];

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
      await postJSON('/api/fuel-entries', form);
      close();
      notify('Fuel entry saved to today’s shift.');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="primary compact" onClick={() => setOpen(true)}>+ New fuel entry</button>
      {open && (
        <div className="backdrop" onClick={event => event.target === event.currentTarget && close()}>
          <div className="modal">
            <button className="close" onClick={close}>×</button>
            <span className="eyebrow">QUICK ACTION</span>
            <h2>New fuel entry</h2>
            <p>Record a fresh movement against today’s station shift.</p>
            <form onSubmit={submit}>
              <label>
                Fuel type
                <select value={form.fuelType} onChange={event => update('fuelType', event.target.value)}>
                  {fuelTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </label>
              <label>
                Quantity (litres)
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={form.quantityL}
                  onChange={event => update('quantityL', event.target.value)}
                />
              </label>
              <label className="span-2">
                Vehicle number
                <input
                  value={form.vehicleNumber}
                  onChange={event => update('vehicleNumber', event.target.value)}
                  placeholder="e.g. TN15 AB 4582"
                />
              </label>
              <label>
                Amount (₹)
                <input type="number" min="1" required value={form.amount} onChange={event => update('amount', event.target.value)} />
              </label>
              <label>
                Payment mode
                <select value={form.paymentMode} onChange={event => update('paymentMode', event.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </label>
              {form.paymentMode === 'CREDIT' && (
                <label className="span-2">
                  Customer
                  <select value={form.customerId} onChange={event => update('customerId', event.target.value)} required>
                    <option value="">Select customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </label>
              )}
              {error && <p className="form-error span-2">{error}</p>}
              <button className="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save fuel entry'} <span>↗</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
