import type { Meta, StoryObj } from "@storybook/react";
import { Tag } from "./Tag";

const meta = {
  title: "DS/Tag",
  component: Tag,
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "React" },
};

export const Active: Story = {
  args: { children: "React", active: true },
};

export const Clickable: Story = {
  args: { children: "Next.js", onClick: () => alert("clicked") },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Tag>React</Tag>
      <Tag>TypeScript</Tag>
      <Tag active>Next.js</Tag>
      <Tag>TailwindCSS</Tag>
      <Tag active>Storybook</Tag>
    </div>
  ),
};
