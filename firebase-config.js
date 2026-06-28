import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkP9_W4kjD9uxZMOj_HuVXouS7gkkkaBE",
  authDomain: "mini-tms-project.firebaseapp.com",
  databaseURL: "https://mini-tms-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mini-tms-project",
  storageBucket: "mini-tms-project.firebasestorage.app",
  messagingSenderId: "1012158831029",
  appId: "1:1012158831029:web:863f64b195f71bef6121fc"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
