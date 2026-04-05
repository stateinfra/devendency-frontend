"use client";

import { useEffect, useState } from "react";

type TocItem = {
  id: string;
  text: string;
  level: number;
};

export function TableOfContents({ content }: { content: string }) {
  const [activeId, setActiveId] = useState<string>("");
  const [headings, setHeadings] = useState<TocItem[]>([]);

  // DOM에서 실제 헤딩 요소를 읽어 ToC 생성
  useEffect(() => {
    // rehype-slug가 DOM에 ID를 부여한 뒤 읽어야 하므로 약간 대기
    const timer = setTimeout(() => {
      const container = document.querySelector(".obsidian-md");
      if (!container) return;

      const elements = container.querySelectorAll("h1[id], h2[id], h3[id]");
      const items: TocItem[] = [];
      elements.forEach((el) => {
        const level = parseInt(el.tagName[1], 10);
        items.push({
          id: el.id,
          text: el.textContent?.trim() || "",
          level,
        });
      });
      setHeadings(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));

    function handleScroll() {
      const firstEl = elements[0];
      const lastEl = elements[elements.length - 1];
      if (!firstEl || !lastEl) return;

      // 맨 위: 첫 번째 헤딩보다 위에 있으면 첫 번째 활성화
      if (firstEl.getBoundingClientRect().top > window.innerHeight * 0.3) {
        setActiveId(firstEl.id);
        return;
      }

      // 맨 아래: 스크롤이 거의 바닥이면 마지막 헤딩 활성화
      const scrollBottom = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollBottom < 100) {
        setActiveId(lastEl.id);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        목차
      </h4>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(heading.id)?.scrollIntoView({
              behavior: "smooth",
            });
          }}
          className={`block text-[13px] leading-relaxed transition-colors py-0.5 border-l-2 ${
            heading.level === 1
              ? "pl-3"
              : heading.level === 2
                ? "pl-5"
                : "pl-7"
          } ${
            activeId === heading.id
              ? "border-primary text-primary font-medium"
              : "border-transparent text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
          }`}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
