export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type OutputSize = { width: number; height: number };

const DEFAULT_OUTPUT: OutputSize = { width: 1200, height: 630 };

/**
 * Canvas 기반 크롭 유틸리티.
 * 이미지 URL + 픽셀 크롭 영역 → 지정 크기 JPEG Blob 반환.
 * outputSize 미지정 시 1200×630.
 */
export async function getCroppedImg(
  imageSrc: string,
  crop: CropArea,
  outputSize: OutputSize = DEFAULT_OUTPUT,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize.width,
    outputSize.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
