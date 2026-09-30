'use client';

import { AlertCircle, Trash2, X } from 'lucide-react';

type ConfirmTaskDeletionDialogProps = {
  taskTitle: string | null;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmTaskDeletionDialog({
  taskTitle,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: ConfirmTaskDeletionDialogProps) {
  if (!taskTitle) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-task-title"
      className="fixed inset-0 z-[60] bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-cream border border-hairline rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-hairline pb-3">
          <div>
            <h3 id="delete-task-title" className="font-editorial text-xl font-bold text-stone-900">
              Delete task?
            </h3>
            <p className="text-sm text-stone-600 mt-2">Do you want to delete this task?</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Close confirmation"
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-cream-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm font-medium text-stone-800 break-words">{taskTitle}</p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-3 border-t border-hairline flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-cream-200 disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-700 text-white text-xs font-semibold hover:bg-red-800 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? 'Deleting...' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
