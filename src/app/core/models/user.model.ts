export interface User {
  id: string;
  username: string;
  name: string;
  lastname: string;
  email: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  recoveryPin: string;
}

export interface RecoverForm {
  username: string;
  recoveryPin: string;
  newPassword: string;
  confirmPassword: string;
}
