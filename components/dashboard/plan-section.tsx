"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import {
  cancelPlanAction,
  resumePlanAction,
  subscribePlanAction,
} from "@/actions/subscription.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FREE_PLAN_LISTING_NOTE,
  PLANS,
  PLAN_PERIODS,
  TIER_RANK,
  describePlan,
  formatIdr,
  getPlan,
  planTotal,
  type PlanMonths,
  type PlanTier,
} from "@/lib/plans";
import { decidePlanChange, type PlanState } from "@/lib/subscription";

interface PlanSectionProps {
  state: PlanState;
  listingCount: number;
}

const ROWS = PLANS.map(describePlan);
const longDate = (iso: string) =>
  format(new Date(iso), "d MMMM yyyy", { locale: idLocale });
const textButton =
  "min-h-11 text-xs font-medium text-primary-700 hover:underline disabled:opacity-40";

export function PlanSection({ state, listingCount }: PlanSectionProps) {
  const router = useRouter();
  const [target, setTarget] = useState<Exclude<PlanTier, "free"> | null>(null);
  const [months, setMonths] = useState<PlanMonths>(1);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const current = getPlan(state.tier);
  const decision = target ? decidePlanChange(state, target, months) : null;
  const targetPlan = target ? getPlan(target) : null;

  const run = async (
    work: () => Promise<{ ok: boolean; message: string; info?: boolean }>,
    after: () => void,
  ) => {
    setLoading(true);
    try {
      const result = await work();
      if (!result.ok)
        toast.error("Gagal memproses", { description: result.message });
      else {
        if (result.info) toast.info(result.message);
        else toast.success(result.message);
        after();
        router.refresh();
      }
    } catch {
      toast.error("Gagal memproses", {
        description: "Terjadi kesalahan. Coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmSubscribe = () => {
    if (!target) return;
    void run(
      async () => {
        const result = await subscribePlanAction({ tier: target, months });
        if (!result.success) return { ok: false, message: result.error };
        return result.data.status === "paid"
          ? {
              ok: true,
              message: `Paket ${getPlan(result.data.tier).name} aktif sampai ${longDate(result.data.expiresAt)}`,
            }
          : {
              ok: true,
              info: true,
              message:
                "Menunggu pembayaran. Paket aktif setelah pembayaran dikonfirmasi.",
            };
      },
      () => setTarget(null),
    );
  };

  const confirmCancel = () =>
    void run(
      async () => {
        const result = await cancelPlanAction();
        return result.success
          ? {
              ok: true,
              message: `Langganan berakhir pada ${longDate(result.data.expiresAt)} dan tidak diperpanjang`,
            }
          : { ok: false, message: result.error };
      },
      () => setCancelOpen(false),
    );

  const resume = () =>
    void run(
      async () => {
        const result = await resumePlanAction();
        return result.success
          ? { ok: true, message: "Langganan akan diperpanjang seperti biasa" }
          : { ok: false, message: result.error };
      },
      () => undefined,
    );

  const action = (tier: PlanTier) => {
    if (tier === "free") return null;
    if (tier === state.tier) {
      return (
        <button
          type="button"
          className={textButton}
          onClick={() => {
            setMonths(1);
            setTarget(tier);
          }}
        >
          Perpanjang
        </button>
      );
    }
    if (TIER_RANK[tier] > TIER_RANK[state.tier]) {
      return (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setMonths(1);
            setTarget(tier);
          }}
        >
          Pilih
        </Button>
      );
    }
    return (
      <span className="text-xs text-neutral-500">
        Setelah masa aktif berakhir
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="border-b border-neutral-300 pb-2">
        <h3 className="font-display text-lg font-semibold text-neutral-900">
          Paket Saya
        </h3>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <p className="font-display text-2xl font-semibold text-primary-900">
            {current.name}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {state.expiresAt === null
              ? "Tidak ada tagihan."
              : state.cancelAtPeriodEnd
                ? `Berakhir ${longDate(state.expiresAt)} dan tidak diperpanjang.`
                : `Berlaku sampai ${longDate(state.expiresAt)}.`}
          </p>
        </div>
        {state.tier !== "free" &&
          (state.cancelAtPeriodEnd ? (
            <button
              type="button"
              className={textButton}
              disabled={loading}
              onClick={resume}
            >
              Batalkan penghentian
            </button>
          ) : (
            <button
              type="button"
              className={textButton}
              onClick={() => setCancelOpen(true)}
            >
              Berhenti berlangganan
            </button>
          ))}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paket</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Verifikasi</TableHead>
              <TableHead>Analitik</TableHead>
              <TableHead>Boost gratis</TableHead>
              <TableHead>Prioritas</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Aksi</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow
                key={row.tier}
                className={row.tier === state.tier ? "bg-primary-50" : ""}
              >
                <TableCell className="font-medium text-neutral-900">
                  {row.name}
                  {row.tier === state.tier && (
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      paket aktif
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono font-medium tabular-nums text-primary-900">
                  {row.price}
                  <span className="font-sans text-neutral-500">/bln</span>
                </TableCell>
                <TableCell>{row.listings}</TableCell>
                <TableCell>{row.verified}</TableCell>
                <TableCell>{row.analytics}</TableCell>
                <TableCell>{row.boost}</TableCell>
                <TableCell>{row.priority}</TableCell>
                <TableCell className="text-right">{action(row.tier)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision?.ok && decision.kind === "renew"
                ? "Perpanjang"
                : "Pilih"}{" "}
              paket {targetPlan?.name}
            </DialogTitle>
            <DialogDescription>
              {decision?.ok
                ? `Berlaku sampai ${longDate(decision.expiresAt)}.`
                : (decision?.reason ?? "")}
            </DialogDescription>
          </DialogHeader>

          {targetPlan && (
            <fieldset className="space-y-2 py-2">
              <legend className="sr-only">Lama langganan</legend>
              {PLAN_PERIODS.map((period) => (
                <label
                  key={period.months}
                  className="flex min-h-11 cursor-pointer items-center justify-between border border-neutral-300 px-3 text-sm has-checked:border-primary-600"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="plan-period"
                      checked={months === period.months}
                      onChange={() => setMonths(period.months)}
                      className="accent-primary-600"
                    />
                    {period.label}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatIdr(planTotal(targetPlan, period.months))}
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {decision?.ok && decision.kind === "upgrade" && (
            <p className="text-xs text-neutral-600">
              Paket baru berlaku sekarang dan masa aktif dihitung ulang. Sisa
              masa paket lama tidak dikembalikan.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="primary"
              onClick={confirmSubscribe}
              disabled={loading || !decision?.ok}
            >
              {loading
                ? "Memproses..."
                : targetPlan
                  ? `Bayar ${formatIdr(planTotal(targetPlan, months))}`
                  : "Bayar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Berhenti berlangganan?</DialogTitle>
            <DialogDescription>
              {state.expiresAt &&
                `Paket ${current.name} tetap aktif sampai ${longDate(state.expiresAt)}. Setelah itu akun kembali ke paket Gratis.`}
            </DialogDescription>
          </DialogHeader>
          {listingCount > getPlan("free").maxListings && (
            <p className="text-xs text-neutral-600">
              {FREE_PLAN_LISTING_NOTE(listingCount)}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setCancelOpen(false)}
              disabled={loading}
            >
              Kembali
            </Button>
            <Button
              variant="primary"
              onClick={confirmCancel}
              disabled={loading}
            >
              {loading ? "Memproses..." : "Ya, berhenti"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
