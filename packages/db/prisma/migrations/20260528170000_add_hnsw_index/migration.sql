-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateIndex
CREATE INDEX IF NOT EXISTS chunk_embedding_hnsw_idx ON "chunk" USING hnsw (embedding vector_cosine_ops);
