export const dynamic = "force-dynamic";

import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-muted">Loading dashboard…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
