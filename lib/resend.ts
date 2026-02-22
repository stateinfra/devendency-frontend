import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationCode(email: string, code: string) {
  await resend.emails.send({
    from: "Devendency <noreply@stateinfra.kr>",
    to: email,
    subject: `[Devendency] 인증 코드: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 8px;">이메일 인증</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 32px;">아래 인증 코드를 입력해주세요.</p>
        <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #999; font-size: 12px;">이 코드는 10분간 유효합니다. 본인이 요청하지 않았다면 이 이메일을 무시해주세요.</p>
      </div>
    `,
  });
}
