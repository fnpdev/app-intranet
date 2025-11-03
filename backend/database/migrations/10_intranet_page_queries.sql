CREATE TABLE intranet_page_queries (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES intranet_pages(id) ON DELETE CASCADE,
  query_id INTEGER REFERENCES intranet_queries(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT FALSE, -- 🔹 NOVA COLUNA: indica a query principal da página
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- 🔸 Vincula as queries à página de produto
INSERT INTO intranet_page_queries (page_id, query_id, active, order_index, is_main)
SELECT p.id, q.id, TRUE, 1, TRUE
FROM intranet_pages p
JOIN intranet_queries q ON q.key = 'produto_por_codigo'
WHERE p.key = 'produto_page';

INSERT INTO intranet_page_queries (page_id, query_id, active, order_index, is_main)
SELECT p.id, q.id, TRUE, 2, FALSE
FROM intranet_pages p
JOIN intranet_queries q ON q.key = 'lote_por_produto'
WHERE p.key = 'produto_page';
