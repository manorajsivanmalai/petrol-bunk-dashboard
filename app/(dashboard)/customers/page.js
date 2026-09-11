import { getSession } from '@/lib/session';
import { listCustomers } from '@/lib/queries/customers';
import { can } from '@/lib/rbac';
import { PageHeading, Kpi, Panel } from '@/components/ui';
import AddCustomerButton from '@/components/AddCustomerButton';
import CustomerRow from '@/components/CustomerRow';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const session = await getSession();
  const customers = await listCustomers();
  const outstandingTotal = customers.reduce((sum, customer) => sum + customer.outstandingAmount, 0);
  const activeCount = customers.filter(customer => customer.status === 'Active').length;

  return (
    <>
      <PageHeading eyebrow="WORKSPACE / CUSTOMERS" title="Customers" text="Credit accounts and transport partners." />
      <section className="kpis two">
        <Kpi label="Active accounts" value={customers.length} trend={`${activeCount} active`} />
        <Kpi label="Outstanding credit" value={formatCurrency(outstandingTotal)} trend="Across all accounts" blue />
      </section>
      <Panel title="Customer accounts" aside={`${customers.length} accounts`}>
        {can(session.role, 'manageCustomers') && <AddCustomerButton />}
        {customers.length === 0 ? (
          <p className="table-empty">No customers yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Contact</th>
                <th>Credit limit</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <CustomerRow key={customer.id} customer={customer} />
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
