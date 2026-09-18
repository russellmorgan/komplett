import { describe, expect, it } from "vitest";
import { newFolder, newList, sortByOrder } from "./lists";

describe("newList", () => {
  it("defaults to no folder, slate color, not inbox", () => {
    expect(newList({ ownerId: "u", name: "Groceries" }, 1)).toEqual({
      ownerId: "u",
      folderId: null,
      name: "Groceries",
      color: "slate",
      sortOrder: 1,
      isInbox: false,
    });
  });

  it("accepts a folder and color", () => {
    expect(newList({ ownerId: "u", name: "Work", folderId: "f1", color: "rose" }, 2)).toEqual({
      ownerId: "u",
      folderId: "f1",
      name: "Work",
      color: "rose",
      sortOrder: 2,
      isInbox: false,
    });
  });
});

describe("newFolder", () => {
  it("builds a plain owned folder", () => {
    expect(newFolder("u", "Personal", 1)).toEqual({ ownerId: "u", name: "Personal", sortOrder: 1 });
  });
});

describe("sortByOrder", () => {
  it("sorts by sortOrder without mutating the input", () => {
    const items = [{ sortOrder: 2 }, { sortOrder: 0 }, { sortOrder: 1 }];
    expect(sortByOrder(items)).toEqual([{ sortOrder: 0 }, { sortOrder: 1 }, { sortOrder: 2 }]);
    expect(items).toEqual([{ sortOrder: 2 }, { sortOrder: 0 }, { sortOrder: 1 }]);
  });
});
