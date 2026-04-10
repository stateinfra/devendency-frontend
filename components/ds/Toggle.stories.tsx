import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "./Toggle";

const meta = {
  title: "DS/Toggle",
  component: Toggle,
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    checked: false,
    label: "Enable notifications",
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    label: "Enable notifications",
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    label: "Disabled toggle",
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    label: "Disabled checked",
    disabled: true,
  },
};

export const NoLabel: Story = {
  args: {
    checked: true,
  },
};
