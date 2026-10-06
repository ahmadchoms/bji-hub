"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moderateListingAction } from "@/actions/admin.actions";

interface ModerationActionsProps {
  listingId: string;
  title: string;
  variant: "icon" | "text";
}

export function ModerationActions({
  listingId,
  title,
  variant,
}: ModerationActionsProps) {
  const [pending, startTransition] = useTransition();

  const run = (decision: "approve" | "suspend") =>
    startTransition(async () => {
      const result = await moderateListingAction(listingId, decision);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (decision === "approve")
        toast.success(`Listing "${title}" disetujui.`);
      else toast.error(`Listing "${title}" ditangguhkan.`);
    });

  if (variant === "icon") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Setujui"
          disabled={pending}
          className="text-status-success hover:bg-green-50"
          onClick={() => run("approve")}
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Tangguhkan"
          disabled={pending}
          className="text-status-error hover:bg-red-50"
          onClick={() => run("suspend")}
        >
          <X className="h-4 w-4" />
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        className="gap-1 text-status-success hover:bg-green-50"
        onClick={() => run("approve")}
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        className="gap-1 text-status-error hover:bg-red-50"
        onClick={() => run("suspend")}
      >
        <X className="h-3.5 w-3.5" /> Tangguhkan
      </Button>
    </>
  );
}
