import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "./Modal";
import { Button } from "./Button";

const meta = {
  title: "DS/Modal",
  component: Modal,
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Modal Title"
          description="This is a description of the modal."
        >
          <p className="text-sm">Modal body content goes here.</p>
        </Modal>
      </>
    );
  },
};

export const WithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Form Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Create Item"
          description="Fill in the details below."
          size="md"
        >
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Name"
              className="w-full rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-transparent px-3 py-2 text-sm outline-none"
            />
            <textarea
              placeholder="Description"
              className="w-full rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-transparent px-3 py-2 text-sm outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Create
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};
