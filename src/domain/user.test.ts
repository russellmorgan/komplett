import { describe, expect, it } from "vitest";
import { inboxList, initialUser } from "./user";

describe("initialUser", () => {
  it("fills defaults: 25/5, sound on, no partner, no accountability task", () => {
    expect(initialUser({ displayName: "Russell", email: "r@example.com" })).toEqual({
      displayName: "Russell",
      email: "r@example.com",
      photoURL: null,
      partnerId: null,
      accountabilityTaskId: null,
      settings: { focusMinutes: 25, breakMinutes: 5, soundEnabled: true },
    });
  });

  it("falls back to the email's local part when there is no display name", () => {
    expect(initialUser({ displayName: null, email: "r@example.com" }).displayName).toBe("r");
  });
});

describe("inboxList", () => {
  it("is an undeletable, top-level list owned by the user", () => {
    expect(inboxList("uid-1")).toEqual({
      ownerId: "uid-1",
      folderId: null,
      name: "Inbox",
      color: "slate",
      sortOrder: 0,
      isInbox: true,
    });
  });
});
