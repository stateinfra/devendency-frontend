import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta = {
  title: "DS/Badge",
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary", children: "Primary" },
};

export const Success: Story = {
  args: { variant: "success", children: "Success" },
};

export const Warning: Story = {
  args: { variant: "warning", children: "Warning" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Danger" },
};

export const Info: Story = {
  args: { variant: "info", children: "Info" },
};

export const Neutral: Story = {
  args: { variant: "neutral", children: "Neutral" },
};

export const Superadmin: Story = {
  args: { variant: "superadmin", children: "Superadmin" },
};

export const Admin: Story = {
  args: { variant: "admin", children: "Admin" },
};

export const Writer: Story = {
  args: { variant: "writer", children: "Writer" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="superadmin">Superadmin</Badge>
      <Badge variant="admin">Admin</Badge>
      <Badge variant="writer">Writer</Badge>
    </div>
  ),
};
