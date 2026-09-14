// Adapted from fluidfunctionalism.com file-thumbnail.tsx — pdfjs-dist removed
// (PDFs get the generic document glyph + filename hint instead of a rendered
// first page; everything else is faithful). Zero dependencies.
// Source: https://www.fluidfunctionalism.com/docs/chat-message

import { useEffect, useState } from "react";

const cn = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

// ─── File thumbnail ───────────────────────────────────────────────────────
// Read-only square preview of a File. Images use object-cover via
// `URL.createObjectURL`; anything else gets the generic document glyph.
// Self-contained (border + surface + sizing) so it can be reused both inside
// a composer's preview row and to render already-sent attachments.
export interface FileThumbnailProps {
  file: File;
  /** Side length of the square thumbnail in pixels. */
  size: number;
  className?: string;
}

export function FileThumbnail({ file, size, className }: FileThumbnailProps) {
  const isImage = file.type.startsWith("image/");

  // Create the blob URL inside an effect (NOT useMemo) so cleanup-revoke and
  // URL-creation stay in sync. In React 18 StrictMode dev, a useMemo-created
  // URL gets revoked by the simulated effect-cleanup but useMemo doesn't
  // re-run on the simulated re-mount, leaving the DOM with a stale, revoked
  // `blob:` URL — broken image. Both in one effect means the simulated
  // re-mount creates a fresh URL and updates state.
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isImage) {
      // Clear stale state if the `file` prop swaps type on the same mount —
      // otherwise a revoked blob URL would keep winning over the new preview.
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isImage, file]);

  // Spinner only while the image URL is genuinely pending; anything that
  // can't produce a preview gets the generic icon instead.
  const isPending = isImage && !imageUrl;

  return (
    <div
      className={cn("cm-thumb", className)}
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={file.name}
          className="cm-thumb-img"
        />
      ) : isPending ? (
        // Thin ring, one quadrant accented — reads as a moving arc.
        <div className="cm-thumb-center">
          <div
            className="cm-thumb-spin"
            aria-label="Loading preview"
            role="status"
          />
        </div>
      ) : (
        // Generic document glyph for files with no renderable preview.
        <div
          className="cm-thumb-center cm-thumb-doc"
          role="img"
          aria-label={file.name}
        >
          <svg
            width={Math.max(16, size * 0.35)}
            height={Math.max(16, size * 0.35)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
          </svg>
          {file.type === "application/pdf" && (
            <span className="cm-thumb-kind">PDF</span>
          )}
        </div>
      )}
    </div>
  );
}

export default FileThumbnail;
