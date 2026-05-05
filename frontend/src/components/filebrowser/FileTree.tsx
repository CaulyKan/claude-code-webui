import {
  FolderIcon,
  DocumentIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import type { FileEntry, SelectedFile } from "../../hooks/useFileBrowser";

interface FileTreeProps {
  entries: FileEntry[];
  currentPath: string;
  selectedFile: SelectedFile | null;
  loading: boolean;
  onNavigateToDirectory: (name: string) => void;
  onNavigateUp: () => void;
  onSelectFile: (path: string, name: string) => void;
}

export function FileTree({
  entries,
  currentPath,
  selectedFile,
  loading,
  onNavigateToDirectory,
  onNavigateUp,
  onSelectFile,
}: FileTreeProps) {
  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb / path display */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 min-h-[40px]">
        {currentPath ? (
          <button
            onClick={onNavigateUp}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            aria-label="Go to parent directory"
          >
            <ChevronUpIcon className="w-4 h-4" />
            <span>..</span>
          </button>
        ) : (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            Root
          </span>
        )}
        {pathParts.length > 0 && (
          <span className="truncate ml-1">/ {pathParts.join(" / ")}</span>
        )}
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Empty directory
          </div>
        ) : (
          <ul className="py-1">
            {entries.map((entry) => {
              const entryPath = currentPath
                ? `${currentPath}/${entry.name}`
                : entry.name;
              const isSelected = selectedFile?.path === entryPath;

              return (
                <li key={entry.name}>
                  <button
                    onClick={() =>
                      entry.type === "directory"
                        ? onNavigateToDirectory(entry.name)
                        : onSelectFile(entryPath, entry.name)
                    }
                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    aria-label={
                      entry.type === "directory"
                        ? `Open directory ${entry.name}`
                        : `View file ${entry.name}`
                    }
                  >
                    {entry.type === "directory" ? (
                      <FolderIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    ) : (
                      <DocumentIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    )}
                    <span className="truncate">{entry.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
