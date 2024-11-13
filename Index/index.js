// Function to calculate time until next June 8th at 9:08 PM
function calculateTimeUntilJune8() {
  const now = new Date();
  const june8 = new Date(now.getFullYear(), 5, 8, 21, 8, 0); // June is 5, 9:08 PM

  if (now > june8) {
    june8.setFullYear(june8.getFullYear() + 1);
  }

  const difference = june8 - now;
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

// Function to update the countdown
function updateCountdown() {
  const { days, hours, minutes, seconds } = calculateTimeUntilJune8();
  document.getElementById('days').textContent = padZero(days);
  document.getElementById('hours').textContent = padZero(hours);
  document.getElementById('minutes').textContent = padZero(minutes);
  document.getElementById('seconds').textContent = padZero(seconds);
}

// Function to pad single digit numbers with leading zero
function padZero(num) {
  return num < 10 ? '0' + num : num;
}

// Update the countdown every second
setInterval(updateCountdown, 1000);

// Initial call to updateCountdown to avoid delay
updateCountdown();


// Initial call to update the countdown
updateCountdown();

// Update the countdown every second
setInterval(updateCountdown, 1000);


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



const scrollToTopButton = document.querySelector('.scroll-to-top');

// Show button when scrolling down
window.addEventListener('scroll', () => {
  if (window.scrollY > 200) { // Adjust this value as needed
    scrollToTopButton.classList.add('show');
    scrollToTopButton.classList.remove('hide');
  } else {
    scrollToTopButton.classList.remove('show');
    scrollToTopButton.classList.add('hide');
  }
});

