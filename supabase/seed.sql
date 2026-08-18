-- Seed de piloto: duas empresas, times reais, sem equipes inventadas no código.
-- Aplicar depois das migrations. Ajuste e-mails conforme o ambiente.

INSERT INTO companies (id, name, slug, status, seats, support_channel)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Empresa Demo A', 'empresa-demo-a', 'active', 50, 'RH interno: rh@demoa.local'),
  ('22222222-2222-2222-2222-222222222222', 'Empresa Demo B', 'empresa-demo-b', 'active', 50, 'Canal de cuidado: cuidado@demob.local')
ON CONFLICT (id) DO NOTHING;

INSERT INTO teams (id, company_id, name)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'Produto'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'Comercial'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'Operações'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222', 'Financeiro')
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO licenses (company_id, plan_name, seats, seats_used, status)
SELECT '11111111-1111-1111-1111-111111111111', 'piloto', 50, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM licenses WHERE company_id = '11111111-1111-1111-1111-111111111111');

INSERT INTO licenses (company_id, plan_name, seats, seats_used, status)
SELECT '22222222-2222-2222-2222-222222222222', 'piloto', 50, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM licenses WHERE company_id = '22222222-2222-2222-2222-222222222222');

-- Convites de exemplo (token conhecido só para ambiente local)
INSERT INTO invites (company_id, team_id, email, role, token, expires_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'colaborador.a@demo.local',
    'companion',
    'seedtokenaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    now() + interval '14 days'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'rh.a@demo.local',
    'manager',
    'seedtokenbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    now() + interval '14 days'
  )
ON CONFLICT (token) DO NOTHING;
