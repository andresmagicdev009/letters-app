import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, computed, inject, model, viewChild } from '@angular/core';
import { PlayerService } from '../player.service';
import { Track } from '../data';

@Component({
  selector: 'app-player',
  imports: [NgTemplateOutlet],
  templateUrl: './player.html',
  styleUrl: './player.css',
  host: {
    '[class.is-open]': 'open()',
    '(document:keydown.escape)': 'open() && setOpen(false)',
  },
})
export class Player {
  protected readonly player = inject(PlayerService);

  /** Bottom sheet en móvil, panel lateral en desktop. */
  readonly open = model(false);

  protected readonly progress = computed(() => Math.min(1, this.player.currentTime() / this.player.duration()) * 100);

  private readonly openBtn = viewChild.required<ElementRef<HTMLButtonElement>>('openBtn');
  private readonly closeBtn = viewChild.required<ElementRef<HTMLButtonElement>>('closeBtn');
  private dragging = false;
  private touchY: number | null = null;

  protected setOpen(v: boolean) {
    this.open.set(v);
    const target = v ? this.closeBtn() : this.openBtn();
    setTimeout(() => target.nativeElement.focus({ preventScroll: true }), 310);
  }

  protected fmt(s: number) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  protected readonly round = Math.round;

  protected coverBg(t: Track) {
    return t.cover.startsWith('linear') ? t.cover : `url('${t.cover}') center / cover`;
  }

  protected onSeekStart(e: PointerEvent) {
    const bar = e.currentTarget as HTMLElement;
    bar.setPointerCapture(e.pointerId);
    this.dragging = true;
    this.seekTo(bar, e.clientX);
  }

  protected onSeekMove(e: PointerEvent) {
    if (this.dragging) this.seekTo(e.currentTarget as HTMLElement, e.clientX);
  }

  protected onSeekEnd() {
    this.dragging = false;
  }

  protected onSeekKey(e: KeyboardEvent) {
    const step = { ArrowRight: 5, ArrowLeft: -5 }[e.key];
    if (!step) return;
    e.preventDefault();
    this.player.seek(this.player.currentTime() + step);
  }

  /** Deslizar la cabecera hacia abajo cierra el panel (móvil). */
  protected onTouchStart(e: TouchEvent) {
    this.touchY = e.touches[0].clientY;
  }

  protected onTouchEnd(e: TouchEvent) {
    if (this.touchY !== null && e.changedTouches[0].clientY - this.touchY > 60) this.setOpen(false);
    this.touchY = null;
  }

  private seekTo(bar: HTMLElement, x: number) {
    const r = bar.getBoundingClientRect();
    this.player.seek(Math.min(1, Math.max(0, (x - r.left) / r.width)) * this.player.duration());
  }
}
