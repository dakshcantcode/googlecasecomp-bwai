"use client";

import { useEffect } from "react";

export function LastSubjectTracker({ subjectId }: { subjectId: string }) {
  useEffect(() => {
    localStorage.setItem("cosynapse-last-subject", subjectId);
  }, [subjectId]);
  return null;
}
