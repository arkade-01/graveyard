export function TombstoneSkeleton() {
  return (
    <div className="tombstone-card rounded-xl p-5 space-y-4 h-72 flex flex-col">
      {/* RIP header */}
      <div className="flex flex-col items-center gap-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-6 w-24 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
      </div>
      {/* Badge */}
      <div className="flex justify-center">
        <div className="skeleton h-6 w-28 rounded-full" />
      </div>
      {/* Score */}
      <div className="space-y-1">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-1.5 w-full rounded-full" />
      </div>
      {/* Stats */}
      <div className="space-y-1">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-full rounded" />
      </div>
      {/* Epitaph */}
      <div className="mt-auto pt-3 border-t border-zinc-800 space-y-1">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/4 mx-auto rounded" />
      </div>
    </div>
  );
}
