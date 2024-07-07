export type Progress = { loaded?: number; total?: number };
export type ProgressIndicator = {
  name: string;
  progress: number;
  loaded: number;
  total: number;
};

export function getProgress(
  ev: ProgressEvent<FileReader>
): Progress | undefined {
  if (!ev.lengthComputable) {
    return undefined;
  }
  return { loaded: ev.loaded, total: ev.total };
}
