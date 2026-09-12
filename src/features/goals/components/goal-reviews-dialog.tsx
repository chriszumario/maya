"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getGoalReviewsFn } from "../actions";
import type { GoalReview } from "../schemas";

export function GoalReviewsDialog({
  goalId,
  trigger,
}: {
  goalId: number;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<GoalReview[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function loadReviews() {
    setIsLoading(true);
    setError(undefined);
    const result = await getGoalReviewsFn({ data: { goalId, limit: 100 } });
    if (result.ok) setReviews(result.data);
    else setError(result.error.message);
    setIsLoading(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen && !isLoading) {
      void loadReviews();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historial de revisiones</DialogTitle>
          <DialogDescription>
            Consulta hasta las últimas 100 revisiones de la meta.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : isLoading || !reviews ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no hay revisiones.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarIcon className="size-4" />
                  {review.localDate}
                </p>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="font-semibold">Funcionó</dt>
                    <dd className="text-muted-foreground">
                      {review.whatWorked}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">No funcionó</dt>
                    <dd className="text-muted-foreground">
                      {review.whatDidNotWork}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Siguiente</dt>
                    <dd className="text-muted-foreground">
                      {review.nextActions}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
