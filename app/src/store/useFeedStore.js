import { create } from "zustand";

export const useFeedStore = create((set) => ({
  isCreateModalOpen: false,
  likedPosts: {},

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  setLikedPost: (postId, isLiked) =>
    set((state) => ({
      likedPosts: {
        ...state.likedPosts,
        [postId]: isLiked,
      },
    })),

  syncLikedPosts: (posts) =>
    set((state) => {
      const nextLikedPosts = { ...state.likedPosts };
      let changed = false;

      posts.forEach((post) => {
        const nextValue = Boolean(post.isLiked);
        if (nextLikedPosts[post.id] !== nextValue) {
          nextLikedPosts[post.id] = nextValue;
          changed = true;
        }
      });

      if (!changed) {
        return state;
      }

      return { likedPosts: nextLikedPosts };
    }),
}));
