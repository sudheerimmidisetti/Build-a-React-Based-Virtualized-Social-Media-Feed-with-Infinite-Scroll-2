# Build a React-Based Virtualized Social Media Feed with Infinite Scroll

## Project Summary

This project is a React-based social media feed built for performance and smooth user experience when handling large lists of posts.

The main focus was to implement modern frontend patterns used in real-world feed systems:

- list virtualization
- infinite scrolling with pagination
- optimistic UI updates
- reusable component architecture
- route-based page separation
- client-side image optimization

---

## What We Built

### 1. Virtualized Feed

The home page feed is built using `react-window` with `FixedSizeList` so only visible rows are rendered in the DOM. This keeps scrolling fast and prevents heavy rendering even when many posts are loaded.

### 2. Infinite Scroll with Pagination

Posts are fetched page-by-page from the mock API using this pattern:

- `GET /posts?_page={page}&_limit={limit}`

When the user nears the end of visible rows, the next page is fetched and appended to the existing list.

### 3. Optimistic Like/Unlike

Each post has a Like button.

- UI updates immediately when clicked
- background `PATCH /posts/:id` request syncs server state
- if the request fails, UI is rolled back and an error toast is shown

### 4. Error Boundary per Post Card

Each post row is wrapped in a class-based Error Boundary.

If one post fails to render, only that card shows fallback UI; the rest of the feed continues working.

### 5. Dynamic User Profile Routing

Implemented route:

- `/profile/:userId`

The profile page reads `userId` from route params and fetches user-specific posts.

### 6. Create Post Modal

A header button opens a modal where users can:

- enter caption
- choose image
- preview selected image immediately

On submit, a new post is created and success toast is displayed.

### 7. Client-Side Image Compression

Before creating a post, image is compressed with `browser-image-compression`.

Global helper exposed:

- `window.compressImage(file)`

### 8. Skeleton Loading States

Skeleton cards are shown:

- during initial feed load
- while loading additional pages

### 9. Containerized App + API

Frontend and mock API run via Docker Compose.

- API service has health check
- App starts after API becomes healthy (`depends_on` with `service_healthy`)

---

## Tech Stack

### Frontend

- React (Vite)
- Tailwind CSS
- react-window
- SWR
- Zustand
- Axios
- react-router-dom
- react-hot-toast
- browser-image-compression

### Mock Backend

- json-server (via `clue/json-server` image)
- data file at `api/db.json`

### Containerization

- Docker
- Docker Compose

---

## Project Structure

```.md
Build a React-Based Virtualized Social Media Feed with Infinite Scroll/
├── .env.example
├── .gitignore
├── api/
│   └── db.json
├── app/
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── public/
│   │   └── vite.svg
│   └── src/
│       ├── assets/
│       │   └── react.svg
│       ├── api/
│       │   └── axios.js
│       ├── services/
│       │   └── api.js
│       ├── components/
│       │   ├── CreatePostModal.jsx
│       │   ├── ErrorBoundary.jsx
│       │   ├── PostCard.jsx
│       │   └── SkeletonPostCard.jsx
│       ├── pages/
│       │   ├── FeedPage.jsx
│       │   └── ProfilePage.jsx
│       ├── store/
│       │   └── useFeedStore.js
│       ├── utils/
│       │   └── compressImage.js
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## How It Was Implemented

### Data Layer Approach

- SWR manages server data and caching for feed and profile data.
- Pagination is handled by SWR infinite loading.
- Zustand manages shared UI state such as modal visibility and liked-post map.

### Feed Rendering Flow

1. Initial page is requested from API.
2. Response is rendered in `FixedSizeList`.
3. `onItemsRendered` checks scroll position.
4. Near end of list triggers next page load.
5. New page data is appended without replacing existing posts.

### Like Interaction Flow

1. User clicks Like.
2. UI updates immediately (optimistic update).
3. PATCH request is sent.
4. On success: keep new state.
5. On failure: rollback previous state + show error toast.

### Post Creation Flow

1. User opens modal.
2. Selects image and sees instant preview.
3. Selected file is compressed in browser.
4. Form sends `POST /posts`.
5. New post is added to top of feed cache and list.
6. Modal closes and success toast appears.

### Error Isolation Flow

- Each `PostCard` is wrapped in `ErrorBoundary`.
- Rendering error in one card does not crash the feed.
- Fallback block appears only for the failed card.

### Routing Flow

- `/` renders Feed page.
- `/profile/:userId` renders Profile page and fetches posts filtered by that user.

This architecture keeps the app readable, scalable, and performant while covering the complete social feed workflow.
