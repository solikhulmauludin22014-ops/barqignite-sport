import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import SessionProvider from '@/components/admin/SessionProvider';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <SessionProvider session={session}>
      <AdminLayoutWrapper>
        {children}
      </AdminLayoutWrapper>
    </SessionProvider>
  );
}
