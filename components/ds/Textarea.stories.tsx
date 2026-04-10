import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta = {
  title: "DS/Textarea",
  component: Textarea,
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Write something...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Description",
    placeholder: "Enter a description...",
    helperText: "Maximum 500 characters.",
  },
};

export const WithError: Story = {
  args: {
    label: "Bio",
    placeholder: "Tell us about yourself...",
    defaultValue: "Hi",
    error: "Bio must be at least 10 characters.",
  },
};
