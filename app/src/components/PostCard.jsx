import { Link } from "react-router-dom";

export default function PostCard({ post, onLike }) {
    const likeText = post.likes === 1 ? "1 like" : `${post.likes || 0} likes`;

    return (
        <article className="rounded-xl border border-slate-700/80 bg-slate-900 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <Link
                    to={`/profile/${post.userId}`}
                    className="text-sm font-semibold text-slate-100 transition hover:text-cyan-300"
                >
                    User {post.userId}
                </Link>
                <span className="text-xs text-slate-400">Post #{post.id}</span>
            </div>

            <img
                src={post.imageUrl}
                alt={post.caption || "post image"}
                className="mb-3 h-40 w-full rounded-lg object-cover"
            />

            <p className="mb-4 text-sm leading-relaxed text-slate-200">
                {post.caption || "No caption yet."}
            </p>

            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{likeText}</span>
                <button
                    type="button"
                    onClick={() => onLike(post.id)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${post.isLiked
                            ? "bg-cyan-600 text-cyan-50 hover:bg-cyan-500"
                            : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                        }`}
                >
                    {post.isLiked ? "Liked" : "Like"}
                </button>
            </div>
        </article>
    );
}
