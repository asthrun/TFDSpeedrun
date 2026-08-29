"use client";

import { useActionState } from "react";
import { deleteCategory } from "@/app/actions/catalog";
import { initialActionState } from "@/lib/action-state";

type Props = {
  categoryId: string;
  profileId: string;
};

export default function DeleteCategoryForm({
  categoryId,
  profileId,
}: Props) {
  const deleteCategoryForId = deleteCategory.bind(
    null,
    categoryId,
    profileId
  );

  const [state, formAction, isPending] = useActionState(
    deleteCategoryForId,
    initialActionState
  );

  return (
    <form
      action={formAction}
      className="mt-10"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Are you sure you want to delete this Category? This cannot be undone."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="text-sm text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Deleting..." : "Delete category"}
      </button>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}