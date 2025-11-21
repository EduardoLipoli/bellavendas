import { auth } from '../firebase/config';
import { EmailAuthProvider, reauthenticateWithCredential, signOut  } from 'firebase/auth';

export const reauthenticate = async (password) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não encontrado.");

    const credential = EmailAuthProvider.credential(user.email, password);
    
    try {
        await reauthenticateWithCredential(user, credential);
        return true;
    } catch (error) {
        console.error("Erro de reautenticação:", error);
        return false;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        // Mesmo que dê erro, tentamos redirecionar
    }
};