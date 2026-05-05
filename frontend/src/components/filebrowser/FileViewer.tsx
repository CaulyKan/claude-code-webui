import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SelectedFile } from "../../hooks/useFileBrowser";
import { getFileContentUrl } from "../../config/api";

interface FileViewerProps {
  selectedFile: SelectedFile | null;
  fileContent: string | null;
  projectDir: string;
  loading: boolean;
}

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "bmp",
  "ico",
]);

function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.has(ext);
}

function isMarkdownFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".md");
}

export function FileViewer({
  selectedFile,
  fileContent,
  projectDir,
  loading,
}: FileViewerProps) {
  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
        <p>Select a file to view its content</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  const contentUrl = getFileContentUrl(projectDir, selectedFile.path);

  return (
    <div className="flex flex-col h-full">
      {/* File name header */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
        <h3 className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
          {selectedFile.name}
        </h3>
      </div>

      {/* File content */}
      <div className="flex-1 overflow-auto p-4">
        {isImageFile(selectedFile.name) ? (
          <div className="flex items-center justify-center min-h-full">
            <img
              src={contentUrl}
              alt={selectedFile.name}
              className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
            />
          </div>
        ) : isMarkdownFile(selectedFile.name) && fileContent !== null ? (
          <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
            <Markdown remarkPlugins={[remarkGfm]}>{fileContent}</Markdown>
          </div>
        ) : fileContent !== null ? (
          <pre className="text-sm font-mono whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 overflow-auto">
            <code>{fileContent}</code>
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <p>Unable to display this file</p>
          </div>
        )}
      </div>
    </div>
  );
}
