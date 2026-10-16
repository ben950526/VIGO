const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

function isAlreadyWebImage(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type);
}

function canvasToJpegFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("無法轉換圖片"));
          return;
        }
        resolve(new File([blob], name, { type: "image/jpeg" }));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

function drawToCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法處理圖片");
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

/** iPhone 常是 HEIC；在瀏覽器轉成 JPG 再上傳，才過得了格式檢查 */
export async function prepareAvatarFile(file: File): Promise<File | { error: string }> {
  if (file.size > 20 * 1024 * 1024) {
    return { error: "圖片太大，請選 20MB 以內的照片" };
  }

  if (isAlreadyWebImage(file) && file.size <= MAX_OUTPUT_BYTES) {
    return file;
  }

  const jpegName = file.name.replace(/\.[^.]+$/, "") || "avatar";
  const outName = `${jpegName}.jpg`;

  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file);
      try {
        const canvas = drawToCanvas(bitmap, bitmap.width, bitmap.height);
        const next = await canvasToJpegFile(canvas, outName);
        if (next.size > MAX_OUTPUT_BYTES) {
          return { error: "壓縮後仍超過 5MB，請換一張較小的照片" };
        }
        return next;
      } finally {
        bitmap.close();
      }
    }
  } catch {
    // 改用 Image 再試（部分手機 createImageBitmap 不吃 HEIC）
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    const next = await new Promise<File>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const canvas = drawToCanvas(
            image,
            image.naturalWidth || image.width,
            image.naturalHeight || image.height,
          );
          void canvasToJpegFile(canvas, outName).then(resolve, reject);
        } catch (err) {
          reject(err);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("decode"));
      };
      image.src = objectUrl;
    });
    if (next.size > MAX_OUTPUT_BYTES) {
      return { error: "壓縮後仍超過 5MB，請換一張較小的照片" };
    }
    return next;
  } catch {
    return {
      error: "這張照片格式目前傳不上去。請用「照片」裡的 JPG，或先存成 JPG 再傳。",
    };
  }
}
