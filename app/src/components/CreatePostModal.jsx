import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useFeedStore } from "../store/useFeedStore";
import "../utils/compressImage";

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function CreatePostModal({ onSubmit }) {
    const isCreateModalOpen = useFeedStore((state) => state.isCreateModalOpen);
    const closeCreateModal = useFeedStore((state) => state.closeCreateModal);

    const [caption, setCaption] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!selectedImage) {
            setPreviewUrl("");
            return undefined;
        }

        const objectUrl = URL.createObjectURL(selectedImage);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedImage]);

    const resetForm = () => {
        setCaption("");
        setSelectedImage(null);
        setPreviewUrl("");
    };

    const handleClose = () => {
        if (submitting) {
            return;
        }

        resetForm();
        closeCreateModal();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!caption.trim()) {
            toast.error("Please add a caption.");
            return;
        }

        if (!selectedImage) {
            toast.error("Please choose an image.");
            return;
        }

        try {
            setSubmitting(true);

            const compressedFile = await window.compressImage(selectedImage);
            const imageUrl = await fileToDataUrl(compressedFile);

            const wasCreated = await onSubmit({
                userId: 1,
                caption: caption.trim(),
                imageUrl,
                likes: 0,
                isLiked: false,
            });

            if (wasCreated) {
                resetForm();
                closeCreateModal();
            }
        } catch (error) {
            console.error(error);
            toast.error("Unable to process image.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isCreateModalOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 className="mb-4 text-xl font-semibold text-slate-100">Create Post</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="caption" className="mb-1 block text-sm text-slate-300">
                            Caption
                        </label>
                        <textarea
                            id="caption"
                            value={caption}
                            onChange={(event) => setCaption(event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                            placeholder="Share what is happening..."
                        />
                    </div>

                    <div>
                        <label htmlFor="post-image" className="mb-1 block text-sm text-slate-300">
                            Image
                        </label>
                        <input
                            id="post-image"
                            type="file"
                            accept="image/*"
                            onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-slate-100 hover:file:bg-slate-600"
                        />
                    </div>

                    {previewUrl && (
                        <img
                            src={previewUrl}
                            alt="New post preview"
                            className="h-48 w-full rounded-lg object-cover"
                        />
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-cyan-50 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Posting..." : "Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
