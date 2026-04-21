"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView, ViewPlugin, Decoration, WidgetType, keymap, type DecorationSet } from "@codemirror/view";
import { syntaxHighlighting, HighlightStyle, syntaxTree } from "@codemirror/language";
import { StateField, EditorState, Prec, ChangeSet } from "@codemirror/state";
import { tags } from "@lezer/highlight";
import { createPost, updatePost } from "@/actions/post";
import { toast } from "sonner";
import { ImageCropModal } from "./cover-image-crop-modal";
import { MarkdownGuideModal } from "./markdown-guide-modal";
import { WikiLinkMenu, type WikiSuggestion } from "./wiki-link-menu";
import { TableSizePicker, buildTableMarkdown } from "./table-size-picker";

// ── YouTube URL detection ──
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

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

// ── Toolbar formatting helpers ──
function toggleInlineMark(view: EditorView, left: string, right: string = left) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.doc.sliceString(from, to);
  const wrapLen = left.length + right.length;
  if (selected.length >= wrapLen && selected.startsWith(left) && selected.endsWith(right)) {
    const inner = selected.slice(left.length, selected.length - right.length);
    view.dispatch({
      changes: { from, to, insert: inner },
      selection: { anchor: from, head: from + inner.length },
    });
  } else {
    const ins = left + selected + right;
    view.dispatch({
      changes: { from, to, insert: ins },
      selection: selected
        ? { anchor: from + left.length, head: from + left.length + selected.length }
        : { anchor: from + left.length },
    });
  }
  view.focus();
}

function toggleLinePrefix(view: EditorView, prefix: string) {
  const { from, to } = view.state.selection.main;
  const fromLine = view.state.doc.lineAt(from);
  const toLine = view.state.doc.lineAt(to);
  let allPrefixed = true;
  for (let n = fromLine.number; n <= toLine.number; n++) {
    if (!view.state.doc.line(n).text.startsWith(prefix)) {
      allPrefixed = false;
      break;
    }
  }
  const changes: { from: number; to: number; insert: string }[] = [];
  for (let n = fromLine.number; n <= toLine.number; n++) {
    const line = view.state.doc.line(n);
    if (allPrefixed) {
      changes.push({ from: line.from, to: line.from + prefix.length, insert: "" });
    } else if (!line.text.startsWith(prefix)) {
      changes.push({ from: line.from, to: line.from, insert: prefix });
    }
  }
  if (changes.length) view.dispatch({ changes });
  view.focus();
}

function setHeadingLevel(view: EditorView, level: number) {
  const { from, to } = view.state.selection.main;
  const fromLine = view.state.doc.lineAt(from);
  const toLine = view.state.doc.lineAt(to);
  const target = "#".repeat(level) + " ";
  const changes: { from: number; to: number; insert: string }[] = [];
  for (let n = fromLine.number; n <= toLine.number; n++) {
    const line = view.state.doc.line(n);
    const m = line.text.match(/^(#{1,6}) /);
    const existingLen = m ? m[0].length : 0;
    const existingLevel = m ? m[1].length : 0;
    if (existingLevel === level) {
      changes.push({ from: line.from, to: line.from + existingLen, insert: "" });
    } else {
      changes.push({ from: line.from, to: line.from + existingLen, insert: target });
    }
  }
  view.dispatch({ changes });
  view.focus();
}

function insertBlockAtCursor(view: EditorView, block: string, cursorOffset?: number) {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  const before = view.state.doc.sliceString(line.from, pos);
  const prefix = before.trim() === "" ? "" : "\n\n";
  const text = prefix + block;
  const cursorAt = pos + prefix.length + (cursorOffset ?? block.length);
  view.dispatch({
    changes: { from: pos, insert: text },
    selection: { anchor: cursorAt },
  });
  view.focus();
}

function insertLink(view: EditorView) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.doc.sliceString(from, to);
  const label = selected || "링크";
  const insert = `[${label}](https://)`;
  view.dispatch({
    changes: { from, to, insert },
    selection: {
      anchor: from + label.length + 3,
      head: from + label.length + 3 + 8,
    },
  });
  view.focus();
}

// ── Markdown table WYSIWYG widget ──
type TableAlignment = "left" | "right" | "center" | null;
type TableData = {
  from: number;
  to: number;
  headers: string[];
  alignments: TableAlignment[];
  rows: string[][];
};

function splitTableRow(text: string): string[] {
  let s = text.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (s[i] === "|") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += s[i];
    }
  }
  out.push(cur.trim());
  return out;
}

function isTableSeparator(text: string): boolean {
  const t = text.trim();
  if (!t.includes("-")) return false;
  const cells = splitTableRow(t);
  if (cells.length < 1) return false;
  return cells.every((c) => /^:?-{3,}:?$/.test(c.trim()));
}

function sepCellAlignment(raw: string): TableAlignment {
  const t = raw.trim();
  const l = t.startsWith(":");
  const r = t.endsWith(":");
  if (l && r) return "center";
  if (r) return "right";
  if (l) return "left";
  return null;
}

function parseTableAtLine(
  state: import("@codemirror/state").EditorState,
  lineNum: number,
): TableData | null {
  const doc = state.doc;
  if (lineNum + 1 > doc.lines) return null;
  const l1 = doc.line(lineNum);
  const l2 = doc.line(lineNum + 1);
  if (!l1.text.includes("|")) return null;
  if (!isTableSeparator(l2.text)) return null;
  const headers = splitTableRow(l1.text);
  if (headers.length === 0) return null;
  const aRaw = splitTableRow(l2.text);
  const alignments: TableAlignment[] = [];
  for (let i = 0; i < headers.length; i++) alignments.push(sepCellAlignment(aRaw[i] ?? ""));
  const rows: string[][] = [];
  let lastEnd = l2.to;
  let n = lineNum + 2;
  while (n <= doc.lines) {
    const line = doc.line(n);
    if (line.text.trim() === "" || !line.text.includes("|")) break;
    // Stop when we run into a new table — either a stray separator row,
    // or a header row whose next line is a separator.
    if (isTableSeparator(line.text)) break;
    if (n + 1 <= doc.lines && isTableSeparator(doc.line(n + 1).text)) break;
    const cells = splitTableRow(line.text);
    while (cells.length < headers.length) cells.push("");
    cells.length = headers.length;
    rows.push(cells);
    lastEnd = line.to;
    n++;
  }
  return { from: l1.from, to: lastEnd, headers, alignments, rows };
}

function tableToMarkdown(t: TableData): string {
  const esc = (c: string) => c.replace(/\|/g, "\\|");
  const fmt = (c: string) => esc(c) || " ";
  const header = "| " + t.headers.map(fmt).join(" | ") + " |";
  const sep = "| " + t.alignments.map((a) => {
    if (a === "center") return ":---:";
    if (a === "right") return "---:";
    if (a === "left") return ":---";
    return "---";
  }).join(" | ") + " |";
  const rs = t.rows.map((r) => "| " + r.map(fmt).join(" | ") + " |");
  return [header, sep, ...rs].join("\n");
}

let pendingTableFocus: { tableFrom: number; row: number; col: number } | null = null;

type PendingReorder = {
  tableFrom: number;
  type: "row" | "col";
  fromIdx: number;
  toIdx: number;
  oldRects: { left: number; top: number }[];
};
let pendingTableReorder: PendingReorder | null = null;

function computeReorderMapping(fromIdx: number, toIdx: number, total: number): number[] {
  const mapping: number[] = new Array(total);
  if (fromIdx < toIdx) {
    for (let i = 0; i < total; i++) {
      if (i < fromIdx) mapping[i] = i;
      else if (i < toIdx) mapping[i] = i + 1;
      else if (i === toIdx) mapping[i] = fromIdx;
      else mapping[i] = i;
    }
  } else if (fromIdx > toIdx) {
    for (let i = 0; i < total; i++) {
      if (i < toIdx) mapping[i] = i;
      else if (i === toIdx) mapping[i] = fromIdx;
      else if (i <= fromIdx) mapping[i] = i - 1;
      else mapping[i] = i;
    }
  } else {
    for (let i = 0; i < total; i++) mapping[i] = i;
  }
  return mapping;
}

const TABLE_MAX_ROWS = 8; // body rows (excluding header)
const TABLE_MAX_COLS = 10;

type TableMenuItem =
  | "-"
  | { label: string; disabled?: boolean; onSelect: () => void };

function showCellContextMenu(x: number, y: number, items: TableMenuItem[]) {
  document.querySelectorAll(".cm-md-table-menu").forEach((n) => n.remove());
  const menu = document.createElement("div");
  menu.className = "cm-md-table-menu";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  for (const item of items) {
    if (item === "-") {
      const sep = document.createElement("div");
      sep.className = "cm-md-table-menu-sep";
      menu.appendChild(sep);
      continue;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cm-md-table-menu-item";
    btn.textContent = item.label;
    btn.disabled = !!item.disabled;
    btn.addEventListener("click", () => {
      if (!btn.disabled) item.onSelect();
      cleanup();
    });
    menu.appendChild(btn);
  }
  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = `${Math.max(0, x - rect.width)}px`;
  if (rect.bottom > window.innerHeight) menu.style.top = `${Math.max(0, y - rect.height)}px`;
  const onMouseDown = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) cleanup();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); cleanup(); }
  };
  const cleanup = () => {
    menu.remove();
    document.removeEventListener("mousedown", onMouseDown, true);
    document.removeEventListener("keydown", onKey, true);
  };
  setTimeout(() => {
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("keydown", onKey, true);
  }, 0);
}

