"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getUsers,
  suspendUser,
  unsuspendUser,
  deleteUser,
  adminSendPasswordReset,
  changeUserRole,
} from "@/actions/admin";
import { ConfirmModal } from "@/components/shared/confirm-modal";

type User = {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  role: string;
  suspended: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  _count: { posts: number; comments: number };
};

type AssignableRole = "READER" | "WRITER" | "ADMIN";

type ModalAction = {
  type: "delete" | "suspend" | "password" | "role";
  user: User;
  newRole?: AssignableRole;
};

function roleBadgeClass(role: string) {
  if (role === "SUPER_ADMIN") return "bg-amber-500/10 text-amber-400";
  if (role === "ADMIN") return "bg-primary/10 text-primary";
  if (role === "WRITER") return "bg-emerald-500/10 text-emerald-400";
  return "bg-white/[0.06] text-[#dcddde]/60";
}

export function UserManagement({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalAction | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = useCallback(() => {
    startTransition(async () => {
      const result = await getUsers(page, search);
      setUsers(result.users as User[]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    });
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function getUserLabel(user: User) {
    return user.email || user.username || user.name || user.id;
  }

  async function handleConfirm() {
    if (!modal) return;
    setModalLoading(true);

    const { type, user } = modal;

    if (type === "delete") {
      const result = await deleteUser(user.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("유저가 삭제되었습니다");
        fetchUsers();
      }
    } else if (type === "suspend") {
      if (user.suspended) {
        const result = await unsuspendUser(user.id);
        if (result.success) {
          toast.success("정지가 해제되었습니다");
          fetchUsers();
        }
      } else {
        const result = await suspendUser(user.id);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success("유저가 정지되었습니다");
          fetchUsers();
        }
      }
    } else if (type === "password") {
      const result = await adminSendPasswordReset(user.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("비밀번호 변경 메일이 발송되었습니다");
      }
    } else if (type === "role" && modal.newRole) {
      const result = await changeUserRole(user.id, modal.newRole);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`역할이 ${modal.newRole}로 변경되었습니다`);
        fetchUsers();
      }
    }

    setModalLoading(false);
    setModal(null);
  }

  function getModalProps() {
    if (!modal) return null;
    const { type, user } = modal;
    const label = getUserLabel(user);

    if (type === "delete") {
      return {
        title: "유저 삭제",
        description: `${label} 유저를 정말 삭제하시겠습니까? 이 유저의 모든 게시글, 댓글, 좋아요 등 데이터가 영구적으로 삭제됩니다.`,
        confirmText: "삭제",
        requiredInput: label,
      };
    }
    if (type === "suspend") {
      if (user.suspended) {
        return {
          title: "정지 해제",
          description: `${label} 유저의 정지를 해제하시겠습니까? 해제 후 다시 로그인할 수 있게 됩니다.`,
          confirmText: "해제",
          requiredInput: label,
        };
      }
      return {
        title: "유저 정지",
        description: `${label} 유저를 정지하시겠습니까? 정지된 유저는 로그인할 수 없습니다.`,
        confirmText: "정지",
        requiredInput: label,
      };
    }
    if (type === "password") {
      return {
        title: "비밀번호 변경 메일 발송",
        description: `${label} 유저에게 비밀번호 변경 메일을 발송하시겠습니까?`,
        confirmText: "발송",
        requiredInput: label,
      };
    }
    if (type === "role" && modal.newRole) {
      return {
        title: "역할 변경",
        description: `${label} 유저의 역할을 ${modal.newRole}(으)로 변경하시겠습니까?`,
        confirmText: "변경",
        requiredInput: label,
      };
    }
    return null;
  }

  const modalProps = getModalProps();

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="이름, 이메일, 사용자명 검색..."
          className="flex-1 h-10 px-3 rounded-lg border border-white/[0.06] bg-white/[0.04] text-sm text-[#dcddde] placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <button
          type="submit"
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors"
        >
          검색
        </button>
      </form>

      <p className="text-sm text-[#dcddde]/50 mb-4">총 {total}명</p>

      <div className="border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">유저</th>
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">역할</th>
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">상태</th>
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">활동</th>
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">가입일</th>
                <th className="text-right px-4 py-3 text-[#dcddde]/50 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className={isPending ? "opacity-50" : ""}>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-[#dcddde] font-medium">
                        {user.name || "이름 없음"}
                      </p>
                      <p className="text-[#dcddde]/40 text-xs">
                        {user.username ? `@${user.username}` : user.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isSuperAdmin && user.role !== "SUPER_ADMIN" ? (
                      <div className="relative group inline-block">
                        <button className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${roleBadgeClass(user.role)}`}>
                          {user.role}
                          <span className="material-symbols-outlined text-[12px] opacity-50">
                            expand_more
                          </span>
                        </button>
                        <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-card border border-white/[0.08] rounded-lg shadow-xl py-1 min-w-[100px]">
                          {(["READER", "WRITER", "ADMIN"] as AssignableRole[])
                            .filter((r) => r !== user.role)
                            .map((r) => (
                              <button
                                key={r}
                                onClick={() =>
                                  setModal({ type: "role", user, newRole: r })
                                }
                                className="w-full text-left px-3 py-1.5 text-xs text-[#dcddde]/70 hover:bg-white/[0.06] hover:text-[#dcddde] transition-colors"
                              >
                                {r}
                              </button>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.suspended ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-400">
                        <span className="material-symbols-outlined text-[14px]">block</span>
                        정지됨
                      </span>
                    ) : !user.emailVerified ? (
                      <span className="text-xs text-yellow-400">미인증</span>
                    ) : (
                      <span className="text-xs text-emerald-400">정상</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#dcddde]/50 text-xs">
                    글 {user._count.posts} · 댓글 {user._count.comments}
                  </td>
                  <td className="px-4 py-3 text-[#dcddde]/40 text-xs">
                    {format(new Date(user.createdAt), "yyyy.MM.dd")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal({ type: "suspend", user })}
                        title={user.suspended ? "정지 해제" : "정지"}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#dcddde]/50 hover:text-[#dcddde] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {user.suspended ? "lock_open" : "block"}
                        </span>
                      </button>
                      <button
                        onClick={() => setModal({ type: "password", user })}
                        title="비밀번호 변경 메일"
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#dcddde]/50 hover:text-[#dcddde] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          mail
                        </span>
                      </button>
                      <button
                        onClick={() => setModal({ type: "delete", user })}
                        title="삭제"
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#dcddde]/50 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !isPending && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#dcddde]/30">
                    유저가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 px-3 rounded-lg text-sm text-[#dcddde]/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
          >
            이전
          </button>
          <span className="text-sm text-[#dcddde]/40">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 px-3 rounded-lg text-sm text-[#dcddde]/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
          >
            다음
          </button>
        </div>
      )}

      {modalProps && (
        <ConfirmModal
          open={!!modal}
          onClose={() => setModal(null)}
          onConfirm={handleConfirm}
          title={modalProps.title}
          description={modalProps.description}
          confirmText={modalProps.confirmText}
          requiredInput={modalProps.requiredInput}
          loading={modalLoading}
        />
      )}
    </div>
  );
}
