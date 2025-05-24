// cloud.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, arrayUnion, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import netlifyIdentity from "https://identity.netlify.com/v1/netlify-identity-widget.js";

// ─── Initialize Firebase ─────────────────────────────────────────────────────
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

// ─── DOM ELEMENTS ─────────────────────────────────────────────────────────────
const chatApp    = document.getElementById("chat-app");
const listEl     = document.getElementById("messages");
const inputEl    = document.getElementById("messageInput");
const sendBtn    = document.getElementById("sendBtn");
const logoutBtn  = document.getElementById("logoutBtn");
const typingEl   = document.getElementById("typingStatus");
const darkBtn    = document.getElementById("darkModeBtn");
const onlineEl   = document.getElementById("online-count");

let currentUser;

// ─── HELPER: COLOR FROM UID ───────────────────────────────────────────────────
function colorFor(uid) {
  let hash = 0;
  for (let c of uid) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${hash % 360},70%,60%)`;
}

// ─── NETLIFY IDENTITY SETUP ──────────────────────────────────────────────────
netlifyIdentity.init();

netlifyIdentity.on("init", user => {
  if (!user) {
    // not logged in → redirect to main
    return (window.location.href = "main.html");
  }
  currentUser = user;
  startChat();
});

netlifyIdentity.on("logout", () => {
  window.location.href = "main.html";
});

// ─── MAIN CHAT FUNCTION ───────────────────────────────────────────────────────
async function startChat() {
  // reveal UI
  chatApp.classList.remove("hidden");

  // dark‑mode toggle
  darkBtn?.addEventListener("click", () =>
    document.body.classList.toggle("dark")
  );

  // typing indicator
  inputEl.addEventListener("input", () => {
    typingEl.textContent = inputEl.value ? "Typing…" : "";
  });

  // logout
  logoutBtn.addEventListener("click", () => netlifyIdentity.logout());

  // Firestore collection & query
  const col = collection(db, "cloud_messages");
  const q   = query(col, orderBy("ts"));

  // real‑time listener
  onSnapshot(q, snapshot => {
    listEl.innerHTML = "";
    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      renderMessage(docSnap.id, m);
    });
    listEl.scrollTop = listEl.scrollHeight;
  });

  // send messages
  sendBtn.addEventListener("click", async () => {
    const text = inputEl.value.trim();
    if (!text) return;
    await addDoc(col, {
      uid:   currentUser.id,
      name:  currentUser.user_metadata.full_name || currentUser.email,
      text,
      ts:    serverTimestamp(),
      readBy: [currentUser.id]
    });
    inputEl.value = "";
  });
}

// ─── RENDERING ────────────────────────────────────────────────────────────────
function renderMessage(id, msg) {
  const isMine  = msg.uid === currentUser.id;
  const hasRead = msg.readBy?.includes(currentUser.id);
  const timeStr = msg.ts?.toDate().toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit"
  });
  const status  = isMine
    ? (msg.readBy?.length > 1 ? "✓✓ Seen" : "✓ Sent")
    : "";

  // mark read
  if (!isMine && !hasRead) {
    const docRef = doc(db, "cloud_messages", id);
    updateDoc(docRef, { readBy: arrayUnion(currentUser.id) });
  }

  // build element
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

  // edit/delete for own messages
  if (isMine) {
    const act = document.createElement("div");
    act.className = "actions";
    act.innerHTML = `
      <button data-action="edit">✏️</button>
      <button data-action="delete">🗑️</button>
    `;
    act.querySelector("[data-action=edit]").onclick = async () => {
      const newText = prompt("Edit message:", msg.text);
      if (newText && newText !== msg.text) {
        const docRef = doc(db, "cloud_messages", id);
        await updateDoc(docRef, { text: newText, edited: true });
      }
    };
    act.querySelector("[data-action=delete]").onclick = async () => {
      if (confirm("Delete this message?")) {
        const docRef = doc(db, "cloud_messages", id);
        await deleteDoc(docRef);
      }
    };
    el.appendChild(act);
  }

  listEl.appendChild(el);
}
