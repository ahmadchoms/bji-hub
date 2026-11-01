"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThumbsUp, Flag, Reply, AlertCircle, CheckCircle2 } from "lucide-react";
import { voteReviewHelpfulAction, reportReviewAction, replyToReviewAction } from "@/actions/review.actions";

interface ReviewItemActionsProps {
  reviewId: string;
  initialHelpfulCount?: number;
  isSellerOwner?: boolean;
  hasSellerReply?: boolean;
}

export function ReviewItemActions({
  reviewId,
  initialHelpfulCount = 0,
  isSellerOwner = false,
  hasSellerReply = false,
}: ReviewItemActionsProps) {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [userVoted, setUserVoted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Report state
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Seller reply state
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySuccess, setReplySuccess] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const handleVoteHelpful = () => {
    startTransition(async () => {
      const res = await voteReviewHelpfulAction(reviewId);
      if (res.success) {
        setHelpfulCount(res.data.voteCount);
        setUserVoted(res.data.userVoted);
      }
    });
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReportError(null);

    startTransition(async () => {
      const res = await reportReviewAction({ reviewId, reason: reportReason.trim() });
      if (res.success) {
        setReportSuccess(true);
        setShowReport(false);
      } else {
        setReportError(res.error);
      }
    });
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyError(null);

    startTransition(async () => {
      const res = await replyToReviewAction({ reviewId, reply: replyText.trim() });
      if (res.success) {
        setReplySuccess(true);
        setShowReplyForm(false);
      } else {
        setReplyError(res.error);
      }
    });
  };

  return (
    <div className="pt-2 flex flex-col gap-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={handleVoteHelpful}
          disabled={isPending}
          className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
            userVoted ? "text-primary-600 font-semibold" : ""
          }`}
          title="Tandai ulasan ini membantu"
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${userVoted ? "fill-primary-600" : ""}`} />
          <span>Membantu {helpfulCount > 0 ? `(${helpfulCount})` : ""}</span>
        </button>

        {!reportSuccess ? (
          <button
            type="button"
            onClick={() => setShowReport(!showReport)}
            className="inline-flex items-center gap-1 hover:text-red-600 transition-colors"
          >
            <Flag className="h-3 w-3" />
            <span>Laporkan</span>
          </button>
        ) : (
          <span className="text-emerald-600 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Dilaporkan
          </span>
        )}

        {isSellerOwner && !hasSellerReply && !replySuccess && (
          <button
            type="button"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="inline-flex items-center gap-1 text-primary-600 hover:underline ml-auto"
          >
            <Reply className="h-3.5 w-3.5" />
            <span>Balas Ulasan</span>
          </button>
        )}
      </div>

      {/* Report Form */}
      {showReport && (
        <form onSubmit={handleReport} className="p-2.5 bg-neutral-100 dark:bg-neutral-900 rounded-md space-y-2 text-xs">
          <p className="font-semibold text-neutral-800 dark:text-neutral-200">Laporkan Ulasan Ini</p>
          <Input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Alasan pelaporan (spam, kata kasar, tidak relevan)..."
            className="text-xs h-8"
            required
          />
          {reportError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {reportError}
            </p>
          )}
          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setShowReport(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white"
              disabled={isPending}
            >
              {isPending ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </div>
        </form>
      )}

      {/* Seller Reply Form */}
      {showReplyForm && (
        <form onSubmit={handleReply} className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-md space-y-2 text-xs">
          <p className="font-semibold text-neutral-800 dark:text-neutral-200">Respon Toko untuk Pembeli</p>
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Tuliskan respon atau terima kasih untuk pembeli..."
            className="text-xs h-8"
            required
          />
          {replyError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {replyError}
            </p>
          )}
          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setShowReplyForm(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" className="text-xs h-7 px-2.5" disabled={isPending}>
              {isPending ? "Mengirim..." : "Kirim Balasan"}
            </Button>
          </div>
        </form>
      )}

      {replySuccess && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Balasan berhasil disimpan dan akan tampil di halaman produk.
        </p>
      )}
    </div>
  );
}
