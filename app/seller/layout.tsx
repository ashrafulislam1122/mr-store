
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [verified, setVerified] = useState(pathname === "/seller/login");

  useEffect(() => {
    if (pathname === "/seller/login") {
      setVerified(true);
      return;
    }

    let active = true;
    setVerified(false);

    async function checkAccess() {
      try {
        const response = await fetch("/api/auth/access", {
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/seller/login");
          return;
        }

        const access = await response.json();

        if (!access.isAdmin && !access.isSeller) {
          router.replace("/seller/login");
          return;
        }

        if (active) setVerified(true);
      } catch {
        router.replace("/seller/login");
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!verified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10110d] text-white">
        Verifying access...
      </main>
    );
  }

  return <>{children}</>;
}
