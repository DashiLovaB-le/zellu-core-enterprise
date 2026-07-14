-- ============================================================
-- MIGRAÇÃO 003 — Fallback models para LLM
-- Adiciona model_2 e model_3 à tabela llm_config
-- String vazia = fallback desativado
-- ============================================================

ALTER TABLE llm_config ADD COLUMN IF NOT EXISTS model_2 TEXT NOT NULL DEFAULT '';
ALTER TABLE llm_config ADD COLUMN IF NOT EXISTS model_3 TEXT NOT NULL DEFAULT '';
