import { getSession } from '@/lib/session';
import { listUsers } from '@/lib/queries/users';
import { ROLES, roleLabels, roleSubtitles, navForRole } from '@/lib/rbac';
import { PageHeading, Panel, Tag } from '@/components/ui';
import InviteUserButton from '@/components/InviteUserButton';
import UserRoleControls from '@/components/UserRoleControls';
import { timeAgo } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AccessPage() {
  const session = await getSession();
  const users = await listUsers();

  return (
    <>
      <PageHeading eyebrow="ADMIN / ACCESS CONTROL" title="Team permissions" text="Control who can see and act on agency data." />
      <section className="role-grid">
        {ROLES.map(role => (
          <article className={`role-card ${role === session.role ? 'you' : ''}`} key={role}>
            <span className="eyebrow">ROLE</span>
            <h3>{roleLabels[role]}</h3>
            <p>{roleSubtitles[role]}</p>
            <div className="permissions">
              {navForRole(role).map(item => (
                <span key={item.key}>{item.label}</span>
              ))}
            </div>
          </article>
        ))}
      </section>
      <Panel title="Active team" aside={`${users.length} members`}>
        <InviteUserButton />
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Last active</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="member-cell">
                  <strong>{user.name}</strong>
                  <small>{user.username}{user.id === session.sub ? ' · You' : ''}</small>
                </td>
                <td>{roleLabels[user.role]}</td>
                <td>{user.lastActiveAt ? timeAgo(user.lastActiveAt) : 'Never signed in'}</td>
                <td>
                  {user.active ? <Tag>Active</Tag> : <Tag tone="muted">Inactive</Tag>}
                  <UserRoleControls user={user} isSelf={user.id === session.sub} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
