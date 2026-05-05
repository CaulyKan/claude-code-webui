import { useState, useCallback } from "react";
import { getFileListUrl, getFileContentUrl } from "../config/api";

export interface FileEntry {
  name: string;
  type: "file" | "directory";
}

export interface SelectedFile {
  name: string;
  path: string;
}

export function useFileBrowser(projectDir: string) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDirectory = useCallback(
    async (subpath: string = "") => {
      setLoading(true);
      setError(null);
      try {
        const url = getFileListUrl(projectDir, subpath);
        const response = await fetch(url);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to list files");
        }
        const data = await response.json();
        setEntries(data.entries || []);
        setCurrentPath(subpath);
        setSelectedFile(null);
        setFileContent(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to list files");
      } finally {
        setLoading(false);
      }
    },
    [projectDir],
  );

  const loadFileContent = useCallback(
    async (filePath: string, fileName: string) => {
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const imageExts = [
        "png",
        "jpg",
        "jpeg",
        "gif",
        "svg",
        "webp",
        "bmp",
        "ico",
      ];
      if (imageExts.includes(ext)) {
        setSelectedFile({ name: fileName, path: filePath });
        setFileContent(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const url = getFileContentUrl(projectDir, filePath);
        const response = await fetch(url);
        if (!response.ok) {
          const data = await response
            .json()
            .catch(() => ({ error: "Failed to read file" }));
          throw new Error(data.error || "Failed to read file");
        }
        const content = await response.text();
        setSelectedFile({ name: fileName, path: filePath });
        setFileContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file");
      } finally {
        setLoading(false);
      }
    },
    [projectDir],
  );

  const navigateUp = useCallback(() => {
    if (!currentPath) return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    loadDirectory(parts.join("/"));
  }, [currentPath, loadDirectory]);

  const navigateToDirectory = useCallback(
    (dirName: string) => {
      const newPath = currentPath ? `${currentPath}/${dirName}` : dirName;
      loadDirectory(newPath);
    },
    [currentPath, loadDirectory],
  );

  return {
    entries,
    currentPath,
    selectedFile,
    fileContent,
    loading,
    error,
    loadDirectory,
    loadFileContent,
    navigateUp,
    navigateToDirectory,
  };
}
