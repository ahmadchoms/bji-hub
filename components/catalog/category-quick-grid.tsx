import Link from "next/link";
import { Coffee, Flame, Package, Wrench, ArrowRight, Tag } from "lucide-react";

interface CategoryQuickGridProps {
  activeCategory?: string;
}

export function CategoryQuickGrid({ activeCategory }: CategoryQuickGridProps) {
  const quickCategories = [
    {
      title: "Green Beans",
      subtitle: "Biji Mentah / Roastery Direct",
      slug: "green-beans",
      icon: Coffee,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      title: "Roasted Beans",
      subtitle: "Siap Seduh / Specialty Lot",
      slug: "roasted-beans",
      icon: Flame,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      title: "Drip Bag Coffee",
      subtitle: "Praktis / Single Serve Sachet",
      slug: "drip-bag",
      icon: Package,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "Alat & Equipment",
      subtitle: "V60, Grinder, Dripper, Server",
      slug: "equipment",
      icon: Wrench,
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  return (
    <section className="py-5 border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary-600" />
            <h2 className="text-sm font-bold font-display text-neutral-900">
              Kategori Pilihan
            </h2>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.slug;
            return (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}`}
                className={`p-3 rounded-lg border transition-all duration-150 flex items-center gap-3 group hover:shadow-xs ${
                  isSelected
                    ? "border-primary-600 bg-primary-50/60 ring-1 ring-primary-600"
                    : "border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${cat.color} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-primary-700 transition-colors truncate">
                    {cat.title}
                  </p>
                  <p className="text-xs text-neutral-600 truncate mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
