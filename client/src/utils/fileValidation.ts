export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export type UploadAllowedKind = "image" | "csv" | "pdf";

export interface UploadFileCandidate {
  name?: string;
  size?: number | null;
  mimeType?: string | null;
}

const CSV_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/comma-separated-values",
  "application/vnd.ms-excel",
]);

const PDF_MIME_TYPES = new Set(["application/pdf"]);

const getExtension = (name?: string): string => {
  if (!name) return "";
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";
};

const matchesKind = (file: UploadFileCandidate, kind: UploadAllowedKind): boolean => {
  const mimeType = file.mimeType?.toLowerCase() || "";
  const extension = getExtension(file.name);

  if (kind === "image") {
    return mimeType.startsWith("image/");
  }

  if (kind === "csv") {
    return CSV_MIME_TYPES.has(mimeType) || extension === ".csv";
  }

  if (kind === "pdf") {
    return PDF_MIME_TYPES.has(mimeType) || extension === ".pdf";
  }

  return false;
};

const getAllowedKindsLabel = (allowedKinds: UploadAllowedKind[]): string => {
  const labels = allowedKinds.map((kind) => {
    if (kind === "image") return "images";
    if (kind === "csv") return "CSV files";
    return "PDF files";
  });

  if (labels.length <= 1) return labels[0] || "files";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
};

export const getUploadFileValidationError = (
  file: UploadFileCandidate,
  allowedKinds: UploadAllowedKind[]
): string | null => {
  const fileName = file.name || "Selected file";

  if (typeof file.size === "number" && file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return `${fileName} is larger than 5 MB.`;
  }

  if (!allowedKinds.some((kind) => matchesKind(file, kind))) {
    return `Only ${getAllowedKindsLabel(allowedKinds)} are allowed. MP3 and MP4 files are not supported.`;
  }

  return null;
};
