'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');

    if (!token) {
      // No authentication, redirect to login
      router.push('/login');
      return;
    }

    // Redirect to role-specific dashboard
    if (role === 'UMPIRE') {
      router.push('/dashboard/umpire');
    } else if (role === 'ADMIN') {
      router.push('/dashboard/admin');
    } else {
      // Unknown role, redirect to home
      router.push('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-3xl font-bold text-white mb-2">Redirecting...</h1>
        <p className="text-slate-400">Please wait while we load your dashboard</p>
      </div>
    </div>
  );
}
