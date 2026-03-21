import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/pos/Sidebar';

export default function Index() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
