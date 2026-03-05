"use client";

import { useEffect, useState } from "react";
import {
  BookMarked, Plus, Trash2, Copy, Check, Edit2, ChevronDown,
  BookOpen, Globe, FileText, Microscope, X, Search
} from "lucide-react";
import {
  Reference, ReferenceType,
  getAllReferences, createReference, updateReference, deleteReference, formatCitation, getSettings
} from "@/lib/localStorageUtils";

type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'ACS';

const TYPE_LABELS: Record<ReferenceType, string> = {
  book: 'Book',
  article: 'Article',
  website: 'Website',
  journal: 'Journal',
};

const TYPE_ICONS: Record<ReferenceType, React.ElementType> = {
  book: BookOpen,
  article: FileText,
  website: Globe,
  journal: Microscope,
};

const emptyForm = (): Omit<Reference, 'id' | 'createdAt'> => ({
  type: 'book',
  title: '',
  authors: '',
  year: new Date().getFullYear().toString(),
  publisher: '',
  url: '',
  journal: '',
  volume: '',
  issue: '',
  pages: '',
  doi: '',
});

export default function ReferencesPage() {
  const [refs, setRefs] = useState<Reference[]>([]);
  const [filterType, setFilterType] = useState<ReferenceType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = getSettings().theme || 'dark';
    document.documentElement.className = savedTheme === 'dark' ? '' : `theme-${savedTheme}`;
    setRefs(getAllReferences());
  }, []);

  const handleSave = () => {
    if (!form.title || !form.authors) return;
    if (editingId) {
      updateReference(editingId, form);
    } else {
      createReference(form);
    }
    setRefs(getAllReferences());
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleEdit = (ref: Reference) => {
    setEditingId(ref.id);
    setForm({
      type: ref.type,
      title: ref.title,
      authors: ref.authors,
      year: ref.year,
      publisher: ref.publisher || '',
      url: ref.url || '',
      journal: ref.journal || '',
      volume: ref.volume || '',
      issue: ref.issue || '',
      pages: ref.pages || '',
      doi: ref.doi || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteReference(id);
    setRefs(getAllReferences());
  };

  const handleCopy = (ref: Reference) => {
    const citation = formatCitation(ref, citationStyle);
    navigator.clipboard.writeText(citation);
    setCopiedId(ref.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const filtered = refs.filter(r => {
    const matchType = filterType === 'all' || r.type === filterType;
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.authors.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Bibliography & References</h1>
      <p className="page-description">Manage your citations and sources. Generate APA, MLA, or Chicago style citations instantly.</p>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Search references..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Type filter */}
        <select className="input" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value as ReferenceType | 'all')}>
          <option value="all">All Types</option>
          {(Object.keys(TYPE_LABELS) as ReferenceType[]).map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        {/* Citation style */}
        <select className="input" style={{ width: 'auto' }} value={citationStyle} onChange={e => setCitationStyle(e.target.value as CitationStyle)}>
          <option value="APA">APA</option>
          <option value="MLA">MLA</option>
          <option value="Chicago">Chicago</option>
          <option value="IEEE">IEEE</option>
          <option value="ACS">ACS</option>
        </select>

        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }} style={{ whiteSpace: 'nowrap' }}>
          <Plus size={16} /> Add Reference
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookMarked size={20} color="var(--accent-color)" />
                {editingId ? 'Edit Reference' : 'Add New Reference'}
              </h2>
              <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={handleCancel}><X size={16} /></button>
            </div>

            {/* Type Selector */}
            <div className="form-group">
              <label className="form-label">Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(Object.keys(TYPE_LABELS) as ReferenceType[]).map(t => {
                  const Icon = TYPE_ICONS[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`btn ${form.type === t ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '8px' }}
                    >
                      <Icon size={14} /> {TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Title *</label>
                <input className="input" placeholder="The Great Gatsby" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Authors * <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>(comma-separated: Doe, J., Smith, A.)</span></label>
                <input className="input" placeholder="Fitzgerald, F. S." value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="input" placeholder="2024" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              </div>
              {form.type === 'book' && (
                <div className="form-group">
                  <label className="form-label">Publisher</label>
                  <input className="input" placeholder="Penguin Books" value={form.publisher} onChange={e => setForm(f => ({ ...f, publisher: e.target.value }))} />
                </div>
              )}
              {(form.type === 'journal' || form.type === 'article') && (
                <>
                  <div className="form-group">
                    <label className="form-label">Journal / Publication</label>
                    <input className="input" placeholder="Nature" value={form.journal} onChange={e => setForm(f => ({ ...f, journal: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Volume</label>
                    <input className="input" placeholder="12" value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issue</label>
                    <input className="input" placeholder="3" value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pages</label>
                    <input className="input" placeholder="45-67" value={form.pages} onChange={e => setForm(f => ({ ...f, pages: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DOI</label>
                    <input className="input" placeholder="10.1234/example" value={form.doi} onChange={e => setForm(f => ({ ...f, doi: e.target.value }))} />
                  </div>
                </>
              )}
              {form.type === 'website' && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">URL</label>
                  <input className="input" placeholder="https://example.com" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                </div>
              )}
            </div>

            {/* Preview citation */}
            {form.title && form.authors && (
              <div style={{
                marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-color)'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600 }}>{citationStyle} Preview:</span>
                <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  {formatCitation({ ...form, id: '', createdAt: '' }, citationStyle)}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.title || !form.authors}>
                {editingId ? 'Update' : 'Save'} Reference
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['all', 'book', 'article', 'website', 'journal'] as const).map(type => {
          const count = type === 'all' ? refs.length : refs.filter(r => r.type === type).length;
          return (
            <div key={type} className="card" style={{ padding: '12px 20px', textAlign: 'center', cursor: 'pointer', border: filterType === type ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', flex: 1, minWidth: '80px' }} onClick={() => setFilterType(type)}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-color)' }}>{count}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{type === 'all' ? 'Total' : TYPE_LABELS[type as ReferenceType]}s</div>
            </div>
          );
        })}
      </div>

      {/* Reference List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <BookMarked size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>{refs.length === 0 ? 'No references yet. Add your first source!' : 'No references match your filter.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(ref => {
            const Icon = TYPE_ICONS[ref.type];
            const citation = formatCitation(ref, citationStyle);
            const isExpanded = expandedId === ref.id;
            return (
              <div key={ref.id} className="card" style={{ transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={18} color="var(--accent-color)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                        color: 'var(--accent-color)', backgroundColor: 'rgba(99,102,241,0.12)',
                        padding: '1px 6px', borderRadius: '4px'
                      }}>{ref.type}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{ref.year}</span>
                    </div>
                    <p style={{ fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref.title}</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{ref.authors}</p>

                    {isExpanded && (
                      <div style={{
                        marginTop: '12px', padding: '10px 14px', backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-color)'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-color)' }}>{citationStyle}:</span>
                        <p style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>{citation}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px', borderRadius: '8px' }}
                      title="Toggle citation"
                      onClick={() => setExpandedId(isExpanded ? null : ref.id)}
                    >
                      <ChevronDown size={15} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px', borderRadius: '8px' }}
                      title={`Copy ${citationStyle} citation`}
                      onClick={() => handleCopy(ref)}
                    >
                      {copiedId === ref.id ? <Check size={15} color="var(--success-color, #22c55e)" /> : <Copy size={15} />}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px', borderRadius: '8px' }}
                      title="Edit"
                      onClick={() => handleEdit(ref)}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px', borderRadius: '8px', color: 'var(--danger-color)' }}
                      title="Delete"
                      onClick={() => handleDelete(ref.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
