import { Inquiry } from "@/types";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface InquiryListProps {
  inquiries: Inquiry[];
  className?: string;
}

export function InquiryList({ inquiries, className }: InquiryListProps) {
  if (inquiries.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Pesan"
        description="Pesan dari calon pembeli B2B akan muncul di sini."
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {inquiries.map((inq) => (
        <div
          key={inq.id}
          className="border border-neutral-300 bg-surface-base rounded-sm p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-neutral-900">{inq.buyerName}</p>
              <p className="text-xs text-neutral-500 font-mono">{inq.buyerContact}</p>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono shrink-0">
              {format(new Date(inq.createdAt), "d MMM yyyy, HH:mm", { locale: idLocale })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-sm">
              Qty: {inq.quantity}
            </span>
          </div>
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {inq.message}
          </p>
        </div>
      ))}
    </div>
  );
}