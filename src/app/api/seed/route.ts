import { getDb, initDb } from '@/lib/db';
import { NextResponse } from 'next/server';

const initialProjects = [
  { name: '外注管理サイト', folder: 'gaityuukannri', description: '外注さんの作業管理・Chatwork通知システム', status: '稼働中', category: '業務ツール' },
  { name: '占いアプリ', folder: 'uranai-app', description: '占い学習プラットフォーム。様々な占術を学べるアプリ', status: '稼働中', category: 'アプリ' },
  { name: 'X自動投稿', folder: 'x-scheduler', description: 'X(Twitter)の予約投稿ツール。時間指定で自動投稿', status: '稼働中', category: '自動化' },
  { name: '写真スワイプ', folder: 'photo-swipe', description: '写真スワイプアプリ。Tinder風UIで写真を選別', status: '開発中', category: 'アプリ' },
  { name: 'プロジェクトハブ', folder: 'project-hub', description: 'プロジェクト管理ツール。タスク・進捗管理', status: '稼働中', category: '業務ツール' },
  { name: 'YouTube文字起こし', folder: 'youtube-transcriber', description: 'YouTube動画の文字起こしツール。字幕・要約生成', status: '稼働中', category: '自動化' },
  { name: 'メインサイト', folder: 'main', description: 'メインのWebアプリケーション', status: '稼働中', category: 'サイト' },
  { name: 'LPランディング', folder: 'lp-landing', description: 'ランディングページ。集客・コンバージョン用LP', status: '稼働中', category: 'サイト' },
  { name: '漫画クリエイター', folder: 'manga-creator', description: '漫画制作ツール。AI活用の漫画作成', status: '開発中', category: 'アプリ' },
  { name: 'カレンダー', folder: 'my-calendar', description: 'カレンダーアプリ。スケジュール管理', status: '稼働中', category: '業務ツール' },
  { name: 'マイサイト', folder: 'mysite', description: '個人サイト。ポートフォリオ・ブログ', status: '稼働中', category: 'サイト' },
  { name: 'レストラン管理', folder: 'restaurant-manager', description: 'レストラン管理システム。予約・メニュー・売上管理', status: '開発中', category: '業務ツール' },
  { name: 'Note投稿くん', folder: 'Note投稿くん', description: 'note.com自動投稿ツール。記事の予約投稿・管理', status: '稼働中', category: '自動化' },
];

export async function POST() {
  const sql = getDb();
  await initDb();

  const existing = await sql`SELECT COUNT(*) as count FROM projects`;
  if (Number(existing[0].count) > 0) {
    return NextResponse.json({ message: 'Already seeded', count: existing[0].count });
  }

  for (const p of initialProjects) {
    const commands = JSON.stringify([`cd ~/projects/${p.folder} && claude`]);
    await sql`
      INSERT INTO projects (name, folder, description, status, category, commands, prompts)
      VALUES (${p.name}, ${p.folder}, ${p.description}, ${p.status}, ${p.category}, ${commands}::jsonb, '[]'::jsonb)
    `;
  }

  return NextResponse.json({ message: 'Seeded', count: initialProjects.length });
}
