import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta = {
  title: "DS/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    children: "Default card content",
  },
};

export const Settings: Story = {
  args: {
    variant: "settings",
    children: "Settings card content",
  },
};

export const Alert: Story = {
  args: {
    variant: "alert",
    alertVariant: "info",
    children: "This is an informational alert.",
  },
};

export const AlertDanger: Story = {
  args: {
    variant: "alert",
    alertVariant: "danger",
    children: "This is a danger alert.",
  },
};

export const Interactive: Story = {
  args: {
    variant: "interactive",
    children: "Click me — I'm interactive!",
  },
};
