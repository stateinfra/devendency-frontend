"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView, ViewPlugin, Decoration, WidgetType, type DecorationSet } from "@codemirror/view";
import { syntaxHighlighting, HighlightStyle, syntaxTree } from "@codemirror/language";
import { StateField } from "@codemirror/state";
import { tags } from "@lezer/highlight";
import { createPost, updatePost } from "@/actions/post";
import { toast } from "sonner";

// ── Image upload helper ──
async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "업로드 실패");
  return data.url;
}

function insertImageToEditor(view: EditorView, file: File) {
  const placeholderId = `uploading-${Date.now()}`;
  const placeholder = `![업로드 중...](${placeholderId})`;
  const pos = view.state.selection.main.head;
  const prefix = pos > 0 && view.state.doc.sliceString(pos - 1, pos) !== "\n" ? "\n" : "";

  view.dispatch({
    changes: { from: pos, insert: prefix + placeholder + "\n" },
  });

  uploadImageFile(file)
    .then((url) => {
      const doc = view.state.doc.toString();
      const idx = doc.indexOf(placeholder);
      if (idx !== -1) {
        const alt = file.name.replace(/\.[^.]+$/, "");
        view.dispatch({
          changes: { from: idx, to: idx + placeholder.length, insert: `![${alt}](${url})` },
        });
      }
    })
    .catch((err) => {
      toast.error(err.message);
      const doc = view.state.doc.toString();
      const idx = doc.indexOf(placeholder);
      if (idx !== -1) {
        view.dispatch({
          changes: { from: idx, to: idx + placeholder.length, insert: "" },
        });
      }
    });
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

const imageUploadExtension = EditorView.domEventHandlers({
  paste(event, view) {
    const files = event.clipboardData?.files;
    if (!files?.length) return false;
    for (const file of Array.from(files)) {
      if (isImageFile(file)) {
        event.preventDefault();
        insertImageToEditor(view, file);
        return true;
      }
    }
    return false;
  },
  drop(event, view) {
    const files = event.dataTransfer?.files;
    if (!files?.length) return false;
    for (const file of Array.from(files)) {
      if (isImageFile(file)) {
        event.preventDefault();
        insertImageToEditor(view, file);
        return true;
      }
    }
    return false;
  },
});

type Tag = { id: string; name: string };

type MarkdownEditorProps = {
  postId?: string;
  initialData?: {
    title: string;
    content: string;
    tagNames: string[];
    published: boolean;
    slug?: string;
  };
  tags: Tag[];
};

const editorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#202020",
      color: "#dcddde",
      fontSize: "1rem",
      lineHeight: "1.75",
    },
    ".cm-content": {
      fontFamily:
        '"Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", sans-serif',
      caretColor: "#7f6df2",
      padding: "0",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#7f6df2",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "rgba(127, 109, 242, 0.2) !important",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-placeholder": {
      color: "#475569",
      fontStyle: "normal",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    ".cm-line": {
      padding: "1px 0",
    },
    ".cm-codeblock-line": {
      backgroundColor: "#1a1a1a",
      fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
      fontSize: "0.85rem",
      lineHeight: "1.65",
      borderLeft: "3px solid rgba(127, 109, 242, 0.3)",
      paddingLeft: "12px !important",
    },
  },
  { dark: true }
);

const codeBlockLine = Decoration.line({ class: "cm-codeblock-line" });

const codeBlockPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }
    update(update: { docChanged: boolean; viewportChanged: boolean; view: EditorView }) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.build(update.view);
      }
    }
    build(view: EditorView) {
      const decs: ReturnType<typeof codeBlockLine.range>[] = [];
      const tree = syntaxTree(view.state);
      tree.iterate({
        enter(node) {
          if (node.name === "FencedCode" || node.name === "CodeBlock") {
            const startLine = view.state.doc.lineAt(node.from).number;
            const endLine = view.state.doc.lineAt(node.to).number;
            for (let i = startLine; i <= endLine; i++) {
              const line = view.state.doc.line(i);
              decs.push(codeBlockLine.range(line.from));
            }
          }
        },
      });
      return Decoration.set(decs, true);
    }
  },
  { decorations: (v) => v.decorations }
);

