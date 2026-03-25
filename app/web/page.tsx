"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WebPage() {
  const router = useRouter();

  useEffect(() => {
    const last = localStorage.getItem("cosynapse-last-subject");
    router.replace(last ? `/web/${last}` : "/dashboard");
  }, [router]);

  return null;
}
