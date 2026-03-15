import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import toast from "react-hot-toast";
import { FixedSizeList as List } from "react-window";
import { api } from "../api/axios";
import PostCard from "../components/PostCard";
import ErrorBoundary from "../components/ErrorBoundary";
import SkeletonPostCard from "../components/SkeletonPostCard";
import CreatePostModal from "../components/CreatePostModal";
import { useFeedStore } from "../store/useFeedStore";

const PAGE_LIMIT = 10;
// Keep row height larger than PostCard content to avoid overlap in FixedSizeList.
const ITEM_SIZE = 340;

const fetcher = (url) => api.get(url).then((response) => response.data);

const getFeedKey = (pageIndex, previousPageData) => {
  if (previousPageData && previousPageData.length < PAGE_LIMIT) {
    return null;
  }

  const nextPage = pageIndex + 1;
  return `/posts?_page=${nextPage}&_limit=${PAGE_LIMIT}`;
};

const Row = memo(function Row({ index, style, data }) {
  const { posts, likedPosts, onLike, isLoadingMore } = data;

  if (index >= posts.length) {
    return isLoadingMore ? (
      <div style={style} className="px-4 py-3">
        <SkeletonPostCard />
      </div>
    ) : null;
  }

  const post = posts[index];
  const isLiked = likedPosts[post.id];
  const postWithCurrentLike =
    typeof isLiked === "boolean" ? { ...post, isLiked } : post;

  return (
    <div style={style} className="px-4 py-3">
      <ErrorBoundary>
        <PostCard post={postWithCurrentLike} onLike={onLike} />
      </ErrorBoundary>
    </div>
  );
});

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const openCreateModal = useFeedStore((state) => state.openCreateModal);
  const likedPosts = useFeedStore((state) => state.likedPosts);
  const setLikedPost = useFeedStore((state) => state.setLikedPost);
  const syncLikedPosts = useFeedStore((state) => state.syncLikedPosts);

  const requestedPageRef = useRef(1);
  const activeLikeRequests = useRef(new Set());

  const { data, error, isValidating, mutate, setSize } = useSWRInfinite(
    getFeedKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  );

  useEffect(() => {
    setLoading(isValidating);
  }, [isValidating]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const mergedPosts = data.flat();
    const currentPage = data.length || 1;
    const lastPage = data[data.length - 1] || [];

    setPosts(mergedPosts);
    setPage(currentPage);
    setHasMore(lastPage.length === PAGE_LIMIT);

    requestedPageRef.current = currentPage;
  }, [data]);

  useEffect(() => {
    if (posts.length > 0) {
      syncLikedPosts(posts);
    }
  }, [posts, syncLikedPosts]);

  const requestNextPage = useCallback(() => {
    if (!hasMore || loading || posts.length === 0) {
      return;
    }

    const nextPage = page + 1;

    if (requestedPageRef.current >= nextPage) {
      return;
    }

    requestedPageRef.current = nextPage;
    setSize(nextPage);
  }, [hasMore, loading, page, posts.length, setSize]);

  const handleItemsRendered = useCallback(
    ({ visibleStopIndex }) => {
      if (visibleStopIndex >= posts.length - 3) {
        requestNextPage();
      }
    },
    [posts.length, requestNextPage]
  );

  const handleLike = useCallback(
    async (postId) => {
      if (activeLikeRequests.current.has(postId)) {
        return;
      }

      let previousPost;

      setPosts((currentPosts) =>
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
        })
      );

      if (!previousPost) {
        return;
      }

      activeLikeRequests.current.add(postId);

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
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? {
                ...post,
                isLiked: previousIsLiked,
                likes: previousPost.likes || 0,
              }
              : post
          )
        );
        setLikedPost(postId, previousIsLiked);
        toast.error("Failed to update like. Restored previous state.");
      } finally {
        activeLikeRequests.current.delete(postId);
      }
    },
    [setLikedPost]
  );

  const handleCreatePost = useCallback(
    async (newPostPayload) => {
      try {
        const response = await api.post("/posts", newPostPayload);
        const createdPost = response.data;

        setPosts((currentPosts) => [createdPost, ...currentPosts]);
        setLikedPost(createdPost.id, Boolean(createdPost.isLiked));

        mutate(
          (currentPages) => {
            if (!currentPages || currentPages.length === 0) {
              return [[createdPost]];
            }

            const nextPages = [...currentPages];
            nextPages[0] = [createdPost, ...nextPages[0]];
            return nextPages;
          },
          { revalidate: false }
        );

        toast.success("Post created successfully.");
        return true;
      } catch {
        toast.error("Unable to create post.");
        return false;
      }
    },
    [mutate, setLikedPost]
  );

  const itemData = useMemo(
    () => ({
      posts,
      likedPosts,
      onLike: handleLike,
      isLoadingMore: loading && posts.length > 0,
    }),
    [posts, likedPosts, handleLike, loading]
  );

  const showInitialSkeleton = loading && posts.length === 0;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            Virtualized Social Feed
          </h1>
          <p className="text-sm text-slate-400">Page {page} • Limit {PAGE_LIMIT}</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-cyan-50 hover:bg-cyan-500"
        >
          Create Post
        </button>
      </header>

      {error && posts.length === 0 ? (
        <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-100">
          <p className="mb-2">Failed to load feed data.</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="rounded-md bg-rose-700 px-3 py-1.5 text-xs font-medium hover:bg-rose-600"
          >
            Retry
          </button>
        </div>
      ) : null}

      {showInitialSkeleton ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonPostCard key={`skeleton-${index}`} />
          ))}
        </div>
      ) : (
        <List
          height={700}
          itemCount={posts.length + (loading && hasMore ? 1 : 0)}
          itemSize={ITEM_SIZE}
          width="100%"
          itemData={itemData}
          onItemsRendered={handleItemsRendered}
        >
          {Row}
        </List>
      )}

      <CreatePostModal onSubmit={handleCreatePost} />
    </div>
  );
}
