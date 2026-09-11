'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Tag } from './ui';
import { formatCurrency, timeAgo } from '@/lib/format';

export default function CustomerRow({ customer }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useSWR(open ? `/api/customers/${customer.id}` : null, fetcher);

  return (
    <>
      <tr>
        <td>
          <button className="row-button" onClick={() => setOpen(value => !value)}>
            <strong>{customer.name}</strong>
          </button>
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
          <td colSpan={5}>
            {isLoading && <p className="table-empty">Loading ledger…</p>}
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
