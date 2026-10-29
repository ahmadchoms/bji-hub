"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { checkOrderPaymentStatusAction } from "@/actions/order.actions";

const MAX_POLL_MS = 3 * 60 * 1000;

export function PaymentStatusPoller({
  orderId,
  accessToken,
}: {
  orderId: string;
  accessToken?: string;
}) {
  const router = useRouter();
  const [startedAt] = useState(() => Date.now());
  const query = useQuery({
    queryKey: ["order-payment-status", orderId],
    queryFn: async () => {
      const res = await checkOrderPaymentStatusAction(orderId, accessToken);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    retry: 2,
    refetchInterval: (q) =>
      q.state.data?.isPaid || Date.now() - startedAt > MAX_POLL_MS
        ? false
        : 4000,
  });

  useEffect(() => {
    if (query.data?.isPaid) router.refresh();
  }, [query.data?.isPaid, router]);

  if (query.data?.isPaid) return null;

  return (
    <p role="status" aria-live="polite" className="text-xs text-neutral-600">
      {query.isError
        ? "Gagal memeriksa status pembayaran. Muat ulang halaman atau coba lagi nanti."
        : "Memeriksa status pembayaran…"}
    </p>
  );
}