// Invisible spacer above each table — gives the user a drag-start surface
// when a table sits at the very top of the doc (or right under another block).
// Not cursor-addressable since it's a zero-length widget decoration.
class TableEdgeWidget extends WidgetType {
  eq() { return true; }
  toDOM() {
    const d = document.createElement("div");
    d.className = "cm-md-table-edge";
    d.setAttribute("contenteditable", "false");
    return d;
  }
  ignoreEvent() { return false; }
}

class TableWidget extends WidgetType {
  constructor(private readonly data: TableData) {
    super();
  }

  eq(other: TableWidget) {
    const a = this.data, b = other.data;
    if (a.headers.length !== b.headers.length || a.rows.length !== b.rows.length) return false;
    for (let i = 0; i < a.headers.length; i++) if (a.headers[i] !== b.headers[i]) return false;
    for (let i = 0; i < a.alignments.length; i++) if (a.alignments[i] !== b.alignments[i]) return false;
    for (let i = 0; i < a.rows.length; i++) {
      const ra = a.rows[i], rb = b.rows[i];
      if (ra.length !== rb.length) return false;
      for (let j = 0; j < ra.length; j++) if (ra[j] !== rb[j]) return false;
    }
    return true;
  }

  ignoreEvent() { return true; }

  toDOM(view: EditorView): HTMLElement {
    const t = this.data;
    const totalCols = Math.max(1, t.headers.length);
    const totalRows = t.rows.length + 1;

    const wrapper = document.createElement("div");
    wrapper.className = "cm-md-table-wrapper";
    wrapper.setAttribute("contenteditable", "false");
    wrapper.dataset.tableFrom = String(t.from);
    wrapper.dataset.tableTo = String(t.to);

    let focusedRow = -1;
    let focusedCol = -1;

    const dispatchTable = (nt: TableData, focus?: { row: number; col: number }) => {
      if (focus) pendingTableFocus = { tableFrom: t.from, row: focus.row, col: focus.col };
      const md = tableToMarkdown(nt);
      view.dispatch({ changes: { from: t.from, to: t.to, insert: md } });
    };

    const readCell = (el: HTMLElement) => (el.textContent || "").replace(/[\r\n]+/g, " ");

    const commitCell = (row: number, col: number, value: string): boolean => {
      const cur = row === 0 ? (t.headers[col] ?? "") : (t.rows[row - 1]?.[col] ?? "");
      if (cur === value) return false;
      const nt: TableData = {
        ...t,
        headers: row === 0 ? t.headers.map((h, i) => (i === col ? value : h)) : t.headers,
        rows: row === 0
          ? t.rows
          : t.rows.map((r, i) => (i === row - 1 ? r.map((c, j) => (j === col ? value : c)) : r)),
      };
      dispatchTable(nt);
      return true;
    };

    const focusCellAt = (row: number, col: number) => {
      const tgt = wrapper.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`);
      if (tgt) {
        tgt.focus();
        const range = document.createRange();
        range.selectNodeContents(tgt);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    };

    const moveCellWithText = (
      row: number, col: number, text: string,
      nextRow: number, nextCol: number,
    ) => {
      if (nextRow >= totalRows) {
        if (t.rows.length >= TABLE_MAX_ROWS) {
          commitCell(row, col, text);
          return;
        }
        const withEdit: TableData = {
          ...t,
          headers: row === 0 ? t.headers.map((h, i) => (i === col ? text : h)) : t.headers,
          rows: row === 0
            ? t.rows
            : t.rows.map((r, i) => (i === row - 1 ? r.map((c, j) => (j === col ? text : c)) : r)),
        };
        const nt: TableData = { ...withEdit, rows: [...withEdit.rows, Array(totalCols).fill("")] };
        dispatchTable(nt, { row: totalRows, col: Math.max(0, nextCol) });
        return;
      }
      if (nextRow < 0) return;
      const changed = commitCell(row, col, text);
      if (changed) {
        pendingTableFocus = { tableFrom: t.from, row: nextRow, col: nextCol };
      } else {
        focusCellAt(nextRow, nextCol);
      }
    };

    // Row/col operations
    const insertRowAt = (targetRow: number) => {
      if (targetRow < 1 || t.rows.length >= TABLE_MAX_ROWS) return;
      const bodyIdx = targetRow - 1;
      const nt: TableData = {
        ...t,
        rows: [
          ...t.rows.slice(0, bodyIdx),
          Array(totalCols).fill(""),
          ...t.rows.slice(bodyIdx),
        ],
      };
      dispatchTable(nt, { row: targetRow, col: Math.max(0, focusedCol) });
    };
    const deleteRowAt = (row: number) => {
      if (row < 1 || row > t.rows.length) return;
      const bodyIdx = row - 1;
      const nt: TableData = { ...t, rows: t.rows.filter((_, i) => i !== bodyIdx) };
      dispatchTable(nt);
    };
    const insertColAt = (col: number) => {
      if (col < 0 || col > totalCols || totalCols >= TABLE_MAX_COLS) return;
      const nt: TableData = {
        ...t,
        headers: [...t.headers.slice(0, col), "", ...t.headers.slice(col)],
        alignments: [...t.alignments.slice(0, col), null, ...t.alignments.slice(col)],
        rows: t.rows.map((r) => [...r.slice(0, col), "", ...r.slice(col)]),
      };
      dispatchTable(nt, { row: Math.max(0, focusedRow), col });
    };
    const deleteColAt = (col: number) => {
      if (col < 0 || col >= totalCols || totalCols <= 1) return;
      const nt: TableData = {
        ...t,
        headers: t.headers.filter((_, i) => i !== col),
        alignments: t.alignments.filter((_, i) => i !== col),
        rows: t.rows.map((r) => r.filter((_, i) => i !== col)),
      };
      dispatchTable(nt);
    };
    const deleteRowRange = (r1: number, r2: number) => {
      if (r1 < 1 || r2 > t.rows.length || r2 < r1) return;
      const b1 = r1 - 1;
      const b2 = r2 - 1;
      const nt: TableData = {
        ...t,
        rows: t.rows.filter((_, i) => i < b1 || i > b2),
      };
      clearCellSelection();
      dispatchTable(nt);
    };
    const deleteColRange = (c1: number, c2: number) => {
      if (c1 < 0 || c2 >= totalCols || c2 < c1) return;
      const count = c2 - c1 + 1;
      if (totalCols - count < 1) return;
      const keep = <T,>(_: T, i: number) => i < c1 || i > c2;
      const nt: TableData = {
        ...t,
        headers: t.headers.filter(keep),
        alignments: t.alignments.filter(keep),
        rows: t.rows.map((r) => r.filter(keep)),
      };
      clearCellSelection();
      dispatchTable(nt);
    };
    const clearCellsInRect = (r1: number, r2: number, c1: number, c2: number) => {
      const nt: TableData = {
        ...t,
        headers: t.headers.map((h, i) => (r1 === 0 && i >= c1 && i <= c2 ? "" : h)),
        rows: t.rows.map((row, rIdx) => {
          const displayRow = rIdx + 1;
          if (displayRow < Math.max(1, r1) || displayRow > r2) return row;
          return row.map((cell, i) => (i >= c1 && i <= c2 ? "" : cell));
        }),
      };
      clearCellSelection();
      dispatchTable(nt);
    };

    // ── Multi-cell selection (drag rectangle) ──
    let selectionAnchor: { row: number; col: number } | null = null;
    let selectionFocus: { row: number; col: number } | null = null;
    let isDraggingSelection = false;
    let selectionCrossedCell = false;

    const paintSelection = () => {
      wrapper.querySelectorAll<HTMLElement>("[data-cell-selected]").forEach((el) => {
        delete el.dataset.cellSelected;
      });
      if (!selectionAnchor || !selectionFocus) return;
      if (selectionAnchor.row === selectionFocus.row && selectionAnchor.col === selectionFocus.col) return;
      const r1 = Math.min(selectionAnchor.row, selectionFocus.row);
      const r2 = Math.max(selectionAnchor.row, selectionFocus.row);
      const c1 = Math.min(selectionAnchor.col, selectionFocus.col);
      const c2 = Math.max(selectionAnchor.col, selectionFocus.col);
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const cell = wrapper.querySelector<HTMLElement>(`[data-row="${r}"][data-col="${c}"]`);
          if (cell) cell.dataset.cellSelected = "";
        }
      }
    };
    const clearCellSelection = () => {
      selectionAnchor = null;
      selectionFocus = null;
      isDraggingSelection = false;
      selectionCrossedCell = false;
      paintSelection();
    };
    const getSelectionRect = () => {
      if (!selectionAnchor || !selectionFocus) return null;
      if (selectionAnchor.row === selectionFocus.row && selectionAnchor.col === selectionFocus.col) return null;
      return {
        r1: Math.min(selectionAnchor.row, selectionFocus.row),
        r2: Math.max(selectionAnchor.row, selectionFocus.row),
        c1: Math.min(selectionAnchor.col, selectionFocus.col),
        c2: Math.max(selectionAnchor.col, selectionFocus.col),
      };
    };
    const moveRow = (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx || fromIdx < 0 || fromIdx >= t.rows.length) return;
      const clamped = Math.max(0, Math.min(t.rows.length - 1, toIdx));
      // Capture old rects for FLIP animation
      const oldRects = Array.from(tbody.children).map((tr) => {
        const r = (tr as HTMLElement).getBoundingClientRect();
        return { left: r.left, top: r.top };
      });
      pendingTableReorder = {
        tableFrom: t.from,
        type: "row",
        fromIdx,
        toIdx: clamped,
        oldRects,
      };
      const arr = [...t.rows];
      const [m] = arr.splice(fromIdx, 1);
      arr.splice(clamped, 0, m);
      dispatchTable({ ...t, rows: arr });
    };
    const moveCol = (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx || fromIdx < 0 || fromIdx >= totalCols) return;
      const clamped = Math.max(0, Math.min(totalCols - 1, toIdx));
      const oldRects = Array.from(hr.children).map((th) => {
        const r = (th as HTMLElement).getBoundingClientRect();
        return { left: r.left, top: r.top };
      });
      pendingTableReorder = {
        tableFrom: t.from,
        type: "col",
        fromIdx,
        toIdx: clamped,
        oldRects,
      };
      const move = <T,>(arr: T[]) => {
        const c = [...arr];
        const [m] = c.splice(fromIdx, 1);
        c.splice(clamped, 0, m);
        return c;
      };
      dispatchTable({
        ...t,
        headers: move(t.headers),
        alignments: move(t.alignments),
        rows: t.rows.map((r) => move(r)),
      });
    };

    const openContextMenu = (x: number, y: number, row: number, col: number) => {
      focusedRow = row;
      focusedCol = col;
      const isHeader = row === 0;
      const canAddRow = t.rows.length < TABLE_MAX_ROWS;
      const canAddCol = totalCols < TABLE_MAX_COLS;
      const canDelRow = !isHeader && t.rows.length > 0;
      const canDelCol = totalCols > 1;
      showCellContextMenu(x, y, [
        { label: "위에 행 추가", disabled: isHeader || !canAddRow, onSelect: () => insertRowAt(row) },
        { label: "아래에 행 추가", disabled: !canAddRow, onSelect: () => insertRowAt(row + 1) },
        { label: "행 삭제", disabled: !canDelRow, onSelect: () => deleteRowAt(row) },
        "-",
        { label: "왼쪽에 열 추가", disabled: !canAddCol, onSelect: () => insertColAt(col) },
        { label: "오른쪽에 열 추가", disabled: !canAddCol, onSelect: () => insertColAt(col + 1) },
        { label: "열 삭제", disabled: !canDelCol, onSelect: () => deleteColAt(col) },
      ]);
    };

    const buildCell = (tag: "th" | "td", row: number, col: number, text: string) => {
      const el = document.createElement(tag);
      el.textContent = text;
      el.contentEditable = "true";
      el.spellcheck = false;
      el.dataset.row = String(row);
      el.dataset.col = String(col);
      if (t.alignments[col]) el.style.textAlign = t.alignments[col]!;

      el.addEventListener("focus", () => {
        focusedRow = row;
        focusedCol = col;
      });
      el.addEventListener("mousedown", (ev) => {
        if (ev.button !== 0) return;
        selectionAnchor = { row, col };
        selectionFocus = { row, col };
        isDraggingSelection = true;
        selectionCrossedCell = false;
        paintSelection();
      });
      el.addEventListener("mouseenter", (ev) => {
        if (!isDraggingSelection || !selectionAnchor) return;
        if (row === selectionAnchor.row && col === selectionAnchor.col) return;
        if (!selectionCrossedCell) {
          selectionCrossedCell = true;
          window.getSelection()?.removeAllRanges();
          const active = document.activeElement as HTMLElement | null;
          if (active && wrapper.contains(active) && active !== el) active.blur();
        }
        selectionFocus = { row, col };
        paintSelection();
        ev.preventDefault();
      });
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const rect = getSelectionRect();
        const clickInSelection = rect &&
          row >= rect.r1 && row <= rect.r2 &&
          col >= rect.c1 && col <= rect.c2;
        if (rect && clickInSelection) {
          const rowSpan = rect.r2 - rect.r1 + 1;
          const colSpan = rect.c2 - rect.c1 + 1;
          if (rowSpan === 1 && colSpan > 1) {
            // 1×n → delete n columns
            const canDel = totalCols - colSpan >= 1;
            showCellContextMenu(e.clientX, e.clientY, [
              { label: `열 ${colSpan}개 삭제`, disabled: !canDel,
                onSelect: () => deleteColRange(rect.c1, rect.c2) },
              "-",
              { label: "선택 영역 지우기",
                onSelect: () => clearCellsInRect(rect.r1, rect.r2, rect.c1, rect.c2) },
            ]);
            return;
          }
          if (colSpan === 1 && rowSpan > 1) {
            // n×1 → delete n rows (header excluded)
            const canDel = rect.r1 >= 1 && rect.r2 <= t.rows.length;
            showCellContextMenu(e.clientX, e.clientY, [
              { label: `행 ${rowSpan}개 삭제`, disabled: !canDel,
                onSelect: () => deleteRowRange(rect.r1, rect.r2) },
              "-",
              { label: "선택 영역 지우기",
                onSelect: () => clearCellsInRect(rect.r1, rect.r2, rect.c1, rect.c2) },
            ]);
            return;
          }
          // General rectangle
          showCellContextMenu(e.clientX, e.clientY, [
            { label: `선택 영역 지우기 (${rowSpan}×${colSpan})`,
              onSelect: () => clearCellsInRect(rect.r1, rect.r2, rect.c1, rect.c2) },
          ]);
          return;
        }
        openContextMenu(e.clientX, e.clientY, row, col);
      });
      el.addEventListener("blur", (e) => {
        const next = (e as FocusEvent).relatedTarget as HTMLElement | null;
        if (next && wrapper.contains(next) && next.dataset && next.dataset.row != null) {
          pendingTableFocus = {
            tableFrom: t.from,
            row: Number(next.dataset.row),
            col: Number(next.dataset.col),
          };
        }
        commitCell(row, col, readCell(el));
      });
      el.addEventListener("paste", (e) => {
        e.preventDefault();
        const plain = (e.clipboardData?.getData("text/plain") || "").replace(/[\r\n]+/g, " ");
        document.execCommand("insertText", false, plain);
      });
      el.addEventListener("keydown", (e) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === "Tab") {
          e.preventDefault();
          const dir = e.shiftKey ? -1 : 1;
          let nr = row, nc = col + dir;
          if (nc >= totalCols) { nc = 0; nr = row + 1; }
          else if (nc < 0) { nc = totalCols - 1; nr = row - 1; }
          moveCellWithText(row, col, readCell(el), nr, nc);
        } else if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          moveCellWithText(row, col, readCell(el), row + 1, col);
        } else if (e.key === "Escape") {
          e.preventDefault();
          el.blur();
        }
      });
      return el;
    };

    const table = document.createElement("table");
    table.className = "cm-md-table";
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    t.headers.forEach((h, c) => hr.appendChild(buildCell("th", 0, c, h)));
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    t.rows.forEach((row, rIdx) => {
      const tr = document.createElement("tr");
      row.forEach((cellText, c) => tr.appendChild(buildCell("td", rIdx + 1, c, cellText)));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);

    // ── Drag handles for row/column reordering ──
    const ROW_TYPE = "application/x-cm-md-table-row";
    const COL_TYPE = "application/x-cm-md-table-col";
    const clearDropIndicators = () => {
      wrapper.querySelectorAll(".cm-md-drop-before, .cm-md-drop-after").forEach((n) => {
        n.classList.remove("cm-md-drop-before", "cm-md-drop-after");
      });
    };

    // Handle visibility controlled per-row / per-col (only show near cursor)
    let hideRowTimer: number | null = null;
    let hideColTimer: number | null = null;
    const showRowHandle = (idx: number) => {
      if (hideRowTimer) { clearTimeout(hideRowTimer); hideRowTimer = null; }
      rowHandles.forEach((h, i) => h.classList.toggle("active", i === idx));
    };
    const hideRowHandles = () => {
      if (hideRowTimer) clearTimeout(hideRowTimer);
      hideRowTimer = window.setTimeout(() => {
        rowHandles.forEach((h) => h.classList.remove("active"));
        hideRowTimer = null;
      }, 80);
    };
    const showColHandle = (idx: number) => {
      if (hideColTimer) { clearTimeout(hideColTimer); hideColTimer = null; }
      colHandles.forEach((h, i) => h.classList.toggle("active", i === idx));
    };
    const hideColHandles = () => {
      if (hideColTimer) clearTimeout(hideColTimer);
      hideColTimer = window.setTimeout(() => {
        colHandles.forEach((h) => h.classList.remove("active"));
        hideColTimer = null;
      }, 80);
    };

    const rowHandles: HTMLElement[] = [];
    t.rows.forEach((_, rIdx) => {
      const h = document.createElement("div");
      h.className = "cm-md-table-drag-handle cm-md-table-row-handle";
      h.draggable = true;
      h.dataset.rowIdx = String(rIdx);
      h.title = "행 (드래그: 이동 / 클릭: 메뉴)";
      h.setAttribute("contenteditable", "false");
      h.textContent = "⋮⋮";
      h.addEventListener("dragstart", (ev) => {
        if (!ev.dataTransfer) return;
        ev.dataTransfer.effectAllowed = "move";
        ev.dataTransfer.setData(ROW_TYPE, String(rIdx));
        h.classList.add("dragging");
      });
      h.addEventListener("dragend", () => {
        h.classList.remove("dragging");
        clearDropIndicators();
      });
      h.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const rect = h.getBoundingClientRect();
        const canAdd = t.rows.length < TABLE_MAX_ROWS;
        showCellContextMenu(rect.right + 4, rect.top, [
          { label: "위에 행 추가", disabled: !canAdd, onSelect: () => insertRowAt(rIdx + 1) },
          { label: "아래에 행 추가", disabled: !canAdd, onSelect: () => insertRowAt(rIdx + 2) },
          "-",
          { label: "행 삭제", onSelect: () => deleteRowAt(rIdx + 1) },
        ]);
      });
      h.addEventListener("mouseenter", () => showRowHandle(rIdx));
      h.addEventListener("mouseleave", hideRowHandles);
      rowHandles.push(h);
      wrapper.appendChild(h);
    });
    const colHandles: HTMLElement[] = [];
    t.headers.forEach((_, cIdx) => {
      const h = document.createElement("div");
      h.className = "cm-md-table-drag-handle cm-md-table-col-handle";
      h.draggable = true;
      h.dataset.colIdx = String(cIdx);
      h.title = "열 (드래그: 이동 / 클릭: 메뉴)";
      h.setAttribute("contenteditable", "false");
      h.textContent = "⋯";
      h.addEventListener("dragstart", (ev) => {
        if (!ev.dataTransfer) return;
        ev.dataTransfer.effectAllowed = "move";
        ev.dataTransfer.setData(COL_TYPE, String(cIdx));
        h.classList.add("dragging");
      });
      h.addEventListener("dragend", () => {
        h.classList.remove("dragging");
        clearDropIndicators();
      });
      h.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const rect = h.getBoundingClientRect();
        const canAdd = totalCols < TABLE_MAX_COLS;
        const canDel = totalCols > 1;
        showCellContextMenu(rect.left, rect.bottom + 4, [
          { label: "왼쪽에 열 추가", disabled: !canAdd, onSelect: () => insertColAt(cIdx) },
          { label: "오른쪽에 열 추가", disabled: !canAdd, onSelect: () => insertColAt(cIdx + 1) },
          "-",
          { label: "열 삭제", disabled: !canDel, onSelect: () => deleteColAt(cIdx) },
        ]);
      });
      h.addEventListener("mouseenter", () => showColHandle(cIdx));
      h.addEventListener("mouseleave", hideColHandles);
      colHandles.push(h);
      wrapper.appendChild(h);
    });

    // Bind row/col hover on actual cells after DOM exists
    Array.from(tbody.children).forEach((tr, rIdx) => {
      tr.addEventListener("mouseenter", () => showRowHandle(rIdx));
      tr.addEventListener("mouseleave", hideRowHandles);
    });
    wrapper.querySelectorAll<HTMLElement>("[data-col]").forEach((cell) => {
      const c = Number(cell.dataset.col);
      cell.addEventListener("mouseenter", () => showColHandle(c));
      cell.addEventListener("mouseleave", hideColHandles);
    });

    // ── End-edge add buttons: + row (bottom) / + col (right) ──
    const addRowEndBtn = document.createElement("button");
    addRowEndBtn.type = "button";
    addRowEndBtn.className = "cm-md-table-add-end cm-md-table-add-row-end";
    addRowEndBtn.title = "행 추가";
    addRowEndBtn.setAttribute("contenteditable", "false");
    addRowEndBtn.textContent = "+";
    addRowEndBtn.disabled = t.rows.length >= TABLE_MAX_ROWS;
    addRowEndBtn.addEventListener("mousedown", (e) => e.preventDefault());
    addRowEndBtn.addEventListener("click", () => insertRowAt(totalRows));
    wrapper.appendChild(addRowEndBtn);

    const addColEndBtn = document.createElement("button");
    addColEndBtn.type = "button";
    addColEndBtn.className = "cm-md-table-add-end cm-md-table-add-col-end";
    addColEndBtn.title = "열 추가";
    addColEndBtn.setAttribute("contenteditable", "false");
    addColEndBtn.textContent = "+";
    addColEndBtn.disabled = totalCols >= TABLE_MAX_COLS;
    addColEndBtn.addEventListener("mousedown", (e) => e.preventDefault());
    addColEndBtn.addEventListener("click", () => insertColAt(totalCols));
    wrapper.appendChild(addColEndBtn);

    wrapper.addEventListener("dragover", (ev) => {
      const dt = ev.dataTransfer;
      if (!dt) return;
      const types = Array.from(dt.types);
      const isRow = types.includes(ROW_TYPE);
      const isCol = types.includes(COL_TYPE);
      if (!isRow && !isCol) return;
      ev.preventDefault();
      dt.dropEffect = "move";
      clearDropIndicators();
      if (isRow) {
        const tr = (ev.target as HTMLElement).closest("tr");
        if (!tr || !tbody.contains(tr)) return;
        const rect = tr.getBoundingClientRect();
        const above = ev.clientY < rect.top + rect.height / 2;
        tr.classList.add(above ? "cm-md-drop-before" : "cm-md-drop-after");
      } else {
        const cell = (ev.target as HTMLElement).closest<HTMLElement>("th, td");
        if (!cell || cell.dataset.col == null) return;
        const rect = cell.getBoundingClientRect();
        const left = ev.clientX < rect.left + rect.width / 2;
        cell.classList.add(left ? "cm-md-drop-before" : "cm-md-drop-after");
      }
    });
    wrapper.addEventListener("dragleave", (ev) => {
      const rel = ev.relatedTarget as Node | null;
      if (rel && wrapper.contains(rel)) return;
      clearDropIndicators();
    });
    wrapper.addEventListener("drop", (ev) => {
      const dt = ev.dataTransfer;
      if (!dt) return;
      const types = Array.from(dt.types);
      const isRow = types.includes(ROW_TYPE);
      const isCol = types.includes(COL_TYPE);
      if (!isRow && !isCol) return;
      ev.preventDefault();
      clearDropIndicators();
      if (isRow) {
        const srcIdx = Number(dt.getData(ROW_TYPE));
        const tr = (ev.target as HTMLElement).closest("tr");
        if (!tr || !tbody.contains(tr)) return;
        const targetIdx = Array.from(tbody.children).indexOf(tr);
        if (targetIdx < 0) return;
        const rect = tr.getBoundingClientRect();
        const above = ev.clientY < rect.top + rect.height / 2;
        let insertAt = above ? targetIdx : targetIdx + 1;
        if (srcIdx < insertAt) insertAt -= 1;
        if (srcIdx === insertAt) return;
        moveRow(srcIdx, insertAt);
      } else {
        const srcIdx = Number(dt.getData(COL_TYPE));
        const cell = (ev.target as HTMLElement).closest<HTMLElement>("th, td");
        if (!cell || cell.dataset.col == null) return;
        const targetIdx = Number(cell.dataset.col);
        const rect = cell.getBoundingClientRect();
        const left = ev.clientX < rect.left + rect.width / 2;
        let insertAt = left ? targetIdx : targetIdx + 1;
        if (srcIdx < insertAt) insertAt -= 1;
        if (srcIdx === insertAt) return;
        moveCol(srcIdx, insertAt);
      }
    });

    const positionHandles = () => {
      const wRect = wrapper.getBoundingClientRect();
      rowHandles.forEach((h, idx) => {
        const tr = tbody.children[idx] as HTMLElement | undefined;
        if (!tr) return;
        const r = tr.getBoundingClientRect();
        h.style.top = `${r.top - wRect.top + r.height / 2 - 10}px`;
      });
      colHandles.forEach((h, idx) => {
        const th = hr.children[idx] as HTMLElement | undefined;
        if (!th) return;
        const r = th.getBoundingClientRect();
        h.style.left = `${r.left - wRect.left + r.width / 2 - 10}px`;
      });
    };

    // FLIP animation for row/col reorder
    const isReordering = pendingTableReorder && pendingTableReorder.tableFrom === t.from;
    if (isReordering) {
      const pr = pendingTableReorder!;
      pendingTableReorder = null;
      // Hide handles during animation
      [...rowHandles, ...colHandles].forEach((h) => { h.style.visibility = "hidden"; });
      queueMicrotask(() => {
        const DURATION = 240;
        if (pr.type === "row") {
          const mapping = computeReorderMapping(pr.fromIdx, pr.toIdx, pr.oldRects.length);
          const newTrs = Array.from(tbody.children) as HTMLElement[];
          newTrs.forEach((tr, newIdx) => {
            const oldIdx = mapping[newIdx];
            const old = pr.oldRects[oldIdx];
            if (!old) return;
            const newRect = tr.getBoundingClientRect();
            const deltaY = old.top - newRect.top;
            if (Math.abs(deltaY) < 1) return;
            tr.style.transition = "none";
            tr.style.transform = `translateY(${deltaY}px)`;
            requestAnimationFrame(() => {
              tr.style.transition = `transform ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
              tr.style.transform = "";
            });
            setTimeout(() => {
              tr.style.transition = "";
              tr.style.transform = "";
            }, DURATION + 40);
          });
        } else {
          const mapping = computeReorderMapping(pr.fromIdx, pr.toIdx, pr.oldRects.length);
          const allRows = [hr, ...Array.from(tbody.children)] as HTMLElement[];
          allRows.forEach((rowEl) => {
            const cells = Array.from(rowEl.children) as HTMLElement[];
            cells.forEach((cell, newIdx) => {
              const oldIdx = mapping[newIdx];
              const old = pr.oldRects[oldIdx];
              if (!old) return;
              const newRect = cell.getBoundingClientRect();
              const deltaX = old.left - newRect.left;
              if (Math.abs(deltaX) < 1) return;
              cell.style.transition = "none";
              cell.style.transform = `translateX(${deltaX}px)`;
              requestAnimationFrame(() => {
                cell.style.transition = `transform ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                cell.style.transform = "";
              });
              setTimeout(() => {
                cell.style.transition = "";
                cell.style.transform = "";
              }, DURATION + 40);
            });
          });
        }
        setTimeout(() => {
          [...rowHandles, ...colHandles].forEach((h) => { h.style.visibility = ""; });
          positionHandles();
        }, DURATION + 40);
      });
    } else {
      requestAnimationFrame(positionHandles);
    }

    const ro = new ResizeObserver(positionHandles);
    ro.observe(wrapper);
    ro.observe(table);
    (wrapper as unknown as { __cmTableRO?: ResizeObserver }).__cmTableRO = ro;

    // Global listeners for selection lifecycle
    const onGlobalMouseUp = () => {
      if (isDraggingSelection) {
        isDraggingSelection = false;
        if (!selectionCrossedCell) {
          selectionAnchor = null;
          selectionFocus = null;
          paintSelection();
        }
      }
    };
    const onGlobalMouseDown = (ev: MouseEvent) => {
      if (!wrapper.contains(ev.target as Node)) clearCellSelection();
    };
    const onGlobalKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && (selectionAnchor || selectionFocus)) {
        clearCellSelection();
      }
    };
    document.addEventListener("mouseup", onGlobalMouseUp);
    document.addEventListener("mousedown", onGlobalMouseDown, true);
    document.addEventListener("keydown", onGlobalKeyDown);
    (wrapper as unknown as { __cmTableCleanups?: Array<() => void> }).__cmTableCleanups = [
      () => document.removeEventListener("mouseup", onGlobalMouseUp),
      () => document.removeEventListener("mousedown", onGlobalMouseDown, true),
      () => document.removeEventListener("keydown", onGlobalKeyDown),
    ];

    if (pendingTableFocus && pendingTableFocus.tableFrom === t.from) {
      const { row, col } = pendingTableFocus;
      pendingTableFocus = null;
      queueMicrotask(() => focusCellAt(row, col));
    }

    return wrapper;
  }

  destroy(dom: HTMLElement): void {
    const ro = (dom as unknown as { __cmTableRO?: ResizeObserver }).__cmTableRO;
    ro?.disconnect();
    const cleanups = (dom as unknown as { __cmTableCleanups?: Array<() => void> }).__cmTableCleanups;
    cleanups?.forEach((fn) => { try { fn(); } catch { /* noop */ } });
  }
}

function buildTableDecorations(
  state: import("@codemirror/state").EditorState,
): DecorationSet {
  try {
    const decs: ReturnType<ReturnType<typeof Decoration.replace>["range"]>[] = [];
    const doc = state.doc;
    let inFence = false;
    let n = 1;
    while (n <= doc.lines) {
      const line = doc.line(n);
      const trimmed = line.text.trim();
      if (trimmed.startsWith("```")) {
        inFence = !inFence;
        n++;
        continue;
      }
      if (!inFence && line.text.includes("|") && n < doc.lines) {
        const l2 = doc.line(n + 1);
        if (isTableSeparator(l2.text)) {
          const data = parseTableAtLine(state, n);
          if (data) {
            // Invisible spacer BEFORE the table for drag-start
            decs.push(
              Decoration.widget({
                widget: new TableEdgeWidget(),
                block: true,
                side: -1,
              }).range(data.from),
            );
            decs.push(
              Decoration.replace({
                widget: new TableWidget(data),
                block: true,
              }).range(data.from, data.to),
            );
            n = doc.lineAt(data.to).number + 1;
            continue;
          }
        }
      }
      n++;
    }
    return Decoration.set(decs, true);
  } catch {
    return Decoration.none;
  }
}

const tableField = StateField.define<DecorationSet>({
  create(state) {
    return buildTableDecorations(state);
  },
  update(value, tr) {
    if (tr.docChanged) return buildTableDecorations(tr.state);
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// Ensure the document always ends with an empty line so the cursor can sit
// after the last block widget (table/image) and users can continue writing.
const ensureTrailingNewline = EditorState.transactionFilter.of((tr) => {
  const newDoc = tr.newDoc;
  if (newDoc.length === 0) return tr;
  const last = newDoc.sliceString(newDoc.length - 1, newDoc.length);
  if (last === "\n") return tr;
  // Compose an append against the post-tr doc length so positions are valid.
  const append = ChangeSet.of(
    { from: newDoc.length, insert: "\n" },
    newDoc.length,
  );
  return {
    changes: tr.changes.compose(append),
    selection: tr.selection,
    effects: tr.effects,
    scrollIntoView: tr.scrollIntoView,
  };
});

const tableAtomicRanges = EditorView.atomicRanges.of((view) => {
  return view.state.field(tableField, false) ?? Decoration.none;
});

const tableDeletionKeymap = Prec.highest(keymap.of([
  {
    key: "Backspace",
    run: (view) => {
      const sel = view.state.selection.main;
      if (!sel.empty) return false;
      const pos = sel.head;
      const field = view.state.field(tableField, false);
      if (!field) return false;
      let target: { from: number; to: number } | null = null;
      field.between(Math.max(0, pos - 1), pos + 1, (from, to) => {
        if (to === pos || (pos > from && pos <= to)) {
          target = { from, to };
          return false;
        }
      });
      if (!target) return false;
      const t = target as { from: number; to: number };
      const startsAtLineStart = t.from === 0 || view.state.doc.sliceString(t.from - 1, t.from) === "\n";
      const from = startsAtLineStart && t.from > 0 ? t.from - 1 : t.from;
      view.dispatch({
        changes: { from, to: t.to, insert: "" },
        selection: { anchor: from },
      });
      return true;
    },
  },
  {
    key: "Delete",
    run: (view) => {
      const sel = view.state.selection.main;
      if (!sel.empty) return false;
      const pos = sel.head;
      const field = view.state.field(tableField, false);
      if (!field) return false;
      let target: { from: number; to: number } | null = null;
      field.between(pos, pos + 1, (from, to) => {
        if (from === pos || (pos >= from && pos < to)) {
          target = { from, to };
          return false;
        }
      });
      if (!target) return false;
      const t = target as { from: number; to: number };
      const endsAtLineEnd = t.to >= view.state.doc.length ||
        view.state.doc.sliceString(t.to, t.to + 1) === "\n";
      const to = endsAtLineEnd && t.to < view.state.doc.length ? t.to + 1 : t.to;
      view.dispatch({
        changes: { from: t.from, to, insert: "" },
        selection: { anchor: t.from },
      });
      return true;
    },
  },
]));

const tableCursorHide = ViewPlugin.fromClass(
  class {
    constructor(view: EditorView) { this.apply(view); }
    update(u: { view: EditorView; docChanged: boolean; selectionSet: boolean }) {
      if (u.selectionSet || u.docChanged) this.apply(u.view);
    }
    apply(view: EditorView) {
      const sel = view.state.selection.main;
      const field = view.state.field(tableField, false);
      if (!field) {
        view.dom.classList.remove("cm-hide-cursor-at-table");
        return;
      }
      let atBoundary = false;
      field.between(Math.max(0, sel.head - 1), sel.head + 1, (from, to) => {
        if (sel.head === from || sel.head === to) {
          atBoundary = true;
          return false;
        }
      });
      view.dom.classList.toggle("cm-hide-cursor-at-table", atBoundary);
    }
  },
);

const tableSelectionOverlay = ViewPlugin.fromClass(
  class {
    constructor(view: EditorView) { this.apply(view); }
    update(u: { view: EditorView; docChanged: boolean; selectionSet: boolean; viewportChanged: boolean }) {
      if (u.selectionSet || u.docChanged || u.viewportChanged) this.apply(u.view);
    }
    apply(view: EditorView) {
      const sel = view.state.selection.main;
      const wrappers = view.dom.querySelectorAll<HTMLElement>(".cm-md-table-wrapper");
      wrappers.forEach((w) => {
        const f = Number(w.dataset.tableFrom);
        const to = Number(w.dataset.tableTo);
        if (!Number.isFinite(f) || !Number.isFinite(to)) return;
        const overlaps = !sel.empty && sel.from <= to && sel.to >= f;
        w.classList.toggle("cm-md-table-selected", overlaps);
      });
    }
  },
);

const imageUploadExtension = EditorView.domEventHandlers({
  paste(event, view) {
    // YouTube URL paste → insert as a standalone paragraph so both the editor
    // preview widget and the rendered post auto-embed it.
    const text = event.clipboardData?.getData("text/plain")?.trim();
    if (text && /^https?:\/\/\S+$/.test(text) && extractYouTubeVideoId(text)) {
      event.preventDefault();
      const pos = view.state.selection.main.head;
      const line = view.state.doc.lineAt(pos);
      const before = view.state.doc.sliceString(line.from, pos);
      const after = view.state.doc.sliceString(pos, line.to);
      const prePad = before.trim() === "" ? "" : "\n\n";
      const postPad = after.trim() === "" ? "\n\n" : "\n\n";
      const insert = `${prePad}${text}${postPad}`;
      const caret = pos + insert.length;
      view.dispatch({
        changes: { from: pos, insert },
        selection: { anchor: caret },
      });
      return true;
    }

    const files = event.clipboardData?.files;
    if (!files?.length) return false;
    const firstImage = Array.from(files).find(isImageFile);
    if (firstImage) {
      event.preventDefault();
      insertImageToEditor(view, firstImage);
      return true;
    }
    return false;
  },
  drop(event, view) {
    const files = event.dataTransfer?.files;
    if (!files?.length) return false;
    const firstImage = Array.from(files).find(isImageFile);
    if (firstImage) {
      event.preventDefault();
      insertImageToEditor(view, firstImage);
      return true;
    }
    return false;
  },
});

type Tag = { id: string; name: string };
type SeriesOption = { id: string; name: string };

type MarkdownEditorProps = {
  postId?: string;
  initialData?: {
    title?: string;
    content?: string;
    tagNames?: string[];
    published?: boolean;
    slug?: string;
    coverImage?: string | null;
    seriesId?: string | null;
  };
  tags: Tag[];
  userSeries?: SeriesOption[];
  seriesLabel?: string | null;
};

const editorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--background) !important",
      color: "var(--foreground) !important",
      fontSize: "1rem",
      lineHeight: "1.75",
    },
    ".cm-content": {
      fontFamily:
        '"Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", sans-serif',
      caretColor: "#7f6df2",
      padding: "0",
      paddingBottom: "50vh",
      backgroundColor: "var(--background) !important",
      minHeight: "60vh",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#7f6df2",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "rgba(127, 109, 242, 0.2) !important",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--active-line)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-placeholder": {
      color: "#94a3b8",
      fontStyle: "normal",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-scroller": {
      overflow: "auto",
      minHeight: "60vh",
    },
    ".cm-line": {
      padding: "1px 0",
    },
    ".cm-codeblock-line": {
      backgroundColor: "var(--card)",
      fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
      fontSize: "0.85rem",
      lineHeight: "1.65",
      borderLeft: "3px solid rgba(127, 109, 242, 0.3)",
      paddingLeft: "12px !important",
    },
  },
  { dark: false }
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

type YTMeta = {
  title: string | null;
  authorName: string | null;
  thumbnailUrl: string | null;
};
const ytMetaCache = new Map<string, YTMeta | "loading" | "error">();
const ytMetaWaiters = new Map<string, Array<(m: YTMeta | null) => void>>();

async function getYTMeta(videoId: string, url: string): Promise<YTMeta | null> {
  const cached = ytMetaCache.get(videoId);
  if (cached && typeof cached === "object") return cached;
  if (cached === "error") return null;
  if (cached === "loading") {
    return new Promise((resolve) => {
      const arr = ytMetaWaiters.get(videoId) ?? [];
      arr.push(resolve);
      ytMetaWaiters.set(videoId, arr);
    });
  }
  ytMetaCache.set(videoId, "loading");
  try {
    const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error("oembed failed");
    const data = await res.json();
    const meta: YTMeta = {
      title: data.title ?? null,
      authorName: data.authorName ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
    };
    ytMetaCache.set(videoId, meta);
    (ytMetaWaiters.get(videoId) ?? []).forEach((fn) => fn(meta));
    ytMetaWaiters.delete(videoId);
    return meta;
  } catch {
    ytMetaCache.set(videoId, "error");
    (ytMetaWaiters.get(videoId) ?? []).forEach((fn) => fn(null));
    ytMetaWaiters.delete(videoId);
    return null;
  }
}

class YouTubeWidget extends WidgetType {
  constructor(
    readonly videoId: string,
    readonly url: string,
    readonly from: number,
    readonly to: number,
  ) {
    super();
  }
  ignoreEvent() {
    return false;
  }
  toDOM() {
    const wrap = document.createElement("div");
    wrap.style.padding = "6px 0";
    wrap.style.maxWidth = "100%";

    const card = document.createElement("div");
    card.style.position = "relative";
    card.style.display = "flex";
    card.style.alignItems = "stretch";
    card.style.gap = "0";
    card.style.border = "1px solid rgba(0,0,0,0.08)";
    card.style.borderRadius = "10px";
    card.style.overflow = "hidden";
    card.style.background = "var(--card)";
    card.style.minHeight = "96px";
    card.style.cursor = "pointer";
    card.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";

    const thumb = document.createElement("div");
    thumb.style.flex = "0 0 160px";
    thumb.style.aspectRatio = "16 / 9";
    thumb.style.position = "relative";
    thumb.style.background = `rgba(0,0,0,0.05) url("https://i.ytimg.com/vi/${this.videoId}/hqdefault.jpg") center/cover no-repeat`;

    const playBadge = document.createElement("div");
    playBadge.style.position = "absolute";
    playBadge.style.inset = "0";
    playBadge.style.display = "flex";
    playBadge.style.alignItems = "center";
    playBadge.style.justifyContent = "center";
    playBadge.style.background = "linear-gradient(to right, rgba(0,0,0,0.05), rgba(0,0,0,0.25))";
    playBadge.innerHTML =
      '<div style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="18" height="18" fill="white" style="margin-left:2px;"><path d="M8 5v14l11-7z"/></svg></div>';
    thumb.appendChild(playBadge);

    const body = document.createElement("div");
    body.style.flex = "1 1 auto";
    body.style.minWidth = "0";
    body.style.padding = "12px 14px";
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.justifyContent = "center";
    body.style.gap = "6px";

    const title = document.createElement("div");
    title.style.fontWeight = "600";
    title.style.fontSize = "14px";
    title.style.lineHeight = "1.4";
    title.style.color = "var(--foreground)";
    title.style.display = "-webkit-box";
    title.style.webkitLineClamp = "2";
    (title.style as any).WebkitBoxOrient = "vertical";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.textContent = this.url;

    const metaRow = document.createElement("div");
    metaRow.style.fontSize = "12px";
    metaRow.style.color = "var(--muted)";
    metaRow.style.display = "flex";
    metaRow.style.alignItems = "center";
    metaRow.style.gap = "6px";
    metaRow.innerHTML =
      '<span style="color:#ff0033;font-weight:700;letter-spacing:-0.02em;">YouTube</span>';

    body.appendChild(title);
    body.appendChild(metaRow);
    card.appendChild(thumb);
    card.appendChild(body);

    // Action buttons (top-right) — data-attrs consumed by youtubeActionHandler.
    const actions = document.createElement("div");
    actions.style.position = "absolute";
    actions.style.top = "6px";
    actions.style.right = "6px";
    actions.style.display = "flex";
    actions.style.gap = "4px";
    actions.style.zIndex = "2";

    const linkIcon =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
    const xIcon =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    const makeAction = (action: "plain" | "delete", innerHTML: string, label: string) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = label;
      btn.setAttribute("aria-label", label);
      btn.dataset.cmYtAction = action;
      btn.dataset.cmYtFrom = String(this.from);
      btn.dataset.cmYtTo = String(this.to);
      btn.dataset.cmYtUrl = this.url;
      btn.dataset.cmYtVideoId = this.videoId;
      btn.style.width = "28px";
      btn.style.height = "28px";
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.borderRadius = "999px";
      btn.style.border = "1px solid rgba(0,0,0,0.08)";
      btn.style.background = "rgba(255,255,255,0.92)";
      btn.style.backdropFilter = "blur(6px)";
      (btn.style as any).WebkitBackdropFilter = "blur(6px)";
      btn.style.color = "#475569";
      btn.style.cursor = "pointer";
      btn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.06)";
      btn.style.transition = "background 0.12s, color 0.12s, transform 0.12s";
      btn.addEventListener("mouseover", () => {
        btn.style.background = "#ffffff";
        btn.style.color = action === "delete" ? "#ef4444" : "#111827";
      });
      btn.addEventListener("mouseout", () => {
        btn.style.background = "rgba(255,255,255,0.92)";
        btn.style.color = "#475569";
      });
      btn.innerHTML = innerHTML;
      return btn;
    };

    actions.appendChild(makeAction("plain", linkIcon, "일반 링크로 변환"));
    actions.appendChild(makeAction("delete", xIcon, "삭제"));
    card.appendChild(actions);

    wrap.appendChild(card);

    // Async fetch + fill; guard against stale updates by checking DOM parentage.
    getYTMeta(this.videoId, this.url).then((meta) => {
      if (!wrap.isConnected) return;
      if (meta?.title) title.textContent = meta.title;
      if (meta?.authorName) {
        const author = document.createElement("span");
        author.textContent = `· ${meta.authorName}`;
        metaRow.appendChild(author);
      }
      if (meta?.thumbnailUrl) {
        thumb.style.backgroundImage = `url("${meta.thumbnailUrl}")`;
      }
    });

    return wrap;
  }
  eq(other: YouTubeWidget) {
    return (
      this.videoId === other.videoId &&
      this.url === other.url &&
      this.from === other.from &&
      this.to === other.to
    );
  }
}

const youtubeActionHandler = EditorView.domEventHandlers({
  mousedown(event, view) {
    const t = event.target as HTMLElement | null;
    if (!t) return false;
    const btn = t.closest("[data-cm-yt-action]") as HTMLElement | null;
    if (!btn) return false;
    const action = btn.dataset.cmYtAction;
    const from = Number(btn.dataset.cmYtFrom);
    const to = Number(btn.dataset.cmYtTo);
    const url = btn.dataset.cmYtUrl ?? "";
    const videoId = btn.dataset.cmYtVideoId ?? "";
    if (!Number.isFinite(from) || !Number.isFinite(to)) return false;

    event.preventDefault();
    event.stopPropagation();

    if (action === "delete") {
      // Remove the URL line and one trailing newline (if any) so no blank gap remains.
      const doc = view.state.doc;
      const end = Math.min(to + 1, doc.length);
      view.dispatch({ changes: { from, to: end, insert: "" } });
      return true;
    }
    if (action === "plain") {
      // Replace standalone URL with a plain markdown link [title](url).
      // Use the cached oEmbed title if we have it; fall back to the URL.
      const cached = ytMetaCache.get(videoId);
      const title =
        cached && typeof cached === "object" && cached.title ? cached.title : url;
      view.dispatch({ changes: { from, to, insert: `[${title}](${url})` } });
      return true;
    }
    return false;
  },
});

function buildYouTubeDecorations(state: import("@codemirror/state").EditorState): DecorationSet {
  try {
    const decs: Array<ReturnType<ReturnType<typeof Decoration.widget>["range"]>> = [];
    const cursorLine = state.doc.lineAt(state.selection.main.head).number;
    const doc = state.doc;
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = line.text.trim();
      if (!text || !/^https?:\/\/\S+$/.test(text)) continue;
      const videoId = extractYouTubeVideoId(text);
      if (!videoId) continue;

      if (i === cursorLine) {
        // Cursor on URL line: keep URL editable, render preview card below.
        decs.push(
          Decoration.widget({
            widget: new YouTubeWidget(videoId, text, line.from, line.to),
            block: true,
            side: 1,
          }).range(line.to),
        );
      } else {
        // Cursor elsewhere: replace the URL line with the preview card.
        decs.push(
          Decoration.replace({
            widget: new YouTubeWidget(videoId, text, line.from, line.to),
            block: true,
          }).range(line.from, line.to),
        );
      }
    }
    return Decoration.set(decs, true);
  } catch {
    return Decoration.none;
  }
}

