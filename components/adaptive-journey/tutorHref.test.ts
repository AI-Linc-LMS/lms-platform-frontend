/**
 * The link that finally gives `topic_source="course"` something behind it.
 */

import { describe, expect, it } from "vitest";
import { MODULE_LESSON_MINUTES, tutorHrefForModule } from "./tutorHref";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

const topic = (over: Partial<JourneyNodeView> = {}) =>
  ({ type: "topic", title: "Recursion", ref: { submoduleId: 42 }, ...over }) as JourneyNodeView;

describe("opening the tutor on a module", () => {
  it("carries the module id so the server can seed the lesson from its material", () => {
    const href = tutorHrefForModule(topic())!;
    const q = new URLSearchParams(href.split("?")[1]);
    expect(q.get("submoduleId")).toBe("42");
    expect(q.get("topic")).toBe("Recursion");
    expect(q.get("source")).toBe("course");
    expect(q.get("minutes")).toBe(String(MODULE_LESSON_MINUTES));
  });

  it("goes to the room route the tutor actually uses", () => {
    // The room stays on /session/new for the whole lesson - rewriting the URL mid-call would
    // trip the camera guard and kill the microphone.
    expect(tutorHrefForModule(topic())!.startsWith("/ai-tutor/session/new?")).toBe(true);
  });

  it("escapes a title rather than breaking the query string", () => {
    const href = tutorHrefForModule(topic({ title: "Trees & graphs: a primer" }))!;
    expect(new URLSearchParams(href.split("?")[1]).get("topic")).toBe("Trees & graphs: a primer");
  });

  it("offers nothing for a checkpoint or an interview", () => {
    // A paper is not a thing to be taught, and neither is a conversation.
    expect(tutorHrefForModule(topic({ type: "checkpoint" }))).toBeNull();
    expect(tutorHrefForModule(topic({ type: "interview" }))).toBeNull();
  });

  it("offers nothing when the node has no module behind it", () => {
    expect(tutorHrefForModule(topic({ ref: {} }))).toBeNull();
  });

  it("offers nothing for an untitled module rather than a lesson about nothing", () => {
    expect(tutorHrefForModule(topic({ title: "   " }))).toBeNull();
  });

  it("passes the learner's level through", () => {
    const href = tutorHrefForModule(topic(), "advanced")!;
    expect(new URLSearchParams(href.split("?")[1]).get("level")).toBe("advanced");
  });
});
