"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ContentWrapperInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isKioskMode = pathname.startsWith('/kioskdisplay') && (searchParams.get('mode') === 'kiosk' || searchParams.get('sig'));

    return (
        <div style={{ paddingTop: isKioskMode ? '0px' : '70px', minHeight: '100vh' }}>
            {children}
        </div>
    );
}

export default function ContentWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div style={{ paddingTop: '70px', minHeight: '100vh' }}>{children}</div>}>
            <ContentWrapperInner>{children}</ContentWrapperInner>
        </Suspense>
    );
}

