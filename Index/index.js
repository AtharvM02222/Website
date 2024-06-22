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

