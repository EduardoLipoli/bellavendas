import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Sua configuração do Firebase que você copiou do console
const firebaseConfig = {
  apiKey: "AIzaSyCH5lydKBYD58vK6WWoeIL-kzFELuuwI2o",
  authDomain: "bellavendas-app.firebaseapp.com",
  projectId: "bellavendas-app",
  storageBucket: "bellavendas-app.firebasestorage.app",
  messagingSenderId: "308506971433",
  appId: "1:308506971433:web:5903747c8b7eebe850bb38"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que você vai usar
export const auth = getAuth(app);
export const db = getFirestore(app);
