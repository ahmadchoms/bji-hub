"use client";

import { useRouter } from "next/navigation";

export function LoadMore({ href }: { href: string }) {
  const router = useRouter();
  return <button type="button" onClick={() => router.push(href)} className="min-h-11 px-4 py-3 text-sm font-medium text-primary-600 hover:underline">Muat lebih banyak</button>;
}
