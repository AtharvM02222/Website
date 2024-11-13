
        // Retrieve the last played time from localStorage
        window.onload = function() {
            const audio = document.getElementById('bg-music');
            const lastTime = localStorage.getItem('lastPlayedTime');
            if (lastTime) {
                audio.currentTime = lastTime; // Start from where it left off
            }
            audio.play(); // Play the song
        };

        // Save the current time of the song before the user navigates away
        window.onbeforeunload = function() {
            const audio = document.getElementById('bg-music');
            localStorage.setItem('lastPlayedTime', audio.currentTime);
        };



// Log a message on hover over the project box
document.querySelector('.project-box').addEventListener('mouseover', () => {
  console.log("Hovering over the project box");
});



// Select the scroll-to-top button
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

// Show button when user scrolls down
window.addEventListener('scroll', () => {
  if (window.scrollY > 100) { // Show button when scrolled 300px down
    scrollToTopBtn.classList.add('show');
  } else {
    scrollToTopBtn.classList.remove('show');
  }
});

// Smooth scroll to top when button is clicked
scrollToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});
