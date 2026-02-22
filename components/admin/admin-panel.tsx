"use client";

import { useState } from "react";
import { UserManagement } from "./user-management";
import { PostManagement } from "./post-management";

const tabs = [
  { id: "users", label: "유저 관리", icon: "group" },
  { id: "posts", label: "게시글 관리", icon: "article" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function AdminPanel({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-white/[0.08]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-[#dcddde]/50 hover:text-[#dcddde]/80"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && <UserManagement isSuperAdmin={isSuperAdmin} />}
      {activeTab === "posts" && <PostManagement />}
    </div>
  );
}
