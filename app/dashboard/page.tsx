"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import DailyBriefing from "@/components/dashboard/DailyBriefing";
import MetricCards from "@/components/dashboard/MetricCards";
import SubjectWebPreview from "@/components/dashboard/SubjectWebPreview";
import UploadModal from "@/components/dashboard/UploadModal";
import { useUserStore } from "@/stores/userStore";

export default function DashboardPage() {
  const { subjects } = useUserStore();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div
      className="min-h-screen pt-24 pb-16 px-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Briefing */}
        <DailyBriefing />

        {/* Metrics */}
        <MetricCards />

        {/* Subject webs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="newspaper-label">YOUR WEBS</span>
              <div className="newspaper-rule mt-1" />
            </div>
            <Button
              size="sm"
              className="rounded-full gap-1"
              style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
              onClick={() => setUploadOpen(true)}
            >
              <Plus size={14} />
              New subject
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((s) => (
              <SubjectWebPreview key={s.id} subject={s} />
            ))}
          </div>
        </div>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
