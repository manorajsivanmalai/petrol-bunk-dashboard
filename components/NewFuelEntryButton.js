'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher, postJSON } from '@/lib/fetcher';
import { useToast } from './ToastProvider';
import { formatCurrency } from '@/lib/format';

const fuelTypes = ['DIESEL', 'PETROL', 'XP95'];
const initialForm = { fuelType: 'DIESEL', quantityL: 240, amount: 24000, vehicleNumber: '' };

function VehiclePicker({ customers, value, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const vehicleList = useMemo(
    () =>
      customers.flatMap(customer =>
        customer.vehicles.map(vehicle => ({
          vehicleId: vehicle.id,
          vehicleNumber: vehicle.vehicleNumber,
          customerName: customer.name,
        }))
      ),
    [customers]
  );

  const selected = vehicleList.find(v => v.vehicleNumber === value);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicleList;
    return vehicleList.filter(
      v => v.vehicleNumber.toLowerCase().includes(q) || v.customerName.toLowerCase().includes(q)
    );
  }, [vehicleList, query]);

  const pick = vehicle => {
    onSelect(vehicle.vehicleNumber);
    setQuery('');
    setOpen(false);
  };

  const clear = () => {
    onSelect('');
    setQuery('');
  };

  if (selected && !open) {
    return (
      <div className="vehicle-picker">
        <div className="vehicle-picker-selected">
          <span>
            <strong>{selected.vehicleNumber}</strong> — {selected.customerName}
          </span>
          <button type="button" className="secondary" onClick={() => setOpen(true)}>Change</button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-picker">
      <input
        value={query}
        autoFocus={open}
        onChange={event => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={event => {
          if (event.key === 'Escape') setOpen(false);
        }}
        placeholder="Search by vehicle number or customer name…"
      />
      {open && (
        <div className="vehicle-suggestions">
          {matches.length === 0 ? (
            <div className="vehicle-suggestions-empty">No matching vehicle.</div>
          ) : (
            matches.slice(0, 50).map(vehicle => (
              <div
                key={vehicle.vehicleId}
                className="vehicle-suggestion"
                onMouseDown={event => {
                  event.preventDefault();
                  pick(vehicle);
                }}
              >
                <strong>{vehicle.vehicleNumber}</strong>
                <small>{vehicle.customerName}</small>
              </div>
            ))
          )}
        </div>
      )}
      {value && (
        <button type="button" className="vehicle-picker-clear" onMouseDown={event => { event.preventDefault(); clear(); }}>
          Clear selection
        </button>
      )}
    </div>
  );
}

export default function NewFuelEntryButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const notify = useToast();
  const { data, isLoading } = useSWR(open ? '/api/customers' : null, fetcher);
  const customers = data?.customers || [];
  const hasVehicles = customers.some(customer => customer.vehicles.length > 0);

  const matchedCustomer = useMemo(() => {
    if (!form.vehicleNumber) return null;
    return customers.find(customer => customer.vehicles.some(v => v.vehicleNumber === form.vehicleNumber)) || null;
  }, [customers, form.vehicleNumber]);

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

  const projectedOutstanding = matchedCustomer ? matchedCustomer.outstandingAmount + Number(form.amount || 0) : 0;
  const exceedsLimit = matchedCustomer && projectedOutstanding > matchedCustomer.creditLimit;

  return (
    <>
      <button className="primary compact" onClick={() => setOpen(true)}>+ New fuel entry</button>
      {open && (
        <div className="backdrop" onClick={event => event.target === event.currentTarget && close()}>
          <div className="modal">
            <button className="close" onClick={close}>×</button>
            <span className="eyebrow">QUICK ACTION</span>
            <h2>New fuel entry</h2>
            <p>Record a fresh movement against today’s station shift. Only registered customer vehicles can be selected, and every entry is billed to their credit account.</p>

            {!isLoading && !hasVehicles ? (
              <p className="form-hint warn span-2">
                No customer vehicles are registered yet. Add a customer with at least one vehicle under Customers before
                recording a fuel entry.
              </p>
            ) : (
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
                  <VehiclePicker customers={customers} value={form.vehicleNumber} onSelect={v => update('vehicleNumber', v)} />
                </label>
                {matchedCustomer && (
                  <p className={`form-hint span-2 ${exceedsLimit ? 'warn' : ''}`}>
                    ✓ Customer: <strong>{matchedCustomer.name}</strong> — {formatCurrency(matchedCustomer.outstandingAmount)} of{' '}
                    {formatCurrency(matchedCustomer.creditLimit)} credit used
                    {exceedsLimit ? ' · this sale would put them over their credit limit' : ''}
                  </p>
                )}
                <label className="span-2">
                  Amount (₹)
                  <input type="number" min="1" required value={form.amount} onChange={event => update('amount', event.target.value)} />
                </label>
                {error && <p className="form-error span-2">{error}</p>}
                <button className="primary" type="submit" disabled={submitting || !form.vehicleNumber}>
                  {submitting ? 'Saving…' : 'Save fuel entry'} <span>↗</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
