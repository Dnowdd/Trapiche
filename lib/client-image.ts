export async function resizeImage(
  file: File,
  {
    max,
    square = false,
    maxBytes = Infinity,
  }: {
    max: number;
    square?: boolean;
    maxBytes?: number;
  },
) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sw = square ? side : bitmap.width;
  const sh = square ? side : bitmap.height;
  const scale = Math.min(1, max / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    bitmap,
    (bitmap.width - sw) / 2,
    (bitmap.height - sh) / 2,
    sw,
    sh,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();
  for (const quality of [0.86, 0.75, 0.62, 0.5]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob) break;
    if (blob.size <= maxBytes)
      return { blob, width: canvas.width, height: canvas.height };
  }
  throw new Error("Essa imagem é grande demais.");
}
