/**
 * @file Database Migration - Create Indexes
 * @description Índices SQL para otimizar queries de busca
 * Executar: supabase migration up 001
 */

/**
 * MIGRATION UP: Criar índices para search performance
 * 
 * POR QUE esses índices:
 * 1. Full-text search em título (BRIN para espaço, GIN para velocidade)
 * 2. Filtros comuns (category, condition, product_type, location)
 * 3. Range queries (price, grade_level, rating)
 * 4. Ordenação (created_at, rating, sales)
 * 5. Compostos para queries comuns
 */

-- Index 1: Full-text search no título (para ILIKE, melhor com BRIN/GIN)
CREATE INDEX IF NOT EXISTS idx_products_title_gin 
ON products USING GIN(title gin_trgm_ops);

-- Index 2: Full-text search na descrição
CREATE INDEX IF NOT EXISTS idx_products_description_gin 
ON products USING GIN(description gin_trgm_ops);

-- Index 3: Filtros simples (muito comuns)
CREATE INDEX IF NOT EXISTS idx_products_category 
ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_condition 
ON products(condition);

CREATE INDEX IF NOT EXISTS idx_products_product_type 
ON products(product_type);

CREATE INDEX IF NOT EXISTS idx_products_location 
ON products(location);

CREATE INDEX IF NOT EXISTS idx_products_subject 
ON products(subject);

-- Index 4: Ordenação/Sorting
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc 
ON products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_rating_desc 
ON products(rating DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_products_price_asc 
ON products(price ASC);

CREATE INDEX IF NOT EXISTS idx_products_price_desc 
ON products(price DESC);

-- Index 5: Range queries
CREATE INDEX IF NOT EXISTS idx_products_price_range 
ON products(price) 
WHERE price > 0 AND price < 1000000;

CREATE INDEX IF NOT EXISTS idx_products_grade_level 
ON products(grade_level) 
WHERE grade_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_rating 
ON products(rating) 
WHERE rating >= 0 AND rating <= 5;

-- Index 6: Composite indexes para queries comuns
-- Query: "livros baratos de matematica"
CREATE INDEX IF NOT EXISTS idx_products_category_price_rating 
ON products(category, price ASC, rating DESC);

-- Query: "serviços de tutoria em luanda"
CREATE INDEX IF NOT EXISTS idx_products_type_location_rating 
ON products(product_type, location, rating DESC);

-- Query: "material escolar novo"
CREATE INDEX IF NOT EXISTS idx_products_category_condition_created_at 
ON products(category, condition, created_at DESC);

-- Query: "material por subject e grade_level"
CREATE INDEX IF NOT EXISTS idx_products_subject_grade_level 
ON products(subject, grade_level);

-- Index 7: User products (para profile page)
CREATE INDEX IF NOT EXISTS idx_products_user_id_created_at 
ON products(user_id, created_at DESC);

-- Index 8: Para sugestões (autocomplete) - produtos populares
CREATE INDEX IF NOT EXISTS idx_products_views_created_at 
ON products(views DESC, created_at DESC) 
WHERE views > 0;

-- Index 9: Partial index para produtos "bons" (para homepage)
CREATE INDEX IF NOT EXISTS idx_products_featured 
ON products(rating DESC, created_at DESC) 
WHERE rating >= 4.0 AND price > 0;

-- Habilitar gin_trgm_ops extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- MIGRATION DOWN: Remover índices (se precisar reverter)
-- DROP INDEX IF EXISTS idx_products_title_gin;
-- DROP INDEX IF EXISTS idx_products_description_gin;
-- DROP INDEX IF EXISTS idx_products_category;
-- ... etc
