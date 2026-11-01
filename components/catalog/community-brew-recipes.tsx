"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Coffee, ThumbsUp, Plus, AlertCircle } from "lucide-react";
import { createBrewRecipeAction, voteBrewRecipeAction } from "@/actions/recipe.actions";
import { toast } from "sonner";
import type { BrewRecipeDetail } from "@/lib/coffee/recipes";

interface CommunityBrewRecipesProps {
  listingId: string;
  initialRecipes: BrewRecipeDetail[];
}

export function CommunityBrewRecipes({
  listingId,
  initialRecipes,
}: CommunityBrewRecipesProps) {
  const [recipes, setRecipes] = useState<BrewRecipeDetail[]>(initialRecipes);
  const [isPending, startTransition] = useTransition();

  // Create recipe dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [method, setMethod] = useState("V60");
  const [doseGrams, setDoseGrams] = useState("15");
  const [waterMl, setWaterMl] = useState("225");
  const [tempC, setTempC] = useState("92");
  const [brewTimeSeconds, setBrewTimeSeconds] = useState("150");
  const [grindSize, setGrindSize] = useState("Medium-Fine");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVote = (recipeId: string) => {
    startTransition(async () => {
      const res = await voteBrewRecipeAction(recipeId);
      if (res.success) {
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId ? { ...r, votesCount: res.data.voteCount } : r
          )
        );
      } else {
        toast.error(res.error || "Gagal mencatat dukungan resep");
      }
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await createBrewRecipeAction({
        listingId,
        method: method.trim(),
        doseGrams: Number(doseGrams),
        waterMl: Number(waterMl),
        tempC: tempC ? Number(tempC) : null,
        brewTimeSeconds: brewTimeSeconds ? Number(brewTimeSeconds) : null,
        grindSize: grindSize.trim() || null,
        notes: notes.trim() || null,
      });

      if (res.success) {
        toast.success("Resep seduh Anda berhasil dibagikan ke komunitas!");
        setShowDialog(false);
        setNotes("");
        // Optimistically add to state
        const newRecipe: BrewRecipeDetail = {
          id: res.data.recipeId,
          listingId,
          userId: "current-user",
          method: method.trim(),
          doseGrams: Number(doseGrams),
          waterMl: Number(waterMl),
          tempC: tempC ? Number(tempC) : null,
          brewTimeSeconds: brewTimeSeconds ? Number(brewTimeSeconds) : null,
          grindSize: grindSize.trim() || null,
          notes: notes.trim() || null,
          votesCount: 0,
          createdAt: new Date().toISOString(),
        };
        setRecipes((prev) => [newRecipe, ...prev]);
      } else {
        setErrorMsg(res.error || "Gagal membagikan resep");
      }
    });
  };

  return (
    <Card className="border border-neutral-200 rounded-xl bg-white shadow-2xs overflow-hidden">
      <CardHeader className="border-b border-neutral-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-100 text-primary-800">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base text-neutral-900">
                Resep Seduh Komunitas
              </CardTitle>
              <CardDescription className="text-xs text-neutral-600">
                Panduan parameter seduh terbaik dari penikmat kopi yang telah membeli produk ini.
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDialog(true)}
            className="text-xs gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Bagikan Resep Anda
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {recipes.length === 0 ? (
          <div className="text-center py-8 text-xs text-neutral-600 space-y-2">
            <Coffee className="w-8 h-8 text-neutral-300 mx-auto" />
            <p>Belum ada resep seduh komunitas untuk kopi ini.</p>
            <p className="text-neutral-600">Jadilah yang pertama membagikan parameter seduh favorit Anda!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((r) => {
              const ratio = Math.round((r.waterMl / r.doseGrams) * 10) / 10;
              const minutes = r.brewTimeSeconds
                ? `${Math.floor(r.brewTimeSeconds / 60)}:${String(r.brewTimeSeconds % 60).padStart(2, "0")}`
                : null;

              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-neutral-900 bg-primary-50 text-primary-800 border border-primary-200 px-2 py-0.5 rounded">
                        {r.method}
                      </span>
                      <span className="text-xs text-neutral-600 font-mono">
                        Rasio 1:{ratio}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-700 pt-1">
                      <div>
                        <span className="text-neutral-600 block text-xs">Dosis / Air</span>
                        <span className="font-medium font-mono">
                          {r.doseGrams}g / {r.waterMl}ml
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-600 block text-xs">Gilingan</span>
                        <span className="font-medium truncate block">
                          {r.grindSize || "-"}
                        </span>
                      </div>
                      {r.tempC && (
                        <div>
                          <span className="text-neutral-600 block text-xs">Suhu Air</span>
                          <span className="font-medium font-mono">{r.tempC}°C</span>
                        </div>
                      )}
                      {minutes && (
                        <div>
                          <span className="text-neutral-600 block text-xs">Waktu Seduh</span>
                          <span className="font-medium font-mono">{minutes}</span>
                        </div>
                      )}
                    </div>

                    {r.notes && (
                      <p className="text-xs text-neutral-600 italic bg-white p-2 rounded border border-neutral-100">
                        &ldquo;{r.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                    <span className="text-xs text-neutral-600">
                      {new Date(r.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleVote(r.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-primary-800 font-medium transition-colors"
                      title="Tandai resep ini membantu"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Membantu {r.votesCount > 0 ? `(${r.votesCount})` : ""}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Dialog Bagikan Resep */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-neutral-900">
              Bagikan Parameter Seduh Kopi
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600">
              Bantu penikmat kopi lain menemukan potensi rasa terbaik dari biji kopi ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            {errorMsg && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1">
                Metode Seduh
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full text-xs rounded-md border border-neutral-300 p-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="V60">V60 (Hario)</option>
                <option value="Aeropress">Aeropress</option>
                <option value="French Press">French Press</option>
                <option value="Origami">Origami Dripper</option>
                <option value="Kalita Wave">Kalita Wave</option>
                <option value="Clever Dripper">Clever Dripper</option>
                <option value="Tubruk">Kopi Tubruk</option>
                <option value="Espresso">Espresso</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Dosis Kopi (gram)
                </label>
                <Input
                  type="number"
                  value={doseGrams}
                  onChange={(e) => setDoseGrams(e.target.value)}
                  min={5}
                  max={100}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Air (ml)
                </label>
                <Input
                  type="number"
                  value={waterMl}
                  onChange={(e) => setWaterMl(e.target.value)}
                  min={50}
                  max={2000}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Suhu Air (°C)
                </label>
                <Input
                  type="number"
                  value={tempC}
                  onChange={(e) => setTempC(e.target.value)}
                  min={70}
                  max={100}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Waktu Seduh (detik)
                </label>
                <Input
                  type="number"
                  value={brewTimeSeconds}
                  onChange={(e) => setBrewTimeSeconds(e.target.value)}
                  min={10}
                  max={600}
                  placeholder="150"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1">
                Tingkat Gilingan
              </label>
              <Input
                type="text"
                value={grindSize}
                onChange={(e) => setGrindSize(e.target.value)}
                placeholder="Medium-Fine (garam meja)"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1">
                Catatan Seduh / Tips Rasa
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Tuang 3 kali, blooming 45 detik untuk aroma buah maksimal"
                maxLength={500}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDialog(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs"
              >
                {isPending ? "Menyimpan..." : "Bagikan Resep"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
