import { Context } from "hono";
import { resolve, normalize, extname } from "node:path";
import { readDir, stat, readTextFile, readBinaryFile } from "../utils/fs.ts";
import { logger } from "../utils/logger.ts";

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".bmp",
  ".ico",
]);

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".json",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".css",
  ".html",
  ".xml",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".php",
  ".swift",
  ".kt",
  ".scala",
  ".lua",
  ".r",
  ".sql",
  ".graphql",
  ".vue",
  ".svelte",
  ".astro",
  ".env",
  ".gitignore",
  ".dockerignore",
  ".editorconfig",
  ".prettierrc",
  ".eslintrc",
  ".tsconfig",
  ".makefile",
  ".cmake",
  ".gradle",
  ".properties",
  ".lock",
  ".log",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
};

const SKIPPED_NAMES = new Set(["node_modules", ".git"]);

function validatePath(projectDir: string, relativePath: string): string {
  const resolved = resolve(projectDir, relativePath);
  const normalizedProject = normalize(projectDir);
  if (!resolved.startsWith(normalizedProject)) {
    throw new Error("Path traversal detected");
  }
  return resolved;
}

export async function handleFileListRequest(c: Context) {
  const dir = c.req.query("dir");
  const subpath = c.req.query("path") || "";

  if (!dir) {
    return c.json({ error: "Missing 'dir' parameter" }, 400);
  }

  const projectDir = decodeURIComponent(dir);

  try {
    const targetPath = validatePath(projectDir, subpath);
    const pathStat = await stat(targetPath);

    if (!pathStat.isDirectory) {
      return c.json({ error: "Not a directory" }, 400);
    }

    const entries: Array<{ name: string; type: "file" | "directory" }> = [];
    for await (const entry of readDir(targetPath)) {
      if (entry.name.startsWith(".") || SKIPPED_NAMES.has(entry.name)) continue;
      if (entry.isDirectory) {
        entries.push({ name: entry.name, type: "directory" });
      } else if (entry.isFile) {
        entries.push({ name: entry.name, type: "file" });
      }
    }

    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return c.json({ entries });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Path traversal detected"
    ) {
      return c.json({ error: "Access denied" }, 403);
    }
    logger.api.error("Error listing files: {error}", { error });
    return c.json({ error: "Failed to list files" }, 500);
  }
}

export async function handleFileContentRequest(c: Context) {
  const dir = c.req.query("dir");
  const filePath = c.req.query("path") || "";

  if (!dir) {
    return c.json({ error: "Missing 'dir' parameter" }, 400);
  }
  if (!filePath) {
    return c.json({ error: "Missing 'path' parameter" }, 400);
  }

  const projectDir = decodeURIComponent(dir);

  try {
    const fullPath = validatePath(projectDir, filePath);
    const fileStat = await stat(fullPath);

    if (!fileStat.isFile) {
      return c.json({ error: "Not a file" }, 400);
    }

    if (fileStat.size > MAX_FILE_SIZE) {
      return c.json({ error: "File too large" }, 413);
    }

    const ext = extname(fullPath).toLowerCase();

    if (IMAGE_EXTENSIONS.has(ext)) {
      const content = await readBinaryFile(fullPath);
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";
      return new Response(content, {
        headers: { "Content-Type": mimeType },
      });
    }

    if (TEXT_EXTENSIONS.has(ext)) {
      const content = await readTextFile(fullPath);
      return c.text(content);
    }

    // Try to read as text for unknown extensions
    try {
      const content = await readTextFile(fullPath);
      return c.text(content);
    } catch {
      return c.json({ error: "Unsupported file type" }, 415);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Path traversal detected"
    ) {
      return c.json({ error: "Access denied" }, 403);
    }
    logger.api.error("Error reading file: {error}", { error });
    return c.json({ error: "Failed to read file" }, 500);
  }
}
