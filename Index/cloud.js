document.addEventListener("DOMContentLoaded", () => {
  // ——— Initialize Netlify Identity ———
  if (!window.netlifyIdentity) {
    console.error("Netlify Identity widget not loaded.");
    return;
  }
  netlifyIdentity.init();

  // ——— Early auth check ———
  netlifyIdentity.on("init", user => {
    if (!user) {
      // Not logged in → immediate redirect
      window.location.replace("main.html");
    } else {
      // Logged in → start chat
      startChat(user);
    }
  });

  // ——— Handle explicit logout ———
  netlifyIdentity.on("logout", () => {
    document.getElementById("chat-app").classList.add("hidden");
    window.location.replace("main.html");
  });

  // ——— Chat logic ———
  function startChat(user) {
    // Show the chat UI
    const app = document.getElementById("chat-app");
    app.classList.remove("hidden");

    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
      authDomain: "cloud02222.firebaseapp.com",
      databaseURL: "https://cloud02222-default-rtdb.firebaseio.com",
      projectId: "cloud02222",
      storageBucket: "cloud02222.firebasestorage.app",
      messagingSenderId: "866391641580",
      appId: "1:866391641580:web:069aa89ef69e77c3dd84c9"
    };
    // Initialize Firebase (only once)
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    // References
    const msgsRef     = db.ref("cloud_messages");
    const presRef     = db.ref("presence");
    const amOnlineRef = db.ref(".info/connected");

    // UI elements
    const msgsEl    = document.getElementById("messages");
    const form      = document.getElementById("msg-form");
    const input     = document.getElementById("msg-input");
    const logoutBtn = document.getElementById("logout-btn");
    const onlineCnt = document.getElementById("online-count");

    // Wire up logout button
    logoutBtn.onclick = () => netlifyIdentity.logout();

    // Presence: track online users
    const me = presRef.child(user.id);
    amOnlineRef.on("value", snap => {
      if (snap.val()) {
        me.set({ name: user.user_metadata.full_name || user.email });
        me.onDisconnect().remove();
      }
    });
    presRef.on("value", snap => {
      onlineCnt.textContent = Object.keys(snap.val()||{}).length;
    });

    // Listen for messages
    msgsRef.on("child_added",   s => renderMessage(s.key, s.val(), user.id));
    msgsRef.on("child_changed", s => updateMessage(s.key, s.val(), user.id));
    msgsRef.on("child_removed", s => removeMessage(s.key));

    // Sending new messages
    form.onsubmit = e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      msgsRef.push({
        uid:    user.id,
        name:   user.user_metadata.full_name || user.email,
        text,
        ts:     Date.now(),
        edited: false
      });
      input.value = "";
    };

    // ——— Message renderers ———
    function renderMessage(id, msg, currentUid) {
      const d = document.createElement("div");
      d.id = id;
      d.className = "message" + (msg.uid === currentUid ? " own" : "");
      const time = new Date(msg.ts).toLocaleTimeString();
      d.innerHTML = `
        <div class="meta">
          ${msg.name} · <small>${time}</small>
          ${msg.edited ? '<span class="edited">(edited)</span>' : ''}
        </div>
        <div class="text">${escape(msg.text)}</div>
      `;
      if (msg.uid === currentUid) {
        const actions = document.createElement("div");
        actions.className = "actions";
        actions.innerHTML = `
          <button data-action="edit">✏️</button>
          <button data-action="delete">🗑️</button>
        `;
        actions.onclick = ev => {
          const a = ev.target.dataset.action;
          if (a === "edit") editMessage(id, msg.text);
          if (a === "delete") deleteMessage(id);
        };
        d.appendChild(actions);
      }
      msgsEl.appendChild(d);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    function updateMessage(id, msg, currentUid) {
      const d = document.getElementById(id);
      if (!d) return renderMessage(id, msg, currentUid);
      d.querySelector(".text").textContent = msg.text;
      if (msg.edited && !d.querySelector(".edited")) {
        d.querySelector(".meta")
         .insertAdjacentHTML("beforeend", '<span class="edited">(edited)</span>');
      }
    }

    function removeMessage(id) {
      const d = document.getElementById(id);
      if (d) d.remove();
    }

    function editMessage(id, oldText) {
      const n = prompt("Edit your message:", oldText);
      if (!n || n === oldText) return;
      msgsRef.child(id).update({ text: n, edited: true });
    }

    function deleteMessage(id) {
      if (!confirm("Delete this message?")) return;
      msgsRef.child(id).remove();
    }

    // Simple XSS escape
    function escape(s) {
      return s.replace(/[&<>"']/g, c =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
      );
    }
  }
});
