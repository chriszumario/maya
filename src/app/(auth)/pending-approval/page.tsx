import type { Metadata } from "next";
import { PendingApprovalView } from "@/features/auth/components/pending-approval-view";
export const metadata: Metadata = { title: "Cuenta pendiente" };
export default function PendingApprovalPage() {
  return <PendingApprovalView />;
}
