import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/pos/Sidebar';

export default function Index() {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
