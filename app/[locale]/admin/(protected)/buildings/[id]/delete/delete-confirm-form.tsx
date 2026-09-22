"use client";

import { useActionState } from "react";
import type { DeleteBuildingState } from "../../actions";

type Action = (
  prevState: DeleteBuildingState,
  formData: FormData
) => Promise<DeleteBuildingState>;

type Props = {
  action: Action;
  labels: {
    confirmLabel: string;
    confirmPlaceholder: string;
    confirmButton: string;
    confirmMismatch: string;
  };
};

const initialState: DeleteBuildingState = {};

export function DeleteConfirmForm({ action, labels }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmName">{labels.confirmLabel}</label>
        <input
          id="confirmName"
          name="confirmName"
          type="text"
          required
          placeholder={labels.confirmPlaceholder}
          className="border rounded px-3 py-2"
        />
      </div>
      {state.error === "mismatch" && (
        <p role="alert" data-testid="confirm-mismatch" className="text-red-600">
          {labels.confirmMismatch}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start border rounded px-4 py-2 font-medium text-red-700"
      >
        {labels.confirmButton}
      </button>
    </form>
  );
}
