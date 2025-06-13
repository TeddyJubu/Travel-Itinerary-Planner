import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAqqzzviF6FoIn1LCyEsC_9QmYhVz1_E-8",
  authDomain: "ai-itineneary.firebaseapp.com",
  projectId: "ai-itineneary",
  storageBucket: "ai-itineneary.firebasestorage.app",
  messagingSenderId: "582428522421",
  appId: "1:582428522421:web:45c90da577ffc7584b8bfc",
  measurementId: "G-Y7KPP4Z0FG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 