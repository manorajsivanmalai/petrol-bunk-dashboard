import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { navForRole, roleLabels, roleSubtitles, roleInitials } from '@/lib/rbac';
import { ToastProvider } from '@/components/ToastProvider';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const shellSession = {
    role: session.role,
    username: session.username,
    label: roleLabels[session.role],
    subtitle: roleSubtitles[session.role],
    initials: roleInitials[session.role],
  };

  return (
    <ToastProvider>
      <DashboardShell session={shellSession} nav={navForRole(session.role)}>
        {children}
      </DashboardShell>
    </ToastProvider>
  );
}
