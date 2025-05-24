// cloud.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, serverTimestamp, doc, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// ——— Your Firebase config ———
const firebaseConfig = {
  apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
  authDomain: "cloud02222.firebaseapp.com",
  projectId: "cloud02222",
  storageBucket: "cloud02222.appspot.com",
  messagingSenderId: "866391641580",
  appId: "1:866391641580:web:069aa89ef69e77c3dd84c9"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

// ——— DOM References ———
const listEl   = document.getElementById("messages");
const inputEl  = document.getElementById("messageInput");
const sendBtn  = document.getElementById("sendBtn");
const logoutBtn= document.getElementById("logoutBtn");
const typingEl = document.getElementById("typingStatus");
const darkBtn  = document.getElementById("darkModeBtn");

let currentUser;

// ——— Utility: generate a color from UID ———
function colorFor(uid) {
  let hash = 0;
  for (let c of uid) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${hash % 360},70%,60%)`;
}

// ——— Auth state listener ———
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    startChat();
  } else {
    // Wait briefly before redirecting to allow identity state to load fully
    setTimeout(() => {
      window.location.href = "main.html";
    }, 500);
  }
});
// ——— Main chat logic ———
async function startChat() {
  // Show the chat UI
  document.getElementById("chat-app").classList.remove("hidden");

  // Logout handler
  logoutBtn.onclick = () => signOut(auth);

  // Typing indicator
  inputEl.oninput = () => {
    typingEl.textContent = inputEl.value ? "Typing…" : "";
  };

  // Dark‑mode toggle
  darkBtn?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  // Firestore collection & query
  const msgsCol = collection(db, "cloud_messages");
  const msgsQ   = query(msgsCol, orderBy("ts"));

  // Real‑time listener
  onSnapshot(msgsQ, snapshot => {
    listEl.innerHTML = "";
    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      renderMessage(docSnap.id, m);
    });
    listEl.scrollTop = listEl.scrollHeight;
  });

  // Send new message
  sendBtn.onclick = async () => {
    const text = inputEl.value.trim();
    if (!text) return;
    await addDoc(msgsCol, {
      uid: currentUser.uid,
      name: currentUser.displayName || currentUser.email.split("@")[0],
      text,
      ts: serverTimestamp(),
      readBy: [currentUser.uid]
    });
    inputEl.value = "";
  };
}

// ——— Render a single message ———
function renderMessage(id, msg) {
  const isMine   = msg.uid === currentUser.uid;
  const hasRead  = msg.readBy?.includes(currentUser.uid);
  const timeStr  = new Date(msg.ts?.toDate()).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit"
  });
  const status   = isMine
    ? (msg.readBy?.length > 1 ? "✓✓ Seen" : "✓ Sent")
    : "";

  // If it’s not mine and I haven’t read it yet, mark it read
  if (!isMine && !hasRead) {
    const docRef = doc(db, "cloud_messages", id);
    updateDoc(docRef, { readBy: arrayUnion(currentUser.uid) });
  }

  // Build the element
  const el = document.createElement("div");
  el.id = id;
  el.className = "message" + (isMine ? " own" : "");
  el.innerHTML = `
    <span class="sender" style="color:${colorFor(msg.uid)}">
      ${msg.name}
    </span>
    <p>${msg.text}</p>
    <div class="meta">
      <small>${timeStr}</small>
      ${isMine ? `<span class="status">${status}</span>` : ""}
    </div>
  `;

  // Edit/Delete for my messages
  if (isMine) {
    const actions = document.createElement("div");
    actions.className = "actions";
    actions.innerHTML = `
      <button data-action="edit">✏️</button>
      <button data-action="delete">🗑️</button>
    `;
    actions.querySelector("[data-action=edit]").onclick = async () => {
      const newText = prompt("Edit message:", msg.text);
      if (newText && newText !== msg.text) {
        await updateDoc(doc(db, "cloud_messages", id), { text: newText, edited: true });
      }
    };
    actions.querySelector("[data-action=delete]").onclick = async () => {
      if (confirm("Delete this message?")) {
        await deleteDoc(doc(db, "cloud_messages", id));
      }
    };
    el.appendChild(actions);
  }

  listEl.appendChild(el);
}
