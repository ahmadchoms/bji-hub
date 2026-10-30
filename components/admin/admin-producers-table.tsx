"use client";

import { useState, useTransition } from "react";
import type { Producer, ProducerKind } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createProducerAction,
  verifyProducerClaimsAction,
} from "@/actions/producer.actions";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Award,
} from "lucide-react";

interface AdminProducersTableProps {
  producers: Producer[];
}

const PRODUCER_KINDS: ProducerKind[] = ["petani", "koperasi", "estate", "processor"];

export function AdminProducersTable({ producers: initialProducers }: AdminProducersTableProps) {
  const [producers, setProducers] = useState<Producer[]>(initialProducers);
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");
  const [isPending, startTransition] = useTransition();

  // Create modal state
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [formName, setFormName] = useState("");
  const [formKind, setFormKind] = useState<ProducerKind>("koperasi");
  const [formVillage, setFormVillage] = useState("");
  const [formProvince, setFormProvince] = useState("");
  const [formAltitudeMin, setFormAltitudeMin] = useState("");
  const [formAltitudeMax, setFormAltitudeMax] = useState("");
  const [formFarmersCount, setFormFarmersCount] = useState("");
  const [formStory, setFormStory] = useState("");
  const [formCertifications, setFormCertifications] = useState<string[]>([]);

  const filtered = producers.filter((p) => {
    if (filterVerified === "verified" && !p.claimsVerifiedAt) return false;
    if (filterVerified === "unverified" && p.claimsVerifiedAt) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchLoc = (p.province?.toLowerCase().includes(q) || p.village?.toLowerCase().includes(q)) ?? false;
      if (!matchName && !matchLoc) return false;
    }
    return true;
  });

  const handleVerify = (id: string) => {
    startTransition(async () => {
      const res = await verifyProducerClaimsAction(id);
      if (res.success) {
        setProducers((prev) =>
          prev.map((item) => (item.id === id ? { ...item, claimsVerifiedAt: res.data.claimsVerifiedAt } : item))
        );
        toast.success(`Klaim produser ${res.data.name} berhasil diverifikasi.`);
      } else {
        toast.error(res.error || "Gagal memverifikasi klaim");
      }
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nama produser wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await createProducerAction({
        name: formName.trim(),
        kind: formKind,
        village: formVillage.trim() || undefined,
        province: formProvince.trim() || undefined,
        altitudeMin: formAltitudeMin ? Number(formAltitudeMin) : undefined,
        altitudeMax: formAltitudeMax ? Number(formAltitudeMax) : undefined,
        farmersCount: formFarmersCount ? Number(formFarmersCount) : undefined,
        story: formStory.trim() || undefined,
        certifications: formCertifications,
      });

      if (res.success) {
        setProducers((prev) => [res.data, ...prev]);
        toast.success(`Produser ${res.data.name} berhasil ditambahkan.`);
        setIsOpenAdd(false);
        setFormName("");
        setFormVillage("");
        setFormProvince("");
        setFormAltitudeMin("");
        setFormAltitudeMax("");
        setFormFarmersCount("");
        setFormStory("");
        setFormCertifications([]);
      } else {
        toast.error(res.error || "Gagal menambahkan produser");
      }
    });
  };

  const toggleCert = (cert: string) => {
    setFormCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-600" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Cari nama, desa, atau provinsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
              aria-label="Cari produser"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-neutral-300 p-1 bg-white">
            <button
              type="button"
              onClick={() => setFilterVerified("all")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors coarse:min-h-11 ${
                filterVerified === "all"
                  ? "bg-primary-800 text-white"
                  : "text-neutral-700 hover:text-neutral-900"
              }`}
            >
              Semua ({producers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterVerified("verified")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors coarse:min-h-11 ${
                filterVerified === "verified"
                  ? "bg-primary-800 text-white"
                  : "text-neutral-700 hover:text-neutral-900"
              }`}
            >
              Terverifikasi ({producers.filter((p) => Boolean(p.claimsVerifiedAt)).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterVerified("unverified")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors coarse:min-h-11 ${
                filterVerified === "unverified"
                  ? "bg-primary-800 text-white"
                  : "text-neutral-700 hover:text-neutral-900"
              }`}
            >
              Menunggu ({producers.filter((p) => !p.claimsVerifiedAt).length})
            </button>
          </div>

          <Button
            onClick={() => setIsOpenAdd(true)}
            size="sm"
            className="flex items-center gap-1 coarse:min-h-11"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Produser</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-neutral-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/80">
              <TableHead className="font-semibold text-neutral-900">Nama & Jenis</TableHead>
              <TableHead className="font-semibold text-neutral-900">Lokasi & Ketinggian</TableHead>
              <TableHead className="font-semibold text-neutral-900">Petani Binaan</TableHead>
              <TableHead className="font-semibold text-neutral-900">Sertifikasi & Klaim</TableHead>
              <TableHead className="font-semibold text-neutral-900">Status</TableHead>
              <TableHead className="text-right font-semibold text-neutral-900">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-neutral-600">
                  Tidak ada produser yang sesuai filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((prod) => {
                const isVerified = Boolean(prod.claimsVerifiedAt);
                return (
                  <TableRow key={prod.id}>
                    <TableCell>
                      <div className="font-semibold text-neutral-900">{prod.name}</div>
                      <div className="text-xs text-neutral-600 capitalize">
                        {prod.kind} • slug: <span className="font-mono">{prod.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-neutral-800">
                        {[prod.village, prod.province].filter(Boolean).join(", ") || "-"}
                      </div>
                      {(prod.altitudeMin || prod.altitudeMax) && (
                        <div className="text-xs text-neutral-600 font-mono">
                          {prod.altitudeMin ?? 0} - {prod.altitudeMax ?? 0} mdpl
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-neutral-800">
                        {prod.farmersCount ? `${prod.farmersCount} petani` : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {prod.certifications && prod.certifications.length > 0 ? (
                          prod.certifications.map((c) => (
                            <Badge key={c} variant="outline" className="text-xs px-1.5 py-0">
                              <Award className="h-3 w-3 mr-0.5 text-amber-700" aria-hidden="true" />
                              {c}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-600">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <XCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                          Belum Diverifikasi
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isVerified && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleVerify(prod.id)}
                          className="h-8 text-xs font-medium text-emerald-800 border-emerald-300 hover:bg-emerald-50 coarse:min-h-11"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" aria-hidden="true" />
                          Verifikasi Klaim
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Add Producer */}
      {isOpenAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-300 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display font-semibold text-lg text-neutral-900">
                Tambah Produser Kopi Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenAdd(false)}
                className="text-neutral-600 hover:text-neutral-900 p-1 rounded-md coarse:min-h-11"
                aria-label="Tutup form"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-neutral-800 block mb-1">
                  Nama Produser / Koperasi <span className="text-red-600">*</span>
                </label>
                <Input
                  required
                  placeholder="Misal: Koperasi Gayo Megah Bersama"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-neutral-800 block mb-1">Jenis Entitas</label>
                  <select
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value as ProducerKind)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white"
                  >
                    {PRODUCER_KINDS.map((k) => (
                      <option key={k} value={k} className="capitalize">
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-neutral-800 block mb-1">Jumlah Petani</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Contoh: 150"
                    value={formFarmersCount}
                    onChange={(e) => setFormFarmersCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-neutral-800 block mb-1">Desa / Kecamatan</label>
                  <Input
                    placeholder="Contoh: Takengon"
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium text-neutral-800 block mb-1">Provinsi</label>
                  <Input
                    placeholder="Contoh: Aceh"
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-neutral-800 block mb-1">Ketinggian Min (mdpl)</label>
                  <Input
                    type="number"
                    placeholder="1200"
                    value={formAltitudeMin}
                    onChange={(e) => setFormAltitudeMin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium text-neutral-800 block mb-1">Ketinggian Max (mdpl)</label>
                  <Input
                    type="number"
                    placeholder="1700"
                    value={formAltitudeMax}
                    onChange={(e) => setFormAltitudeMax(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-neutral-800 block mb-1">Cerita & Profil Singkat</label>
                <Textarea
                  placeholder="Cerita asal-usul, tradisi budidaya, atau sistem agroforestri..."
                  rows={3}
                  value={formStory}
                  onChange={(e) => setFormStory(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-neutral-800 block mb-1.5">
                  Klaim Sertifikasi & Indikasi Geografis
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "indikasi-geografis",
                    "organik-indonesia",
                    "fair-trade",
                    "rainforest-alliance",
                  ].map((cert) => {
                    const active = formCertifications.includes(cert);
                    return (
                      <button
                        type="button"
                        key={cert}
                        onClick={() => toggleCert(cert)}
                        className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors coarse:min-h-11 ${
                          active
                            ? "bg-amber-100 border-amber-400 text-amber-900 font-semibold"
                            : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        {cert}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpenAdd(false)}
                  disabled={isPending}
                  className="coarse:min-h-11"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isPending} className="coarse:min-h-11">
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
                  Simpan Produser
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
