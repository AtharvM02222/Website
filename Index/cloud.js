// cloud.js

// 1) Real Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
  authDomain: "cloud02222.firebaseapp.com",
  databaseURL: "https://cloud02222-default-rtdb.firebaseio.com",
  projectId: "cloud02222",
  storageBucket: "cloud02222.appspot.com",
  messagingSenderId: "866391641580",
  appId: "1:866391641580:web:069aa89ef69e77c3dd84c9"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();

// 2) DOM references
const messageList = document.getElementById("messageList");
const messageInput = document.getElementById("messageInput");
const sendBtn     = document.getElementById("sendBtn");
const logoutBtn   = document.getElementById("logoutBtn");
const typingStatus= document.getElementById("typingStatus");
const darkModeBtn = document.getElementById("darkModeBtn"); // optional

let currentUser;

// 3) Auth listener
auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "main.html";
  currentUser = user;
  listenMessages();
});

// 4) Listen & render messages
function listenMessages() {
  const msgsRef = db.ref("cloud_messages");
  msgsRef.off();
  msgsRef.on("value", snap => {
    messageList.innerHTML = "";
    snap.forEach(child => {
      const msg = child.val();
      renderMessage(child.key, msg);
    });
    messageList.scrollTop = messageList.scrollHeight;
  });
}

// 5) Render each message
function renderMessage(id, msg) {
  const isMine = msg.uid === currentUser.uid;
  const hasRead = msg.readBy?.includes(currentUser.uid);
  
  // Mark read
  if (!isMine && !hasRead) {
    db.ref(`cloud_messages/${id}/readBy`)
      .transaction(readBy => readBy ? [...new Set([...readBy, currentUser.uid])] : [currentUser.uid]);
  }

  const el = document.createElement("div");
  el.id = id;
  el.className = "message" + (isMine ? " mine" : "");
  
  const time = new Date(msg.ts).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  const status = isMine 
    ? (msg.readBy?.length > 1 ? "✓✓ Seen" : "✓ Sent") 
    : "";

  el.innerHTML = `
    <span class="sender" style="color:${colorFor(msg.uid)}">
      ${msg.name}
    </span>
    <p>${escape(msg.text)}</p>
    <div class="meta">
      <small>${time}</small>
      ${isMine ? `<span class="status">${status}</span>` : ""}
    </div>
    ${isMine ? `
      <div class="actions">
        <button data-action="edit">✏️</button>
        <button data-action="delete">🗑️</button>
      </div>` : ""}
  `;
  messageList.appendChild(el);

  if (isMine) {
    el.querySelector("[data-action=edit]")
      .onclick = () => editMessage(id, msg.text);
    el.querySelector("[data-action=delete]")
      .onclick = () => deleteMessage(id);
  }
}

// 6) Send message (button‑click, no form)
sendBtn.onclick = () => {
  const text = messageInput.value.trim();
  if (!text) return;
  db.ref("cloud_messages").push({
    uid: currentUser.uid,
    name: currentUser.displayName || currentUser.email,
    text,
    ts: Date.now(),
    readBy: [currentUser.uid]
  });
  messageInput.value = "";
};

// 7) Edit & delete
function editMessage(id, oldText) {
  const newText = prompt("Edit message:", oldText);
  if (newText && newText !== oldText) {
    db.ref(`cloud_messages/${id}`).update({ text: newText, edited: true });
  }
}
function deleteMessage(id) {
  if (confirm("Delete this message?")) {
    db.ref(`cloud_messages/${id}`).remove();
  }
}

// 8) Typing indicator
messageInput.oninput = () => {
  typingStatus.textContent = messageInput.value ? "Typing..." : "";
};

// 9) Logout
logoutBtn.onclick = () => {
  auth.signOut().then(() => window.location.href = "main.html");
};

// 10) Username color generator
function colorFor(uid) {
  let hash = 0;
  for (let c of uid) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${hash % 360},70%,60%)`;
}

// 11) Dark mode toggle (optional)
darkModeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// 12) XSS-safe escape
function escape(str) {
  return str.replace(/[&<>"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
