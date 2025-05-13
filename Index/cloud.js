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
const db = firebase.firestore();

// 2. Wait for Netlify Identity to be ready
netlifyIdentity.on('init', user => {
  if (!user) return;  // already handled in head script

  const userEmail = user.email;
  const messagesList = document.getElementById('messages');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const logoutBtn = document.getElementById('logout-btn');

  // 3. Send a new message
  chatForm.addEventListener('submit', async e => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    await db.collection('messages').add({
      user: userEmail,
      message: text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    messageInput.value = '';
  });

  // 4. Real-time listener for incoming messages
  db.collection('messages')
    .orderBy('timestamp')
    .onSnapshot(snapshot => {
      messagesList.innerHTML = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement('li');
        li.textContent = `${data.user}: ${data.message}`;
        li.classList.add(data.user === userEmail ? 'self' : 'other');
        messagesList.appendChild(li);
      });
      // auto-scroll to bottom
      messagesList.scrollTop = messagesList.scrollHeight;
    });

  // 5. Logout
  logoutBtn.addEventListener('click', () => {
    netlifyIdentity.logout();
    window.location.replace('/main.html');
  });
});

// Ensure Netlify Identity is initialized
netlifyIdentity.init();
