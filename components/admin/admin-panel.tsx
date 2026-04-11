"use client";

import { useState } from "react";
import { UserManagement } from "./user-management";
import { PostManagement } from "./post-management";
import { Tabs } from "@/components/ds";

const tabItems = [
  { key: "users", label: "유저 관리", icon: "group" },
  { key: "posts", label: "게시글 관리", icon: "article" },
];

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div>
      <Tabs
        items={tabItems}
        activeKey={activeTab}
        onChange={setActiveTab}
        variant="underline"
        className="mb-6"
      />

      {activeTab === "users" && <UserManagement />}
      {activeTab === "posts" && <PostManagement />}
    </div>
  );
}
