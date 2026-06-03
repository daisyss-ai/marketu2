# ✅ CHECKLIST DE REFATORAÇÃO - MarketU v2

## PRÉ-REQUISITOS

- [ ] Node.js >= 16
- [ ] Next.js 16+ instalado
- [ ] Supabase project active
- [ ] Git repository initialized
- [ ] 2-3 dias de desenvolvimento alocados

## FASE 1: DEPENDÊNCIAS

- [ ] `npm install @tanstack/react-query @tanstack/react-query-devtools`
- [ ] Verificar versions no package.json
- [ ] `npm install` executado
- [ ] `npm run build` sem erros

## FASE 2: TIPOS & CONSTANTES

- [ ] `src/types/search.ts` criado
- [ ] `src/types/products.ts` criado
- [ ] `src/types/filters.ts` criado
- [ ] `src/types/api.ts` criado
- [ ] `src/lib/constants/search.ts` criado
- [ ] Todas constantes em um lugar
- [ ] TypeScript validation: `npx tsc --noEmit` passa

## FASE 3: UTILITÁRIOS

- [ ] `src/lib/utils/url-sync.ts` criado
- [ ] `urlToSearchQuery()` funciona
- [ ] `searchQueryToUrl()` funciona
- [ ] URL sync com browser tested
- [ ] `src/lib/search/ranking.ts` criado
- [ ] Algoritmo de ranking implementado

## FASE 4: SERVICES

- [ ] `src/lib/services/cache-key.ts` criado
- [ ] Cache key factory funciona
- [ ] `src/lib/services/query-client.ts` criado
- [ ] QueryClient configurations corretas
- [ ] Retry policies setadas
- [ ] Cache times setados

## FASE 5: DATABASE

- [ ] `src/lib/database/migrations/001_create_indexes.sql` criado
- [ ] SQL file reviewed e testado
- [ ] Índices criados no Supabase
- [ ] `SELECT * FROM pg_indexes WHERE tablename='products'` mostra ~12 índices
- [ ] `src/lib/database/queries/products.ts` criado
- [ ] Queries estão type-safe
- [ ] Queries estão otimizadas (sem SELECT *)

## FASE 6: API ROUTES

- [ ] `src/app/api/products/search/route.ts` criado
- [ ] POST /api/products/search funciona
- [ ] Retorna SearchResponse correto
- [ ] Caching headers configurados
- [ ] Error handling implementado
- [ ] `src/app/api/products/suggest/route.ts` atualizado
- [ ] GET /api/products/suggest funciona

## FASE 7: HOOKS

- [ ] `src/hooks/queries/useProducts.ts` criado
- [ ] `useProducts()` funciona com React Query
- [ ] Cache hits working (DevTools verde)
- [ ] `src/hooks/queries/useSuggestions.ts` criado
- [ ] Debounce funcionando
- [ ] Sugestões aparecem após 2 caracteres
- [ ] `src/hooks/filters/useProductFilters.ts` criado
- [ ] Filtros sincronizam com URL
- [ ] Browser back/forward funciona

## FASE 8: COMPONENTES

- [ ] `src/components/search/SearchBar.refactored.tsx` criado
- [ ] Debounce implementado
- [ ] Sugestões dropdown funciona
- [ ] `src/components/produtos/ProductGrid.refactored.tsx` criado
- [ ] Memoization funciona
- [ ] Paginação funciona
- [ ] `src/components/produtos/ProductCard.refactored.tsx` criado
- [ ] Card otimizado (memo)

## FASE 9: INTEGRAÇÃO

- [ ] `src/app/layout.tsx` atualizado com QueryClientProvider
- [ ] `src/app/home/page.tsx` refatorado para usar hooks
- [ ] React Query DevTools disponível em dev
- [ ] Sem erros de React no console

## FASE 10: TESTES

- [ ] Primeira página carrega em < 500ms
- [ ] Mudança de filtro em < 100ms
- [ ] React Query DevTools mostra cache hits
- [ ] URL atualiza quando filtros mudam
- [ ] Browser back button funciona
- [ ] Compartilhar URL funciona (copy/paste)
- [ ] Sugestões aparecem/desaparecem corretamente
- [ ] Erros são tratados gracefully

