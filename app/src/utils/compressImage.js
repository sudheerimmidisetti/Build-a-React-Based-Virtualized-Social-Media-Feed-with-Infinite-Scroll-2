import imageCompression from "browser-image-compression";

export async function compressImage(file) {
  if (!file) {
    throw new Error("File is required for compression.");
  }

  const options = {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
  };

  return imageCompression(file, options);
}

if (typeof window !== "undefined") {
  window.compressImage = compressImage;
}

export default compressImage;
