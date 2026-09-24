import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

/**
 * setContent is how a draft's saved email gets back into the editor. It set the subject AND
 * `lastInitialSubject` to the saved value, so on the very next render the title snap-back saw a
 * "changed" title (the prop no longer matched) and replaced the saved subject with the
 * title-derived default. A saved custom subject never survived being restored.
 */

// The Tiptap body is not what is under test; a textarea keeps the value contract.
vi.mock("@/components/common/RichTextEditor", () => ({
  RichTextEditor: (p: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="stub-body" value={p.value} onChange={(e) => p.onChange(e.target.value)} />
  ),
}));
vi.mock("@/components/common/EmailTemplatePreview", () => ({
  EmailTemplatePreview: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import {
  EmailNotificationEditor,
  type EmailNotificationEditorHandle,
} from "./EmailNotificationEditor";

function renderEditor(title: string) {
  const ref = createRef<EmailNotificationEditorHandle>();
  const props = (t: string) => ({
    initialSubject: `Important Notification - ${t}`,
    initialBody: "<p>Dear {name},</p>",
  });
  const view = render(<EmailNotificationEditor ref={ref} {...props(title)} />);
  return {
    ref,
    retitle: (t: string) => view.rerender(<EmailNotificationEditor ref={ref} {...props(t)} />),
  };
}

const subjectField = () => screen.getByLabelText("Email subject") as HTMLInputElement;

describe("EmailNotificationEditor.setContent", () => {
  it("keeps a restored subject instead of snapping it back to the title default", () => {
    const { ref } = renderEditor("Unit 3");
    act(() => ref.current?.setContent("Mid-term reminder", "<p>Bring a calculator.</p>"));
    expect(subjectField().value).toBe("Mid-term reminder");
    expect(ref.current?.getValues()).toMatchObject({
      subject: "Mid-term reminder",
      body: "<p>Bring a calculator.</p>",
    });
  });

  it("still lets a later title edit reset the subject, as the field's hint promises", () => {
    const { ref, retitle } = renderEditor("Unit 3");
    act(() => ref.current?.setContent("Mid-term reminder", null));
    retitle("Unit 3 final");
    expect(subjectField().value).toBe("Important Notification - Unit 3 final");
  });

  it("leaves the subject alone when only the body is restored", () => {
    const { ref } = renderEditor("Unit 3");
    act(() => ref.current?.setContent(null, "<p>Bring a calculator.</p>"));
    expect(subjectField().value).toBe("Important Notification - Unit 3");
    expect(ref.current?.getValues().body).toBe("<p>Bring a calculator.</p>");
  });
});