## FASE 11: VALIDAÇÃO

- [ ] TypeScript sem erros: `npx tsc --noEmit`
- [ ] ESLint sem warnings: `npm run lint`
- [ ] Build sem erros: `npm run build`
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Network tab sem requisições duplicadas

## FASE 12: PERFORMANCE

- [ ] Database query < 100ms
- [ ] Ranking < 50ms
- [ ] API response < 200ms
- [ ] React render < 100ms
- [ ] Cache hit < 50ms
- [ ] DevTools mostra verde (cache) para queries repetidas

## FASE 13: ROLLOUT

- [ ] Documentação atualizada
- [ ] Team treinado sobre nova arquitetura
- [ ] Monitoring setup (Sentry/LogRocket)
- [ ] Error tracking configured
- [ ] Analytics events setup
- [ ] Deploy para staging
- [ ] Deploy para production

## FASE 14: PÓS-DEPLOY

- [ ] Monitorar Core Web Vitals
- [ ] Monitorar erro rate (deve ser 0%)
- [ ] Monitorar cache hit rate (deve ser > 80%)
- [ ] User feedback positivo
- [ ] Database query times normal
- [ ] No slow requests

## DOCUMENTAÇÃO

- [ ] REFACTORING_README.md criado ✅
- [ ] REFACTORING_IMPLEMENTATION_GUIDE.md criado ✅
- [ ] ARCHITECTURE_COMPLETE.md criado ✅
- [ ] Code comments em arquivos complexos
- [ ] README.md team atualizado

## CLEANUP

- [ ] Arquivos antigos removidos (ou marcados como @deprecated)
- [ ] Imports otimizados (sem unused)
- [ ] Comentários removidos (exceto importantes)
- [ ] Console.logs removido (exceto erro logs)
- [ ] Dead code removido

## FINAL

- [ ] Demo com team agendada
- [ ] Feedback coletado
- [ ] Issues criadas para melhorias
- [ ] Performance baseline estabelecido
- [ ] Roadmap Phase 2 planejado

---

## SINAIS DE SUCESSO

### Green Lights ✅

```
✅ Primeira página: 200-300ms
✅ Cache hit rate: 80%+
✅ Sem requisições duplicadas
✅ URL sincronizado
✅ TypeScript: 0 errors
✅ Lighthouse: > 90
✅ Usuários: Não veem flashing/delays
✅ Team: Consegue manter/estender código
```

### Red Flags 🚨

```
🚨 Primeira página: > 500ms
🚨 Muitos console errors
🚨 Cache hit rate: < 50%
🚨 Requisições duplicadas
🚨 URL não sincroniza
🚨 TypeScript errors
🚨 Lighthouse: < 80
```

---

## ROLLBACK PLAN

Se algo der muito errado:

```bash
# 1. Revert código
git revert <commit>

# 2. Remover índices (se criar problema)
supabase migration down 001_create_indexes

# 3. Limpar React Query cache
queryClient.clear()

# 4. Voltar para versão anterior
```

---

## ESTIMATIVA DE TEMPO

```
Setup & Dependencies:     2 horas
Types & Constants:        1 hora
Utilities:               1 hora
Database & Queries:      2 horas
Services:                1 hora
API Routes:              1 hora
Hooks:                   2 horas
Components:              2 horas
Integration:             1 hora
Testing:                 2 horas
Documentation:           1 hora
─────────────────────────────
TOTAL:                   16 horas (2 dias para 1 dev)
```

---

## PRÓXIMAS FASES

Após conclusão:

- [ ] **Phase 2**: Redis cache layer
- [ ] **Phase 3**: PostgreSQL FTS (Full-Text Search)
- [ ] **Phase 4**: ML-based ranking
- [ ] **Phase 5**: Elasticsearch (1M+ products)

---

Data de Início: __________
Data de Conclusão: __________
Desenvolvedor: __________
Reviewed by: __________

✅ TUDO COMPLETO? Pronto para deploy!
