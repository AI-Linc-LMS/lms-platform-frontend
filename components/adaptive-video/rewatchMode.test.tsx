import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WatchModeSelector } from "./RailPanels";

/**
 * Rewatch mode is offered only to someone who has already finished the video.
 *
 * Reported as "we can add one more feature for the students who have watched a particular video.
 * In that mode they will not get the questions inside the video."
 *
 * The gate is not cosmetic. A watch with no answered check-ins scores from coverage ALONE, and at
 * full coverage that is worth MORE than answering badly - 25 points against 15. Offering "no
 * questions" to a first-time watcher would make the check-ins optional for everybody and hand the
 * higher score to whoever skipped them. The server enforces it too, and quietly falls back to
 * Normal pace for anyone who asks too early.
 */

describe("the watch mode card", () => {
  it("does not offer rewatch to a first-time watcher", () => {
    render(<WatchModeSelector value="normal" onChange={vi.fn()} rewatchAvailable={false} />);
    expect(screen.getByText("Normal pace")).toBeInTheDocument();
    expect(screen.queryByText("Rewatch")).not.toBeInTheDocument();
  });

  it("offers it to somebody who has finished the video", () => {
    render(<WatchModeSelector value="normal" onChange={vi.fn()} rewatchAvailable />);
    expect(screen.getByText("Rewatch")).toBeInTheDocument();
    expect(screen.getByText("No questions - just the video")).toBeInTheDocument();
  });

  it("withholds it when the backend never said - an older API", () => {
    // `rewatch_available` is absent on a backend that predates it. Unlike `can_edit` elsewhere,
    // the safe reading here is "no": showing a mode the server will refuse and silently downgrade
    // would have the rail claim one thing while the session does another.
    render(<WatchModeSelector value="normal" onChange={vi.fn()} />);
    expect(screen.queryByText("Rewatch")).not.toBeInTheDocument();
  });

  it("keeps the ordinary modes alongside it", () => {
    render(<WatchModeSelector value="rewatch" onChange={vi.fn()} rewatchAvailable />);
    expect(screen.getByText("Normal pace")).toBeInTheDocument();
    expect(screen.getByText("Pause & ask every 60s")).toBeInTheDocument();
    expect(screen.getByText("Rewatch")).toBeInTheDocument();
  });
});
