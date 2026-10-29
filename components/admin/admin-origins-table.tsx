"use client";

import { useState, useTransition } from "react";
import type { CoffeeOrigin } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCoffeeOriginAction,
  toggleCoffeeOriginAction,
} from "@/actions/origin.actions";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Globe,
  MapPin,
  Mountain,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
} from "lucide-react";

interface AdminOriginsTableProps {
  origins: CoffeeOrigin[];
}

export function AdminOriginsTable({ origins: initialOrigins }: AdminOriginsTableProps) {
  const [origins, setOrigins] = useState<CoffeeOrigin[]>(initialOrigins);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "domestic" | "intl">("all");
  const [isPending, startTransition] = useTransition();

  // Modal create state
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCountry, setFormCountry] = useState("Indonesia");
  const [formIsland, setFormIsland] = useState("");
  const [formMinAlt, setFormMinAlt] = useState("");
  const [formMaxAlt, setFormMaxAlt] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const filtered = origins.filter((o) => {
    if (filterType === "domestic" && o.country.toLowerCase() !== "indonesia") return false;
    if (filterType === "intl" && o.country.toLowerCase() === "indonesia") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = o.name.toLowerCase().includes(q);
      const matchCountry = o.country.toLowerCase().includes(q);
      const matchIsland = o.islandOrState?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchCountry && !matchIsland) return false;
    }
    return true;
  });

  const domesticCount = origins.filter((o) => o.country.toLowerCase() === "indonesia").length;
  const intlCount = origins.length - domesticCount;

  const handleToggle = (id: string) => {
    startTransition(async () => {
      const res = await toggleCoffeeOriginAction(id);
      if (res.success) {
        setOrigins((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isActive: res.data.isActive } : item))
        );
        toast.success(`Status ${res.data.name} berhasil diubah.`);
      } else {
        toast.error(res.error || "Gagal mengubah status wilayah");
      }
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCountry.trim()) {
      toast.error("Nama wilayah dan negara wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await createCoffeeOriginAction({
        name: formName.trim(),
        country: formCountry.trim(),
        islandOrState: formIsland.trim() || undefined,
        minAltitude: formMinAlt ? Number(formMinAlt) : undefined,
        maxAltitude: formMaxAlt ? Number(formMaxAlt) : undefined,
        description: formDesc.trim() || undefined,
      });

      if (res.success) {
        setOrigins((prev) => [res.data, ...prev]);
        toast.success(`Wilayah ${res.data.name} berhasil ditambahkan!`);
        setIsOpenAdd(false);
        setFormName("");
        setFormCountry("Indonesia");
        setFormIsland("");
        setFormMinAlt("");
        setFormMaxAlt("");
        setFormDesc("");
      } else {
        toast.error(res.error || "Gagal menambahkan wilayah");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Cari wilayah, negara, atau pulau..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded border border-neutral-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded transition-colors ${
                filterType === "all" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Semua ({origins.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("domestic")}
              className={`px-3 py-1 rounded transition-colors ${
                filterType === "domestic" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Domestik ({domesticCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("intl")}
              className={`px-3 py-1 rounded transition-colors ${
                filterType === "intl" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Internasional ({intlCount})
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setIsOpenAdd(true)}
            className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white shrink-0 font-medium"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah Asal Kopi
          </Button>
        </div>
      </div>

      {/* Add Origin Modal */}
      {isOpenAdd && (
        <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-neutral-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-semibold text-neutral-900 text-sm">Tambah Master Asal Kopi (Origin)</h3>
                <p className="text-xs text-neutral-600">
                  Daftarkan wilayah penghasil kopi baru untuk katalog spesialisasi & buyer internasional.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenAdd(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-neutral-700 block mb-1">
                  Nama Wilayah / Terroir <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Misal: Aceh Gayo, Yirgacheffe, Huila"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-neutral-700 block mb-1">
                    Negara <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="Misal: Indonesia, Ethiopia, Colombia"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-neutral-700 block mb-1">Pulau / Provinsi / Zona</label>
                  <Input
                    placeholder="Misal: Sumatra, Gedeo, Andes"
                    value={formIsland}
                    onChange={(e) => setFormIsland(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-neutral-700 block mb-1">Ketinggian Min (mdpl)</label>
                  <Input
                    type="number"
                    placeholder="Misal: 1200"
                    value={formMinAlt}
                    onChange={(e) => setFormMinAlt(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-neutral-700 block mb-1">Ketinggian Max (mdpl)</label>
                  <Input
                    type="number"
                    placeholder="Misal: 1700"
                    value={formMaxAlt}
                    onChange={(e) => setFormMaxAlt(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-neutral-700 block mb-1">Karakter Rasa & Deskripsi Terroir</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsikan karakter terroir tanah vulkanik, cuaca mikro, dan profil acidity khas daerah ini..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full border border-neutral-300 rounded p-2 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpenAdd(false)}
                  className="h-8 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="h-8 text-xs bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Simpan Wilayah
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-neutral-300 bg-surface-base rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/70 text-xs">
              <TableHead className="font-semibold text-neutral-800">Nama Wilayah</TableHead>
              <TableHead className="font-semibold text-neutral-800">Negara & Lokasi</TableHead>
              <TableHead className="font-semibold text-neutral-800">Ketinggian (mdpl)</TableHead>
              <TableHead className="font-semibold text-neutral-800">Karakter Terroir</TableHead>
              <TableHead className="font-semibold text-neutral-800">Status</TableHead>
              <TableHead className="font-semibold text-neutral-800 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-neutral-600">
                  Tidak ada data wilayah asal kopi yang sesuai dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const isDomestic = item.country.toLowerCase() === "indonesia";
                return (
                  <TableRow key={item.id} className="text-xs hover:bg-neutral-50/50">
                    <TableCell className="font-medium text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {isDomestic ? (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            Indonesia
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 border-sky-200">
                            <Globe className="w-2.5 h-2.5 mr-0.5" />
                            {item.country}
                          </Badge>
                        )}
                        {item.islandOrState && (
                          <span className="text-neutral-600 text-xs font-mono">({item.islandOrState})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-neutral-700">
                      {item.minAltitude || item.maxAltitude ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Mountain className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>
                            {item.minAltitude ? `${item.minAltitude.toLocaleString("id-ID")}` : "?"} -{" "}
                            {item.maxAltitude ? `${item.maxAltitude.toLocaleString("id-ID")}` : "?"} m
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-neutral-600" title={item.description || ""}>
                      {item.description || <span className="text-neutral-400 italic">Belum ada keterangan</span>}
                    </TableCell>
                    <TableCell>
                      {item.isActive ? (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                          Aktif di Form
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-neutral-100 text-neutral-600 border-neutral-300">
                          <XCircle className="w-2.5 h-2.5 mr-1" />
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleToggle(item.id)}
                        className="h-7 text-xs text-neutral-600 hover:text-neutral-900"
                      >
                        {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
