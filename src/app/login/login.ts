import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { LoginForm, RecoverForm, RegisterForm, User } from '../core/models';
import { ipcErrorMessage } from '../core/utils/ipc-error';
import { allFilled, firstError, isValidPassword, isValidPin, ValidationMessages as V } from '../core/utils/validators';

export type AuthMode = 'login' | 'register' | 'recover';

const emptyLoginForm = (): LoginForm => ({ username: '', password: '' });
const emptyRegisterForm = (): RegisterForm => ({
  name: '', lastname: '', username: '', email: '', password: '', confirmPassword: '', recoveryPin: '',
});
const emptyRecoverForm = (): RecoverForm => ({ username: '', recoveryPin: '', newPassword: '', confirmPassword: '' });

/**
 * ViewModel de la pantalla de autenticación (login.html).
 * Valida formularios y delega la autenticación en AuthService.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<User>();

  mode: AuthMode = 'login';
  hasUsers = true; // asumir que hay usuarios hasta confirmar lo contrario
  loading = false;
  errorMsg = '';
  successMsg = '';

  loginForm = emptyLoginForm();
  registerForm = emptyRegisterForm();
  recoverForm = emptyRecoverForm();

  constructor(private auth: AuthService, private cdr: ChangeDetectorRef) {}

  get titleText(): string {
    if (this.mode === 'recover') return 'Recuperar Contraseña';
    return this.hasUsers ? 'Iniciar Sesión' : 'Crear Cuenta';
  }

  get subtitleText(): string {
    if (this.mode === 'recover') return 'Usa tu PIN de recuperación para crear una nueva contraseña';
    return this.hasUsers ? 'Ingresa tus credenciales para continuar' : 'Registra el primer usuario del sistema';
  }

  async ngOnInit() {
    try {
      this.hasUsers = await this.auth.hasUsers();
      this.mode = this.hasUsers ? 'login' : 'register';
      this.cdr.markForCheck();
    } catch {
      // Si falla el IPC, dejamos login por defecto
    }
  }

  switchMode(mode: AuthMode) {
    if (mode === 'recover') this.recoverForm.username = this.loginForm.username;
    this.mode = mode;
    this.clearMessages();
  }

  // ───────────── Comandos ─────────────

  async onLogin() {
    const f = this.loginForm;
    const error = firstError([[!allFilled(f.username, f.password), V.REQUIRED]]);

    await this.submit(error, 'Error al iniciar sesión.', async () => {
      const user = await this.auth.login(f.username, f.password);
      this.loginSuccess.emit(user);
    });
  }

  async onRegister() {
    const f = this.registerForm;
    const error = firstError([
      [!allFilled(f.username, f.name, f.lastname, f.email, f.password), V.REQUIRED],
      [f.password !== f.confirmPassword, V.PASSWORDS_MISMATCH],
      [!isValidPin(f.recoveryPin), V.INVALID_PIN],
      [!isValidPassword(f.password), V.SHORT_PASSWORD],
    ]);

    await this.submit(error, 'Error al registrar usuario.', async () => {
      const { confirmPassword, ...data } = f;
      await this.auth.register(data);
      this.goToLogin(f.username, '¡Usuario creado exitosamente! Ahora puedes iniciar sesión.');
      this.registerForm = emptyRegisterForm();
    });
  }

  async onRecover() {
    const f = this.recoverForm;
    const error = firstError([
      [!allFilled(f.username, f.recoveryPin, f.newPassword, f.confirmPassword), V.REQUIRED],
      [!isValidPin(f.recoveryPin), V.INVALID_PIN],
      [!isValidPassword(f.newPassword), V.SHORT_PASSWORD],
      [f.newPassword !== f.confirmPassword, V.PASSWORDS_MISMATCH],
    ]);

    await this.submit(error, 'Error al recuperar la contraseña.', async () => {
      const { confirmPassword, ...data } = f;
      await this.auth.recoverPassword(data);
      this.goToLogin(f.username, 'Contraseña actualizada. Ya puedes iniciar sesión.');
      this.recoverForm = emptyRecoverForm();
    });
  }

  // ───────────── Helpers ─────────────

  /** Flujo común: validar → loading → ejecutar → mostrar error */
  private async submit(validationError: string | null, fallbackError: string, action: () => Promise<void>) {
    this.clearMessages();
    if (validationError) {
      this.errorMsg = validationError;
      return;
    }

    this.loading = true;
    try {
      await action();
    } catch (err) {
      this.errorMsg = ipcErrorMessage(err, fallbackError);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private goToLogin(username: string, successMsg: string) {
    this.mode = 'login';
    this.loginForm = { ...emptyLoginForm(), username };
    this.successMsg = successMsg;
  }

  private clearMessages() {
    this.errorMsg = '';
    this.successMsg = '';
  }
}
