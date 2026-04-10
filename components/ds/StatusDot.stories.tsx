import type { Meta, StoryObj } from "@storybook/react";
import { StatusDot } from "./StatusDot";

const meta = {
  title: "DS/StatusDot",
  component: StatusDot,
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { status: "success", label: "Online" },
};

export const Warning: Story = {
  args: { status: "warning", label: "Away" },
};

export const Danger: Story = {
  args: { status: "danger", label: "Offline" },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusDot status="success" label="Online" />
      <StatusDot status="warning" label="Away" />
      <StatusDot status="danger" label="Offline" />
    </div>
  ),
};
