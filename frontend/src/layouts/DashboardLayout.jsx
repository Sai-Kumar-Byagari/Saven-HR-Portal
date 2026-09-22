import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import PageLoader from '../components/ui/PageLoader';
import AiChatBar from '../components/shared/AiChatBar';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6FA]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        {/* Main content — pb-[72px] reserves space for the AI bar at bottom */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-7 py-6 pb-24">
            <ErrorBoundary context="PageContent">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
        {/* AI Chat Bar — ChatGPT style, pinned to bottom of content area */}
        <AiChatBar />
      </div>
    </div>
  );
}
