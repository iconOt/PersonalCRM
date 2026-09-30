export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string' && error) return error;
  return 'Unexpected error';
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return <div className="text-center py-12 text-gray-500 dark:text-gray-400">{label}</div>;
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Could not load data' }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 p-5">
      <h2 className="text-sm font-semibold text-red-700 dark:text-red-300">{title}</h2>
      <p className="text-sm text-red-600 dark:text-red-400 mt-1 break-words">{describeError(error)}</p>
      <p className="text-xs text-red-500 dark:text-red-500 mt-2">
        This usually means the InsForge backend could not be reached. Check that the project is
        running and that VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY in .env are correct.
      </p>
      {onRetry && (
        <button type="button" className="btn-secondary mt-3" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function InlineError({ error }: { error: unknown }) {
  return (
    <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300 break-words">
      {describeError(error)}
    </div>
  );
}
