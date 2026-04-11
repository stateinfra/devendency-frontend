import React from "react";

export const metadata = {
  title: "Design System — Devendency",
  description: "KRDS 기반 Devendency 디자인 시스템 가이드",
};

/* ─────────────────────────────────────────────
   KRDS-inspired 3-tier token system
   Primitive → Semantic → Component
   ───────────────────────────────────────────── */

const primitiveColors = {
  primary: [
    { step: 5, hex: "#f0edfe" },
    { step: 10, hex: "#e0d9fd" },
    { step: 20, hex: "#c2b4fb" },
    { step: 30, hex: "#a48ef9" },
    { step: 40, hex: "#8f7bf5" },
    { step: 50, hex: "#7f6df2" },
    { step: 60, hex: "#6c5ce7" },
    { step: 70, hex: "#5a4bd4" },
    { step: 80, hex: "#483bbf" },
    { step: 90, hex: "#362ba8" },
    { step: 95, hex: "#2a2080" },
  ],
  gray: [
    { step: 0, hex: "#ffffff" },
    { step: 5, hex: "#f5f5f5" },
    { step: 10, hex: "#e8e8e8" },
    { step: 20, hex: "#d1d1d1" },
    { step: 30, hex: "#b0b0b0" },
    { step: 40, hex: "#949494" },
    { step: 50, hex: "#787878" },
    { step: 60, hex: "#555555" },
    { step: 70, hex: "#3d3d3d" },
    { step: 80, hex: "#262626" },
    { step: 90, hex: "#1a1a1a" },
    { step: 95, hex: "#111111" },
    { step: 100, hex: "#000000" },
  ],
  system: [
    { name: "Success", hex: "#22c55e", light: "#dcfce7" },
    { name: "Warning", hex: "#f59e0b", light: "#fef3c7" },
    { name: "Danger", hex: "#ef4444", light: "#fee2e2" },
    { name: "Info", hex: "#3b82f6", light: "#dbeafe" },
  ],
};

const semanticTokens = [
  { token: "--background", light: "#ffffff", dark: "#202020", desc: "페이지 배경" },
  { token: "--foreground", light: "#1a1a1a", dark: "#dcddde", desc: "기본 텍스트" },
  { token: "--card", light: "#f5f5f5", dark: "#262626", desc: "카드 배경" },
  { token: "--primary", light: "#7f6df2", dark: "#7f6df2", desc: "주요 액션/링크" },
  { token: "--border", light: "rgba(0,0,0,0.08)", dark: "rgba(255,255,255,0.08)", desc: "경계선" },
  { token: "--ring", light: "#7f6df2", dark: "#7f6df2", desc: "포커스 링" },
  { token: "--active-line", light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.03)", desc: "활성 줄" },
];

const typographyScale = [
  { name: "Display", size: "2.5rem", weight: "800", lineHeight: "1.2", letter: "-0.02em", desc: "페이지 대제목" },
  { name: "Heading L", size: "2rem", weight: "700", lineHeight: "1.3", letter: "-0.01em", desc: "섹션 제목" },
  { name: "Heading M", size: "1.5rem", weight: "700", lineHeight: "1.35", letter: "-0.01em", desc: "서브섹션 제목" },
  { name: "Heading S", size: "1.25rem", weight: "600", lineHeight: "1.4", letter: "0", desc: "소제목" },
  { name: "Body L", size: "1.0625rem", weight: "400", lineHeight: "1.75", letter: "-0.01em", desc: "본문 (17px)" },
  { name: "Body M", size: "1rem", weight: "400", lineHeight: "1.75", letter: "-0.01em", desc: "기본 본문" },
  { name: "Body S", size: "0.875rem", weight: "400", lineHeight: "1.5", letter: "0", desc: "보조 텍스트" },
  { name: "Caption", size: "0.75rem", weight: "400", lineHeight: "1.5", letter: "0.01em", desc: "캡션/라벨" },
  { name: "Code", size: "0.85rem", weight: "400", lineHeight: "1.65", letter: "0", desc: "코드 블록" },
];

const spacingScale = [
  { token: "space-1", px: 4 },
  { token: "space-2", px: 8 },
  { token: "space-3", px: 12 },
  { token: "space-4", px: 16 },
  { token: "space-5", px: 20 },
  { token: "space-6", px: 24 },
  { token: "space-8", px: 32 },
  { token: "space-10", px: 40 },
  { token: "space-12", px: 48 },
  { token: "space-16", px: 64 },
];

const radiusScale = [
  { name: "Small", token: "radius-sm", value: "4px" },
  { name: "Medium", token: "radius-md", value: "8px" },
  { name: "Large", token: "radius-lg", value: "12px" },
  { name: "XLarge", token: "radius-xl", value: "16px" },
  { name: "Full", token: "radius-full", value: "9999px" },
];

