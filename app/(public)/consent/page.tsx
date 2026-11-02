import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { checkPendingConsentsAction } from "@/actions/consent.actions";
import { PageContainer } from "@/components/layout/page-container";
import { ConsentGateway } from "@/components/legal/consent-gateway";

export const metadata: Metadata = {
  title: "Persetujuan Dokumen Kebijakan | Biji Hub",
  description: "Tinjau dan setujui syarat layanan dan kebijakan privasi Biji Hub.",
};

export const dynamic = "force-dynamic";

interface ConsentPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const { next } = await searchParams;
  const session = await getSession();

  if (session.role === "guest" || !session.userId) {
    redirect(`/login?next=${encodeURIComponent(next || "/consent")}`);
  }

  const res = await checkPendingConsentsAction();
  const pendingDocs = res.success ? res.data.pendingDocuments : [];

  const target = !next || next === "/consent" ? "/" : next;

  if (pendingDocs.length === 0) {
    redirect(target);
  }

  return (
    <div className="py-12 md:py-16 bg-neutral-50/50 min-h-[70vh] flex items-center">
      <PageContainer>
        <ConsentGateway pendingDocuments={pendingDocs} returnTo={target} />
      </PageContainer>
    </div>
  );
}
