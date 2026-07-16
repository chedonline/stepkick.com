import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import type { RunResult, SubjectId } from './engine/types';
import { SUBJECT_BY_ID } from './subjects';
import { addStars, recordRun, setView, view, type ViewId } from './storage';
import { mountGame } from './ui/game';
import { mountHome } from './ui/home';
import { mountResults } from './ui/results';
import { mountStickers } from './ui/stickers';
import { mountCircuits } from './ui/circuits';
import { mountMemory } from './ui/memory';
import { mountSort } from './ui/sort';
import { mountTapAll } from './ui/tapall';
import { mountOrder } from './ui/order';
import { mountMaze } from './ui/maze';
import { mountMensa } from './ui/mensa';
import { h } from './ui/dom';

registerSW({ immediate: true });

// Ask the browser to keep our save (stars + stickers) durable — i.e. not evicted
// under storage pressure. localStorage already survives app restarts; this hardens
// it against automatic cleanup on an installed PWA.
if (navigator.storage?.persist) void navigator.storage.persist();

const app = document.getElementById('app')!;

// --- desktop frame + view switcher -------------------------------------
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;
// Real devices (installed PWA, any touch device, small screens) get the full
// viewport; only mouse-driven desktops get the debug frame + view switcher.
const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
const isSmallScreen = window.matchMedia('(max-width: 850px)').matches;

if (!isStandalone && !isTouchDevice && !isSmallScreen) {
  document.body.classList.add('framed');
  document.body.dataset.view = view();
  const views: { id: ViewId; label: string }[] = [
    { id: 'phone', label: '📱 Phone' },
    { id: 'ipad-p', label: 'iPad ▯' },
    { id: 'ipad-l', label: 'iPad ▭' },
  ];
  const switcher = h('div', 'view-switcher');
  for (const v of views) {
    const btn = h('button', 'view-btn', v.label);
    btn.dataset.viewId = v.id;
    btn.onclick = () => {
      document.body.dataset.view = v.id;
      setView(v.id);
      syncSwitcher();
    };
    switcher.append(btn);
  }
  function syncSwitcher(): void {
    for (const b of switcher.querySelectorAll<HTMLButtonElement>('.view-btn'))
      b.classList.toggle('is-active', b.dataset.viewId === document.body.dataset.view);
  }
  syncSwitcher();
  document.body.append(switcher);
}

// --- screen routing -----------------------------------------------------
function goHome(): void {
  mountHome(app, startGame, {
    book: showStickers,
    circuits: showCircuits,
    memory: showMemory,
    sort: () => mountSort(app, goHome),
    tapall: () => mountTapAll(app, goHome),
    order: () => mountOrder(app, goHome),
    maze: () => mountMaze(app, goHome),
    mensa: () => mountMensa(app, goHome),
  });
}

function startGame(subject: SubjectId): void {
  mountGame(app, SUBJECT_BY_ID[subject], finishGame, goHome);
}

function showStickers(): void {
  mountStickers(app, goHome);
}

function showCircuits(): void {
  mountCircuits(app, goHome);
}

function showMemory(): void {
  mountMemory(app, goHome);
}

function finishGame(result: RunResult): void {
  if (result.answered === 0) {
    goHome();
    return;
  }
  const { newBest } = recordRun(result);
  // one star per correct answer, forever — may unlock new stickers
  const { newStickers } = addStars(result.correct);
  mountResults(app, result, newBest, newStickers, startGame, goHome, showStickers);
}

goHome();
