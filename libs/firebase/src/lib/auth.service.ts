import { inject, Injectable, signal, WritableSignal, computed } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  authState
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FirestoreService } from './firestore.service';
import { Usuario, Profesional, EstadoUsuario, RolUsuario } from '@derma/models';

export interface RegisterUserParams {
  email?: string;
  password?: string;
  telefono?: string;
  apellido?: string;
  nombre?: string;
  rol?: RolUsuario;
  dni?: string;
}

export interface RegisterProfesionalParams extends RegisterUserParams {
  numeroMatriculaNacional: string;
  numeroMatriculaProvincial: string;
  tituloProfesional?: string;
}

export interface LoginParams {
  email?: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private router: Router = inject(Router);

  // Directly bind to Firebase Auth state for reactiveness
  public firebaseUser = toSignal(authState(this.auth));

  // Custom User object state
  public currentUser: WritableSignal<Usuario | null> = signal(null);
  public isAuthStatusLoaded: WritableSignal<boolean> = signal(false);

  // Computed properties
  public isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    onAuthStateChanged(this.auth, async (fbUser) => {
      if (fbUser) {
        const user = await this.firestoreService.getDocument<Usuario>('usuarios', fbUser.uid);
        if (user) {
          const userWithVerification: Usuario = {
            ...user,
            correoVerificado: fbUser.emailVerified
          };
          this.currentUser.set(userWithVerification);
        } else {
          this.currentUser.set(null);
        }
      } else {
        this.currentUser.set(null);
      }
      this.isAuthStatusLoaded.set(true);
    });
  }

  async register(params: RegisterUserParams) {
    const { email, password, telefono, apellido, nombre, rol, dni } = params;
    if (!email || !password) throw new Error("Email and password are required");

    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      const fbUser = credential.user;

      const newUser: Usuario = {
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        telefono: telefono || '',
        apellido: apellido || '',
        nombre: nombre || '',
        dni: dni || '',
        rol: rol || RolUsuario.PACIENTE,
        estado: EstadoUsuario.ACTIVO,
        correoVerificado: fbUser.emailVerified
      };

      await this.firestoreService.setDocument('usuarios', fbUser.uid, newUser);
      return fbUser;
    } catch (error) {
      console.error('Error in register(): ', error);
      throw error;
    }
  }

  async registerProfesional(params: RegisterProfesionalParams) {
    const { email, password, telefono, apellido, nombre, dni, numeroMatriculaNacional, numeroMatriculaProvincial, tituloProfesional } = params;
    if (!email || !password) throw new Error("Email and password are required");

    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      const fbUser = credential.user;

      const newProfesional: Profesional = {
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        telefono: telefono || '',
        apellido: apellido || '',
        nombre: nombre || '',
        dni: dni || '',
        rol: RolUsuario.DERMATOLOGO,
        estado: EstadoUsuario.ACTIVO,
        correoVerificado: fbUser.emailVerified,
        numeroMatriculaNacional,
        numeroMatriculaProvincial,
        tituloProfesional: tituloProfesional || '',
        horariosLaborales: {},
        duracionConsulta: 30,
        honorarios: []
      };

      await this.firestoreService.setDocument('usuarios', fbUser.uid, newProfesional);
      return fbUser;
    } catch (error) {
      console.error('Error in registerProfesional(): ', error);
      throw error;
    }
  }

  async sendEmailVerification(): Promise<void> {
    const fbUser = this.auth.currentUser;
    if (!fbUser) throw new Error('No hay usuario autenticado');
    if (fbUser.emailVerified) throw new Error('El usuario ya está verificado');

    try {
      await sendEmailVerification(fbUser);
    } catch (error) {
      console.error('Error enviando verificación:', error);
      throw new Error('No se pudo enviar el correo de verificación');
    }
  }

  async login(params: LoginParams) {
    const { email, password } = params;
    if (!email || !password) throw new Error("Email and password are required");

    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      await credential.user.reload();

      const appUser = await this.firestoreService.getDocument<Usuario>('usuarios', credential.user.uid);
      if (!appUser) throw new Error('No se encontraron datos del usuario en la base de datos.');

      if (credential.user.emailVerified && !appUser.correoVerificado) {
        await this.firestoreService.updateDocument('usuarios', credential.user.uid, { correoVerificado: true });
      }

      const userWithVerification: Usuario = {
        ...appUser,
        correoVerificado: credential.user.emailVerified
      };

      await this.firestoreService.updateDocument('usuarios', credential.user.uid, {
        online: true,
        lastSeen: new Date().toISOString()
      });

      this.currentUser.set(userWithVerification);
      this.navigateBasedOnRole(appUser.rol);
    } catch (error) {
      console.error("Error en el login", error);
      const errMsg = error instanceof Error ? error.message : 'Error en el login, revisa tus credenciales.';
      throw new Error(errMsg);
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      const user = credential.user;

      const displayName = user.displayName || "";
      const partes = displayName.trim().split(" ");
      const nombre = partes.length > 1 ? partes[0] : displayName;
      const apellido = partes.length > 1 ? partes[partes.length - 1] : "";

      let appUser = await this.firestoreService.getDocument<Usuario>('usuarios', user.uid);

      if (!appUser) {
        const newUser: Usuario = {
          uid: user.uid,
          email: user.email ?? '',
          telefono: '',
          apellido: apellido,
          nombre: nombre,
          dni: '',
          rol: RolUsuario.PACIENTE,
          estado: EstadoUsuario.ACTIVO,
          fotoPerfil: user.photoURL || '',
          correoVerificado: user.emailVerified
        };

        await this.firestoreService.setDocument('usuarios', user.uid, newUser);
        appUser = newUser;
      }

      this.currentUser.set({
        ...appUser,
        correoVerificado: user.emailVerified
      });

      await this.firestoreService.updateDocument('usuarios', user.uid, {
        online: true,
        lastSeen: new Date().toISOString()
      });

      this.navigateBasedOnRole(appUser.rol);
    } catch (error) {
      console.error('Error en login con google', error);
      throw error;
    }
  }

  private navigateBasedOnRole(rol: RolUsuario) {
    if (rol === RolUsuario.PACIENTE) {
      this.router.navigate(['/paciente']);
    } else {
      this.router.navigate(['/admin']);
    }
  }

  async logOut() {
    const user = this.currentUser();
    if (user) {
      await this.firestoreService.updateDocument('usuarios', user.uid, {
        online: false,
        lastSeen: new Date().toISOString()
      });
    }
    await signOut(this.auth);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error("Error al enviar email de recuperación", error);
      const errMsg = error instanceof Error ? error.message : 'No se pudo enviar el email de recuperación.';
      throw new Error(errMsg);
    }
  }
}
