import type { Meta, StoryObj } from "@storybook/react";
import { DropdownMenu } from "./DropdownMenu";
import { Button } from "./Button";

const meta = {
  title: "DS/DropdownMenu",
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu
      trigger={<Button variant="secondary">Menu</Button>}
      items={[
        { label: "프로필", icon: "person", onClick: () => {} },
        { label: "설정", icon: "settings", onClick: () => {} },
        { label: "", divider: true },
        {
          label: "로그아웃",
          icon: "logout",
          danger: true,
          onClick: () => {},
        },
      ]}
    />
  ),
};
