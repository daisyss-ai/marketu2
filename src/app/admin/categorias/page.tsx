'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tags,
  Plus,
  Pencil,
  Archive,
  Loader2,
  ChevronRight,
  ChevronDown,
  Folder,
  X,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCategoriesTree,
  createCategory,
  updateCategory,
  archiveCategory,
} from './actions';
import type { CategoryRow } from './actions';

const MODAL_CARD = 'bg-white rounded-3xl border border-[#EDE7FF] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<(CategoryRow & { depth: number })[]>([]);
  const [tree, setTree] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [archiving, setArchiving] = useState<CategoryRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formParentId, setFormParentId] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getCategoriesTree(true);
    if (res.success) {
      setCategories(res.data);
      setTree(res.tree);
    } else {
      toast.error(res.error || 'Erro ao carregar categorias.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormIcon('');
    setFormParentId('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const handleOpenEdit = (cat: CategoryRow) => {
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon || '');
    setFormParentId(cat.parent_id || '');
    setEditing(cat);
  };

  const handleNameChange = (value: string, isEdit: boolean) => {
    setFormName(value);
    if (!isEdit || !document.getElementById('slug-manual')?.getAttribute('data-touched')) {
      setFormSlug(slugify(value));
    }
  };

  const handleSubmitCreate = async () => {
    if (!formName.trim()) {
      toast.error('O nome é obrigatório.');
      return;
    }
    if (!formSlug.trim()) {
      toast.error('O slug é obrigatório.');
      return;
    }

    setSubmitting(true);
    const res = await createCategory({
      name: formName.trim(),
      slug: formSlug.trim(),
      icon: formIcon.trim() || undefined,
      parent_id: formParentId || null,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success('Categoria criada com sucesso!');
      setShowCreate(false);
      resetForm();
      loadData();
    } else {
      toast.error(res.error || 'Erro ao criar categoria.');
    }
  };

  const handleSubmitEdit = async () => {
    if (!editing) return;
    if (!formName.trim()) {
      toast.error('O nome é obrigatório.');
      return;
    }
    if (!formSlug.trim()) {
      toast.error('O slug é obrigatório.');
      return;
    }

    setSubmitting(true);
    const res = await updateCategory(editing.id, {
      name: formName.trim(),
      slug: formSlug.trim(),
      icon: formIcon.trim() || undefined,
      parent_id: formParentId || null,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success('Categoria atualizada com sucesso!');
      setEditing(null);
      resetForm();
      loadData();
    } else {
      toast.error(res.error || 'Erro ao atualizar categoria.');
    }
  };

  const handleArchive = async () => {
    if (!archiving) return;
    setSubmitting(true);
    const res = await archiveCategory(archiving.id);
    setSubmitting(false);

    if (res.success) {
      toast.success('Categoria arquivada com sucesso!');
      setArchiving(null);
      loadData();
    } else {
      toast.error(res.error || 'Erro ao arquivar categoria.');
    }
  };

  const activeCategories = categories.filter(c => c.is_active !== false);
  const archivedCategories = categories.filter(c => c.is_active === false);

  const filteredCategories = categories.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Tags className="w-6 h-6 text-[#4B187C]" />
            Categorias
          </h2>
          <p className="text-xs text-gray-400 font-sans mt-1">
            Gere a árvore de categorias da plataforma.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4B187C] hover:bg-[#3d1266] text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#EDE7FF] bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar categorias..."
              className="w-full text-xs bg-white border border-[#EDE7FF] rounded-xl pl-9 pr-3 py-2 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C]"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#4B187C]" />
            <p className="text-sm font-semibold text-gray-500">A carregar categorias...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
              <Tags className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Nenhuma categoria</h3>
            <p className="text-xs text-gray-400 font-sans max-w-sm">
              Ainda não existem categorias. Crie a primeira para organizar os produtos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE7FF]">
            {/* Active categories */}
            {activeCategories.length > 0 && (
              <div className="px-4 py-2 bg-gray-50/80">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Ativas ({activeCategories.length})
                </span>
              </div>
            )}
            {filteredCategories
              .filter(c => c.is_active !== false)
              .map(cat => (
                <CategoryRowComponent
                  key={cat.id}
                  category={cat}
                  onEdit={handleOpenEdit}
                  onArchive={setArchiving}
                />
              ))}

            {/* Archived categories */}
            {archivedCategories.length > 0 && (
              <div className="px-4 py-2 bg-gray-50/80 border-t border-[#EDE7FF]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Arquivadas ({archivedCategories.length})
                </span>
              </div>
            )}
            {search && filteredCategories
              .filter(c => c.is_active === false)
              .map(cat => (
                <CategoryRowComponent
                  key={cat.id}
                  category={cat}
                  onEdit={handleOpenEdit}
                  onArchive={setArchiving}
                  archived
                />
              ))}
            {!search && archivedCategories.length > 0 && (
              <div className="px-4 py-6 flex items-center justify-center text-xs text-gray-400 font-sans">
                As categorias arquivadas não aparecem nos selects de criação de produto.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={MODAL_CARD}>
            <div className="p-6 border-b border-[#EDE7FF] flex items-center justify-between">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#4B187C]" />
                Nova Categoria
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 font-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => handleNameChange(e.target.value, false)}
                  placeholder="Ex: Materiais Digitais"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#4B187C] focus:outline-none focus:ring-1 focus:ring-[#4B187C] text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug-manual"
                  type="text"
                  value={formSlug}
                  onChange={e => {
                    e.target.setAttribute('data-touched', 'true');
                    setFormSlug(e.target.value);
                  }}
                  placeholder="materiais-digitais"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#4B187C] focus:outline-none focus:ring-1 focus:ring-[#4B187C] text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Ícone (emoji)</label>
                <input
                  type="text"
                  value={formIcon}
                  onChange={e => setFormIcon(e.target.value)}
                  placeholder="📚"
                  maxLength={10}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#4B187C] focus:outline-none focus:ring-1 focus:ring-[#4B187C] text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Categoria pai (opcional)</label>
                <select
                  value={formParentId}
                  onChange={e => setFormParentId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#4B187C] focus:outline-none focus:ring-1 focus:ring-[#4B187C] text-gray-800 cursor-pointer"
                >
                  <option value="">Nenhuma (categoria raiz)</option>
                  {tree.map(cat => (
                    <ParentOptions key={cat.id} category={cat} depth={0} exclude={null} />
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitCreate}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#4B187C] hover:bg-[#3d1266] text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                Criar Categoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={MODAL_CARD}>
            <div className="p-6 border-b border-[#EDE7FF] flex items-center justify-between">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#4B187C]" />
                Editar Categoria
              </h3>
              <button
                onClick={() => { setEditing(null); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 font-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => handleNameChange(e.target.value, true)}
                  placeholder="Ex: Materiais Digitais"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#4B187C] focus:outline-none focus:ring-1 focus:ring-[#4B187C] text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug-manual"
                  type="text"
                  value={formSlug}
                  onChange={e => {
                    e.target.setAttribute('data-touched', 'true');
                    setFormSlug(e.target.value);
                  }}
                  placeholder="materiais-digitais"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#4B187C] focus:outline-none focus:ring-1 focus:ring-[#4B187C] text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Ícone (emoji)</label>
                <input
                  type="text"
                  value={formIcon}
                  onChange={e => setFormIcon(e.target.value)}
                  placeholder="📚"
                  maxLength={10}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#4B187C] focus:outline-none focus:ring-1 focus:ring-[#4B187C] text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Categoria pai (opcional)</label>
                <select
                  value={formParentId}
                  onChange={e => setFormParentId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#4B187C] focus:outline-none focus:ring-1 focus:ring-[#4B187C] text-gray-800 cursor-pointer"
                >
                  <option value="">Nenhuma (categoria raiz)</option>
                  {tree.map(cat => (
                    <ParentOptions key={cat.id} category={cat} depth={0} exclude={editing.id} />
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => { setEditing(null); resetForm(); }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#4B187C] hover:bg-[#3d1266] text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archiving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={MODAL_CARD}>
            <div className="p-6 border-b border-[#EDE7FF] flex items-center justify-between">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-600" />
                Arquivar Categoria
              </h3>
              <button
                onClick={() => setArchiving(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 font-sans">
              <div className="text-xs text-gray-500">
                <p>Está prestes a arquivar a categoria <strong className="text-gray-800">{archiving.name}</strong>.</p>
                <p className="mt-2">Os produtos associados mantêm-se, mas a categoria deixará de aparecer nos selects de criação de produto.</p>
                <p className="mt-2 font-bold text-amber-600">Pode reativá-la mais tarde, se necessário.</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setArchiving(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleArchive}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirmar Arquivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryRowComponent({
  category,
  onEdit,
  onArchive,
  archived,
}: {
  category: CategoryRow & { depth: number };
  onEdit: (cat: CategoryRow) => void;
  onArchive: (cat: CategoryRow) => void;
  archived?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="hover:bg-[#f8f7ff] transition-colors">
      <div className="flex items-center gap-3 px-4 py-3">
        <div style={{ paddingLeft: `${category.depth * 24}px` }} className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span className="shrink-0">{renderCategoryIcon(category.icon)}</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-sm font-bold truncate ${archived ? 'text-gray-400' : 'text-gray-800'}`}>
              {category.name}
            </span>
            <code className="text-[10px] text-gray-400 font-mono hidden sm:inline">/{category.slug}</code>
            {archived && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                Arquivada
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#4B187C] hover:bg-[#EDE7FF] transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {!archived && (
            <button
              onClick={() => onArchive(category)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
              title="Arquivar"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="border-t border-[#EDE7FF]/50">
          {category.children!.map(child => (
            <CategoryRowComponent
              key={child.id}
              category={{
                ...child,
                depth: category.depth + 1,
                children: child.children,
              }}
              onEdit={onEdit}
              onArchive={onArchive}
              archived={archived}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function renderCategoryIcon(icon: string | null) {
  if (icon) {
    return (
      <span className="w-5 h-5 flex items-center justify-center text-sm">
        {icon}
      </span>
    );
  }
  return <Folder className="w-4 h-4 text-gray-400" />;
}

function ParentOptions({
  category,
  depth,
  exclude,
}: {
  category: CategoryRow;
  depth: number;
  exclude: string | null;
}) {
  if (category.id === exclude) return null;

  return (
    <>
      <option value={category.id}>
        {'\u00A0'.repeat(depth * 2)}{category.name}
      </option>
      {category.children?.map(child => (
        <ParentOptions key={child.id} category={child} depth={depth + 1} exclude={exclude} />
      ))}
    </>
  );
}