// ── Image preview widget ──
class ImageWidget extends WidgetType {
  constructor(
    readonly url: string,
    readonly alt: string
  ) {
    super();
  }
  ignoreEvent() {
    return false;
  }
  toDOM() {
    const wrap = document.createElement("div");
    wrap.style.padding = "6px 0";
    wrap.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = this.url;
    img.alt = this.alt;
    img.draggable = false;
    img.style.maxWidth = "100%";
    img.style.maxHeight = "360px";
    img.style.borderRadius = "8px";
    img.style.border = "1px solid rgba(255,255,255,0.06)";
    img.onerror = () => {
      wrap.style.display = "none";
    };

    wrap.appendChild(img);
    return wrap;
  }
  eq(other: ImageWidget) {
    return this.url === other.url;
  }
}

function buildImageDecorations(state: import("@codemirror/state").EditorState): DecorationSet {
  try {
    const decs: Array<ReturnType<ReturnType<typeof Decoration.widget>["range"]>> = [];
    const cursorLine = state.doc.lineAt(state.selection.main.head).number;
    const tree = syntaxTree(state);
    tree.iterate({
      enter(node) {
        if (node.name === "Image") {
          const text = state.doc.sliceString(node.from, node.to);
          const m = text.match(/!\[([^\]]*)\]\((\S+?)\)/);
          if (m && m[2] && m[2].length > 1 && !m[2].startsWith("uploading-")) {
            const line = state.doc.lineAt(node.from);
            const isActive = line.number === cursorLine;

            if (isActive) {
              // Cursor on image line: show syntax + image below
              const pos = line.to;
              if (pos <= state.doc.length) {
                decs.push(
                  Decoration.widget({
                    widget: new ImageWidget(m[2], m[1]),
                    block: true,
                    side: 1,
                  }).range(pos)
                );
              }
            } else {
              // Cursor elsewhere: hide syntax, show image only
              decs.push(
                Decoration.replace({
                  widget: new ImageWidget(m[2], m[1]),
                }).range(node.from, node.to)
              );
            }
          }
        }
      },
    });
    return Decoration.set(decs, true);
  } catch {
    return Decoration.none;
  }
}

