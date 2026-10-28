-- Pedido de demonstração da landing comercial: faixa de colaboradores da empresa.
-- Leads antigos ficam sem faixa (NULL).

ALTER TABLE public.landing_leads
  ADD COLUMN IF NOT EXISTS company_size TEXT
    CHECK (company_size IS NULL OR company_size IN ('ate-50', '51-200', '201-500', '501-1000', 'mais-1000'));
