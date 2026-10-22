import { Component, signal } from '@angular/core';
import { LOCK_ENABLED } from './data';
import { Home } from './home/home';
import { Lock } from './lock/lock';

@Component({
  selector: 'app-root',
  imports: [Home, Lock],
  templateUrl: './app.html',
})
export class App {
  /** El interior se monta debajo del bloqueo mientras este se desvanece. */
  protected readonly unlocked = signal(!LOCK_ENABLED);
  protected readonly showLock = signal(LOCK_ENABLED);
}
