import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta = {
  title: "DS/Avatar",
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInitial: Story = {
  args: { initial: "A", size: "md" },
};

export const WithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/150?img=3",
    initial: "J",
    size: "md",
  },
};

export const ExtraSmall: Story = {
  args: { initial: "X", size: "xs" },
};

export const Small: Story = {
  args: { initial: "S", size: "sm" },
};

export const Medium: Story = {
  args: { initial: "M", size: "md" },
};

export const Large: Story = {
  args: { initial: "L", size: "lg" },
};

export const ExtraLarge: Story = {
  args: { initial: "XL", size: "xl" },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar initial="X" size="xs" />
      <Avatar initial="S" size="sm" />
      <Avatar initial="M" size="md" />
      <Avatar initial="L" size="lg" />
      <Avatar initial="XL" size="xl" />
    </div>
  ),
};

export const AllSizesWithImage: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar src="https://i.pravatar.cc/150?img=3" initial="J" size="xs" />
      <Avatar src="https://i.pravatar.cc/150?img=3" initial="J" size="sm" />
      <Avatar src="https://i.pravatar.cc/150?img=3" initial="J" size="md" />
      <Avatar src="https://i.pravatar.cc/150?img=3" initial="J" size="lg" />
      <Avatar src="https://i.pravatar.cc/150?img=3" initial="J" size="xl" />
    </div>
  ),
};
