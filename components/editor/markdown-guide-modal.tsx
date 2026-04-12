"use client";

import { Modal, Button } from "@/components/ds";

const SAMPLE = `# 제목 1
## 제목 2
### 제목 3

이것은 일반 문단입니다. **굵게**, *기울임*, ~~취소선~~, \`인라인 코드\`를 사용할 수 있어요.

> 인용문은 이렇게 작성합니다.

- 순서 없는 목록
- 두 번째 항목
  - 중첩 항목

1. 순서 있는 목록
2. 두 번째

[링크 텍스트](https://example.com)

![이미지 설명](https://placehold.co/600x300)

\`\`\`ts
// 코드 블록 — 언어 지정 가능
function hello(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

| 표 | 헤더 |
| --- | --- |
| 셀1 | 셀2 |

수식: $E = mc^2$

---

체크리스트:
- [x] 완료된 항목
- [ ] 미완료 항목
`;

const SECTIONS: { title: string; rows: { syntax: string; desc: string }[] }[] = [
  {
    title: "텍스트 강조",
    rows: [
      { syntax: "**굵게**", desc: "굵게" },
      { syntax: "*기울임*", desc: "기울임" },
      { syntax: "~~취소선~~", desc: "취소선" },
      { syntax: "`코드`", desc: "인라인 코드" },
    ],
  },
  {
    title: "구조",
    rows: [
      { syntax: "# 제목", desc: "헤딩 (#~######)" },
      { syntax: "> 인용", desc: "인용문" },
      { syntax: "- 항목", desc: "순서 없는 목록" },
      { syntax: "1. 항목", desc: "순서 있는 목록" },
      { syntax: "- [ ] 할 일", desc: "체크리스트" },
      { syntax: "---", desc: "구분선" },
    ],
  },
  {
    title: "링크 / 미디어",
    rows: [
      { syntax: "[텍스트](URL)", desc: "링크" },
      { syntax: "![설명](URL)", desc: "이미지" },
    ],
  },
  {
    title: "코드",
    rows: [
      { syntax: "```ts ... ```", desc: "코드 블록 (언어 지정)" },
      { syntax: "```mermaid ... ```", desc: "Mermaid 다이어그램" },
    ],
  },
  {
    title: "기타",
    rows: [
      { syntax: "| a | b |", desc: "표 (GFM)" },
      { syntax: "$E=mc^2$", desc: "수식 (KaTeX)" },
    ],
  },
];

export function MarkdownGuideModal({
  open,
  onClose,
  onInsertSample,
}: {
  open: boolean;
  onClose: () => void;
  onInsertSample: (sample: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="마크다운 가이드" size="md">
      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {section.title}
            </h4>
            <div className="rounded-lg border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {section.rows.map((row) => (
                    <tr
                      key={row.syntax}
                      className="border-b border-black/[0.06] dark:border-white/[0.06] last:border-0"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-primary w-1/2">
                        {row.syntax}
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-xs">
                        {row.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
        <Button
          onClick={() => {
            onInsertSample(SAMPLE);
            onClose();
          }}
        >
          예시 보기
        </Button>
      </div>
    </Modal>
  );
}
