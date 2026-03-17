"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocalUser } from "@/lib/userAuth";

export default function NicknameSetup() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/auth") return;
    const user = getLocalUser();
    if (!user) {
      router.replace("/auth");
    }
  }, [pathname]);

  return null;
}