const imagePreviewField = StateField.define<DecorationSet>({
  create(state) {
    return buildImageDecorations(state);
  },
  update(value, tr) {
    if (tr.docChanged || tr.selection) {
      return buildImageDecorations(tr.state);
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const markdownHighlighting = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: "1.8em",
    fontWeight: "700",
    color: "#e0e0e0",
  },
  {
    tag: tags.heading2,
    fontSize: "1.4em",
    fontWeight: "700",
    color: "#e0e0e0",
  },
  {
    tag: tags.heading3,
    fontSize: "1.2em",
    fontWeight: "600",
    color: "#e0e0e0",
  },
  {
    tag: tags.heading4,
    fontSize: "1.1em",
    fontWeight: "600",
    color: "#dcddde",
  },
  { tag: tags.strong, fontWeight: "700", color: "#e8e8e8" },
  { tag: tags.emphasis, fontStyle: "italic" },
  {
    tag: tags.strikethrough,
    textDecoration: "line-through",
    color: "#6b6f80",
  },
  { tag: tags.link, color: "#a68bf0" },
  { tag: tags.url, color: "#7f6df2" },
  {
    tag: tags.monospace,
    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
    color: "#e06c9a",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: "3px",
  },
  { tag: tags.quote, color: "#a0a4b0", fontStyle: "italic" },
  { tag: tags.processingInstruction, color: "#555" },
  { tag: tags.meta, color: "#555" },
  { tag: tags.contentSeparator, color: "#555" },
  { tag: tags.list, color: "#6b6f80" },

  // Code syntax highlighting (matches globals.css hljs theme)
  { tag: tags.keyword, color: "#ff7b72", fontWeight: "600" },
  { tag: tags.operator, color: "#ff7b72" },
  { tag: tags.definitionKeyword, color: "#ff7b72", fontWeight: "600" },
  { tag: tags.controlKeyword, color: "#ff7b72", fontWeight: "600" },
  { tag: tags.moduleKeyword, color: "#ff7b72", fontWeight: "600" },
  { tag: tags.function(tags.definition(tags.variableName)), color: "#d2a8ff" },
  { tag: tags.function(tags.variableName), color: "#d2a8ff" },
  { tag: tags.definition(tags.className), color: "#d2a8ff" },
  { tag: tags.definition(tags.typeName), color: "#d2a8ff" },
  { tag: tags.typeName, color: "#79c0ff" },
  { tag: tags.className, color: "#d2a8ff" },
  { tag: tags.string, color: "#a5d6ff" },
  { tag: tags.special(tags.string), color: "#a5d6ff" },
  { tag: tags.regexp, color: "#a5d6ff" },
  { tag: tags.number, color: "#79c0ff" },
  { tag: tags.bool, color: "#79c0ff" },
  { tag: tags.null, color: "#79c0ff" },
  { tag: tags.variableName, color: "#dcddde" },
  { tag: tags.propertyName, color: "#ffa657" },
  { tag: tags.definition(tags.propertyName), color: "#ffa657" },
  { tag: tags.comment, color: "#8b949e", fontStyle: "italic" },
  { tag: tags.lineComment, color: "#8b949e", fontStyle: "italic" },
  { tag: tags.blockComment, color: "#8b949e", fontStyle: "italic" },
  { tag: tags.docComment, color: "#8b949e", fontStyle: "italic" },
  { tag: tags.tagName, color: "#ff7b72" },
  { tag: tags.attributeName, color: "#79c0ff" },
  { tag: tags.attributeValue, color: "#a5d6ff" },
  { tag: tags.atom, color: "#79c0ff" },
  { tag: tags.self, color: "#ff7b72" },
  { tag: tags.inserted, color: "#aff5b4" },
  { tag: tags.deleted, color: "#ffdcd7" },
]);

const editorExtensions = [
  markdown({ base: markdownLanguage, codeLanguages: languages }),
  EditorView.lineWrapping,
  syntaxHighlighting(markdownHighlighting),
  codeBlockPlugin,
  imagePreviewField,
  imageUploadExtension,
];

export function MarkdownEditor({
  postId,
  initialData,
  tags: availableTags,
}: MarkdownEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tagNames || []
  );
  const [tagInput, setTagInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag & drop overlay ──
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      dragCounter.current++;
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files?.length || !editorRef.current?.view) return;

    for (const file of Array.from(files)) {
      if (isImageFile(file)) {
        insertImageToEditor(editorRef.current.view, file);
      }
    }
  }, []);

  // ── Tag logic ──
  const filteredTags = availableTags.filter(
    (t) =>
      t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.includes(t.name)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(name: string) {
    const trimmed = name.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
    setShowSuggestions(false);
    tagInputRef.current?.focus();
  }

  function removeTag(name: string) {
    setSelectedTags((prev) => prev.filter((n) => n !== name));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  }

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  // ── Auto-save (debounce 3s after last edit) ──
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef({ title: initialData?.title || "", content: initialData?.content || "" });
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (!title && !content) return;
    // Skip if nothing changed
    if (title === savedRef.current.title && content === savedRef.current.content) return;

    setAutoSaveStatus("idle");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      if (!title || !content) return;
      setAutoSaveStatus("saving");

      const formData = new FormData();
      formData.set("title", title);
      formData.set("content", content);
      formData.set("excerpt", "");
      selectedTags.forEach((name) => formData.append("tagNames", name));
      formData.set("published", "false");

      const result = postId
        ? await updatePost(postId, formData)
        : await createPost(formData);

      if (!result.error) {
        savedRef.current = { title, content };
        setAutoSaveStatus("saved");
      } else {
        setAutoSaveStatus("idle");
      }
    }, 3000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [title, content, selectedTags, postId]);

  // ── Submit ──
  function handleSubmit(published: boolean) {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("excerpt", "");
    selectedTags.forEach((name) => formData.append("tagNames", name));
    formData.set("published", String(published));

    startTransition(async () => {
      const result = postId
        ? await updatePost(postId, formData)
        : await createPost(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(published ? "글이 발행되었습니다" : "임시저장되었습니다");
        const slug = "slug" in result ? result.slug : initialData?.slug;
        router.push(published && slug ? `/posts/${slug}` : "/");
        router.refresh();
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#202020]"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3 p-10 rounded-2xl border-2 border-dashed border-primary/60 bg-white/[0.03]">
            <span className="material-symbols-outlined text-5xl text-primary/80">upload</span>
            <p className="text-sm font-medium text-slate-300">이미지를 여기에 놓아주세요</p>
            <p className="text-xs text-slate-500">JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      )}

      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06] shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          나가기
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            title="이미지 추가"
          >
            <span className="material-symbols-outlined text-[18px]">image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && editorRef.current?.view) {
                insertImageToEditor(editorRef.current.view, file);
              }
              e.target.value = "";
            }}
          />
          {autoSaveStatus === "saving" && (
            <span className="text-[11px] text-slate-600">저장 중...</span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-[11px] text-slate-600">자동 저장됨</span>
          )}
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isPending || title.trim().length < 2 || !content}
            className="h-8 px-4 rounded-full border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/5 hover:text-slate-200 transition-colors disabled:opacity-40"
          >
            임시저장
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isPending || title.trim().length < 2 || !content}
            className="h-8 px-4 rounded-full bg-primary hover:bg-primary/80 text-white text-xs font-medium transition-colors disabled:opacity-40"
          >
            {isPending ? "저장 중..." : "발행"}
          </button>
        </div>
      </div>

      {/* Scrollable editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
          {/* Title */}
          <input
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl font-bold bg-transparent border-none outline-none text-white placeholder:text-slate-700 leading-tight"
            autoFocus
          />

          {/* Tags */}
          <div className="relative">
            <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
              {selectedTags.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.06] text-slate-400 text-xs rounded-md"
                >
                  #{name}
                  <button
                    type="button"
                    onClick={() => removeTag(name)}
                    className="hover:text-red-400 transition-colors leading-none"
                  >
                    <span className="material-symbols-outlined text-[8px]">
                      close
                    </span>
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                type="text"
                placeholder={
                  selectedTags.length === 0 ? "태그 추가..." : ""
                }
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value.replace(/#/g, ""));
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleTagKeyDown}
                className="flex-1 min-w-[80px] bg-transparent text-xs outline-none placeholder:text-slate-600 text-slate-400"
              />
            </div>

            {showSuggestions && tagInput && filteredTags.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 top-full left-0 mt-1 bg-[#2a2a2a] border border-white/[0.08] rounded-lg shadow-xl max-h-40 overflow-y-auto min-w-[180px]"
              >
                {filteredTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => addTag(tag.name)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span className="text-slate-600 mr-1">#</span>
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.04]" />

          {/* CodeMirror Editor */}
          <CodeMirror
            ref={editorRef}
            value={content}
            onChange={handleContentChange}
            theme={editorTheme}
            extensions={editorExtensions}
            placeholder="마크다운으로 글을 작성하세요..."
            minHeight="60vh"
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              bracketMatching: false,
              closeBrackets: false,
              autocompletion: false,
              indentOnInput: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
