import { Component, ElementRef, afterNextRender, output, signal, viewChildren } from '@angular/core';
import { PASSCODE_HASH, PASSCODE_LENGTH } from '../data';

type Status = 'idle' | 'error' | 'ok';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

async function sha256(text: string): Promise<string | null> {
  if (!crypto.subtle) return null; // requiere https o localhost
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

@Component({
  selector: 'app-lock',
  templateUrl: './lock.html',
  styleUrl: './lock.css',
})
export class Lock {
  /** La clave es correcta: el interior debe montarse debajo. */
  readonly unlocked = output();
  /** Terminó el fundido: el bloqueo ya puede quitarse. */
  readonly closed = output();

  protected readonly slots = Array.from({ length: PASSCODE_LENGTH }, (_, i) => i);
  protected readonly status = signal<Status>('idle');
  protected readonly shaking = signal(false);
  protected readonly unlocking = signal(false);
  protected readonly message = signal('');

  private readonly cells = viewChildren<ElementRef<HTMLInputElement>>('cell');
  private readonly digits: string[] = Array(PASSCODE_LENGTH).fill('');
  private busy = false;

  constructor() {
    afterNextRender(() => this.focusAt(0));
  }

  protected onInput(i: number, el: HTMLInputElement) {
    const v = el.value.replace(/\D/g, '');
    if (this.busy || !v) { this.paint(i); return; }
    this.fill(v.length >= PASSCODE_LENGTH ? 0 : i, v.slice(0, PASSCODE_LENGTH));
  }

  protected onKeydown(i: number, e: KeyboardEvent) {
    if (this.busy) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.digits[i]) this.setDigit(i, '');
      else if (i > 0) { this.setDigit(i - 1, ''); this.focusAt(i - 1); }
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); this.focusAt(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); this.focusAt(i + 1); }
  }

  protected onPaste(i: number, e: ClipboardEvent) {
    e.preventDefault();
    if (this.busy) return;
    const t = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (t) this.fill(t.length >= PASSCODE_LENGTH ? 0 : i, t.slice(0, PASSCODE_LENGTH));
  }

  private fill(start: number, digits: string) {
    this.status.set('idle');
    this.message.set('');
    let i = start;
    for (const d of digits) { if (i >= PASSCODE_LENGTH) break; this.setDigit(i++, d); }
    if (this.digits.join('').length === PASSCODE_LENGTH) this.submit();
    else this.focusAt(i);
  }

  private async submit() {
    this.busy = true;
    const hash = await sha256(this.digits.join(''));
    if (hash === PASSCODE_HASH) {
      this.status.set('ok');
      this.cells().forEach(c => c.nativeElement.blur());
      setTimeout(() => {
        this.unlocked.emit();
        this.unlocking.set(true);
        setTimeout(() => this.closed.emit(), 320);
      }, 450);
      return;
    }
    this.status.set('error');
    this.message.set(hash === null ? 'Abre la app con https para poder entrar' : 'Clave incorrecta, intenta de nuevo');
    if (!reduced()) this.shaking.set(true);
    setTimeout(() => {
      this.shaking.set(false);
      this.digits.forEach((_, i) => this.setDigit(i, ''));
      this.busy = false;
      this.focusAt(0);
    }, reduced() ? 120 : 320);
  }

  private setDigit(i: number, v: string) {
    this.digits[i] = v;
    this.paint(i);
  }

  /** Las celdas muestran un punto en vez del dígito. */
  private paint(i: number) {
    this.cells()[i].nativeElement.value = this.digits[i] ? '•' : '';
  }

  private focusAt(i: number) {
    const c = this.cells()[Math.max(0, Math.min(PASSCODE_LENGTH - 1, i))]?.nativeElement;
    c?.focus({ preventScroll: true });
    c?.select();
  }
}
