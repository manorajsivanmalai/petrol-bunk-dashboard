export function Kpi({ label, value, trend, blue }) {
  return (
    <article className={`kpi ${blue ? 'blue' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <b>{trend}</b>
    </article>
  );
}

export function Panel({ title, aside, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {aside && <span>{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function Tag({ children, tone }) {
  return <span className={`tag ${tone || ''}`}>{children}</span>;
}

export function EmptyState({ icon, title, text, children }) {
  return (
    <section className="panel empty">
      <div>{icon}</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </section>
  );
}

export function PageHeading({ eyebrow, title, text, children }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow blue">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
