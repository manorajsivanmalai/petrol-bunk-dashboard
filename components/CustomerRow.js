'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, postJSON } from '@/lib/fetcher';
import { Tag } from './ui';
import { formatCurrency, timeAgo } from '@/lib/format';
import { useToast } from './ToastProvider';

export default function CustomerRow({ customer }) {
  const [open, setOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState('');
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const notify = useToast();
  const detailKey = open ? `/api/customers/${customer.id}` : null;
  const { data, isLoading } = useSWR(detailKey, fetcher);

  const vehicles = data?.customer.vehicles ?? customer.vehicles;

  const addVehicle = async event => {
    event.preventDefault();
    if (!newVehicle.trim()) return;
    setAddingVehicle(true);
    setVehicleError('');
    try {
      await postJSON(`/api/customers/${customer.id}/vehicles`, { vehicleNumber: newVehicle.trim() });
      setNewVehicle('');
      notify('Vehicle added.');
      mutate(`/api/customers/${customer.id}`);
      mutate('/api/customers');
    } catch (err) {
      setVehicleError(err.message);
    } finally {
      setAddingVehicle(false);
    }
  };

  const recordPayment = async event => {
    event.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    setRecordingPayment(true);
    setPaymentError('');
    try {
      await postJSON(`/api/customers/${customer.id}/payments`, { amount });
      setPaymentAmount('');
      notify('Payment recorded.');
      mutate(`/api/customers/${customer.id}`);
      mutate('/api/customers');
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setRecordingPayment(false);
    }
  };

  const removeVehicle = async vehicleId => {
    try {
      const response = await fetch(`/api/customers/${customer.id}/vehicles/${vehicleId}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Could not remove vehicle.');
      }
      notify('Vehicle removed.');
      mutate(`/api/customers/${customer.id}`);
      mutate('/api/customers');
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <>
      <tr>
        <td className="member-cell">
          <button className="row-button" onClick={() => setOpen(value => !value)}>
            <strong>{customer.name}</strong>
            <small>{open ? '▾ Hide transactions' : '▸ View transactions'}</small>
          </button>
        </td>
        <td>
          {customer.vehicles.length === 0 ? (
            '—'
          ) : (
            <div className="vehicle-tags">
              {customer.vehicles.map(vehicle => (
                <Tag key={vehicle.id} tone="muted">{vehicle.vehicleNumber}</Tag>
              ))}
            </div>
          )}
        </td>
        <td>{customer.contactPhone || '—'}</td>
        <td>{formatCurrency(customer.creditLimit)}</td>
        <td>{formatCurrency(customer.outstandingAmount)}</td>
        <td>
          <Tag>{customer.status}</Tag>
        </td>
      </tr>
      {open && (
        <tr className="ledger-row">
          <td colSpan={6}>
            <div className="ledger-vehicles">
              {vehicles.map(vehicle => (
                <Tag key={vehicle.id} tone="muted">
                  {vehicle.vehicleNumber}
                  <button type="button" onClick={() => removeVehicle(vehicle.id)} title="Remove vehicle">×</button>
                </Tag>
              ))}
            </div>
            <form className="ledger-add-vehicle" onSubmit={addVehicle}>
              <input
                value={newVehicle}
                onChange={event => setNewVehicle(event.target.value)}
                placeholder="Add another vehicle number"
              />
              <button className="secondary" type="submit" disabled={addingVehicle}>
                {addingVehicle ? 'Adding…' : '+ Add vehicle'}
              </button>
            </form>
            {vehicleError && <p className="form-error">{vehicleError}</p>}

            <form className="ledger-add-vehicle" onSubmit={recordPayment}>
              <input
                type="number"
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={event => setPaymentAmount(event.target.value)}
                placeholder="Record a payment received (₹)"
              />
              <button className="secondary" type="submit" disabled={recordingPayment}>
                {recordingPayment ? 'Saving…' : '+ Record payment'}
              </button>
            </form>
            {paymentError && <p className="form-error">{paymentError}</p>}

            {isLoading && <p className="table-empty">Loading transactions…</p>}
            {data && data.transactions.length === 0 && <p className="table-empty">No transactions yet.</p>}
            {data && data.transactions.length > 0 && (
              <div className="ledger-list">
                {data.transactions.map(tx => (
                  <div className="ledger-item" key={tx.id}>
                    <span>
                      {tx.note || (tx.type === 'DEBIT' ? 'Fuel issued' : 'Payment received')} · {timeAgo(tx.createdAt)}
                    </span>
                    <strong>
                      {tx.type === 'DEBIT' ? '+' : '−'}
                      {formatCurrency(tx.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
