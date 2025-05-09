netlifyIdentity.init();

netlifyIdentity.on('init', user => {
  if (!user) {
    window.location.replace('/main.html');
  } else {
    document.body.style.display = 'flex';
    loadNotes(user);
    updateOnlineUsers();
  }
});
netlifyIdentity.on('login', () => location.reload());
netlifyIdentity.on('logout', () => window.location.replace('/main.html'));

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
const db = firebase.firestore();
const storage = firebase.storage();
const notesRef = db.collection('notes');

const chatDiv = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const photoInput = document.getElementById('photoInput');
const sendButton = document.getElementById('sendButton');
const logoutButton = document.getElementById('logoutButton');
const typingIndicator = document.getElementById('typingIndicator');
const typingUser = document.getElementById('typingUser');
const usersList = document.getElementById('usersList');

let typingTimeout;
let onlineUsers = {};

sendButton.addEventListener('click', async () => {
  const user = netlifyIdentity.currentUser();
  const username = user.user_metadata.username || user.user_metadata.full_name || user.email.split('@')[0];

  const text = messageInput.value.trim();
  const file = photoInput.files[0];

  if (!text && !file) return;

  let photoUrl = null;

  if (file) {
    try {
      const storageRef = storage.ref(`photos/${user.id}/${Date.now()}_${file.name}`);
      const uploadTaskSnapshot = await storageRef.put(file);
      photoUrl = await uploadTaskSnapshot.ref.getDownloadURL();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload photo.');
      return;
    }
  }

  await notesRef.add({
    userId: user.id,
    username: username,
    email: user.email,
    text: text || null,
    photoUrl: photoUrl || null,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    seenBy: []
  });

  messageInput.value = '';
  photoInput.value = '';
});

messageInput.addEventListener('input', () => {
  clearTimeout(typingTimeout);
  typingIndicator.style.display = 'block';
  typingUser.innerText = netlifyIdentity.currentUser().user_metadata.username || 'User';
  typingTimeout = setTimeout(() => {
    typingIndicator.style.display = 'none';
  }, 1000);
});

logoutButton.addEventListener('click', () => {
  netlifyIdentity.logout();
});

function loadNotes(user) {
  notesRef.orderBy('timestamp').onSnapshot(snapshot => {
    chatDiv.innerHTML = '';
    snapshot.forEach(doc => {
      const d = doc.data();
      const isOwn = d.userId === user.id;
      const displayName = d.username || (d.email ? d.email.split('@')[0] : 'Anonymous');

      let tick = '';
      if (isOwn) {
        const seenCount = (d.seenBy || []).length;
        if (seenCount > 0) {
          tick = seenCount > 1 ? '✔✔ (blue)' : '✔✔';
        } else {
          tick = '✔';
        }
      }

      const msg = document.createElement('div');
      msg.className = 'message' + (isOwn ? ' own-message' : '');
      msg.innerHTML = `
        <div class="meta">
          <strong>${displayName}</strong> • ${formatTimestamp(d.timestamp)} ${isOwn ? `<span>${tick}</span>` : ''}
        </div>
        <div>${d.text ? linkify(d.text) : ''}</div>
        ${d.photoUrl ? `<div><img src="${d.photoUrl}" alt="Photo" style="max-width: 100%; margin-top: 5px;"></div>` : ''}
        ${isOwn
          ? `<div class="actions">
              <button data-id="${doc.id}" data-text="${encodeURIComponent(d.text || '')}">Edit</button>
              <button data-id="${doc.id}">Delete</button>
             </div>`
          : ''}
      `;
      chatDiv.appendChild(msg);

      if (!isOwn && !(d.seenBy || []).includes(user.id)) {
        notesRef.doc(doc.id).update({
          seenBy: firebase.firestore.FieldValue.arrayUnion(user.id)
        });
      }
    });
    chatDiv.scrollTop = chatDiv.scrollHeight;
    attachActions();
  });
}

function attachActions() {
  document.querySelectorAll('.actions button').forEach(btn => {
    const id = btn.getAttribute('data-id');
    if (btn.innerText === 'Edit') {
      const oldText = decodeURIComponent(btn.getAttribute('data-text'));
      btn.onclick = async () => {
        const newText = prompt('Edit your note:', oldText);
        if (newText !== null) {
          await notesRef.doc(id).update({ text: newText });
        }
      };
    } else {
      btn.onclick = async () => {
        if (confirm('Delete this note?')) {
          await notesRef.doc(id).delete();
        }
      };
    }
  });
}

function updateOnlineUsers() {
  const users = Object.values(onlineUsers);
  usersList.innerText = users.join(', ') || 'No one';
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = ts.toDate(), now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = d.toDateString() === new Date(now - 86400000).toDateString();
  const hh = d.getHours(), mm = String(d.getMinutes()).padStart(2, '0');
  return isToday ? `Today ${hh}:${mm}` : isYesterday ? `Yesterday ${hh}:${mm}` : `${d.toLocaleDateString()} ${hh}:${mm}`;
}

function linkify(text) {
  return text.replace(/(https?:\/\/[^\s]+)/g, url => `<a href="${url}" target="_blank">${url}</a>`);
}

netlifyIdentity.on('login', user => {
  onlineUsers[user.id] = user.user_metadata.username || user.email;
  updateOnlineUsers();
});

netlifyIdentity.on('logout', () => {
  delete onlineUsers[netlifyIdentity.currentUser().id];
  updateOnlineUsers();
});
