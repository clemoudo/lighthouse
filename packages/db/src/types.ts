import { z } from "zod";

/**
 * Schema for raw parsed content from LlamaParse.
 * Stored in Document.parsedContent.
 */
export const ParsedPageSchema = z.object({
  markdown: z.string(),
  pageNumber: z.number(),
  printedPageNumber: z.string().optional(),
});

export const ParsedContentSchema = z.array(ParsedPageSchema);

export type ParsedPage = z.infer<typeof ParsedPageSchema>;
export type ParsedContent = z.infer<typeof ParsedContentSchema>;

/**
 * Schema for Chapter metadata.
 * Stored in Chapter.metadata.
 */
export const ChapterMetadataSchema = z.object({
  startPage: z.number(),
  endPage: z.number(),
});

export type ChapterMetadata = z.infer<typeof ChapterMetadataSchema>;

/**
 * Schema for Chunk metadata.
 * Stored in Chunk.metadata.
 */
export const ChunkMetadataSchema = z.object({
  pdfPageNumber: z.number(),
  printedPageNumber: z.string().optional(),
  source: z.string(),
  chapterTitle: z.string(),
});

export type ChunkMetadata = z.infer<typeof ChunkMetadataSchema>;

/**
 * Schema for Table of Contents extraction.
 * Used by the AI service and ToC extraction logic.
 */
export const TableOfContentsEntrySchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    title: z.string(),
    startPage: z.number(),
    endPage: z.number(),
    subSections: z.array(TableOfContentsEntrySchema).optional(),
  })
);

export type TableOfContentsEntry = z.infer<typeof TableOfContentsEntrySchema>;
