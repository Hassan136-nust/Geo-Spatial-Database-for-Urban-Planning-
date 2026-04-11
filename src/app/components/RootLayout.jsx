import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Navigation } from './Navigation';
import { LoadingFallback } from './LoadingFallback';

export function RootLayout() {
  return (
    <>
      {/* Navigation */}
      <Navigation />

      {/* Page Content */}
      <main className="relative z-10">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
