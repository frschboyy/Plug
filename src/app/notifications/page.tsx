import { TopBar } from '@/components/layout/TopBar';

export const metadata = { title: 'Notifications' };

export default function NotificationsPage() {
  return (
    <div className="pb-nav">
      <TopBar title="Notifications" backHref="/" backLabel="Back" />
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🔔</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">All caught up!</h1>
        <p className="text-sm text-gray-500">No new notifications right now.</p>
      </div>
    </div>
  );
}
