
// ————— CONFIGURE FIREBASE HERE —————
const firebaseConfig = {
  apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
  authDomain: "cloud02222.firebaseapp.com",
  databaseURL: "https://cloud02222-default-rtdb.firebaseio.com",
  projectId: "cloud02222",
  storageBucket: "cloud02222.firebasestorage.app",
  messagingSenderId: "866391641580",
  appId: "1:866391641580:web:069aa89ef69e77c3dd84c9",
  measurementId: "G-DFZ8C8C82F"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Refs
const msgsRef     = db.ref("cloud_messages");
const presRef     = db.ref("presence");
const amOnlineRef = db.ref(".info/connected");

// ————— UI ELEMENTS —————
const app        = document.getElementById("chat-app");
const msgsEl     = document.getElementById("messages");
const form       = document.getElementById("msg-form");
const input      = document.getElementById("msg-input");
const logoutBtn  = document.getElementById("logout");
const onlineCnt  = document.getElementById("online-count");

// ————— AUTH & PRESENCE —————
netlifyIdentity.init();
netlifyIdentity.on("init", user => {
  if (!user) return location.replace("main.html");
  startApp(user);
});
netlifyIdentity.on("login",  user => startApp(user));
netlifyIdentity.on("logout",()=> location.replace("main.html"));

function startApp(user) {
  app.classList.remove("hidden");
  logoutBtn.onclick = () => netlifyIdentity.logout();

  // Presence: mark self online, remove on disconnect
  const myPresRef = presRef.child(user.id);
  amOnlineRef.on("value", snap => {
    if (snap.val()) {
      myPresRef.set({ name: user.user_metadata.full_name || user.email });
      myPresRef.onDisconnect().remove();
    }
  });

  // Track online count
  presRef.on("value", snap => {
    onlineCnt.textContent = Object.keys(snap.val()||{}).length;
  });

  // Messages: listen for add/change/remove
  msgsRef.on("child_added",   snap => renderMessage(snap.key, snap.val()));
  msgsRef.on("child_changed", snap => updateMessage(snap.key, snap.val()));
  msgsRef.on("child_removed", snap => removeMessage(snap.key));

  // Send
  form.onsubmit = e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    msgsRef.push({
      uid:       user.id,
      name:      user.user_metadata.full_name || user.email,
      text,
      ts:        Date.now(),
      edited:    false
    });
    input.value = "";
  };
}

// ————— RENDER HELPERS —————
function renderMessage(id, msg) {
  const div = document.createElement("div");
  div.id = id;
  div.className = "message" + (msg.uid===netlifyIdentity.currentUser().id?" own":"");
  const time = new Date(msg.ts).toLocaleTimeString();
  div.innerHTML = `
    <div class="meta">
      ${msg.name} · <small>${time}</small>
      ${msg.edited?'<span class="edited">(edited)</span>':''}
    </div>
    <div class="text">${escape(msg.text)}</div>
  `;
  // actions
  if (msg.uid===netlifyIdentity.currentUser().id) {
    const act = document.createElement("div");
    act.className = "actions";
    act.innerHTML = `
      <button data-action="edit">✏️</button>
      <button data-action="delete">🗑️</button>
    `;
    act.onclick = e => {
      const actn = e.target.dataset.action;
      if (actn==="edit") return editMessage(id, msg.text);
      if (actn==="delete") return deleteMessage(id);
    };
    div.appendChild(act);
  }
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function updateMessage(id, msg) {
  const div = document.getElementById(id);
  if (!div) return renderMessage(id, msg);
  div.querySelector(".text").textContent = msg.text;
  const meta = div.querySelector(".meta");
  if (msg.edited && !meta.querySelector(".edited")) {
    meta.insertAdjacentHTML("beforeend", '<span class="edited">(edited)</span>');
  }
}

function removeMessage(id) {
  const div = document.getElementById(id);
  if (div) div.remove();
}

function editMessage(id, oldText) {
  const newText = prompt("Edit message:", oldText);
  if (newText==null || !newText.trim() || newText===oldText) return;
  msgsRef.child(id).update({ text: newText, edited: true });
}

function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;
  msgsRef.child(id).remove();
}

// Simple XSS escape
function escape(s) {
  return s.replace(/[&<>"']/g, c=>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
}
