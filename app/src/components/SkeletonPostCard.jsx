export default function SkeletonPostCard() {
    return (
        <div className="rounded-xl border border-slate-700/70 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="shimmer h-4 w-20 rounded" />
                <div className="shimmer h-3 w-14 rounded" />
            </div>
            <div className="shimmer mb-3 h-40 w-full rounded-lg" />
            <div className="shimmer mb-2 h-4 w-11/12 rounded" />
            <div className="shimmer mb-4 h-4 w-8/12 rounded" />
            <div className="flex items-center justify-between">
                <div className="shimmer h-3 w-12 rounded" />
                <div className="shimmer h-8 w-20 rounded-md" />
            </div>
        </div>
    );
}
