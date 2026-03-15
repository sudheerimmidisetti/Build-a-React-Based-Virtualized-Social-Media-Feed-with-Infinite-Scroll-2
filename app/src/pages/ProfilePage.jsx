import { useCallback, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import toast from "react-hot-toast";
import { api } from "../api/axios";
import PostCard from "../components/PostCard";
import ErrorBoundary from "../components/ErrorBoundary";
import SkeletonPostCard from "../components/SkeletonPostCard";
import { useFeedStore } from "../store/useFeedStore";

const fetcher = (url) => api.get(url).then((response) => response.data);

export default function ProfilePage() {
    const { userId } = useParams();

    const likedPosts = useFeedStore((state) => state.likedPosts);
    const setLikedPost = useFeedStore((state) => state.setLikedPost);
    const syncLikedPosts = useFeedStore((state) => state.syncLikedPosts);

    const { data, error, isLoading, mutate } = useSWR(
        `/posts?userId=${userId}`,
        fetcher,
        {
            revalidateOnFocus: false,
        }
    );

    const posts = useMemo(() => data || [], [data]);

    useEffect(() => {
        if (posts.length > 0) {
            syncLikedPosts(posts);
        }
    }, [posts, syncLikedPosts]);

    const handleLike = useCallback(
        async (postId) => {
            let previousPost;

            mutate(
                (currentPosts = []) =>
                    currentPosts.map((post) => {
                        if (post.id !== postId) {
                            return post;
                        }

                        previousPost = post;
                        const nextIsLiked = !post.isLiked;
                        const nextLikes = Math.max(
                            0,
                            (post.likes || 0) + (nextIsLiked ? 1 : -1)
                        );

                        return {
                            ...post,
                            isLiked: nextIsLiked,
                            likes: nextLikes,
                        };
                    }),
                { revalidate: false }
            );

            if (!previousPost) {
                return;
            }

            const previousIsLiked = !!previousPost.isLiked;
            const nextIsLiked = !previousIsLiked;
            const nextLikes = Math.max(
                0,
                (previousPost.likes || 0) + (nextIsLiked ? 1 : -1)
            );

            setLikedPost(postId, nextIsLiked);

            try {
                await api.patch(`/posts/${postId}`, {
                    isLiked: nextIsLiked,
                    likes: nextLikes,
                });
            } catch {
                mutate(
                    (currentPosts = []) =>
                        currentPosts.map((post) =>
                            post.id === postId
                                ? {
                                    ...post,
                                    isLiked: previousIsLiked,
                                    likes: previousPost.likes || 0,
                                }
                                : post
                        ),
                    { revalidate: false }
                );
                setLikedPost(postId, previousIsLiked);
                toast.error("Failed to update like. Restored previous state.");
            }
        },
        [mutate, setLikedPost]
    );

    if (isLoading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-6">
                <div className="mb-4">
                    <div className="shimmer h-6 w-36 rounded" />
                </div>
                <div className="space-y-4">
                    <SkeletonPostCard />
                    <SkeletonPostCard />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-6">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-100">Profile: User {userId}</h1>
                    <p className="text-sm text-slate-400">Posts from this user</p>
                </div>
                <Link
                    to="/"
                    className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500"
                >
                    Back to Feed
                </Link>
            </header>

            {error ? (
                <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-100">
                    <p className="mb-2">Failed to load profile posts.</p>
                    <button
                        type="button"
                        onClick={() => mutate()}
                        className="rounded-md bg-rose-700 px-3 py-1.5 text-xs font-medium hover:bg-rose-600"
                    >
                        Retry
                    </button>
                </div>
            ) : null}

            {!error && posts.length === 0 ? (
                <p className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
                    No posts found for this user.
                </p>
            ) : null}

            <div className="space-y-4">
                {posts.map((post) => {
                    const isLiked = likedPosts[post.id];
                    const postWithCurrentLike =
                        typeof isLiked === "boolean" ? { ...post, isLiked } : post;

                    return (
                        <ErrorBoundary key={post.id}>
                            <PostCard post={postWithCurrentLike} onLike={handleLike} />
                        </ErrorBoundary>
                    );
                })}
            </div>
        </div>
    );
}
