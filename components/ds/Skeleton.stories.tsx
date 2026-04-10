import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "DS/Skeleton",
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    variant: "text",
    width: 200,
  },
};

export const Circle: Story = {
  args: {
    variant: "circle",
    width: 48,
  },
};

export const Rect: Story = {
  args: {
    variant: "rect",
    width: 320,
  },
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <Skeleton variant="rect" />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" />
      <div className="flex items-center gap-3 mt-1">
        <Skeleton variant="circle" width={32} />
        <Skeleton variant="text" width={100} />
      </div>
    </div>
  ),
};
