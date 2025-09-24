const firebaseConfig = {
  apiKey: "AIzaSyD01LKZxpJaforldiwTm8SoR5BO0_ANkDY",
  authDomain: "cannoli-f1d4d.firebaseapp.com",
  projectId: "cannoli-f1d4d",
  storageBucket: "cannoli-f1d4d.firebasestorage.app",
  messagingSenderId: "370614675260",
  appId: "1:370614675260:web:d68b860b7f80ce3868a039",
  measurementId: "G-PLX34LSTRB"
};

firebase.initializeApp(firebaseConfig);

// Inicializa las herramientas que usaremos
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();