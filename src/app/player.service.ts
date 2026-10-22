import { Injectable, computed, signal } from '@angular/core';
import { TRACKS } from './data';

const FAVS_KEY = 'cartas.favs';

/** Único dueño del <audio>: la vista solo lee signals y llama acciones. */
@Injectable({ providedIn: 'root' })
export class PlayerService {
  readonly tracks = TRACKS;

  private readonly audio = new Audio();
  private readonly metaDuration = signal(0);

  readonly index = signal(0);
  readonly playing = signal(false);
  readonly currentTime = signal(0);
  readonly favorites = signal(new Set<number>(readFavs()));

  readonly track = computed(() => this.tracks[this.index()]);
  readonly duration = computed(() => this.metaDuration() || this.track().duration);

  constructor() {
    const a = this.audio;
    a.preload = 'metadata';
    a.addEventListener('timeupdate', () => this.currentTime.set(a.currentTime));
    a.addEventListener('loadedmetadata', () => this.metaDuration.set(isFinite(a.duration) ? a.duration : 0));
    a.addEventListener('play', () => this.playing.set(true));
    a.addEventListener('pause', () => this.playing.set(false));
    a.addEventListener('ended', () => this.next());
    this.load(0, false);
  }

  toggle() {
    if (this.audio.paused) this.audio.play().catch(() => {});
    else this.audio.pause();
  }

  select(i: number) {
    if (i === this.index()) this.toggle();
    else this.load(i, true);
  }

  next() {
    this.load(this.index() + 1, true);
  }

  /** Igual que en cualquier reproductor: si ya avanzó más de 3 s, vuelve al inicio. */
  prev() {
    if (this.audio.currentTime > 3) this.seek(0);
    else this.load(this.index() - 1, true);
  }

  seek(seconds: number) {
    const t = Math.min(this.duration(), Math.max(0, seconds));
    this.audio.currentTime = t;
    this.currentTime.set(t);
  }

  toggleFavorite(i: number) {
    const favs = new Set(this.favorites());
    if (favs.has(i)) favs.delete(i);
    else favs.add(i);
    this.favorites.set(favs);
    try { localStorage.setItem(FAVS_KEY, JSON.stringify([...favs])); } catch {}
  }

  private load(i: number, autoplay: boolean) {
    const n = this.tracks.length;
    this.index.set((i + n) % n);
    this.metaDuration.set(0);
    this.currentTime.set(0);
    this.audio.src = this.track().src;
    if (autoplay) this.audio.play().catch(() => {});
  }
}

function readFavs(): number[] {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'); } catch { return []; }
}
