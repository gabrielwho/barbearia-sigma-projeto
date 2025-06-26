// Configuração do Firebase
const firebaseConfig = {
apiKey: "AIzaSyDMSOgbwXqKKWJos4P1TflB2oTKpoIG5RA",
  authDomain: "barbeariasigma-333.firebaseapp.com",
  projectId: "barbeariasigma-333",
  storageBucket: "barbeariasigma-333.firebasestorage.app",
  messagingSenderId: "361852309199",
  appId: "1:361852309199:web:3d73abf5463df2fecdf1ba"
};

// Inicializa o Firebase
//const app = initializeApp(firebaseConfig);
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
  // Configuração do Firestore para evitar erros
  db.settings({
    experimentalForceLongPolling: true, // Para evitar erros em localhost
    merge: true
  });