import { useEffect } from "react";
import { useFileBrowser } from "../hooks/useFileBrowser";
import { FileTree } from "./filebrowser/FileTree";
import { FileViewer } from "./filebrowser/FileViewer";

interface FileBrowserProps {
  workingDirectory: string;
  onBack: () => void;
}

export function FileBrowser({ workingDirectory }: FileBrowserProps) {
  const {
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
  } = useFileBrowser(workingDirectory);

  useEffect(() => {
    loadDirectory("");
  }, [loadDirectory]);

  return (
    <div className="flex-1 flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      {/* Left panel - File tree */}
      <div className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Files
          </h2>
        </div>
        <FileTree
          entries={entries}
          currentPath={currentPath}
          selectedFile={selectedFile}
          loading={loading}
          onNavigateToDirectory={navigateToDirectory}
          onNavigateUp={navigateUp}
          onSelectFile={(path, name) => loadFileContent(path, name)}
        />
      </div>

      {/* Right panel - File viewer */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
              <button
                onClick={() => loadDirectory(currentPath)}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <FileViewer
            selectedFile={selectedFile}
            fileContent={fileContent}
            projectDir={workingDirectory}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
