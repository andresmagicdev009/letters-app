import { Component, DOCUMENT, DestroyRef, ElementRef, effect, inject, signal, viewChildren } from '@angular/core';
import { LETTERS } from '../data';
import { Player } from '../player/player';

type Theme = 'rosa' | 'rojo' | 'azul';

const THEME_KEY = 'cartas.theme';
const KEY_STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

@Component({
  selector: 'app-home',
  imports: [Player],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly document = inject(DOCUMENT);

  protected readonly letters = LETTERS;
  protected readonly letter = LETTERS[0];
  protected readonly themes: { name: Theme; label: string; color: string }[] = [
    { name: 'rosa', label: 'Rosa', color: 'linear-gradient(135deg,#EC5C8A,#B8365F)' },
    { name: 'rojo', label: 'Rojo', color: 'linear-gradient(135deg,#E5484D,#8E1A24)' },
    { name: 'azul', label: 'Azul', color: 'linear-gradient(135deg,#5B8DEF,#1E3A8A)' },
  ];
  protected readonly theme = signal<Theme>(readTheme());
  private readonly desktop = matchMedia('(min-width: 1024px)');
  /** En desktop el panel lateral empieza abierto. */
  protected readonly playerOpen = signal(this.desktop.matches);

  private readonly themeButtons = viewChildren<ElementRef<HTMLButtonElement>>('themeOpt');

  constructor() {
    this.document.body.style.background = 'var(--surface)';
    const onResize = (e: MediaQueryListEvent) => this.playerOpen.set(e.matches);
    this.desktop.addEventListener('change', onResize);
    inject(DestroyRef).onDestroy(() => this.desktop.removeEventListener('change', onResize));
    effect(() => {
      const name = this.theme();
      const root = this.document.documentElement;
      if (name === 'rosa') delete root.dataset['theme'];
      else root.dataset['theme'] = name;
      try { localStorage.setItem(THEME_KEY, name); } catch {}
    });
  }

  /** Radiogroup accesible: las flechas mueven la selección y el foco. */
  protected onThemeKeydown(i: number, e: KeyboardEvent) {
    const step = KEY_STEP[e.key];
    if (!step) return;
    e.preventDefault();
    const n = (i + step + this.themes.length) % this.themes.length;
    this.theme.set(this.themes[n].name);
    this.themeButtons()[n].nativeElement.focus();
  }
}

function readTheme(): Theme {
  let saved: string | null = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch {}
  return saved === 'rojo' || saved === 'azul' ? saved : 'rosa';
}
