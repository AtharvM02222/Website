// cloud.js
// ====== 1) FIREBASE & NETLIFY INIT ======
netlifyIdentity.init(); // keep exactly as before

// Paste your existing firebaseConfig here:
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR-PROJECT.firebaseio.com",
  projectId: "YOUR-PROJECT",
  storageBucket: "YOUR-PROJECT.appspot.com",
  messagingSenderId: "…",
  appId: "…",
};

// Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// Simple auth: Netlify Identity
let currentUser = null;
netlifyIdentity.on("init", user => {
  if (!user) netlifyIdentity.open();
});
netlifyIdentity.on("login", user => {
  currentUser = user;
  netlifyIdentity.close();
  setup();
});

// ====== 2) PRESENCE & TYPING ======
function setupPresence() {
  const userStatusDatabaseRef = db.ref(`/status/${currentUser.id}`);
  const isOfflineForDatabase = {
    state: "offline",
    last_changed: firebase.database.ServerValue.TIMESTAMP,
  };
  const isOnlineForDatabase = {
    state: "online",
    last_changed: firebase.database.ServerValue.TIMESTAMP,
  };

  db.ref(".info/connected").on("value", snap => {
    if (snap.val() === false) return;
    userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(() => {
      userStatusDatabaseRef.set(isOnlineForDatabase);
    });
  });

  // typing
  const typingRef = db.ref("/typing/global");
  let typingTimer = null;
  document.getElementById("msg-input").addEventListener("input", () => {
    typingRef.child(currentUser.id).set(currentUser.user_metadata.full_name || currentUser.email);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      typingRef.child(currentUser.id).remove();
    }, 1500);
  });
}

// ====== 3) UI RENDERING ======
const msgsDiv = document.getElementById("messages");
function addMessage(msg, id) {
  const div = document.createElement("div");
  div.classList.add("message", msg.uid === currentUser.id ? "self" : "other");
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  if (msg.text) {
    bubble.textContent = msg.text;
    linkifyElement(bubble, { target: "_blank" });
  }
  if (msg.imgUrl) {
    const img = document.createElement("img");
    img.src = msg.imgUrl;
    bubble.appendChild(img);
  }
  div.appendChild(bubble);
  msgsDiv.appendChild(div);
  msgsDiv.scrollTop = msgsDiv.scrollHeight;
}

// Typing indicator
db.ref("/typing/global").on("value", snap => {
  const typing = snap.val() || {};
  delete typing[currentUser.id];
  const names = Object.values(typing);
  document.getElementById("typing-indicator").textContent =
    names.length ? `${names.join(", ")} is typing…` : "";
});

// Online list
db.ref("/status").on("value", snap => {
  const status = snap.val() || {};
  const online = Object.entries(status)
    .filter(([_, v]) => v.state === "online")
    .map(([uid, v]) => v);
  const list = document.getElementById("online-list");
  list.innerHTML = "";
  online.forEach(u => {
    const span = document.createElement("span");
    span.textContent = u.user_metadata?.full_name || u.email;
    list.appendChild(span);
  });
});

// ====== 4) LOAD & SEND MESSAGES ======
db.ref("/messages/global")
  .limitToLast(100)
  .on("child_added", snap => addMessage(snap.val(), snap.key));

document.getElementById("send-btn").onclick = async () => {
  const txtInput = document.getElementById("msg-input");
  const fileInput = document.getElementById("img-input");

  let imgUrl = null;
  if (fileInput.files[0]) {
    const file = fileInput.files[0];
    const storageRef = storage.ref(`images/${Date.now()}_${file.name}`);
    await storageRef.put(file);
    imgUrl = await storageRef.getDownloadURL();
  }

  const newMsg = {
    uid: currentUser.id,
    text: txtInput.value || null,
    imgUrl,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  };
  await db.ref("/messages/global").push(newMsg);
  txtInput.value = "";
  fileInput.value = "";
};

// ====== 5) BOOTSTRAP EVERYTHING ======
function setup() {
  setupPresence();
}
