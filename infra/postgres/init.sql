-- Enable pgvector extension for RAG capabilities
CREATE EXTENSION IF NOT EXISTS vector;

-- Note: PostgreSQL 17 supports UUID v7 natively in some aspects, 
-- but a custom function can be useful for explicit uuid7 generation if needed.
-- For now, we ensure the environment is ready for vector operations.
