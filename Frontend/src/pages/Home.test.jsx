
 // @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { getEvents } from "../services/api";

vi.mock("../services/api", () => ({
  getEvents: vi.fn(),
}));

describe("Home page", () => {
  beforeEach(() => {
    getEvents.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the landing page and fallback events when the API returns an empty list", async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /Welcome to/i })
    ).toBeTruthy();

    expect(
      screen.getByRole("heading", { name: /Upcoming Events/i })
    ).toBeTruthy();

    expect(await screen.findByText("TechNova 2026")).toBeTruthy();

    expect(
      screen.getByPlaceholderText("Search events, venues, departments...")
    ).toBeTruthy();
  });

  it("filters visible events using the search field", async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await screen.findByText("TechNova 2026");

    fireEvent.change(
      screen.getByPlaceholderText("Search events, venues, departments..."),
      { target: { value: "no-match-event" } }
    );

    await waitFor(() => {
      expect(
        screen.getByText("No events match your search.")
      ).toBeTruthy();
    });
  });

  it("shows the fallback notice when the backend request fails", async () => {
    getEvents.mockRejectedValueOnce(new Error("API unavailable"));

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Backend events are unavailable right now/i)
    ).toBeTruthy();

    expect(
      screen.getAllByText("TechNova 2026").length
    ).toBeGreaterThan(0);
  });
});