const youtubePreviewField = StateField.define<DecorationSet>({
  create(state) {
    return buildYouTubeDecorations(state);
  },
  update(value, tr) {
    if (tr.docChanged || tr.selection) {
      return buildYouTubeDecorations(tr.state);
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const markdownHighlighting = HighlightStyle.define([
  { tag: tags.heading1, fontSize: "1.8em", fontWeight: "700", color: "var(--heading)" },
  { tag: tags.heading2, fontSize: "1.4em", fontWeight: "700", color: "var(--heading)" },
  { tag: tags.heading3, fontSize: "1.2em", fontWeight: "600", color: "var(--heading)" },
  { tag: tags.heading4, fontSize: "1.1em", fontWeight: "600", color: "var(--heading)" },
  { tag: tags.strong, fontWeight: "700", color: "var(--strong)" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--muted)" },
  { tag: tags.link, color: "var(--link)" },
  { tag: tags.url, color: "var(--primary)" },
  {
    tag: tags.monospace,
    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
    color: "var(--inline-code-fg)",
    backgroundColor: "var(--inline-code-bg)",
    borderRadius: "3px",
  },
  { tag: tags.quote, color: "var(--muted)", fontStyle: "italic" },
  { tag: tags.processingInstruction, color: "var(--muted)" },
  { tag: tags.meta, color: "var(--muted)" },
  { tag: tags.contentSeparator, color: "var(--muted)" },
  { tag: tags.list, color: "var(--muted)" },

  // Code syntax highlighting (matches globals.css hljs theme, token-driven)
  { tag: tags.keyword, color: "var(--code-keyword)", fontWeight: "600" },
  { tag: tags.operator, color: "var(--code-keyword)" },
  { tag: tags.definitionKeyword, color: "var(--code-keyword)", fontWeight: "600" },
  { tag: tags.controlKeyword, color: "var(--code-keyword)", fontWeight: "600" },
  { tag: tags.moduleKeyword, color: "var(--code-keyword)", fontWeight: "600" },
  { tag: tags.function(tags.definition(tags.variableName)), color: "var(--code-function)" },
  { tag: tags.function(tags.variableName), color: "var(--code-function)" },
  { tag: tags.definition(tags.className), color: "var(--code-function)" },
  { tag: tags.definition(tags.typeName), color: "var(--code-function)" },
  { tag: tags.typeName, color: "var(--code-number)" },
  { tag: tags.className, color: "var(--code-function)" },
  { tag: tags.string, color: "var(--code-string)" },
  { tag: tags.special(tags.string), color: "var(--code-string)" },
  { tag: tags.regexp, color: "var(--code-string)" },
  { tag: tags.number, color: "var(--code-number)" },
  { tag: tags.bool, color: "var(--code-number)" },
  { tag: tags.null, color: "var(--code-number)" },
  { tag: tags.variableName, color: "var(--foreground)" },
  { tag: tags.propertyName, color: "var(--code-variable)" },
  { tag: tags.definition(tags.propertyName), color: "var(--code-variable)" },
  { tag: tags.comment, color: "var(--code-comment)", fontStyle: "italic" },
  { tag: tags.lineComment, color: "var(--code-comment)", fontStyle: "italic" },
  { tag: tags.blockComment, color: "var(--code-comment)", fontStyle: "italic" },
  { tag: tags.docComment, color: "var(--code-comment)", fontStyle: "italic" },
  { tag: tags.tagName, color: "var(--code-keyword)" },
  { tag: tags.attributeName, color: "var(--code-number)" },
  { tag: tags.attributeValue, color: "var(--code-string)" },
  { tag: tags.atom, color: "var(--code-number)" },
  { tag: tags.self, color: "var(--code-keyword)" },
  { tag: tags.inserted, color: "var(--code-inserted)" },
  { tag: tags.deleted, color: "var(--code-deleted)" },
]);

const editorExtensions = [
  markdown({ base: markdownLanguage, codeLanguages: languages }),
  EditorView.lineWrapping,
  syntaxHighlighting(markdownHighlighting),
  codeBlockPlugin,
  imagePreviewField,
  youtubePreviewField,
  youtubeActionHandler,
  tableField,
  tableAtomicRanges,
  tableSelectionOverlay,
  tableCursorHide,
  tableDeletionKeymap,
  ensureTrailingNewline,
  imageUploadExtension,
];

export function MarkdownEditor({
  postId,
  initialData,
  tags: availableTags,
  userSeries = [],
  seriesLabel = null,
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
  const [guideOpen, setGuideOpen] = useState(false);
  const [wikiMenu, setWikiMenu] = useState<{
    x: number;
    y: number;
    from: number; // position of first "[" in "[["
    query: string;
  } | null>(null);
  const [tablePicker, setTablePicker] = useState<{
    x: number;
    y: number;
    from: number;
    to: number;
  } | null>(null);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const seriesDropdownRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const tableButtonRef = useRef<HTMLButtonElement>(null);
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
    const firstImage = Array.from(files).find(isImageFile);
    if (firstImage) {
      insertImageToEditor(editorRef.current.view, firstImage);
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
    // Skip while IME composition is active (macOS Korean input duplication fix)
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
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

  // ── Wiki-link menu detection ──
  const handleEditorUpdate = useCallback((vu: { view: EditorView }) => {
    const view = vu.view;
    const sel = view.state.selection.main;
    if (!sel.empty) {
      setWikiMenu(null);
      return;
    }
    const cursor = sel.head;
    const line = view.state.doc.lineAt(cursor);
    const beforeCursor = line.text.slice(0, cursor - line.from);

    const MENU_H = 320;
    const flipY = (top: number, bottom: number) =>
      bottom + MENU_H + 8 > window.innerHeight && top - MENU_H - 8 > 0
        ? top - MENU_H - 8
        : bottom + 4;

    const wiki = beforeCursor.match(/\[\[([^\[\]\n]*)$/);
    if (wiki) {
      const bracketOffset = beforeCursor.lastIndexOf("[[");
      const from = line.from + bracketOffset;
      const coords = view.coordsAtPos(from);
      if (coords) {
        setWikiMenu({
          x: coords.left,
          y: flipY(coords.top, coords.bottom),
          from,
          query: wiki[1],
        });
        return;
      }
    }
    setWikiMenu(null);
  }, []);

  const handleWikiSelect = useCallback(
    (item: WikiSuggestion) => {
      const view = editorRef.current?.view;
      if (!view || !wikiMenu) return;
      const cursor = view.state.selection.main.head;
      const insert = `[[${item.slug}]]`;
      view.dispatch({
        changes: { from: wikiMenu.from, to: cursor, insert },
        selection: { anchor: wikiMenu.from + insert.length },
      });
      setWikiMenu(null);
      view.focus();
    },
    [wikiMenu],
  );

  const handleTableInsert = useCallback(
    (rows: number, cols: number) => {
      const view = editorRef.current?.view;
      if (!view || !tablePicker) return;
      const md = buildTableMarkdown(rows, cols);
      const lineAtFrom = view.state.doc.lineAt(tablePicker.from);
      const beforeOnLine = view.state.doc.sliceString(lineAtFrom.from, tablePicker.from);
      const needsBlock = beforeOnLine.trim() !== "";
      const prefix = needsBlock ? "\n\n" : "";
      view.dispatch({
        changes: { from: tablePicker.from, to: tablePicker.to, insert: prefix + md },
        selection: { anchor: tablePicker.from + prefix.length + md.length },
      });
      setTablePicker(null);
      view.focus();
    },
    [tablePicker],
  );

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
    if (!title && !content) return;

    // localStorage only — no server draft creation
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
      savedRef.current = {
        title,
        content,
        tags: [...selectedTags],
        coverImage: coverImage ?? null,
        seriesId: selectedSeriesId,
      };
      setAutoSaveStatus("saved");
      setLastSavedAt(new Date());
    } catch {
      setAutoSaveStatus("error");
    }
  }, [title, content, selectedTags, coverImage, selectedSeriesId, backupKey]);

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
      className="fixed inset-0 z-50 flex flex-col bg-background"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3 p-10 rounded-2xl border-2 border-dashed border-primary/60 bg-black/[0.03] dark:bg-white/[0.03]">
            <span className="material-symbols-outlined text-5xl text-primary/80">upload</span>
            <p className="text-sm font-medium text-gray-600 dark:text-slate-300">이미지를 여기에 놓아주세요</p>
            <p className="text-xs text-slate-500">JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      )}

      {/* Top bar — 3 columns: left (back) / center (actions) / right (status + publish) */}
      <div className="grid grid-cols-3 items-center gap-2 px-3 sm:px-5 h-14 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0 overflow-hidden">
        <div className="flex items-center justify-self-start">
          <Link
            href={postId && initialData?.slug ? `/posts/${initialData.slug}` : "/"}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="hidden sm:inline">나가기</span>
          </Link>
        </div>

        <div className="flex items-center gap-0.5 min-w-0 overflow-x-auto no-scrollbar [justify-content:safe_center]">
          {/* Headings */}
          <button type="button" title="제목 1" onClick={() => { const v = editorRef.current?.view; if (v) setHeadingLevel(v, 1); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">format_h1</span>
          </button>
          <button type="button" title="제목 2" onClick={() => { const v = editorRef.current?.view; if (v) setHeadingLevel(v, 2); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">format_h2</span>
          </button>
          <button type="button" title="제목 3" onClick={() => { const v = editorRef.current?.view; if (v) setHeadingLevel(v, 3); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">format_h3</span>
          </button>

          <div className="w-px h-4 bg-black/[0.08] dark:bg-white/[0.08] mx-1 shrink-0" />

          {/* Inline marks */}
          <button type="button" title="굵게" onClick={() => { const v = editorRef.current?.view; if (v) toggleInlineMark(v, "**"); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">format_bold</span>
          </button>
          <button type="button" title="기울임" onClick={() => { const v = editorRef.current?.view; if (v) toggleInlineMark(v, "*"); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">format_italic</span>
          </button>
          <button type="button" title="취소선" onClick={() => { const v = editorRef.current?.view; if (v) toggleInlineMark(v, "~~"); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">strikethrough_s</span>
          </button>
          <button type="button" title="인라인 코드" onClick={() => { const v = editorRef.current?.view; if (v) toggleInlineMark(v, "`"); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">code</span>
          </button>
          <button type="button" title="링크" onClick={() => { const v = editorRef.current?.view; if (v) insertLink(v); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">link</span>
          </button>

          <div className="w-px h-4 bg-black/[0.08] dark:bg-white/[0.08] mx-1 shrink-0" />

          {/* Lists */}
          <button type="button" title="목록" onClick={() => { const v = editorRef.current?.view; if (v) toggleLinePrefix(v, "- "); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
          </button>
          <button type="button" title="번호 목록" onClick={() => { const v = editorRef.current?.view; if (v) toggleLinePrefix(v, "1. "); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
          </button>
          <button type="button" title="할 일" onClick={() => { const v = editorRef.current?.view; if (v) toggleLinePrefix(v, "- [ ] "); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">check_box</span>
          </button>

          <div className="w-px h-4 bg-black/[0.08] dark:bg-white/[0.08] mx-1 shrink-0" />

          {/* Blocks */}
          <button type="button" title="인용" onClick={() => { const v = editorRef.current?.view; if (v) toggleLinePrefix(v, "> "); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">format_quote</span>
          </button>
          <button type="button" title="코드 블록" onClick={() => { const v = editorRef.current?.view; if (v) insertBlockAtCursor(v, "```ts\n\n```", 6); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">data_object</span>
          </button>
          <button type="button" title="구분선" onClick={() => { const v = editorRef.current?.view; if (v) insertBlockAtCursor(v, "---\n"); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">horizontal_rule</span>
          </button>

          <div className="w-px h-4 bg-black/[0.08] dark:bg-white/[0.08] mx-1 shrink-0" />

          {/* Inserts */}
          <button
            ref={tableButtonRef}
            type="button"
            title="표"
            onClick={() => {
              const view = editorRef.current?.view;
              const btn = tableButtonRef.current;
              if (!view || !btn) return;
              const rect = btn.getBoundingClientRect();
              const pos = view.state.selection.main.head;
              setTablePicker({ x: rect.left, y: rect.bottom + 4, from: pos, to: pos });
            }}
            className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
          </button>
          <button type="button" title="이미지" onClick={() => fileInputRef.current?.click()} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">image</span>
          </button>
          <button type="button" title="수식" onClick={() => { const v = editorRef.current?.view; if (v) insertBlockAtCursor(v, "$$\n\n$$", 3); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">function</span>
          </button>
          <button type="button" title="다이어그램" onClick={() => { const v = editorRef.current?.view; if (v) insertBlockAtCursor(v, "```mermaid\nflowchart LR\n  A --> B\n```"); }} className="size-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">schema</span>
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
        </div>

        <div className="flex items-center justify-self-end gap-3">
          {autoSaveStatus === "saving" && (
            <span className="hidden md:inline text-[11px] text-slate-600 whitespace-nowrap">저장 중...</span>
          )}
          {autoSaveStatus === "saved" && lastSavedAt && (
            <span className="hidden md:inline text-[11px] text-slate-600 whitespace-nowrap">
              자동 저장됨 ({lastSavedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })})
            </span>
          )}
          {autoSaveStatus === "error" && (
            <span className="hidden md:inline text-[11px] text-red-400 whitespace-nowrap">
              저장 실패{retryCount.current < 3 ? " · 재시도 중..." : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="마크다운 가이드"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isPending || title.trim().length < 2 || !content}
            className="h-8 px-4 rounded-full bg-primary hover:bg-primary/80 text-white dark:text-white text-xs font-medium transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {isPending ? "저장 중..." : "발행"}
          </button>
        </div>
      </div>

      {/* Scrollable editor area — desk */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f1f1f1] dark:bg-[#181818]">
        {/* Cover image — on the desk, above the paper (matches paper width) */}
        <div className="max-w-[960px] mx-auto pt-6 sm:pt-10">
          {coverImage ? (
            <div className="relative group w-full rounded-xl overflow-hidden">
              <img
                src={coverImage}
                alt="표지 이미지"
                className="w-full object-cover h-[260px] sm:h-[420px]"
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
              className="w-full h-[140px] sm:h-[180px] rounded-xl border border-dashed border-black/[0.12] dark:border-white/[0.12] hover:border-black/25 dark:hover:border-white/25 flex items-center justify-center gap-2 text-slate-600 hover:text-slate-400 transition-all disabled:opacity-40"
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

        {/* Paper sheet — minimum A4 ratio (210:297), grows with content */}
        <div className="max-w-[960px] mx-auto mt-4 mb-6 sm:mb-10 px-6 sm:px-14 py-10 sm:py-14 space-y-4 min-w-0 aspect-[210/297] bg-background shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_24px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)] rounded-sm">
          {/* Title */}
          <input
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editorRef.current?.view?.focus();
              }
            }}
            className="w-full text-4xl font-bold bg-transparent border-none outline-none leading-tight"
            style={{ color: "var(--heading)" }}
            autoFocus
          />

          {/* Tags */}
          <div className="relative">
            <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
              {selectedTags.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-black/[0.06] dark:bg-white/[0.06] text-slate-400 text-xs rounded-md"
                >
                  #{name}
                  <button
                    type="button"
                    onClick={() => removeTag(name)}
                    aria-label={`${name} 태그 제거`}
                    className="inline-flex items-center justify-center size-3.5 rounded-sm text-slate-500 hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M2 2 L8 8 M8 2 L2 8" />
                    </svg>
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
                className="flex-1 min-w-[80px] bg-transparent text-xs outline-none placeholder:text-gray-400 dark:placeholder:text-slate-600 text-slate-400"
              />
            </div>

            {showSuggestions && tagInput && filteredTags.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 top-full left-0 mt-1 bg-white dark:bg-[#2a2a2a] border border-black/[0.08] dark:border-white/[0.08] rounded-lg shadow-xl max-h-40 overflow-y-auto min-w-[180px]"
              >
                {filteredTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => addTag(tag.name)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span className="text-slate-600 mr-1">#</span>
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 시리즈 라벨 (읽기 전용, 시리즈 상세 페이지에서 작성 시작 시) */}
          {seriesLabel && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="material-symbols-outlined text-[14px] text-primary">
                book_2
              </span>
              <span className="text-gray-700 dark:text-slate-300">
                시리즈 <strong className="font-semibold">{seriesLabel}</strong>에 작성 중
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-black/[0.04] dark:border-white/[0.04]" />

          {/* CodeMirror Editor */}
          <CodeMirror
            ref={editorRef}
            value={content}
            onChange={handleContentChange}
            onUpdate={handleEditorUpdate}
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
              autocompletion: false, // handled by our extension (wiki-link only)
              indentOnInput: true,
            }}
          />
        </div>
      </div>

      {wikiMenu && (
        <WikiLinkMenu
          position={{ x: wikiMenu.x, y: wikiMenu.y }}
          query={wikiMenu.query}
          onSelect={handleWikiSelect}
          onClose={() => setWikiMenu(null)}
        />
      )}

      {tablePicker && (
        <TableSizePicker
          position={{ x: tablePicker.x, y: tablePicker.y }}
          onSelect={handleTableInsert}
          onClose={() => setTablePicker(null)}
        />
      )}

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
      />

      <MarkdownGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onInsertSample={(sample) => {
          const view = editorRef.current?.view;
          if (!view) {
            setContent((c) => (c ? c + "\n\n" + sample : sample));
            return;
          }
          const pos = view.state.doc.length;
          const insert = (pos > 0 ? "\n\n" : "") + sample;
          view.dispatch({
            changes: { from: pos, insert },
            selection: { anchor: pos + insert.length },
          });
          view.focus();
        }}
      />
    </div>
  );
}
