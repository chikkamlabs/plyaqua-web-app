'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const partnerId = searchParams?.get('partnerId') || searchParams?.get('partner_id') || searchParams?.get('id') || '';
    if (partnerId) {
      router.replace(`/admin/partner/transactions?partnerId=${partnerId}`);
    } else {
      router.replace('/admin/partner/transactions');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
    </div>
  );
}

export default function PartnersTransactionsRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="w-8 h-8 anim-spin text-[var(--color-secondary)]" />
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  );
}
