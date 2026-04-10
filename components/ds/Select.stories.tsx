import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const options = [
  { value: "react", label: "React" },
  { value: "ts", label: "TypeScript" },
  { value: "next", label: "Next.js" },
];

const meta = {
  title: "DS/Select",
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options,
    placeholder: "Select a framework...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Framework",
    options,
    placeholder: "Select a framework...",
    helperText: "Choose your preferred framework.",
  },
};

export const WithError: Story = {
  args: {
    label: "Framework",
    options,
    placeholder: "Select a framework...",
    error: "Please select a framework.",
  },
};
