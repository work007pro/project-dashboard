'use client';

import { useState, useEffect, useCallback } from 'react';
import CopyButton from './CopyButton';

interface Project {
  id: number;
  name: string;
  folder: string;
  description: string;
  status: string;
  commands: string[];
  prompts: string[];
}

const statusColors: Record<string, string> = {
  '稼働中': 'bg-green-500',
  '開発中': 'bg-yellow-500',
  '停止中': 'bg-red-500',
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchProjects = useCallback(async () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/projects${params}`);
    const data = await res.json();
    setProjects(data);
    if (data.length > 0 && !selectedId) {
      setSelectedId(data[0].id);
    }
    setLoading(false);
  }, [search, selectedId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const selected = projects.find(p => p.id === selectedId) || null;

  const updateProject = async (id: number, updates: Partial<Project>) => {
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await fetchProjects();
  };

  const deleteProject = async (id: number) => {
    if (!confirm('このプロジェクトを削除しますか？')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setSelectedId(null);
    await fetchProjects();
  };

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const saveEdit = async (field: string) => {
    if (!selected) return;
    await updateProject(selected.id, { [field]: editValue });
    setEditingField(null);
  };

  const addItem = async (field: 'commands' | 'prompts', value: string) => {
    if (!selected || !value.trim()) return;
    const current = selected[field] || [];
    await updateProject(selected.id, { [field]: [...current, value.trim()] });
  };

  const removeItem = async (field: 'commands' | 'prompts', index: number) => {
    if (!selected) return;
    const current = [...(selected[field] || [])];
    current.splice(index, 1);
    await updateProject(selected.id, { [field]: current });
  };

  const updateItem = async (field: 'commands' | 'prompts', index: number, value: string) => {
    if (!selected) return;
    const current = [...(selected[field] || [])];
    current[index] = value;
    await updateProject(selected.id, { [field]: current });
  };

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        folder: formData.get('folder'),
        description: formData.get('description'),
        status: formData.get('status'),
      }),
    });
    const newProject = await res.json();
    setShowAddForm(false);
    setSelectedId(newProject.id);
    await fetchProjects();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold mb-3">Project Dashboard</h1>
          <input
            type="text"
            placeholder="検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                selectedId === p.id ? 'bg-gray-800 border-l-2 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusColors[p.status] || 'bg-gray-500'}`} />
                <span className="text-sm font-medium truncate">{p.name}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 truncate">~/{p.folder}</div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
          >
            + 新規プロジェクト
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <form onSubmit={handleAddProject} className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
              <h2 className="text-lg font-bold mb-4">新規プロジェクト追加</h2>
              <div className="space-y-3">
                <input name="name" placeholder="プロジェクト名" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500" />
                <input name="folder" placeholder="フォルダ名（~/projects/以下）" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500" />
                <textarea name="description" placeholder="説明文" rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500" />
                <select name="status" defaultValue="開発中" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500">
                  <option value="稼働中">稼働中</option>
                  <option value="開発中">開発中</option>
                  <option value="停止中">停止中</option>
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">追加</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium">キャンセル</button>
              </div>
            </form>
          </div>
        )}

        {selected ? (
          <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${statusColors[selected.status]}`} />
                {editingField === 'name' ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => saveEdit('name')}
                    onKeyDown={e => e.key === 'Enter' && saveEdit('name')}
                    className="text-2xl font-bold bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <h2
                    className="text-2xl font-bold cursor-pointer hover:text-blue-400"
                    onClick={() => startEdit('name', selected.name)}
                  >
                    {selected.name}
                  </h2>
                )}
                <select
                  value={selected.status}
                  onChange={e => updateProject(selected.id, { status: e.target.value })}
                  className="text-sm bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="稼働中">稼働中</option>
                  <option value="開発中">開発中</option>
                  <option value="停止中">停止中</option>
                </select>
              </div>
              <button
                onClick={() => deleteProject(selected.id)}
                className="px-3 py-1 bg-red-900 hover:bg-red-800 rounded text-sm transition-colors"
              >
                削除
              </button>
            </div>

            {/* Folder */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider">フォルダ</label>
              {editingField === 'folder' ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => saveEdit('folder')}
                  onKeyDown={e => e.key === 'Enter' && saveEdit('folder')}
                  className="block w-full mt-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p
                  className="mt-1 text-sm text-gray-300 cursor-pointer hover:text-blue-400"
                  onClick={() => startEdit('folder', selected.folder)}
                >
                  ~/projects/{selected.folder}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="text-xs text-gray-500 uppercase tracking-wider">説明</label>
              {editingField === 'description' ? (
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => saveEdit('description')}
                  rows={3}
                  className="block w-full mt-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p
                  className="mt-1 text-sm text-gray-300 cursor-pointer hover:text-blue-400 whitespace-pre-wrap"
                  onClick={() => startEdit('description', selected.description)}
                >
                  {selected.description || 'クリックして説明を追加...'}
                </p>
              )}
            </div>

            {/* Commands */}
            <ItemList
              title="起動コマンド"
              items={selected.commands || []}
              onAdd={val => addItem('commands', val)}
              onRemove={idx => removeItem('commands', idx)}
              onUpdate={(idx, val) => updateItem('commands', idx, val)}
              placeholder="コマンドを追加..."
            />

            {/* Prompts */}
            <ItemList
              title="よく使うプロンプト"
              items={selected.prompts || []}
              onAdd={val => addItem('prompts', val)}
              onRemove={idx => removeItem('prompts', idx)}
              onUpdate={(idx, val) => updateItem('prompts', idx, val)}
              placeholder="プロンプトを追加..."
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>プロジェクトを選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemList({
  title,
  items,
  onAdd,
  onRemove,
  onUpdate,
  placeholder,
}: {
  title: string;
  items: string[];
  onAdd: (val: string) => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, val: string) => void;
  placeholder: string;
}) {
  const [newValue, setNewValue] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 bg-gray-900 border border-gray-800 rounded-lg p-3">
            {editingIdx === idx ? (
              <textarea
                autoFocus
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => {
                  onUpdate(idx, editVal);
                  setEditingIdx(null);
                }}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-blue-500"
                rows={2}
              />
            ) : (
              <code
                className="flex-1 text-sm font-mono text-gray-200 whitespace-pre-wrap cursor-pointer hover:text-blue-400"
                onClick={() => {
                  setEditingIdx(idx);
                  setEditVal(item);
                }}
              >
                {item}
              </code>
            )}
            <CopyButton text={item} />
            <button
              onClick={() => onRemove(idx)}
              className="px-2 py-1 text-gray-500 hover:text-red-400 text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && newValue.trim()) {
              onAdd(newValue);
              setNewValue('');
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm font-mono focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => {
            if (newValue.trim()) {
              onAdd(newValue);
              setNewValue('');
            }
          }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
        >
          追加
        </button>
      </div>
    </div>
  );
}
