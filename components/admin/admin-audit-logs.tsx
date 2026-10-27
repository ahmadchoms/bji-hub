"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import type { AuditLogRecord } from "@/lib/data/audit-logs";
import { Clock, Search, FileText } from "lucide-react";

interface AdminAuditLogsProps {
  logs: AuditLogRecord[];
}

export function AdminAuditLogs({ logs }: AdminAuditLogsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  const filtered = logs.filter((log) => {
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesSearch =
      searchTerm === "" ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetId && log.targetId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "approve_payout":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Setujui Payout</Badge>;
      case "reject_payout":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300">Tolak Payout</Badge>;
      case "dispute_resolve_refund":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Dispute: Refund</Badge>;
      case "dispute_resolve_complete":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Dispute: Selesai</Badge>;
      case "manual_refund_resolve":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Refund Manual</Badge>;
      case "retry_refund":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Retry Refund</Badge>;
      case "verify_seller":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Verifikasi Toko</Badge>;
      case "reject_seller":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300">Tolak Verifikasi</Badge>;
      case "suspend_listing":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300">Tangguhkan Produk</Badge>;
      case "approve_listing":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Aktifkan Produk</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const actionTypes = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-neutral-200">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari aksi, actor, target ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-neutral-800"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 font-medium">Filter Aksi:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border border-neutral-300 rounded-md px-2 py-1.5 text-xs bg-white text-neutral-800"
          >
            <option value="all">Semua Aksi ({logs.length})</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act} ({logs.filter((l) => l.action === act).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-neutral-200 p-8">
          <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-800">
            Tidak ada riwayat log
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Belum ada aktivitas admin yang tercatat pada filter ini.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
          {filtered.map((log) => {
            const dateStr = log.createdAt
              ? format(new Date(log.createdAt), "d MMM yyyy, HH:mm:ss", { locale: idLocale })
              : "-";

            return (
              <div key={log.id} className="p-4 hover:bg-neutral-50/60 transition-colors space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-mono text-xs font-semibold text-neutral-900">
                      Target: {log.targetType ? `${log.targetType}#` : ""}{log.targetId || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dateStr} WIB</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span>
                    Pelaku: <strong className="text-neutral-700">{log.actorId}</strong> ({log.actorRole})
                  </span>
                  {log.ipAddress && (
                    <span>
                      IP: <span className="font-mono">{log.ipAddress}</span>
                    </span>
                  )}
                  {log.details && (
                    <span className="text-neutral-600 truncate max-w-lg font-mono text-[11px] bg-neutral-100 px-2 py-0.5 rounded-sm">
                      {log.details}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
