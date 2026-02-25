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
import { ImageCropModal } from "./cover-image-crop-modal";

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
type SeriesOption = { id: string; name: string };

type MarkdownEditorProps = {
  postId?: string;
  initialData?: {
    title: string;
    content: string;
    tagNames: string[];
    published: boolean;
    slug?: string;
    coverImage?: string | null;
    seriesId?: string | null;
  };
  tags: Tag[];
  userSeries?: SeriesOption[];
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
  userSeries = [],
}: MarkdownEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(postId);
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tagNames || []
  );
  const [tagInput, setTagInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [coverImage, setCoverImage] = useState<string | null>(
    initialData?.coverImage ?? null,
  );
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(
    initialData?.seriesId || "",
  );
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const seriesDropdownRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // ── Cover image crop & upload ──
  function handleCoverImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setCropModalOpen(true);
  }

  const handleCropConfirm = useCallback(async (blob: Blob) => {
    setCropModalOpen(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
    setIsCoverUploading(true);
    try {
      const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
      const url = await uploadImageFile(file);
      setCoverImage(url);
    } catch {
      toast.error("표지 이미지 업로드에 실패했습니다");
    } finally {
      setIsCoverUploading(false);
    }
  }, [cropImageSrc]);

  function handleCropClose() {
    setCropModalOpen(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  }

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
      if (
        seriesDropdownRef.current &&
        !seriesDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSeriesDropdown(false);
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
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const savedRef = useRef({
    title: initialData?.title || "",
    content: initialData?.content || "",
    tags: initialData?.tagNames || [] as string[],
    coverImage: initialData?.coverImage ?? null as string | null,
    seriesId: initialData?.seriesId || "" as string,
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const hasUnsavedChanges = useCallback(() => {
    const s = savedRef.current;
    return (
      title !== s.title ||
      content !== s.content ||
      JSON.stringify(selectedTags) !== JSON.stringify(s.tags) ||
      (coverImage ?? null) !== s.coverImage ||
      selectedSeriesId !== s.seriesId
    );
  }, [title, content, selectedTags, coverImage, selectedSeriesId]);

  // localStorage backup key
  const backupKey = currentPostId ? `draft-backup-${currentPostId}` : "draft-backup-new";

  const performAutoSave = useCallback(async () => {
    if (!title || !content) return;

    // Save to localStorage as backup before server call
    try {
      localStorage.setItem(
        backupKey,
        JSON.stringify({
          title,
          content,
          tags: selectedTags,
          coverImage,
          seriesId: selectedSeriesId,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // localStorage full or unavailable — ignore
    }

    setAutoSaveStatus("saving");

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("excerpt", "");
    selectedTags.forEach((name) => formData.append("tagNames", name));
    // 이미 발행된 글은 발행 상태 유지, 새 글 자동저장은 임시저장으로
    const isPublished = initialData?.published ?? false;
    formData.set("published", String(isPublished));
    formData.set("coverImage", coverImage ?? "");
    formData.set("seriesId", selectedSeriesId);

    const result = currentPostId
      ? await updatePost(currentPostId, formData)
      : await createPost(formData);

    if (!result.error) {
      // First create → capture postId for future updates
      if (!currentPostId && "postId" in result && result.postId) {
        setCurrentPostId(result.postId);
        // Migrate localStorage key from "new" to actual postId
        try {
          const backup = localStorage.getItem("draft-backup-new");
          if (backup) {
            localStorage.setItem(`draft-backup-${result.postId}`, backup);
            localStorage.removeItem("draft-backup-new");
          }
        } catch { /* ignore */ }
      }
      savedRef.current = {
        title,
        content,
        tags: [...selectedTags],
        coverImage: coverImage ?? null,
        seriesId: selectedSeriesId,
      };
      retryCount.current = 0;
      setAutoSaveStatus("saved");
      setLastSavedAt(new Date());

      // Clear localStorage backup on successful server save
      try {
        const key = currentPostId
          ? `draft-backup-${currentPostId}`
          : "postId" in result && result.postId
            ? `draft-backup-${result.postId}`
            : "draft-backup-new";
        localStorage.removeItem(key);
      } catch { /* ignore */ }
    } else {
      setAutoSaveStatus("error");
      // Retry up to 3 times with 5s delay
      if (retryCount.current < 3) {
        retryCount.current++;
        retryTimer.current = setTimeout(() => {
          performAutoSave();
        }, 5000);
      }
    }
  }, [title, content, selectedTags, coverImage, selectedSeriesId, currentPostId, backupKey]);

  useEffect(() => {
    if (!title && !content) return;
    if (!hasUnsavedChanges()) return;

    setAutoSaveStatus("idle");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(() => {
      retryCount.current = 0;
      performAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [title, content, selectedTags, coverImage, selectedSeriesId, hasUnsavedChanges, performAutoSave]);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  // ── Beforeunload protection ──
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // ── localStorage backup restore on mount ──
  useEffect(() => {
    try {
      const key = currentPostId ? `draft-backup-${currentPostId}` : "draft-backup-new";
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const backup = JSON.parse(raw) as {
        title: string;
        content: string;
        tags: string[];
        coverImage: string | null;
        seriesId: string;
        savedAt: string;
      };
      // Only offer restore if backup has content and differs from initial data
      const hasBackupContent = backup.title || backup.content;
      const differsFromInitial =
        backup.title !== (initialData?.title || "") ||
        backup.content !== (initialData?.content || "");
      if (hasBackupContent && differsFromInitial) {
        toast("저장되지 않은 이전 작업이 있습니다. 복원하시겠습니까?", {
          action: {
            label: "복원",
            onClick: () => {
              setTitle(backup.title);
              setContent(backup.content);
              setSelectedTags(backup.tags || []);
              if (backup.coverImage !== undefined) setCoverImage(backup.coverImage);
              if (backup.seriesId !== undefined) setSelectedSeriesId(backup.seriesId);
              toast.success("이전 작업이 복원되었습니다");
            },
          },
          duration: 10000,
        });
      }
    } catch {
      // Corrupted backup — ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Submit ──
  function handleSubmit(published: boolean) {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (retryTimer.current) clearTimeout(retryTimer.current);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("excerpt", "");
    selectedTags.forEach((name) => formData.append("tagNames", name));
    formData.set("published", String(published));
    formData.set("coverImage", coverImage ?? "");
    formData.set("seriesId", selectedSeriesId);

    startTransition(async () => {
      const result = currentPostId
        ? await updatePost(currentPostId, formData)
        : await createPost(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        // Mark as saved to prevent beforeunload warning
        savedRef.current = {
          title,
          content,
          tags: [...selectedTags],
          coverImage: coverImage ?? null,
          seriesId: selectedSeriesId,
        };
        // Clean up localStorage backup
        try {
          const key = currentPostId
            ? `draft-backup-${currentPostId}`
            : "draft-backup-new";
          localStorage.removeItem(key);
        } catch { /* ignore */ }

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
          {autoSaveStatus === "saved" && lastSavedAt && (
            <span className="text-[11px] text-slate-600">
              자동 저장됨 ({lastSavedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })})
            </span>
          )}
          {autoSaveStatus === "error" && (
            <span className="text-[11px] text-red-400">
              저장 실패{retryCount.current < 3 ? " · 재시도 중..." : ""}
            </span>
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
          {/* Cover image */}
          <div>
            {coverImage ? (
              <div className="relative group w-full rounded-xl overflow-hidden mb-2">
                <img
                  src={coverImage}
                  alt="표지 이미지"
                  className="w-full object-cover max-h-[300px]"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImage(null)}
                    className="px-3 py-1.5 text-xs rounded-full bg-white/20 hover:bg-red-500/60 text-white transition-colors"
                  >
                    제거
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                disabled={isCoverUploading}
                className="w-full h-[80px] rounded-xl border border-dashed border-white/[0.08] hover:border-white/20 flex items-center justify-center gap-2 text-slate-600 hover:text-slate-400 transition-all disabled:opacity-40"
              >
                {isCoverUploading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                    <span className="text-xs">표지 이미지 추가</span>
                    <span className="text-[10px] text-slate-700">권장 1200×630</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleCoverImageChange}
            />
          </div>

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

          {/* Series selector */}
          {userSeries.length > 0 && (
            <div className="relative" ref={seriesDropdownRef}>
              {selectedSeriesId ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-lg font-medium">
                  <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                  {userSeries.find((s) => s.id === selectedSeriesId)?.name}
                  <button
                    type="button"
                    onClick={() => setSelectedSeriesId("")}
                    className="hover:text-red-400 transition-colors ml-0.5"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSeriesDropdown((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-300 rounded-lg border border-dashed border-white/[0.08] hover:border-white/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                  시리즈에 추가
                </button>
              )}
              {showSeriesDropdown && !selectedSeriesId && (
                <div className="absolute z-10 top-full left-0 mt-1 bg-[#2a2a2a] border border-white/[0.08] rounded-lg shadow-xl min-w-[200px] py-1">
                  {userSeries.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSeriesId(s.id);
                        setShowSeriesDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[14px] text-slate-600">auto_stories</span>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