export default function DesignSystemPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12 overflow-x-hidden">
      {/* ── Header ── */}
      <div className="mb-16">
        <p className="text-xs font-semibold tracking-widest uppercase text-[#7f6df2] mb-3">Design System</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-[#dcddde] mb-4 tracking-tight">Devendency</h1>
        <p className="text-gray-500 dark:text-[#dcddde]/50 text-base max-w-2xl leading-relaxed">
          KRDS(한국형 디자인 시스템)의 3계층 토큰 구조를 참고하여 구성된 디자인 가이드입니다.
          사이트에서 사용하는 모든 컴포넌트가 여기에 매핑되어 있습니다.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            { label: "Primitive", desc: "원시 값", color: "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-[#dcddde]/60" },
            { label: "Semantic", desc: "의미 기반", color: "bg-[#7f6df2]/10 text-[#7f6df2]" },
            { label: "Component", desc: "컴포넌트별", color: "bg-[#7f6df2] text-white" },
          ].map((tier, i) => (
            <div key={tier.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-300 dark:text-[#dcddde]/20">&rarr;</span>}
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tier.color}`}>
                {tier.label}
                <span className="ml-1.5 opacity-70 font-normal">{tier.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          01. COLOR PALETTE
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="01" title="Color Palette" subtitle="Primitive Token" desc="KRDS의 13단계 명도 체계를 참고한 색상 팔레트입니다. 50을 기준색으로, 접근성 대비율(WCAG AA)을 준수합니다." />
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-gray-400 dark:text-[#dcddde]/40 uppercase tracking-wider mb-4">Primary</h3>
          <PaletteStrip colors={primitiveColors.primary} />
        </div>
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-gray-400 dark:text-[#dcddde]/40 uppercase tracking-wider mb-4">Gray</h3>
          <PaletteStrip colors={primitiveColors.gray} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-400 dark:text-[#dcddde]/40 uppercase tracking-wider mb-4">System</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {primitiveColors.system.map((c) => (
              <div key={c.name} className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
                <div className="h-16" style={{ backgroundColor: c.hex }} />
                <div className="h-6" style={{ backgroundColor: c.light }} />
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-[#dcddde]">{c.name}</p>
                  <p className="text-xs font-mono text-gray-400 dark:text-[#dcddde]/40">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          02. SEMANTIC TOKENS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="02" title="Semantic Tokens" subtitle="Theme Variables" desc="Primitive 토큰을 참조하는 의미 기반 토큰입니다. 라이트/다크 모드에 따라 값이 전환됩니다." />
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] text-xs font-semibold text-gray-400 dark:text-[#dcddde]/40 uppercase tracking-wider px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
            <span>Token</span>
            <span className="w-20 text-center">Light</span>
            <span className="w-20 text-center">Dark</span>
            <span className="w-32 text-right hidden sm:block">설명</span>
          </div>
          {semanticTokens.map((t) => (
            <div key={t.token} className="grid grid-cols-[1fr_auto_auto_auto] items-center px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0">
              <span className="text-sm font-mono text-[#7f6df2]">{t.token}</span>
              <div className="w-20 flex justify-center"><div className="size-7 rounded-md border border-black/[0.1] dark:border-white/[0.1] shadow-sm" style={{ backgroundColor: t.light }} title={t.light} /></div>
              <div className="w-20 flex justify-center"><div className="size-7 rounded-md border border-black/[0.1] dark:border-white/[0.1] shadow-sm" style={{ backgroundColor: t.dark }} title={t.dark} /></div>
              <span className="w-32 text-right text-xs text-gray-400 dark:text-[#dcddde]/40 hidden sm:block">{t.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          03. TYPOGRAPHY
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="03" title="Typography" subtitle="Type Scale" desc="KRDS의 Display-Heading-Body 계층을 참고한 타이포그래피 시스템입니다. Pretendard 서체를 기본으로, 코드에는 Fira Code를 사용합니다." />
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden mb-8">
          {typographyScale.map((item) => (
            <div key={item.name} className="flex items-center justify-between px-6 py-5 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0 group hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
              <div className="flex-1 min-w-0">
                <span className="text-gray-900 dark:text-[#dcddde] block truncate" style={{ fontSize: item.size, fontWeight: Number(item.weight), lineHeight: item.lineHeight, letterSpacing: item.letter, fontFamily: item.name === "Code" ? '"Fira Code", "JetBrains Mono", monospace' : undefined }}>
                  {item.name === "Code" ? "const hello = 'world';" : "다람쥐 헌 쳇바퀴에 타고파"}
                </span>
              </div>
              <div className="flex-shrink-0 ml-6 text-right">
                <p className="text-xs font-semibold text-gray-900 dark:text-[#dcddde]">{item.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-[#dcddde]/30 font-mono">{item.size} · {item.weight} · {item.lineHeight}</p>
                <p className="text-[10px] text-gray-300 dark:text-[#dcddde]/20">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-[#dcddde]/40 mb-3">Sans (본문)</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-[#dcddde] tracking-tight">Pretendard</p>
            <p className="text-sm text-gray-500 dark:text-[#dcddde]/50 mt-3 leading-relaxed">가나다라마바사 아자차카타파하<br />ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz 0123456789</p>
          </div>
          <div className="p-6 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-[#dcddde]/40 mb-3">Mono (코드)</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-[#dcddde] font-mono tracking-tight">Fira Code</p>
            <p className="text-sm text-gray-500 dark:text-[#dcddde]/50 mt-3 font-mono leading-relaxed">{`=> !== === :: ... #[] <> 0x1F`}<br />{`function() { return true; }`}<br />ABCDEFG abcdefg 0123456789</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          04. SPACING
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="04" title="Spacing" subtitle="4px Base Unit" desc="4px 기반의 간격 시스템입니다. 일관된 여백과 패딩을 위해 토큰화된 간격 스케일을 사용합니다." />
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
          {spacingScale.map((s) => (
            <div key={s.token} className="flex items-center gap-5 px-5 py-3 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0">
              <span className="text-xs font-mono text-[#7f6df2] w-20 shrink-0">{s.token}</span>
              <span className="text-xs font-mono text-gray-400 dark:text-[#dcddde]/40 w-10 text-right shrink-0">{s.px}px</span>
              <div className="flex-1"><div className="h-4 rounded-sm bg-[#7f6df2]/15 border border-[#7f6df2]/25" style={{ width: `${Math.min(s.px * 4, 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          05. BORDER RADIUS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="05" title="Border Radius" subtitle="Shape Tokens" desc="KRDS의 Small-Medium-Large-XLarge 4단계 체계를 참고한 모서리 둥글기 스케일입니다." />
        <div className="flex flex-wrap gap-8">
          {radiusScale.map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-3">
              <div className="size-20 border-2 border-[#7f6df2] bg-[#7f6df2]/8" style={{ borderRadius: r.value }} />
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-900 dark:text-[#dcddde]">{r.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#dcddde]/30 font-mono">{r.token}</p>
                <p className="text-[10px] text-gray-300 dark:text-[#dcddde]/20 font-mono">{r.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          06. SHADOWS & EFFECTS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="06" title="Shadows & Effects" subtitle="Elevation" desc="깊이와 계층을 표현하는 그림자 및 효과 토큰입니다." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "shadow-sm", cls: "shadow-sm", desc: "버튼, 아바타" },
            { name: "shadow-lg", cls: "shadow-lg", desc: "드롭다운, 카드" },
            { name: "shadow-2xl", cls: "shadow-2xl", desc: "모달, 라이트박스" },
            { name: "backdrop-blur", cls: "shadow-lg backdrop-blur-md bg-white/80 dark:bg-[#262626]/80", desc: "헤더, 오버레이" },
          ].map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-3">
              <div className={`size-20 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#262626] ${s.cls}`} />
              <p className="text-xs font-semibold text-gray-900 dark:text-[#dcddde]">{s.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-[#dcddde]/30">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          07. ICONS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="07" title="Icons" subtitle="Material Symbols" desc="Google Material Symbols Outlined 아이콘을 사용합니다. fontVariationSettings로 크기와 굵기를 제어합니다." />
        <div className="flex flex-wrap gap-4">
          {["light_mode", "dark_mode", "routine", "search", "edit", "delete", "favorite", "visibility", "share", "link", "arrow_back", "arrow_forward", "expand_more", "expand_less", "check", "close", "add", "remove", "person", "settings", "logout", "photo_camera", "content_copy", "lock", "menu"].map((icon) => (
            <div key={icon} className="flex flex-col items-center gap-2 w-16">
              <div className="size-10 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center text-gray-600 dark:text-[#dcddde]/60">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
              </div>
              <p className="text-[9px] text-gray-400 dark:text-[#dcddde]/30 font-mono truncate w-full text-center">{icon}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          08. BUTTONS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="08" title="Buttons" subtitle="Component Token" desc="사이트 전체에서 사용하는 버튼 변형입니다. Header, Post, Auth, Admin 등에서 사용됩니다." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ComponentCard title="기본 버튼">
            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 rounded-lg bg-[#7f6df2] text-white text-sm font-semibold hover:bg-[#6c5ce7] active:bg-[#5a4bd4] transition-colors shadow-sm">Primary</button>
              <button className="px-5 py-2.5 rounded-lg bg-black/[0.06] dark:bg-white/[0.08] text-gray-700 dark:text-[#dcddde] text-sm font-semibold border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.12] transition-colors">Secondary</button>
              <button className="px-5 py-2.5 rounded-lg border border-black/[0.1] dark:border-white/[0.1] text-gray-600 dark:text-[#dcddde]/70 text-sm font-semibold hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors">Outline</button>
              <button className="px-5 py-2.5 rounded-lg text-gray-500 dark:text-[#dcddde]/50 text-sm font-semibold hover:text-gray-900 dark:hover:text-[#dcddde] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">Ghost</button>
            </div>
          </ComponentCard>
          <ComponentCard title="상태 버튼">
            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 rounded-lg bg-[#ef4444] text-white text-sm font-semibold shadow-sm">Danger</button>
              <button className="px-5 py-2.5 rounded-lg bg-[#7f6df2] text-white text-sm font-semibold opacity-50 cursor-not-allowed">Disabled</button>
              <button className="px-5 py-2.5 rounded-lg bg-[#7f6df2] text-white text-sm font-semibold flex items-center gap-2">
                <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Loading
              </button>
            </div>
          </ComponentCard>
          <ComponentCard title="Pill / Round 버튼 (Header, Follow)">
            <div className="flex flex-wrap gap-3">
              <button className="h-9 px-5 rounded-full bg-[#7f6df2] text-white text-sm font-medium hover:bg-[#6c5ce7] transition-colors">팔로우</button>
              <button className="h-9 px-5 rounded-full bg-black/10 dark:bg-white/10 text-gray-600 dark:text-slate-300 text-sm font-medium hover:bg-red-900/20 hover:text-red-400 transition-colors">팔로잉</button>
              <button className="h-9 px-4 rounded-full border border-black/[0.08] dark:border-white/[0.08] text-sm font-medium text-gray-600 dark:text-[#dcddde]/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">글쓰기</button>
            </div>
          </ComponentCard>
          <ComponentCard title="아이콘 버튼">
            <div className="flex flex-wrap gap-3">
              <button className="size-9 rounded-full bg-black/[0.06] dark:bg-white/[0.08] flex items-center justify-center text-gray-500 dark:text-[#dcddde]/50 hover:text-gray-900 dark:hover:text-[#dcddde] transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
              </button>
              <button className="size-9 rounded-lg hover:bg-red-900/20 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
              <button className="size-10 rounded-full border border-black/[0.1] dark:border-white/[0.1] shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>favorite</span>
              </button>
              <button className="size-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-gray-400 dark:text-[#dcddde]/40 hover:text-gray-900 dark:hover:text-[#dcddde] transition-all">
                <svg className="size-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </button>
            </div>
          </ComponentCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          09. FORM CONTROLS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="09" title="Form Controls" subtitle="Input · Select · Checkbox · Radio · Toggle" desc="Auth, Settings, Admin, Editor 등에서 사용하는 폼 컨트롤입니다." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Text Input */}
          <ComponentCard title="Text Input">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#dcddde]/70 mb-1.5 block">기본 Input</label>
                <input type="text" placeholder="텍스트를 입력하세요..." className="w-full h-10 px-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-gray-900 dark:text-[#dcddde] text-sm placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 focus:ring-2 focus:ring-[#7f6df2]/20 focus:border-[#7f6df2] transition-all" readOnly />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#dcddde]/70 mb-1.5 block">Username (@prefix)</label>
                <div className="flex">
                  <span className="px-3 h-10 flex items-center rounded-l-lg bg-black/[0.06] dark:bg-white/[0.06] border border-r-0 border-black/[0.06] dark:border-white/[0.06] text-sm text-gray-400 dark:text-[#dcddde]/40">@</span>
                  <input type="text" placeholder="username" className="flex-1 h-10 px-3 rounded-r-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm text-gray-900 dark:text-[#dcddde]" readOnly />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#dcddde]/70 mb-1.5 block">도움말 포함</label>
                <input type="text" className="w-full h-10 px-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm" readOnly />
                <p className="text-[11px] text-gray-400 dark:text-[#dcddde]/30 mt-1.5">도움말 텍스트가 여기에 표시됩니다.</p>
              </div>
            </div>
          </ComponentCard>

          {/* Textarea */}
          <ComponentCard title="Textarea">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#dcddde]/70 mb-1.5 block">댓글 / 바이오</label>
              <textarea rows={3} placeholder="내용을 입력하세요..." className="w-full px-4 py-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm text-gray-900 dark:text-[#dcddde] placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 focus:ring-2 focus:ring-[#7f6df2]/20 focus:border-[#7f6df2] transition-all resize-none" readOnly />
            </div>
          </ComponentCard>

          {/* Select */}
          <ComponentCard title="Select">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#dcddde]/70 mb-1.5 block">카테고리</label>
              <div className="relative">
                <select className="w-full h-10 px-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm text-gray-900 dark:text-[#dcddde] appearance-none pr-10 focus:ring-2 focus:ring-[#7f6df2]/20 focus:border-[#7f6df2]" defaultValue="1">
                  <option value="1">React</option>
                  <option value="2">TypeScript</option>
                  <option value="3">Next.js</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-[#dcddde]/40">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </ComponentCard>

          {/* Checkbox & Radio & Toggle */}
          <ComponentCard title="Checkbox · Radio · Toggle">
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-[#dcddde]/40 mb-3">Checkbox</p>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <span className="size-[18px] rounded border-2 border-[#7f6df2] bg-[#7f6df2] flex items-center justify-center"><svg className="size-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6l2.5 2.5L9.5 4" /></svg></span>
                    <span className="text-sm text-gray-900 dark:text-[#dcddde]">선택됨</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer"><span className="size-[18px] rounded border-2 border-gray-300 dark:border-[#dcddde]/20 bg-white dark:bg-[#262626]" /><span className="text-sm text-gray-900 dark:text-[#dcddde]">미선택</span></label>
                  <label className="flex items-center gap-3 opacity-50 cursor-not-allowed"><span className="size-[18px] rounded border-2 border-gray-200 dark:border-[#dcddde]/10 bg-gray-100 dark:bg-white/[0.04]" /><span className="text-sm text-gray-400 dark:text-[#dcddde]/30">비활성화</span></label>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-[#dcddde]/40 mb-3">Radio</p>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer"><span className="size-[18px] rounded-full border-2 border-[#7f6df2] flex items-center justify-center"><span className="size-2.5 rounded-full bg-[#7f6df2]" /></span><span className="text-sm text-gray-900 dark:text-[#dcddde]">옵션 A</span></label>
                  <label className="flex items-center gap-3 cursor-pointer"><span className="size-[18px] rounded-full border-2 border-gray-300 dark:border-[#dcddde]/20" /><span className="text-sm text-gray-900 dark:text-[#dcddde]">옵션 B</span></label>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-[#dcddde]/40 mb-3">Toggle Switch</p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3"><div className="w-11 h-6 rounded-full bg-[#7f6df2] p-0.5"><div className="size-5 rounded-full bg-white shadow-sm translate-x-5" /></div><span className="text-sm text-gray-900 dark:text-[#dcddde]">활성</span></div>
                  <div className="flex items-center gap-3"><div className="w-11 h-6 rounded-full bg-gray-200 dark:bg-white/[0.1] p-0.5"><div className="size-5 rounded-full bg-white shadow-sm" /></div><span className="text-sm text-gray-900 dark:text-[#dcddde]">비활성</span></div>
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          10. THEME TOGGLE
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="10" title="Theme Toggle" subtitle="ThemeToggle.tsx" desc="3-way 토글 (Light / Auto / Dark). Material Symbols Outlined 아이콘을 사용합니다." />
        <div className="flex flex-wrap gap-8 items-start">
          <ComponentCard title="현재 사이트 스타일 (Header)">
            <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] rounded-full p-0.5 w-fit">
              {[
                { icon: "light_mode", active: false },
                { icon: "routine", active: true },
                { icon: "dark_mode", active: false },
              ].map((m) => (
                <div key={m.icon} className={`size-8 flex items-center justify-center rounded-full transition-all ${m.active ? "bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm" : "text-gray-400 dark:text-slate-500"}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, width: 16, height: 16, fontVariationSettings: "'opsz' 16, 'wght' 400" }}>{m.icon}</span>
                </div>
              ))}
            </div>
          </ComponentCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          11. AVATAR
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="11" title="Avatar" subtitle="Profile · Comment · Post" desc="사용자 프로필 이미지 또는 이니셜 뱃지입니다. 다양한 크기로 사용됩니다." />
        <div className="flex flex-wrap items-end gap-6">
          {[
            { size: "size-5", label: "20px (post meta)", initial: "A" },
            { size: "size-8", label: "32px (comment)", initial: "B" },
            { size: "size-9", label: "36px (header menu)", initial: "C" },
            { size: "size-20", label: "80px (settings)", initial: "D" },
          ].map((a) => (
            <div key={a.size} className="flex flex-col items-center gap-2">
              <div className={`${a.size} rounded-full bg-black/[0.06] dark:bg-white/[0.08] flex items-center justify-center text-gray-500 dark:text-[#dcddde]/50 font-semibold`} style={{ fontSize: a.size === "size-20" ? 28 : a.size === "size-9" ? 14 : a.size === "size-8" ? 12 : 8 }}>
                {a.initial}
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 dark:text-[#dcddde]/30 font-mono">{a.size}</p>
                <p className="text-[10px] text-gray-300 dark:text-[#dcddde]/20">{a.label}</p>
              </div>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2">
            <div className="size-20 rounded-full bg-[#7f6df2]/20 flex items-center justify-center ring-2 ring-black/[0.08] dark:ring-white/[0.08] hover:ring-[#7f6df2]/50 transition-all relative group cursor-pointer">
              <span className="text-[28px] font-semibold text-[#7f6df2]">U</span>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>photo_camera</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 dark:text-[#dcddde]/30 font-mono">upload</p>
              <p className="text-[10px] text-gray-300 dark:text-[#dcddde]/20">settings hover</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          12. BADGES & TAGS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="12" title="Badges & Tags" subtitle="Status · Role · Tag" desc="포스트 태그, 역할 뱃지, 상태 인디케이터 등에 사용됩니다." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ComponentCard title="컬러 뱃지">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#7f6df2]/10 text-[#7f6df2] text-xs font-semibold">Primary</span>
              <span className="px-2.5 py-1 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs font-semibold">Success</span>
              <span className="px-2.5 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-semibold">Warning</span>
              <span className="px-2.5 py-1 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-xs font-semibold">Danger</span>
              <span className="px-2.5 py-1 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-semibold">Info</span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-[#dcddde]/50 text-xs font-semibold">Neutral</span>
            </div>
          </ComponentCard>
          <ComponentCard title="Admin 역할 뱃지">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#7f6df2]/10 text-[#7f6df2] text-xs font-semibold">ADMIN</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">WRITER</span>
              <span className="px-2.5 py-1 rounded-full bg-black/[0.06] dark:bg-white/[0.06] text-gray-500 dark:text-[#dcddde]/50 text-xs font-semibold">USER</span>
            </div>
          </ComponentCard>
          <ComponentCard title="상태 인디케이터">
            <div className="flex flex-wrap gap-4">
              {[
                { label: "공개", color: "text-emerald-400" },
                { label: "비공개", color: "text-yellow-400" },
                { label: "정지", color: "text-red-400" },
                { label: "미인증", color: "text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className={`size-2 rounded-full ${s.color === "text-emerald-400" ? "bg-emerald-400" : s.color === "text-yellow-400" ? "bg-yellow-400" : "bg-red-400"}`} />
                  <span className={`text-xs ${s.color}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </ComponentCard>
          <ComponentCard title="포스트 태그">
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Next.js", "Tailwind"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-gray-600 dark:text-[#dcddde]/60 text-xs font-medium hover:bg-[#7f6df2]/10 hover:text-[#7f6df2] transition-colors cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          </ComponentCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          13. CARDS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="13" title="Cards" subtitle="Post · Settings · Info" desc="포스트 카드, 설정 카드, 정보 카드 등 콘텐츠 그룹화에 사용됩니다." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ComponentCard title="Post Card">
            <div className="group cursor-pointer rounded-xl p-3 -m-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
              <div className="aspect-[16/9] rounded-lg bg-gradient-to-br from-[#7f6df2]/20 to-[#7f6df2]/5 mb-3 overflow-hidden" />
              <h4 className="text-base font-bold text-gray-900 dark:text-[#dcddde] mb-1.5 leading-snug group-hover:text-[#7f6df2] line-clamp-2">Next.js 16에서 달라진 것들</h4>
              <p className="text-xs text-gray-500 dark:text-[#dcddde]/50 leading-relaxed mb-3 line-clamp-1">App Router의 새로운 기능과 변경 사항을 정리했습니다.</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#dcddde]/30">
                <div className="size-5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] flex items-center justify-center text-[8px] font-semibold text-gray-500 dark:text-[#dcddde]/50">A</div>
                <span>Author</span><span>·</span><span>2일 전</span><span>·</span>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>favorite</span><span>42</span>
              </div>
            </div>
          </ComponentCard>
          <ComponentCard title="Settings Card">
            <div className="p-5 bg-white dark:bg-[#262626] rounded-xl border border-black/[0.08] dark:border-white/[0.08]">
              <h4 className="font-semibold text-gray-900 dark:text-[#dcddde] mb-3">프로필 설정</h4>
              <div className="space-y-3">
                <div><label className="text-xs font-medium text-gray-500 dark:text-[#dcddde]/50 mb-1 block">이름</label><input className="w-full h-10 px-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm" readOnly /></div>
              </div>
            </div>
          </ComponentCard>
          <ComponentCard title="Alert / Notice">
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-[#7f6df2]/5 border border-[#7f6df2]/10 text-sm text-gray-700 dark:text-[#dcddde]/70">이메일 인증이 필요합니다.</div>
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 text-sm text-red-600 dark:text-red-400">삭제된 항목은 복구할 수 없습니다.</div>
            </div>
          </ComponentCard>
          <ComponentCard title="Series Nav Card">
            <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#262626] overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer">
                <span className="font-semibold text-sm text-gray-900 dark:text-[#dcddde]">React 시리즈</span>
                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 18 }}>expand_more</span>
              </div>
              <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-2 py-2 space-y-0.5">
                <div className="px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-[#dcddde] cursor-pointer">1. React 기초</div>
                <div className="px-3 py-2 rounded-lg text-sm bg-[#7f6df2]/10 text-[#7f6df2] font-medium">2. Hooks 패턴 (현재)</div>
                <div className="px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 cursor-pointer">3. 상태 관리</div>
              </div>
            </div>
          </ComponentCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          14. NAVIGATION
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="14" title="Navigation" subtitle="Tab · Sidebar · Pagination · TOC" desc="탭 네비게이션, 사이드바, 페이지네이션, 목차 등 탐색 관련 컴포넌트입니다." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ComponentCard title="Feed Tabs">
            <div className="flex gap-1 p-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
              {[
                { label: "최신", icon: "schedule", active: true },
                { label: "트렌딩", icon: "trending_up", active: false },
                { label: "팔로잉", icon: "group", active: false },
              ].map((t) => (
                <button key={t.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${t.active ? "bg-[#7f6df2]/10 text-[#7f6df2]" : "text-gray-400 dark:text-[#dcddde]/40 hover:text-gray-600 dark:hover:text-[#dcddde]/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </ComponentCard>
          <ComponentCard title="Admin Tabs (Underline)">
            <div className="flex gap-6 border-b border-black/[0.06] dark:border-white/[0.06]">
              {["포스트 관리", "사용자 관리"].map((t, i) => (
                <button key={t} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${i === 0 ? "border-[#7f6df2] text-[#7f6df2]" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-[#dcddde]"}`}>{t}</button>
              ))}
            </div>
          </ComponentCard>
          <ComponentCard title="Sidebar Nav">
            <div className="w-56 space-y-0.5">
              {[
                { label: "대시보드", icon: "dashboard", active: true },
                { label: "새 글 쓰기", icon: "edit", active: false },
                { label: "시리즈", icon: "collections_bookmark", active: false },
                { label: "설정", icon: "settings", active: false },
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${item.active ? "bg-[#7f6df2]/10 text-[#7f6df2] font-medium" : "text-gray-400 dark:text-slate-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>{item.label}
                </div>
              ))}
            </div>
          </ComponentCard>
          <ComponentCard title="Pagination">
            <div className="flex items-center justify-center gap-1">
              <button className="size-10 rounded-full flex items-center justify-center text-gray-300 dark:text-[#dcddde]/20 cursor-not-allowed"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span></button>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={`size-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${n === 1 ? "bg-[#7f6df2] text-white" : "text-gray-500 dark:text-[#dcddde]/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"}`}>{n}</button>
              ))}
              <button className="size-10 rounded-full flex items-center justify-center text-gray-500 dark:text-[#dcddde]/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span></button>
            </div>
          </ComponentCard>
          <ComponentCard title="Table of Contents (TOC)">
            <div className="w-56">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-3">목차</p>
              <div className="space-y-0.5">
                {[
                  { label: "소개", depth: 0, active: false },
                  { label: "설치 방법", depth: 0, active: true },
                  { label: "npm으로 설치", depth: 1, active: false },
                  { label: "yarn으로 설치", depth: 1, active: false },
                  { label: "사용법", depth: 0, active: false },
                ].map((item, i) => (
                  <div key={i} className={`block text-[13px] leading-relaxed py-0.5 border-l-2 ${item.active ? "border-[#7f6df2] text-[#7f6df2] font-medium" : "border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-[#dcddde]"}`} style={{ paddingLeft: item.depth === 0 ? 12 : 24 }}>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </ComponentCard>
          <ComponentCard title="Scroll Progress">
            <div className="space-y-3">
              <p className="text-xs text-gray-400 dark:text-[#dcddde]/40">포스트 읽기 진행률 (상단 고정)</p>
              <div className="w-full h-[4px] bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-[#7f6df2] rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
          </ComponentCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          15. MODALS & OVERLAYS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="15" title="Modals & Overlays" subtitle="Dialog · Confirm · Search · Lightbox" desc="확인 대화상자, 검색 모달, 이미지 라이트박스 등의 오버레이 컴포넌트입니다." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ComponentCard title="Confirm Modal">
            <div className="bg-white dark:bg-[#2a2a2a] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm">
              <h4 className="text-lg font-bold text-gray-900 dark:text-[#dcddde] mb-2">삭제 확인</h4>
              <p className="text-sm text-gray-500 dark:text-[#dcddde]/50 mb-4">이 작업은 되돌릴 수 없습니다.</p>
              <div className="bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-red-500 dark:text-red-400 font-medium mb-1">확인을 위해 아래 텍스트를 입력하세요</p>
                <p className="text-sm font-mono text-red-600 dark:text-red-400">삭제합니다</p>
              </div>
              <input className="w-full h-10 px-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm mb-4" placeholder="삭제합니다" readOnly />
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">취소</button>
                <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium">삭제</button>
              </div>
            </div>
          </ComponentCard>
          <ComponentCard title="Search Modal">
            <div className="bg-white dark:bg-[#2a2a2a] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-w-sm">
              <div className="flex items-center gap-3 px-5 h-14 border-b border-black/[0.06] dark:border-white/[0.06]">
                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 20 }}>search</span>
                <span className="text-sm text-gray-400 dark:text-[#dcddde]/30">검색어를 입력하세요...</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-black/[0.1] dark:border-white/[0.1] text-gray-400 dark:text-[#dcddde]/30">ESC</span>
              </div>
              <div className="px-5 py-8 text-center text-sm text-gray-400 dark:text-[#dcddde]/30">검색 결과가 여기에 표시됩니다</div>
            </div>
          </ComponentCard>
          <ComponentCard title="Dropdown Menu">
            <div className="w-48 py-1 bg-white dark:bg-[#2a2a2a] rounded-xl border border-black/[0.08] dark:border-white/[0.08] shadow-lg">
              {[
                { label: "내 프로필", icon: "person" },
                { label: "설정", icon: "settings" },
                { label: "divider" },
                { label: "로그아웃", icon: "logout", danger: true },
              ].map((item, i) =>
                item.label === "divider" ? (
                  <div key={i} className="border-t border-black/[0.08] dark:border-white/[0.08] my-1" />
                ) : (
                  <div key={i} className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06] ${item.danger ? "text-red-500" : "text-gray-700 dark:text-[#dcddde]"}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                  </div>
                )
              )}
            </div>
          </ComponentCard>
          <ComponentCard title="Context Menu (YouTube)">
            <div className="w-56 bg-white dark:bg-[#2a2a2a] border border-black/[0.1] dark:border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
              <div className="px-3 py-2 border-b border-black/[0.06] dark:border-white/[0.06] text-[11px] text-gray-500 dark:text-slate-500 truncate font-mono">https://youtu.be/abc123</div>
              <div className="py-1">
                <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-black/[0.06] dark:hover:bg-white/[0.06] cursor-pointer text-gray-700 dark:text-[#dcddde]">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smart_display</span>임베드로 삽입
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-black/[0.06] dark:hover:bg-white/[0.06] cursor-pointer text-gray-700 dark:text-[#dcddde]">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link</span>링크로 삽입
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          16. COMMENTS
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="16" title="Comments" subtitle="Comment Form · Thread" desc="댓글 작성 폼과 스레드형 댓글 목록입니다." />
        <ComponentCard title="Comment Thread">
          <div className="space-y-4 max-w-lg">
            {/* Comment Form */}
            <div>
              <textarea rows={3} placeholder="댓글을 작성하세요..." className="w-full px-4 py-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm resize-none" readOnly />
              <div className="flex justify-end mt-2">
                <button className="px-4 py-2 rounded-full bg-[#7f6df2] text-white text-sm font-medium">작성</button>
              </div>
            </div>
            {/* Comment Item */}
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0">K</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-[#dcddde]">Kim</span>
                  <span className="text-xs text-gray-400 dark:text-[#dcddde]/30">3시간 전</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-[#dcddde]/70">좋은 글이네요! 많은 도움이 되었습니다.</p>
                <div className="flex gap-3 mt-2">
                  <button className="text-xs text-gray-400 hover:text-[#7f6df2] flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>reply</span>답글</button>
                  <button className="text-xs text-gray-400 hover:text-red-500"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span></button>
                </div>
                {/* Nested Reply */}
                <div className="ml-0 mt-3 pl-4 border-l-2 border-black/[0.06] dark:border-white/[0.06]">
                  <div className="flex gap-3">
                    <div className="size-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-xs font-bold shrink-0">L</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-[#dcddde]">Lee</span>
                        <span className="text-xs text-gray-400 dark:text-[#dcddde]/30">1시간 전</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-[#dcddde]/70">저도 동의합니다!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>
      </section>

      {/* ══════════════════════════════════════════
          17. TABLE
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="17" title="Table" subtitle="Admin Data Table" desc="관리자 패널의 데이터 테이블 스타일입니다." />
        <ComponentCard title="Admin Table">
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden text-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-black/[0.02] dark:bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-[#dcddde]/50 uppercase tracking-wider">제목</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-[#dcddde]/50 uppercase tracking-wider">상태</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-[#dcddde]/50 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { title: "React Hooks 완벽 가이드", status: "공개", statusColor: "text-emerald-400" },
                  { title: "TypeScript 제네릭 이해하기", status: "비공개", statusColor: "text-yellow-400" },
                ].map((row) => (
                  <tr key={row.title} className="border-t border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-gray-900 dark:text-[#dcddde]">{row.title}</td>
                    <td className={`px-4 py-3 text-xs ${row.statusColor}`}>{row.status}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-gray-400 inline-flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </section>

      {/* ══════════════════════════════════════════
          18. LOADING & EMPTY STATES
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="18" title="States" subtitle="Loading · Empty · Error · Skeleton" desc="로딩, 빈 상태, 에러, 스켈레톤 등 상태별 UI입니다." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ComponentCard title="Loading Spinner">
            <div className="flex items-center gap-6">
              <div className="size-6 border-2 border-[#7f6df2]/30 border-t-[#7f6df2] rounded-full animate-spin" />
              <div className="size-8 border-2 border-[#7f6df2]/30 border-t-[#7f6df2] rounded-full animate-spin" />
              <div className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" style={{ background: "#7f6df2", padding: 2 }} />
            </div>
          </ComponentCard>
          <ComponentCard title="Skeleton">
            <div className="space-y-3">
              <div className="aspect-[16/9] rounded-lg bg-black/[0.08] dark:bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-black/[0.08] dark:bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-black/[0.06] dark:bg-white/[0.04] animate-pulse" />
            </div>
          </ComponentCard>
          <ComponentCard title="Empty State">
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-gray-300 dark:text-[#dcddde]/20" style={{ fontSize: 48 }}>article</span>
              <p className="text-sm text-gray-400 dark:text-[#dcddde]/30 mt-3">아직 작성된 글이 없습니다</p>
            </div>
          </ComponentCard>
          <ComponentCard title="Scroll to Top">
            <div className="flex items-center gap-4">
              <button className="size-11 rounded-full bg-black/10 dark:bg-white/10 border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-md shadow-lg flex items-center justify-center text-gray-600 dark:text-[#dcddde]/60">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_upward</span>
              </button>
              <span className="text-xs text-gray-400 dark:text-[#dcddde]/30">스크롤 상단 이동 (fixed bottom-right)</span>
            </div>
          </ComponentCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          19. CODE BLOCK
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="19" title="Code Block" subtitle="Syntax Highlight" desc="highlight.js 기반의 코드 블록입니다. 라이트/다크 테마를 각각 제공합니다." />
        <ComponentCard title="코드 블록 (다크)">
          <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#1a1a1a]">
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-[#ff5f56]" />
                  <div className="size-3 rounded-full bg-[#ffbd2e]" />
                  <div className="size-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="text-xs text-[#dcddde]/40 font-mono ml-2">example.tsx</span>
              </div>
              <button className="size-7 rounded-md hover:bg-white/[0.06] flex items-center justify-center text-[#dcddde]/40">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>content_copy</span>
              </button>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="font-mono text-sm text-[#dcddde] leading-relaxed">
                <span style={{ color: "#ff7b72", fontWeight: 600 }}>{"const "}</span>
                <span style={{ color: "#d2a8ff" }}>{"greeting"}</span>
                <span>{" = "}</span>
                <span style={{ color: "#a5d6ff" }}>{'"Hello, World!"'}</span>
                <span>{";"}</span>
              </code>
            </pre>
          </div>
        </ComponentCard>
      </section>

      {/* ══════════════════════════════════════════
          20. CONTENT STYLES (Obsidian MD)
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="20" title="Content Styles" subtitle="Obsidian Markdown" desc="블로그 콘텐츠에 적용되는 Obsidian 스타일 마크다운 렌더링입니다." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ContentCard title="Inline Code">
            <p className="text-gray-900 dark:text-[#dcddde]">
              변수를 선언할 때는{" "}
              <code className="bg-black/[0.06] dark:bg-white/[0.08] text-[#d63384] dark:text-[#e06c9a] px-1.5 py-0.5 rounded text-sm font-mono">const</code>
              {" "}키워드를 사용합니다.
            </p>
          </ContentCard>
          <ContentCard title="Blockquote">
            <blockquote className="border-l-[3px] border-[#7f6df2] pl-4 py-1 text-gray-500 dark:text-[#a0a4b0]">좋은 코드는 그 자체로 최고의 문서이다.</blockquote>
          </ContentCard>
          <ContentCard title="Link">
            <span className="text-[#7f6df2] dark:text-[#a68bf0] cursor-pointer hover:underline">Obsidian 스타일의 보라색 링크</span>
          </ContentCard>
          <ContentCard title="Emphasis">
            <p className="text-gray-900 dark:text-[#dcddde]">
              <strong className="font-bold text-black dark:text-[#e8e8e8]">Bold 텍스트</strong>,{" "}
              <em className="italic">Italic 텍스트</em>,{" "}
              <del className="line-through text-gray-400 dark:text-[#6b6f80]">Strikethrough</del>
            </p>
          </ContentCard>
          <ContentCard title="Task List">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5">
                <span className="size-4 rounded-[3px] border-2 border-[#7f6df2] bg-[#7f6df2] flex items-center justify-center">
                  <svg className="size-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6l2.5 2.5L9.5 4" /></svg>
                </span>
                <span className="text-sm text-gray-900 dark:text-[#dcddde]">완료된 할 일</span>
              </label>
              <label className="flex items-center gap-2.5">
                <span className="size-4 rounded-[3px] border-2 border-gray-300 dark:border-[#dcddde]/20" />
                <span className="text-sm text-gray-900 dark:text-[#dcddde]">미완료 할 일</span>
              </label>
            </div>
          </ContentCard>
          <ContentCard title="Table">
            <table className="w-full text-sm border-collapse">
              <thead><tr><th className="text-left p-2 border border-black/[0.1] dark:border-white/[0.08] bg-gray-100 dark:bg-[#2d2d2d] font-semibold text-gray-900 dark:text-[#e0e0e0]">이름</th><th className="text-left p-2 border border-black/[0.1] dark:border-white/[0.08] bg-gray-100 dark:bg-[#2d2d2d] font-semibold text-gray-900 dark:text-[#e0e0e0]">설명</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border border-black/[0.1] dark:border-white/[0.08]">Props</td><td className="p-2 border border-black/[0.1] dark:border-white/[0.08]">컴포넌트 속성</td></tr>
                <tr className="bg-black/[0.02] dark:bg-white/[0.02]"><td className="p-2 border border-black/[0.1] dark:border-white/[0.08]">State</td><td className="p-2 border border-black/[0.1] dark:border-white/[0.08]">내부 상태</td></tr>
              </tbody>
            </table>
          </ContentCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          21. RESPONSIVE GRID
          ══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader number="21" title="Layout & Grid" subtitle="Responsive Breakpoints" desc="반응형 레이아웃 시스템입니다. max-width: 1200px 컨테이너와 Tailwind 브레이크포인트를 사용합니다." />
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
          {[
            { bp: "sm", px: "640px", cols: "1", desc: "모바일" },
            { bp: "md", px: "768px", cols: "2", desc: "태블릿" },
            { bp: "lg", px: "1024px", cols: "3", desc: "데스크탑" },
            { bp: "xl", px: "1280px", cols: "4", desc: "와이드" },
          ].map((b) => (
            <div key={b.bp} className="flex items-center gap-5 px-5 py-3 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0">
              <span className="text-sm font-mono text-[#7f6df2] w-8">{b.bp}</span>
              <span className="text-xs font-mono text-gray-400 dark:text-[#dcddde]/40 w-16">{b.px}</span>
              <span className="text-xs text-gray-500 dark:text-[#dcddde]/50 w-24">Grid: {b.cols}col</span>
              <span className="text-xs text-gray-400 dark:text-[#dcddde]/30">{b.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer Reference ── */}
      <footer className="pt-8 border-t border-black/[0.06] dark:border-white/[0.06]">
        <p className="text-xs text-gray-400 dark:text-[#dcddde]/30">
          KRDS(한국형 디자인 시스템) v1.0.0의 토큰 구조를 참고하여 Devendency에 맞게 재구성하였습니다.
          <br />
          자세한 내용은{" "}
          <a href="https://www.krds.go.kr" target="_blank" rel="noopener noreferrer" className="text-[#7f6df2] hover:underline">krds.go.kr</a>
          에서 확인할 수 있습니다.
        </p>
      </footer>
    </div>
  );
}

/* ── Shared Sub-components ── */

function SectionHeader({ number, title, subtitle, desc }: { number: string; title: string; subtitle: string; desc: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] font-bold tracking-widest text-[#7f6df2] bg-[#7f6df2]/10 px-2 py-0.5 rounded">{number}</span>
        <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-[#dcddde]/40">{subtitle}</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-[#dcddde] mb-2">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-[#dcddde]/50 max-w-2xl leading-relaxed">{desc}</p>
    </div>
  );
}

function ComponentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
      <h3 className="text-[10px] font-semibold text-gray-400 dark:text-[#dcddde]/40 uppercase tracking-widest mb-6">{title}</h3>
      {children}
    </div>
  );
}

function ContentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
      <h3 className="text-[10px] font-semibold text-gray-400 dark:text-[#dcddde]/40 uppercase tracking-widest mb-4">{title}</h3>
      {children}
    </div>
  );
}

function PaletteStrip({ colors }: { colors: { step: number; hex: string }[] }) {
  return (
    <>
      <div className="flex rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06]">
        {colors.map((c) => (
          <div key={c.step} className="flex-1 group relative" style={{ backgroundColor: c.hex }}>
            <div className="aspect-[1/1.4] min-h-[72px]" />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className={`text-[10px] font-bold ${c.step >= 50 ? "text-white" : "text-gray-800"}`}>{c.step}</span>
              <span className={`text-[9px] font-mono ${c.step >= 50 ? "text-white/70" : "text-gray-600"}`}>{c.hex}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex mt-1.5">
        {colors.map((c) => (
          <div key={c.step} className="flex-1 text-center">
            <span className="text-[10px] font-mono text-gray-400 dark:text-[#dcddde]/30">{c.step}</span>
          </div>
        ))}
      </div>
    </>
  );
}
