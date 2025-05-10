// cloud.js

// 1) YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDW9a-Dd4c44QRsjUSpNcjvn1RPzOorXw4",
  authDomain: "protean-tooling-444907-k3.firebaseapp.com",
  projectId: "protean-tooling-444907-k3",
  storageBucket: "protean-tooling-444907-k3.firebasestorage.app",
  messagingSenderId: "989275453863",
  appId: "1:989275453863:web:f04a2937a7785c75231e82",
  measurementId: "G-6ZE618L262"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2) NETLIFY IDENTITY INIT
netlifyIdentity.init();
let me = null;

netlifyIdentity.on("init", user => {
  if (!user) netlifyIdentity.open();
  else startChat(user);
});
netlifyIdentity.on("login", user => {
  me = user;
  netlifyIdentity.close();
  startChat(user);
});

// 3) CHAT FUNCTIONALITY
function startChat(user) {
  me = user;
  document.getElementById("logoutBtn").onclick = () => {
    netlifyIdentity.logout();
    location.reload();
  };

  const uid = user.id;
  const name = user.user_metadata.full_name || user.email;

  const msgsDiv = document.getElementById("msgs");
  const inp = document.getElementById("inp");
  const sendBtn = document.getElementById("sendBtn");

  // load old & new messages
  db.ref("/notes")
    .orderByChild("time")
    .limitToLast(200)
    .on("child_added", snap => {
      const m = snap.val();
      const isMe = m.uid === uid;
      render(m.text, isMe, false);
    });

  // send messages
  sendBtn.onclick = () => {
    const txt = inp.value.trim();
    if (!txt) return;
    const msg = { uid, name, text: txt, time: Date.now() };
    // first render with 1 tick
    const bubble = render(txt, true, true);
    inp.value = "";
    // push to DB
    db.ref("/notes").push(msg)
      .then(() => {
        // upgrade to 2 ticks
        bubble.querySelector(".tick").textContent = "✓✓";
      })
      .catch(_ => {
        bubble.querySelector(".tick").textContent = "⚠";
      });
  };

  inp.addEventListener("keyup", e => {
    if (e.key === "Enter") sendBtn.click();
  });
}

// 4) RENDER HELPER
function render(text, isSelf, withTick) {
  const row = document.createElement("div");
  row.className = "message " + (isSelf ? "self" : "other");

  const b = document.createElement("div");
  b.className = "bubble";
  b.textContent = text;

  if (isSelf) {
    const t = document.createElement("span");
    t.className = "tick";
    t.textContent = withTick ? "✓" : "✓✓";
    b.appendChild(t);
  }

  row.appendChild(b);
  const msgs = document.getElementById("msgs");
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
  return b;
}
