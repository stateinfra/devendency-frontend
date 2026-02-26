import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: "Devendency <noreply@stateinfra.kr>",
    to: email,
    subject: "[Devendency] 비밀번호 변경",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 8px;">비밀번호 변경</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 32px;">비밀번호 재설정이 요청되었습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${resetUrl}" style="display: inline-block; background: #7f6df2; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">비밀번호 변경하기</a>
        </div>
        <p style="color: #999; font-size: 12px;">이 링크는 1시간 동안 유효합니다. 본인이 요청하지 않았다면 이 이메일을 무시해주세요.</p>
      </div>
    `,
  });
}

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
