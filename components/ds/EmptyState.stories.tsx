import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "DS/EmptyState",
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: "inbox",
    message: "No items found",
  },
};

export const NoPosts: Story = {
  args: {
    icon: "article",
    message: "No posts yet. Start writing your first post!",
  },
};

export const NoResults: Story = {
  args: {
    icon: "search_off",
    message: "No results match your search.",
  },
};
