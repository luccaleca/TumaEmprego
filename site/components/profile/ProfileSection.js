"use client";

export function ProfileSection({
  title,
  description,
  isEditing,
  editDisabled = false,
  readOnly = false,
  saving,
  onEdit,
  onCancel,
  onSave,
  view,
  edit,
}) {
  return (
    <details className="group overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm transition-shadow open:shadow-md">
      <summary className="cursor-pointer list-none px-4 py-3.5 transition hover:bg-zinc-50 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                {description}
              </p>
            ) : null}
          </div>
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-500 transition group-open:rotate-180 group-open:bg-emerald-50 group-open:text-emerald-700"
          >
            ▼
          </span>
        </div>
      </summary>

      <div className="border-t border-zinc-100 px-4 pb-4 pt-3 sm:px-5">
        {readOnly ? null : (
          <div className="mb-4 flex items-center justify-end gap-2 border-b border-zinc-100 pb-3">
          {!isEditing ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
              disabled={editDisabled}
              className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Editar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onCancel();
                }}
                disabled={saving}
                className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSave();
                }}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </>
          )}
        </div>
        )}

        <div>{isEditing && edit ? edit : view}</div>
      </div>
    </details>
  );
}
