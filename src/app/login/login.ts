import { Component, OnInit, Output, EventEmitter, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IpcService } from '../ipc.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<any>();

  mode: 'login' | 'register' = 'login';
  hasUsers = true; // asumir que hay usuarios hasta confirmar lo contrario
  loading = false;
  errorMsg = '';
  successMsg = '';

  loginForm = { username: '', password: '' };

  registerForm = {
    name: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    recoveryPin: ''
  };

  constructor(private ipc: IpcService, private zone: NgZone) {}

  ngOnInit() {
    this.ipc.invoke('auth:has-users')
      .then((hasUsers: boolean) => {
        this.zone.run(() => {
          this.hasUsers = hasUsers;
          this.mode = hasUsers ? 'login' : 'register';
        });
      })
      .catch(() => {
        // Si falla el IPC, dejamos login por defecto
      });
  }

  async onLogin() {
    this.errorMsg = '';
    if (!this.loginForm.username || !this.loginForm.password) {
      this.errorMsg = 'Por favor completa todos los campos.';
      return;
    }
    this.loading = true;
    try {
      const user = await this.ipc.invoke('auth:login', this.loginForm);
      this.zone.run(() => {
        this.loginSuccess.emit(user);
      });
    } catch (err: any) {
      this.zone.run(() => {
        this.errorMsg = err?.message || 'Error al iniciar sesión.';
        this.loading = false;
      });
    }
  }

  async onRegister() {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.registerForm.username || !this.registerForm.name ||
        !this.registerForm.lastname || !this.registerForm.email || !this.registerForm.password) {
      this.errorMsg = 'Por favor completa todos los campos.';
      return;
    }

    if (this.registerForm.password !== this.registerForm.confirmPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.registerForm.recoveryPin || !/^\d{6}$/.test(this.registerForm.recoveryPin)) {
      this.errorMsg = 'El PIN de recuperación debe ser de 6 dígitos numéricos.';
      return;
    }

    if (this.registerForm.password.length < 8) {
      this.errorMsg = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.loading = true;
    try {
      await this.ipc.invoke('auth:register', {
        username: this.registerForm.username,
        name: this.registerForm.name,
        lastname: this.registerForm.lastname,
        email: this.registerForm.email,
        password: this.registerForm.password,
        recoveryPin: this.registerForm.recoveryPin
      });
      this.zone.run(() => {
        this.successMsg = '¡Usuario creado exitosamente! Ahora puedes iniciar sesión.';
        this.mode = 'login';
        this.loginForm.username = this.registerForm.username;
        this.registerForm = { username: '', name: '', lastname: '', email: '', password: '', confirmPassword: '', recoveryPin: '' };
        this.loading = false;
      });
    } catch (err: any) {
      this.zone.run(() => {
        this.errorMsg = err?.message || 'Error al registrar usuario.';
        this.loading = false;
      });
    }
  }

  switchMode(m: 'login' | 'register') {
    this.mode = m;
    this.errorMsg = '';
    this.successMsg = '';
  }
}
