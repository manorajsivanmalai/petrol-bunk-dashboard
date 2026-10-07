'use client';

import { useMemo, useState } from 'react';
import { timeAgo } from '@/lib/format';

export default function AuditTable({ entries }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(entry =>
      [entry.title, entry.summary, entry.actorName, entry.actorUsername, entry.actorRole]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(q))
    );
  }, [entries, query]);

  return (
    <>
      <div className="field-row">
        <input
          className="table-search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search by person, action, or detail…"
        />
        <span className="trend">{filtered.length} of {entries.length} shown</span>
      </div>
      {filtered.length === 0 ? (
        <p className="table-empty">No matching activity.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Person</th>
              <th>Action</th>
              <th>Detail</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id}>
                <td title={new Date(entry.createdAt).toLocaleString('en-IN')}>{timeAgo(entry.createdAt)}</td>
                <td className="member-cell">
                  <strong>{entry.actorName}</strong>
                  {entry.actorUsername && <small>{entry.actorUsername}</small>}
                </td>
                <td>{entry.title}</td>
                <td>{entry.summary}</td>
                <td>{entry.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
