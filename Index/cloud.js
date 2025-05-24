document.addEventListener("DOMContentLoaded", () => {
  if (!window.netlifyIdentity) {
    console.error("Netlify Identity not loaded");
    return;
  }

  netlifyIdentity.init();

  netlifyIdentity.on("init", user => {
    if (!user) {
      window.location.replace("main.html");
    } else {
      startChat(user);
    }
  });

  netlifyIdentity.on("logout", () => {
    window.location.replace("main.html");
  });

  function startChat(user) {
    const app = document.getElementById("chat-app");
    const messagesEl = document.getElementById("messages");
    const form = document.getElementById("msg-form");
    const input = document.getElementById("msg-input");
    const logoutBtn = document.getElementById("logout-btn");
    const onlineCount = document.getElementById("online-count");

    // Show chat UI
    app.classList.remove("hidden");

    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
      authDomain: "cloud02222.firebaseapp.com",
      databaseURL: "https://cloud02222-default-rtdb.firebaseio.com",
      projectId: "cloud02222",
      storageBucket: "cloud02222.appspot.com",
      messagingSenderId: "866391641580",
      appId: "1:866391641580:web:069aa89ef69e77c3dd84c9"
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();
    const msgsRef = db.ref("cloud_messages");
    const presenceRef = db.ref("presence");
    const connectedRef = db.ref(".info/connected");

    // Track presence
    const myPresence = presenceRef.child(user.id);
    connectedRef.on("value", snap => {
      if (snap.val()) {
        myPresence.set({
          name: user.user_metadata.full_name || user.email
        });
        myPresence.onDisconnect().remove();
      }
    });

    presenceRef.on("value", snap => {
      const online = snap.val() || {};
      onlineCount.textContent = Object.keys(online).length;
    });

    // Load and render messages
    msgsRef.on("child_added", snap => {
      renderMessage(snap.key, snap.val(), user.id);
    });

    msgsRef.on("child_changed", snap => {
      updateMessage(snap.key, snap.val());
    });

    msgsRef.on("child_removed", snap => {
      const msgEl = document.getElementById(snap.key);
      if (msgEl) msgEl.remove();
    });

    // Send message
    form.addEventListener("submit", e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      msgsRef.push({
        uid: user.id,
        name: user.user_metadata.full_name || user.email,
        text: text,
        ts: Date.now(),
        edited: false
      });

      input.value = "";
    });

    // Logout button
    logoutBtn.addEventListener("click", () => {
      netlifyIdentity.logout();
    });

    // Render message
    function renderMessage(id, msg, uid) {
      const div = document.createElement("div");
      div.className = "message" + (msg.uid === uid ? " own" : "");
      div.id = id;

      const timeStr = new Date(msg.ts).toLocaleTimeString();

      let html = `
        <div class="meta">${msg.name} · <small>${timeStr}</small>
        ${msg.edited ? '<span class="edited">(edited)</span>' : ''}
        </div>
        <div class="text">${escapeHTML(msg.text)}</div>
      `;

      if (msg.uid === uid) {
        html += `
          <div class="actions">
            <button data-id="${id}" data-action="edit">✏️</button>
            <button data-id="${id}" data-action="delete">🗑️</button>
          </div>
        `;
      }

      div.innerHTML = html;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      // Event listeners for edit/delete
      div.querySelectorAll(".actions button").forEach(btn => {
        btn.addEventListener("click", e => {
          const action = btn.dataset.action;
          const msgId = btn.dataset.id;

          if (action === "edit") {
            const currentText = msg.text;
            const newText = prompt("Edit your message:", currentText);
            if (newText && newText !== currentText) {
              msgsRef.child(msgId).update({ text: newText, edited: true });
            }
          } else if (action === "delete") {
            if (confirm("Delete this message?")) {
              msgsRef.child(msgId).remove();
            }
          }
        });
      });
    }

    // Update message text
    function updateMessage(id, msg) {
      const div = document.getElementById(id);
      if (!div) return;

      const textEl = div.querySelector(".text");
      if (textEl) textEl.textContent = msg.text;

      const meta = div.querySelector(".meta");
      if (meta && msg.edited && !meta.innerHTML.includes("(edited)")) {
        meta.innerHTML += '<span class="edited">(edited)</span>';
      }
    }

    // Simple HTML escape
    function escapeHTML(str) {
      return str.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));
    }
  }
});
