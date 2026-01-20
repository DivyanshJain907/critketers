'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't check maintenance on certain pages
    // Allow: maintenance page, API routes, login, signup
    if (
      pathname === '/maintenance' ||
      pathname.startsWith('/api/') ||
      pathname === '/login' ||
      pathname === '/signup'
    ) {
      return;
    }

    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/maintenance');
        const data = await res.json();
        
        if (data.isEnabled) {
          // Allow admins to access everything during maintenance
          const userRole = localStorage.getItem('userRole');
          if (userRole === 'ADMIN') {
            return; // Admins can access everything
          }
          
          router.push('/maintenance');
        }
      } catch (error) {
        console.error('Error checking maintenance status:', error);
      }
    };

    // Check on mount and every 30 seconds
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30000);

    return () => clearInterval(interval);
  }, [pathname, router]);

  return <>{children}</>;
}
