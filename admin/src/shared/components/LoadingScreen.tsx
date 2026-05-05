type LoadingScreenProps = { message?: string };

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-surface-dim"
      role="status" aria-live="polite" aria-busy="true"
    >
      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shadow-level2">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-body-medium text-on-surface-variant">{message}</p>
    </div>
  );
}
