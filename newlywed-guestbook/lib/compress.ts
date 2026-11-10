// Client-side image compression: resize to max 1600px on the long edge, re-encode as JPEG.
// Falls back to the original file if the browser cannot decode it (e.g. HEIC on Chrome).

const MAX_EDGE = 1600;
const QUALITY = 0.8;

export async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await loadBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap.source, 0, 0, w, h);
    if ("close" in bitmap.source && typeof (bitmap.source as ImageBitmap).close === "function") {
      (bitmap.source as ImageBitmap).close();
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );
    if (!blob) return file;
    // Never return something bigger than what the guest picked
    return blob.size < file.size || scale < 1 ? blob : file;
  } catch {
    return file;
  }
}

type Loaded = { source: CanvasImageSource; width: number; height: number };

async function loadBitmap(file: File): Promise<Loaded> {
  if (typeof createImageBitmap === "function") {
    try {
      // imageOrientation "from-image" respects EXIF rotation from phone cameras
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height };
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}
