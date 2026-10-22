import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  afterEach(() => vi.unstubAllGlobals());

  async function render() {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function type(el: HTMLElement, code: string) {
    const cell = el.querySelector<HTMLInputElement>('.cell')!;
    cell.value = code;
    cell.dispatchEvent(new Event('input'));
  }

  it('asks for the 8-digit passcode first', async () => {
    const el = await render();
    expect(el.querySelectorAll('.cell').length).toBe(8);
    expect(el.querySelector('app-home')).toBeNull();
  });

  it('rejects a wrong passcode', async () => {
    const el = await render();
    type(el, '11111111');
    await vi.waitFor(() => expect(el.querySelector('.lock__msg')?.textContent).toContain('Clave incorrecta'));
    expect(el.querySelector('app-home')).toBeNull();
  });

  it('shows the letter and removes the lock after the right passcode', async () => {
    const el = await render();
    type(el, '20261016');
    await vi.waitFor(() => expect(el.querySelector('app-lock')).toBeNull(), { timeout: 2000 });
    expect(el.querySelector('.paper__greeting')?.textContent).toContain('Pequitas');
    expect(el.querySelectorAll('.playlist .row').length).toBe(4);
  });
});
