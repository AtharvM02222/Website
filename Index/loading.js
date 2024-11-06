// script.js
document.addEventListener("DOMContentLoaded", function () {
    const text = "Initializing...";
    const typewriterTextElement = document.getElementById("typewriter-text");
    const mainPageURL = "https://atharvmandlavdiya.netlify.app/main.html";  // Main page URL
    
    let i = 0; // for typing the text
    let deleteIndex = text.length; // for deleting the text, starting at the end
    let isDeleting = false;
    
    function typeWriter() {
        if (isDeleting) {
            // Remove one character at a time
            typewriterTextElement.textContent = text.substring(0, deleteIndex);
            deleteIndex--; // Decrease deleteIndex to remove one character
        } else {
            // Add one character at a time
            typewriterTextElement.textContent = text.substring(0, i);
            i++; // Increase i to add one more character
        }
        
        // Set the typing speed and deleting speed
        let speed = isDeleting ? 50 : 150;
        
        if (!isDeleting && i === text.length) {
            // When typing is complete, wait 500ms before starting to delete
            setTimeout(function () {
                isDeleting = true; // Start deleting
                typeWriter(); // Recursively call typeWriter for deletion
            }, 500);  // 500ms delay before starting to delete
        } else if (isDeleting && deleteIndex === 0) {
            // When deletion is complete, redirect to the main page
            setTimeout(function () {
                window.location.href = mainPageURL;
            }, 500); // Optional delay before redirecting
        } else {
            setTimeout(typeWriter, speed); // Continue typing or deleting
        }
    }
    
    // Start typing when the page loads
    typeWriter();
});
