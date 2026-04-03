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

const statusTextColors: Record<string, string> = {
  '稼働中': 'text-green-400',
  '開発中': 'text-yellow-400',
  '停止中': 'text-red-400',
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
    setLoading(false);
  }, [search]);

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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Add Project Modal */}
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Project Dashboard</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
          >
            + 新規プロジェクト
          </button>
        </div>

        {/* Ask Claude - Top Banner */}
        <div className="mb-6 p-4 bg-purple-900/30 border border-purple-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 mr-4">
              <h2 className="text-sm font-bold text-purple-300 mb-1">Claudeに起動コマンドを聞く</h2>
              <p className="text-xs text-gray-400">
                {selected
                  ? `「${selected.name}」の起動コマンドを聞くプロンプトをコピー`
                  : 'プロジェクトを選択してプロンプトをコピー'}
              </p>
            </div>
            <CopyButton
              text={
                selected
                  ? `${selected.name}の起動コマンドと開発環境のセットアップ手順を教えて。フォルダは ~/projects/${selected.folder} です。`
                  : 'このプロジェクトの起動コマンドと開発環境のセットアップ手順を教えて。'
              }
              label="コピーして聞く"
              copiedLabel="Copied!"
            />
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="プロジェクトを検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-sm mb-6 focus:outline-none focus:border-blue-500"
        />

        {/* Detail Panel (shown above list when project selected) */}
        {selected && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${statusColors[selected.status]}`} />
                {editingField === 'name' ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => saveEdit('name')}
                    onKeyDown={e => e.key === 'Enter' && saveEdit('name')}
                    className="text-xl font-bold bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <h2
                    className="text-xl font-bold cursor-pointer hover:text-blue-400"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedId(null)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                >
                  閉じる
                </button>
                <button
                  onClick={() => deleteProject(selected.id)}
                  className="px-3 py-1 bg-red-900 hover:bg-red-800 rounded text-sm transition-colors"
                >
                  削除
                </button>
              </div>
            </div>

            {/* Folder */}
            <div className="mb-3">
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
            <div className="mb-5">
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

            {/* Quick Copy: first command */}
            {selected.commands && selected.commands.length > 0 && (
              <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">起動コマンド</span>
                    <code className="block mt-1 text-sm font-mono text-green-400 truncate">{selected.commands[0]}</code>
                  </div>
                  <CopyButton text={selected.commands[0]} />
                </div>
              </div>
            )}

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
        )}

        {/* Project List (center) */}
        <div className="grid gap-3">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
              className={`w-full text-left px-5 py-4 rounded-lg border transition-colors ${
                selectedId === p.id
                  ? 'bg-gray-800 border-blue-500'
                  : 'bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColors[p.status] || 'bg-gray-500'}`} />
                  <span className="font-medium truncate">{p.name}</span>
                  <span className={`text-xs ${statusTextColors[p.status] || 'text-gray-500'}`}>{p.status}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {p.commands && p.commands.length > 0 && (
                    <span
                      className="text-xs text-gray-500 font-mono truncate max-w-48 hidden sm:inline"
                    >
                      {p.commands[0]}
                    </span>
                  )}
                  <CopyButton text={p.commands?.[0] || `cd ~/projects/${p.folder} && claude`} />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1.5 ml-5.5 truncate">{p.description}</div>
            </button>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            プロジェクトがありません。新規プロジェクトを追加してください。
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
          <div key={idx} className="flex items-start gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3">
            {editingIdx === idx ? (
              <textarea
                autoFocus
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => {
                  onUpdate(idx, editVal);
                  setEditingIdx(null);
                }}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-blue-500"
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
