import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./Tabs";

const meta = {
  title: "DS/Tabs",
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
];

const itemsWithIcons = [
  { key: "all", label: "All", icon: "apps" },
  { key: "published", label: "Published", icon: "check_circle" },
  { key: "draft", label: "Draft", icon: "edit_note" },
];

export const Pill: Story = {
  args: {
    items,
    activeKey: "all",
    variant: "pill",
  },
};

export const Underline: Story = {
  args: {
    items,
    activeKey: "published",
    variant: "underline",
  },
};

export const WithIcons: Story = {
  args: {
    items: itemsWithIcons,
    activeKey: "all",
    variant: "pill",
  },
};

export const UnderlineWithIcons: Story = {
  args: {
    items: itemsWithIcons,
    activeKey: "draft",
    variant: "underline",
  },
};
