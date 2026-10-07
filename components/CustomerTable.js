'use client';

import { useMemo, useState } from 'react';
import CustomerRow from './CustomerRow';

export default function CustomerTable({ customers }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(customer =>
      [customer.name, customer.contactPhone, ...customer.vehicles.map(v => v.vehicleNumber)]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(q))
    );
  }, [customers, query]);

  return (
    <>
      <div className="field-row">
        <input
          className="table-search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search by name, phone, or vehicle number…"
        />
        <span className="trend">{filtered.length} of {customers.length} shown</span>
      </div>
      {filtered.length === 0 ? (
        <p className="table-empty">No matching customers.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Vehicle</th>
              <th>Contact</th>
              <th>Credit limit</th>
              <th>Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(customer => (
              <CustomerRow key={customer.id} customer={customer} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
