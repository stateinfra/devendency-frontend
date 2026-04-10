import type { Meta, StoryObj } from "@storybook/react";
import { Radio } from "./Radio";

const meta = {
  title: "DS/Radio",
  component: Radio,
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    checked: false,
    label: "Option A",
    name: "group1",
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    label: "Option A",
    name: "group1",
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    label: "Disabled option",
    name: "group1",
    disabled: true,
  },
};

export const RadioGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Radio checked={true} onChange={() => {}} label="Option A" name="demo" />
      <Radio checked={false} onChange={() => {}} label="Option B" name="demo" />
      <Radio checked={false} onChange={() => {}} label="Option C" name="demo" />
    </div>
  ),
};
