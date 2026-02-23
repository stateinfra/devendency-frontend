import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/s3";
import sharp from "sharp";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

// 파일 매직 바이트로 실제 이미지인지 검증
function detectImageType(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const rl = checkRateLimit("upload", session.user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
    }

    // 1) MIME 타입 검증
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드할 수 있습니다 (JPEG, PNG, GIF, WebP)" },
        { status: 400 },
      );
    }

    // 2) 확장자 검증
    const fileExt = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTS.has(fileExt)) {
      return NextResponse.json(
        { error: "허용되지 않는 파일 확장자입니다" },
        { status: 400 },
      );
    }

    // 3) 크기 검증
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "이미지 크기는 5MB 이하여야 합니다" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4) 매직 바이트로 실제 이미지 파일인지 검증
    const detectedType = detectImageType(buffer);
    if (!detectedType) {
      return NextResponse.json(
        { error: "유효한 이미지 파일이 아닙니다" },
        { status: 400 },
      );
    }

    // JPEG/PNG → WebP 변환 (GIF는 애니메이션 보존을 위해 원본 유지)
    let uploadBuffer: Buffer = buffer;
    let uploadType = detectedType;

    if (detectedType === "image/jpeg" || detectedType === "image/png") {
      uploadBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer() as Buffer;
      uploadType = "image/webp";
    }

    const uploadExt = uploadType === "image/gif" ? "gif" : "webp";
    const id = crypto.randomUUID();
    const filename = `images/${session.user.id}/${id}.${uploadExt}`;

    const url = await uploadImage(uploadBuffer, filename, uploadType);

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[upload] error:", err);
    return NextResponse.json(
      { error: err.message || "업로드 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
