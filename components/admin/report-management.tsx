"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { getReports, resolveReport, getSpamFilters, addSpamFilter, deleteSpamFilter } from "@/actions/report";
import { Button, Input, Badge } from "@/components/ds";

type Report = {
  id: string;
  type: "POST" | "COMMENT";
  targetId: string;
  reason: string;
  status: string;
  createdAt: Date;
  reporter: { name: string | null; username: string | null };
  targetTitle: string;
  targetContent: string;
};

type SpamFilter = {
  id: string;
  pattern: string;
  createdAt: Date;
};

export function ReportManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filters, setFilters] = useState<SpamFilter[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"reports" | "filters">("reports");

  const loadReports = useCallback(() => {
    startTransition(async () => {
      const data = await getReports();
      setReports(data.reports as Report[]);
    });
  }, []);

  const loadFilters = useCallback(() => {
    startTransition(async () => {
      const data = await getSpamFilters();
      setFilters(data as SpamFilter[]);
    });
  }, []);

  useEffect(() => {
    loadReports();
    loadFilters();
  }, [loadReports, loadFilters]);

  function handleResolve(reportId: string, action: "dismiss" | "addFilter") {
    startTransition(async () => {
      const result = await resolveReport(reportId, action);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(action === "dismiss" ? "신고를 기각했습니다" : "필터에 추가하고 콘텐츠를 삭제했습니다");
        loadReports();
        loadFilters();
      }
    });
  }

  function handleAddFilter(e: React.FormEvent) {
    e.preventDefault();
    if (!newPattern.trim()) return;
    startTransition(async () => {
      const result = await addSpamFilter(newPattern);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("필터가 추가되었습니다");
        setNewPattern("");
        loadFilters();
      }
    });
  }

  function handleDeleteFilter(id: string) {
    startTransition(async () => {
      const result = await deleteSpamFilter(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("필터가 삭제되었습니다");
        loadFilters();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={tab === "reports" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setTab("reports")}
        >
          신고 ({reports.length})
        </Button>
        <Button
          variant={tab === "filters" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setTab("filters")}
        >
          스팸 필터 ({filters.length})
        </Button>
      </div>

      {tab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-[#dcddde]/40 py-8 text-center">
              대기 중인 신고가 없습니다
            </p>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={r.type === "POST" ? "info" : "neutral"}>
                    {r.type === "POST" ? "글" : "댓글"}
                  </Badge>
                  <span className="text-xs text-gray-400 dark:text-[#dcddde]/30">
                    신고자: {r.reporter.name || r.reporter.username}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-[#dcddde]/70">
                  <span className="font-medium">사유:</span> {r.reason}
                </p>
                <p className="text-xs text-gray-400 dark:text-[#dcddde]/40 truncate">
                  {r.type === "POST" ? r.targetTitle : r.targetContent}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleResolve(r.id, "addFilter")}
                    disabled={isPending}
                  >
                    필터 추가 + 삭제
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResolve(r.id, "dismiss")}
                    disabled={isPending}
                  >
                    기각
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "filters" && (
        <div className="space-y-4">
          <form onSubmit={handleAddFilter} className="flex gap-2">
            <Input
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              placeholder="차단할 키워드"
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!newPattern.trim() || isPending}>
              추가
            </Button>
          </form>
          <div className="space-y-1">
            {filters.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-[#dcddde]/40 py-4 text-center">
                등록된 필터가 없습니다
              </p>
            ) : (
              filters.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                >
                  <code className="text-sm text-gray-600 dark:text-[#dcddde]/70">{f.pattern}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    onClick={() => handleDeleteFilter(f.id)}
                    disabled={isPending}
                    className="hover:text-red-400"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
