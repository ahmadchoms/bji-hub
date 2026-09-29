"use client";

import { useState } from "react";
import Image from "next/image";
import { ListingImage } from "@/types";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: ListingImage[];
  title: string;
  className?: string;
}

export function ImageGallery({ images, title, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages =
    images.length > 0
      ? images
      : [{ id: "default", listingId: "default", url: "", sortOrder: 0 }];

  const currentImage = displayImages[selectedIndex] || displayImages[0];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Image Container */}
      <div className="relative aspect-[3/2] w-full rounded-sm overflow-hidden bg-secondary-50 border border-neutral-300">
        {currentImage.url ? (
          <Image
            src={currentImage.url}
            alt={`${title} - Foto ${selectedIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-secondary-50">
            <span className="font-display text-xl text-primary-900 font-semibold">{title}</span>
            <span className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">Foto belum tersedia</span>
          </div>
        )}
      </div>

      {/* Thumbnails (if > 1 image) */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {displayImages.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={idx === selectedIndex}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative w-16 h-16 rounded-sm overflow-hidden shrink-0 border transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary-600 cursor-pointer",
                idx === selectedIndex
                  ? "border-primary-600 opacity-100"
                  : "border-neutral-300 opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={`${title} thumbnail ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}