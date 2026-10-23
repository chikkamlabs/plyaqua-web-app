'use client';

import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getGameWords,
  addGameWord,
  updateGameWord,
  deleteGameWord,
  getGamePoints,
  addGamePoint,
  updateGamePoint,
  deleteGamePoint,
  getGameCashbacks,
  addGameCashback,
  updateGameCashback,
  deleteGameCashback,
  GameWord,
  GamePoint,
  GameCashback,
} from '@/lib/gamePlayStore';
import {
  Gamepad2,
  BookOpen,
  Coins,
  CircleDollarSign,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
  ChevronRight,
  AlertCircle,
  Tag,
  Sliders,
} from 'lucide-react';

export default function GamePlayDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [words, setWords] = useState<GameWord[]>([]);
  const [points, setPoints] = useState<GamePoint[]>([]);
  const [cashbacks, setCashbacks] = useState<GameCashback[]>([]);
  const [loading, setLoading] = useState(true);

  // Overscreen Modal states
  const [activeModal, setActiveModal] = useState<'words' | 'points' | 'cashback' | null>(null);

  // Form states for adding
  const [newWordText, setNewWordText] = useState('');
  const [newWordStatus, setNewWordStatus] = useState<'active' | 'deactive'>('active');

  const [newPointValue, setNewPointValue] = useState<number>(10);
  const [newPointName, setNewPointName] = useState('');

  const [newCashbackFrom, setNewCashbackFrom] = useState<number>(5.0);
  const [newCashbackTo, setNewCashbackTo] = useState<number>(25.0);

  // Form states for inline editing
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editWordName, setEditWordName] = useState('');
  const [editWordStatus, setEditWordStatus] = useState<'active' | 'deactive'>('active');

  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [editPointValue, setEditPointValue] = useState<number>(0);
  const [editPointName, setEditPointName] = useState('');

  const [editingCashbackId, setEditingCashbackId] = useState<string | null>(null);
  const [editCashbackFrom, setEditCashbackFrom] = useState<number>(0);
  const [editCashbackTo, setEditCashbackTo] = useState<number>(0);

  const [savingAction, setSavingAction] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load all gameplay data
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      const [wordsRes, pointsRes, cashbacksRes] = await Promise.all([
        getGameWords(),
        getGamePoints(),
        getGameCashbacks(),
      ]);

      if (!active) return;

      if (wordsRes.data) setWords(wordsRes.data);
      if (pointsRes.data) setPoints(pointsRes.data);
      if (cashbacksRes.data) setCashbacks(cashbacksRes.data);

      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // ---------------- GAME WORDS HANDLERS ----------------
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordText.trim()) return;

    setSavingAction(true);
    setModalError(null);

    const { data, error } = await addGameWord(newWordText, newWordStatus);
    setSavingAction(false);

    if (error || !data) {
      setModalError(error?.message || 'Failed to add word');
      return;
    }

    setWords((prev) => [data, ...prev]);
    setNewWordText('');
  };

  const handleStartEditWord = (w: GameWord) => {
    setEditingWordId(w.id);
    setEditWordName(w.name);
    setEditWordStatus((w.status as 'active' | 'deactive') || 'active');
  };

  const handleSaveEditWord = async (id: string) => {
    if (!editWordName.trim()) return;
    setSavingAction(true);
    setModalError(null);

    const { data, error } = await updateGameWord(id, {
      name: editWordName,
      status: editWordStatus,
    });
    setSavingAction(false);

    if (error || !data) {
      setModalError(error?.message || 'Failed to update word');
      return;
    }

    setWords((prev) => prev.map((w) => (w.id === id ? data : w)));
    setEditingWordId(null);
  };

  const handleDeleteWord = async (id: string) => {
    const { success, error } = await deleteGameWord(id);
    if (!success) {
      setModalError(error?.message || 'Failed to delete word');
      return;
    }
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  // ---------------- GAME POINTS HANDLERS ----------------
  const handleAddPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPointName.trim()) return;

    setSavingAction(true);
    setModalError(null);

    const { data, error } = await addGamePoint(newPointValue, newPointName);
    setSavingAction(false);

    if (error || !data) {
      setModalError(error?.message || 'Failed to add game point tier');
      return;
    }

    setPoints((prev) => [...prev, data].sort((a, b) => a.values - b.values));
    setNewPointName('');
    setNewPointValue(10);
  };

  const handleStartEditPoint = (p: GamePoint) => {
    setEditingPointId(p.id);
    setEditPointValue(p.values);
    setEditPointName(p.name);
  };

  const handleSaveEditPoint = async (id: string) => {
    if (!editPointName.trim()) return;
    setSavingAction(true);
    setModalError(null);

    const { data, error } = await updateGamePoint(id, {
      values: editPointValue,
      name: editPointName,
    });
    setSavingAction(false);

    if (error || !data) {
      setModalError(error?.message || 'Failed to update point');
      return;
    }

    setPoints((prev) => prev.map((p) => (p.id === id ? data : p)).sort((a, b) => a.values - b.values));
    setEditingPointId(null);
  };

  const handleDeletePoint = async (id: string) => {
    const { success, error } = await deleteGamePoint(id);
    if (!success) {
      setModalError(error?.message || 'Failed to delete point tier');
      return;
    }
    setPoints((prev) => prev.filter((p) => p.id !== id));
  };

  // ---------------- GAME CASHBACK HANDLERS ----------------
  const handleAddCashback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCashbackFrom > newCashbackTo) {
      setModalError('"Range From" cannot be greater than "Range To"');
      return;
    }

    setSavingAction(true);
    setModalError(null);

    const { data, error } = await addGameCashback(newCashbackFrom, newCashbackTo);
    setSavingAction(false);

    if (error || !data) {
      setModalError(error?.message || 'Failed to add cashback range');
      return;
    }

    setCashbacks((prev) => [...prev, data].sort((a, b) => a.range_from - b.range_from));
    setNewCashbackFrom(5.0);
    setNewCashbackTo(25.0);
  };

  const handleStartEditCashback = (c: GameCashback) => {
    setEditingCashbackId(c.id);
    setEditCashbackFrom(c.range_from);
    setEditCashbackTo(c.range_to);
  };

  const handleSaveEditCashback = async (id: string) => {
    if (editCashbackFrom > editCashbackTo) {
      setModalError('"Range From" cannot be greater than "Range To"');
      return;
    }

    setSavingAction(true);
    setModalError(null);

    const { data, error } = await updateGameCashback(id, {
      range_from: editCashbackFrom,
      range_to: editCashbackTo,
    });
    setSavingAction(false);

    if (error || !data) {
      setModalError(error?.message || 'Failed to update cashback range');
      return;
    }

    setCashbacks((prev) => prev.map((c) => (c.id === id ? data : c)).sort((a, b) => a.range_from - b.range_from));
    setEditingCashbackId(null);
  };

  const handleDeleteCashback = async (id: string) => {
    const { success, error } = await deleteGameCashback(id);
    if (!success) {
      setModalError(error?.message || 'Failed to delete cashback range');
      return;
    }
    setCashbacks((prev) => prev.filter((c) => c.id !== id));
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalError(null);
    setEditingWordId(null);
    setEditingPointId(null);
    setEditingCashbackId(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Heading Game Play */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gamepad2
                  className="w-5 h-5"
                  style={{ color: 'var(--color-secondary)' }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Interactive Rewards Engine
                </span>
              </div>
              <h1 className="page-title text-2xl font-bold">
                Game Play
              </h1>
              <p className="body-text text-xs mt-1">
                Configure game words dictionary, reward points tiering, and cashback reward ranges.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="card-base p-12 text-center">
              <Loader2 className="w-8 h-8 anim-spin mx-auto mb-3 text-[var(--color-secondary)]" />
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                Loading Game Play configurations...
              </p>
            </div>
          ) : (
            /* 3 Core Interactive Cards */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Game Words Card */}
              <div
                onClick={() => {
                  setModalError(null);
                  setActiveModal('words');
                }}
                className="card-interactive p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="badge-base badge-primary text-xs font-mono">
                      {words.length} Words
                    </span>
                  </div>

                  <h2 className="section-title text-lg font-bold mb-1">
                    Game Words
                  </h2>
                  <p className="body-text text-xs mb-4">
                    Word dictionary for puzzle and guessing game modes. Tap to view all words and edit.
                  </p>

                  {/* Word Preview Chips */}
                  <div className="flex flex-wrap gap-1.5 min-h-[4rem]">
                    {words.slice(0, 5).map((w) => (
                      <span
                        key={w.id}
                        className="px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-mono font-medium flex items-center gap-1.5"
                        style={{
                          backgroundColor: 'var(--color-surface-muted)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        <Tag className="w-3 h-3 text-[var(--color-secondary)]" />
                        <span>{w.name}</span>
                      </span>
                    ))}
                    {words.length > 5 && (
                      <span className="px-2 py-1 text-xs text-[var(--color-text-muted)] font-mono">
                        +{words.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="mt-6 pt-4 border-t flex items-center justify-between text-xs font-semibold"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <span>Tap to view &amp; edit words</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* 2. Game Points Card */}
              <div
                onClick={() => {
                  setModalError(null);
                  setActiveModal('points');
                }}
                className="card-interactive p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: 'var(--color-secondary-light)',
                        color: 'var(--color-secondary)',
                      }}
                    >
                      <Coins className="w-6 h-6" />
                    </div>
                    <span className="badge-base badge-secondary text-xs font-mono">
                      {points.length} Tiers
                    </span>
                  </div>

                  <h2 className="section-title text-lg font-bold mb-1">
                    Game Points
                  </h2>
                  <p className="body-text text-xs mb-4">
                    Reward points tiers distributed during gameplay. Tap to view and edit point values.
                  </p>

                  {/* Points Preview list */}
                  <div className="space-y-1.5 min-h-[4rem]">
                    {points.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-[var(--radius-sm)] text-xs"
                        style={{
                          backgroundColor: 'var(--color-surface-hover)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        <span className="font-medium truncate mr-2" style={{ color: 'var(--color-text-primary)' }}>
                          {p.name}
                        </span>
                        <span className="font-mono font-bold" style={{ color: 'var(--color-secondary)' }}>
                          {p.values} pts
                        </span>
                      </div>
                    ))}
                    {points.length > 3 && (
                      <p className="text-xs text-[var(--color-text-muted)] text-right">
                        +{points.length - 3} more tiers
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className="mt-6 pt-4 border-t flex items-center justify-between text-xs font-semibold"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <span>Tap to view &amp; edit points</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* 3. Game Cashback Card */}
              <div
                onClick={() => {
                  setModalError(null);
                  setActiveModal('cashback');
                }}
                className="card-interactive p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: 'var(--color-success-light)',
                        color: 'var(--color-success-text)',
                      }}
                    >
                      <CircleDollarSign className="w-6 h-6" />
                    </div>
                    <span className="badge-base badge-success text-xs font-mono">
                      {cashbacks.length} Ranges
                    </span>
                  </div>

                  <h2 className="section-title text-lg font-bold mb-1">
                    Game Cashback
                  </h2>
                  <p className="body-text text-xs mb-4">
                    From range to range reward intervals for cashback games. Tap to view and edit ranges.
                  </p>

                  {/* Cashback Ranges Preview list */}
                  <div className="space-y-1.5 min-h-[4rem]">
                    {cashbacks.slice(0, 3).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-[var(--radius-sm)] text-xs"
                        style={{
                          backgroundColor: 'var(--color-surface-hover)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        <span className="text-[var(--color-text-secondary)]">Range:</span>
                        <span className="font-mono font-bold" style={{ color: 'var(--color-success-text)' }}>
                          ${Number(c.range_from).toFixed(2)} → ${Number(c.range_to).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {cashbacks.length > 3 && (
                      <p className="text-xs text-[var(--color-text-muted)] text-right">
                        +{cashbacks.length - 3} more ranges
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className="mt-6 pt-4 border-t flex items-center justify-between text-xs font-semibold"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <span>Tap to view &amp; edit cashback</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================================
          OVERSCREEN MODAL 1: GAME WORDS (Display & Edit from game_words table)
          ====================================================================== */}
      {activeModal === 'words' && (
        <div className="dialog-overlay anim-fade-in" onClick={closeModal}>
          <div
            className="dialog-content max-w-2xl max-h-[90vh] flex flex-col anim-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="dialog-header">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="card-title text-base font-bold">
                    Game Words Dictionary (game_words)
                  </h3>
                  <p className="small-text text-[var(--color-text-muted)]">
                    View words list and edit existing entries in Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="btn-icon"
                title="Close Overscreen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="dialog-body flex-1 overflow-y-auto space-y-4">
              {modalError && (
                <div
                  className="p-3 rounded-[var(--radius-md)] flex items-center gap-2 text-xs border"
                  style={{
                    backgroundColor: 'var(--color-danger-light)',
                    color: 'var(--color-danger-text)',
                    borderColor: 'var(--color-danger-border)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Add New Word Form */}
              <form onSubmit={handleAddWord} className="p-3.5 rounded-[var(--radius-lg)] border bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] space-y-3">
                <span className="label-text block font-semibold text-xs">
                  Add New Game Word
                </span>
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <input
                    type="text"
                    value={newWordText}
                    onChange={(e) => setNewWordText(e.target.value.toUpperCase())}
                    placeholder="Enter word (e.g. WATERFALL)..."
                    className="input-base text-xs font-mono uppercase flex-1"
                    required
                  />
                  <select
                    value={newWordStatus}
                    onChange={(e) => setNewWordStatus(e.target.value as 'active' | 'deactive')}
                    className="select-base text-xs w-full sm:w-32"
                  >
                    <option value="active">Active</option>
                    <option value="deactive">Deactive</option>
                  </select>
                  <button
                    type="submit"
                    disabled={savingAction || !newWordText.trim()}
                    className="btn-base btn-primary text-xs py-2 px-3.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Word</span>
                  </button>
                </div>
              </form>

              {/* List of Words with Edit Controls */}
              <div className="table-container border">
                <table className="table-base">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Word (name)</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {words.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="table-cell text-center py-8 text-xs text-[var(--color-text-muted)]">
                          No words found in game_words. Add your first word above!
                        </td>
                      </tr>
                    ) : (
                      words.map((w) => {
                        const isEditing = editingWordId === w.id;
                        return (
                          <tr key={w.id} className="table-row">
                            {/* Name */}
                            <td className="table-cell">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editWordName}
                                  onChange={(e) => setEditWordName(e.target.value.toUpperCase())}
                                  className="input-base text-xs font-mono uppercase py-1"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-mono font-bold text-sm tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
                                  {w.name}
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="table-cell">
                              {isEditing ? (
                                <select
                                  value={editWordStatus}
                                  onChange={(e) => setEditWordStatus(e.target.value as 'active' | 'deactive')}
                                  className="select-base text-xs py-1"
                                >
                                  <option value="active">Active</option>
                                  <option value="deactive">Deactive</option>
                                </select>
                              ) : w.status === 'active' ? (
                                <span className="status-chip status-chip-active">
                                  Active
                                </span>
                              ) : (
                                <span className="status-chip status-chip-inactive">
                                  Deactive
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="table-cell text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditWord(w.id)}
                                    disabled={savingAction}
                                    className="btn-base btn-secondary text-xs py-1 px-2.5"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingWordId(null)}
                                    className="btn-base btn-outline text-xs py-1 px-2.5"
                                  >
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditWord(w)}
                                    className="btn-icon w-7 h-7 text-slate-500 hover:text-[var(--color-primary)]"
                                    title="Edit word"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWord(w.id)}
                                    className="btn-icon w-7 h-7 text-red-500 hover:text-red-700"
                                    title="Delete word"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="dialog-footer">
              <button
                type="button"
                onClick={closeModal}
                className="btn-base btn-primary text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          OVERSCREEN MODAL 2: GAME POINTS (View & Edit from game_points table)
          ====================================================================== */}
      {activeModal === 'points' && (
        <div className="dialog-overlay anim-fade-in" onClick={closeModal}>
          <div
            className="dialog-content max-w-2xl max-h-[90vh] flex flex-col anim-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="dialog-header">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-secondary-light)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="card-title text-base font-bold">
                    Game Points Tiers (game_points)
                  </h3>
                  <p className="small-text text-[var(--color-text-muted)]">
                    View point rewards and edit tier configurations in Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="btn-icon"
                title="Close Overscreen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="dialog-body flex-1 overflow-y-auto space-y-4">
              {modalError && (
                <div
                  className="p-3 rounded-[var(--radius-md)] flex items-center gap-2 text-xs border"
                  style={{
                    backgroundColor: 'var(--color-danger-light)',
                    color: 'var(--color-danger-text)',
                    borderColor: 'var(--color-danger-border)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Add New Point Form */}
              <form onSubmit={handleAddPoint} className="p-3.5 rounded-[var(--radius-lg)] border bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] space-y-3">
                <span className="label-text block font-semibold text-xs">
                  Add New Game Point Tier
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div className="form-group sm:col-span-2">
                    <label className="form-label text-[11px]">Reward Label / Name</label>
                    <input
                      type="text"
                      value={newPointName}
                      onChange={(e) => setNewPointName(e.target.value)}
                      placeholder="e.g. Diamond Wave"
                      className="input-base text-xs"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-[11px]">Point Value (values)</label>
                    <input
                      type="number"
                      min={1}
                      value={newPointValue}
                      onChange={(e) => setNewPointValue(Math.max(1, parseInt(e.target.value) || 0))}
                      className="input-base text-xs font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingAction || !newPointName.trim()}
                    className="btn-base btn-primary text-xs py-1.5 px-3.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Point Tier</span>
                  </button>
                </div>
              </form>

              {/* Table of Points */}
              <div className="table-container border">
                <table className="table-base">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Reward Label (name)</th>
                      <th className="table-header-cell w-36">Points (values)</th>
                      <th className="table-header-cell text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="table-cell text-center py-8 text-xs text-[var(--color-text-muted)]">
                          No point tiers configured in game_points. Add one above!
                        </td>
                      </tr>
                    ) : (
                      points.map((p) => {
                        const isEditing = editingPointId === p.id;
                        return (
                          <tr key={p.id} className="table-row">
                            {/* Name */}
                            <td className="table-cell">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editPointName}
                                  onChange={(e) => setEditPointName(e.target.value)}
                                  className="input-base text-xs py-1"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                  {p.name}
                                </span>
                              )}
                            </td>

                            {/* Values */}
                            <td className="table-cell">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={1}
                                  value={editPointValue}
                                  onChange={(e) => setEditPointValue(Math.max(1, parseInt(e.target.value) || 0))}
                                  className="input-base text-xs font-mono py-1 w-28"
                                />
                              ) : (
                                <span className="badge-base badge-secondary text-xs font-mono font-bold">
                                  {p.values} pts
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="table-cell text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditPoint(p.id)}
                                    disabled={savingAction}
                                    className="btn-base btn-secondary text-xs py-1 px-2.5"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPointId(null)}
                                    className="btn-base btn-outline text-xs py-1 px-2.5"
                                  >
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditPoint(p)}
                                    className="btn-icon w-7 h-7 text-slate-500 hover:text-[var(--color-primary)]"
                                    title="Edit point tier"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePoint(p.id)}
                                    className="btn-icon w-7 h-7 text-red-500 hover:text-red-700"
                                    title="Delete point tier"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="dialog-footer">
              <button
                type="button"
                onClick={closeModal}
                className="btn-base btn-primary text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          OVERSCREEN MODAL 3: GAME CASHBACK (From Range to Range: game_cashback)
          ====================================================================== */}
      {activeModal === 'cashback' && (
        <div className="dialog-overlay anim-fade-in" onClick={closeModal}>
          <div
            className="dialog-content max-w-2xl max-h-[90vh] flex flex-col anim-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="dialog-header">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-success-light)',
                    color: 'var(--color-success-text)',
                  }}
                >
                  <CircleDollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="card-title text-base font-bold">
                    Game Cashback Ranges (game_cashback)
                  </h3>
                  <p className="small-text text-[var(--color-text-muted)]">
                    Configure minimum and maximum cashback limits (from range to range)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="btn-icon"
                title="Close Overscreen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="dialog-body flex-1 overflow-y-auto space-y-4">
              {modalError && (
                <div
                  className="p-3 rounded-[var(--radius-md)] flex items-center gap-2 text-xs border"
                  style={{
                    backgroundColor: 'var(--color-danger-light)',
                    color: 'var(--color-danger-text)',
                    borderColor: 'var(--color-danger-border)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Add New Range Form */}
              <form onSubmit={handleAddCashback} className="p-3.5 rounded-[var(--radius-lg)] border bg-[var(--color-surface-hover)] border-[var(--color-border-subtle)] space-y-3">
                <span className="label-text block font-semibold text-xs">
                  Add New Cashback Range (from range to range)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="form-group">
                    <label className="form-label text-[11px]">Range From ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={newCashbackFrom}
                      onChange={(e) => setNewCashbackFrom(Number(e.target.value))}
                      className="input-base text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-[11px]">Range To ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={newCashbackTo}
                      onChange={(e) => setNewCashbackTo(Number(e.target.value))}
                      className="input-base text-xs font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingAction}
                    className="btn-base btn-primary text-xs py-1.5 px-3.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Cashback Range</span>
                  </button>
                </div>
              </form>

              {/* Table of Ranges */}
              <div className="table-container border">
                <table className="table-base">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Range From ($)</th>
                      <th className="table-header-cell">Range To ($)</th>
                      <th className="table-header-cell">Formatted Interval</th>
                      <th className="table-header-cell text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashbacks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="table-cell text-center py-8 text-xs text-[var(--color-text-muted)]">
                          No cashback intervals configured in game_cashback. Add a range above!
                        </td>
                      </tr>
                    ) : (
                      cashbacks.map((c) => {
                        const isEditing = editingCashbackId === c.id;
                        return (
                          <tr key={c.id} className="table-row">
                            {/* Range From */}
                            <td className="table-cell">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={editCashbackFrom}
                                  onChange={(e) => setEditCashbackFrom(Number(e.target.value))}
                                  className="input-base text-xs font-mono py-1 w-28"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-mono font-medium text-xs">
                                  ${Number(c.range_from).toFixed(2)}
                                </span>
                              )}
                            </td>

                            {/* Range To */}
                            <td className="table-cell">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={editCashbackTo}
                                  onChange={(e) => setEditCashbackTo(Number(e.target.value))}
                                  className="input-base text-xs font-mono py-1 w-28"
                                />
                              ) : (
                                <span className="font-mono font-medium text-xs">
                                  ${Number(c.range_to).toFixed(2)}
                                </span>
                              )}
                            </td>

                            {/* Formatted */}
                            <td className="table-cell">
                              <span className="badge-base badge-success font-mono font-bold text-xs">
                                ${Number(c.range_from).toFixed(2)} – ${Number(c.range_to).toFixed(2)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="table-cell text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditCashback(c.id)}
                                    disabled={savingAction}
                                    className="btn-base btn-secondary text-xs py-1 px-2.5"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCashbackId(null)}
                                    className="btn-base btn-outline text-xs py-1 px-2.5"
                                  >
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditCashback(c)}
                                    className="btn-icon w-7 h-7 text-slate-500 hover:text-[var(--color-primary)]"
                                    title="Edit range"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCashback(c.id)}
                                    className="btn-icon w-7 h-7 text-red-500 hover:text-red-700"
                                    title="Delete range"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="dialog-footer">
              <button
                type="button"
                onClick={closeModal}
                className="btn-base btn-primary text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
