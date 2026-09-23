import path from "node:path";
import { expect, test } from "vitest";
import { resolveFile } from "./serve.js";

const dist = path.resolve(import.meta.dirname, "../dist");
const index = path.join(dist, "index.html");

test("serves a real file", () => {
  expect(resolveFile(dist, "/index.html")).toBe(index);
});

test("falls back to index.html so client-side routes reload", () => {
  expect(resolveFile(dist, "/timer")).toBe(index);
  expect(resolveFile(dist, "/list/abc123")).toBe(index);
  expect(resolveFile(dist, "/")).toBe(index);
});

test("ignores the query string", () => {
  expect(resolveFile(dist, "/index.html?v=1")).toBe(index);
});

test("refuses to escape the served root", () => {
  expect(resolveFile(dist, "/../../../etc/passwd")).toBe(index); // normalised, then not a file
  expect(resolveFile(dist, "/%2e%2e%2f%2e%2e%2fetc%2fpasswd")).toBe(index);
  expect(resolveFile(dist, "/%ZZ")).toBe(null);
});
