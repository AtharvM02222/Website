// Firebase config (yours)
const firebaseConfig = {
  apiKey: "AIzaSyDW9a-Dd4c44QRsjUSpNcjvn1RPzOorXw4",
  authDomain: "protean-tooling-444907-k3.firebaseapp.com",
  projectId: "protean-tooling-444907-k3",
  storageBucket: "protean-tooling-444907-k3.appspot.com",
  messagingSenderId: "989275453863",
  appId: "1:989275453863:web:f04a2937a7785c75231e82",
  measurementId: "G-6ZE618L262"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// Netlify Identity Auth
netlifyIdentity.init();
let currentUser = null;

netlifyIdentity.on("init", user => {
  if (!user) netlifyIdentity.open();
  else {
    currentUser = user;
    setupChat();
  }
});

netlifyIdentity.on("login", user => {
  currentUser = user;
  netlifyIdentity.close();
  setupChat();
});

// Chat Setup
function setupChat() {
  const uid = currentUser.id;
  const name = currentUser.user_metadata.full_name || currentUser.email;

  // Online presence
  const statusRef = db.ref(`/status/${uid}`);
  const connectedRef = db.ref(".info/connected");
  connectedRef.on("value", snap => {
    if (snap.val()) {
      statusRef.onDisconnect().remove();
      statusRef.set({ name });
    }
  });

  // Show who's online
  db.ref("/status").on("value", snap => {
    const users = snap.val() || {};
    const container = document.getElementById("online-users");
    container.innerHTML = "";
    Object.values(users).forEach(u => {
      const span = document.createElement("span");
      span.textContent = u.name;
      container.appendChild(span);
    });
  });

  // Typing
  const typingRef = db.ref("/typing");
  let typingTimer;
  const input = document.getElementById("msg-input");

  input.addEventListener("input", () => {
    typingRef.child(uid).set(name);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => typingRef.child(uid).remove(), 1500);
  });

  typingRef.on("value", snap => {
    const data = snap.val() || {};
    delete data[uid];
    const names = Object.values(data);
    document.getElementById("typing-indicator").textContent = names.length
      ? `${names.join(", ")} is typing...`
      : "";
  });

  // Load messages
  const msgRef = db.ref("/notes").limitToLast(100);
  msgRef.on("child_added", snap => {
    const msg = snap.val();
    renderMessage(msg, msg.uid === uid);
  });

  // Send message
  document.getElementById("send-btn").onclick = async () => {
    const text = input.value.trim();
    const file = document.getElementById("img-input").files[0];

    let imgUrl = null;
    if (file) {
      const fileRef = storage.ref(`images/${Date.now()}-${file.name}`);
      await fileRef.put(file);
      imgUrl = await fileRef.getDownloadURL();
    }

    if (!text && !imgUrl) return;

    const msgData = {
      uid,
      name,
      text: text || null,
      img: imgUrl || null,
      time: Date.now()
    };

    await db.ref("/notes").push(msgData);
    input.value = "";
    document.getElementById("img-input").value = "";
  };
}

// Render a message bubble
function renderMessage(msg, isSelf) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "message " + (isSelf ? "self" : "other");

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (msg.text) {
    bubble.textContent = msg.text;
    linkifyElement(bubble);
  }

  if (msg.img) {
    const img = document.createElement("img");
    img.src = msg.img;
    bubble.appendChild(img);
  }

  msgDiv.appendChild(bubble);
  document.getElementById("messages").appendChild(msgDiv);
  document.getElementById("messages").scrollTop = 999999;
}
