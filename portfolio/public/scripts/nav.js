customElements.whenDefined('ninja-keys').then(() => {
  document.querySelector('ninja-keys').data = [
    { id: 'home',        title: 'Home',                handler: () => location.href = '/' },
    { id: 'github',      title: 'GitHub',              handler: () => window.open('https://github.com/AtharvM02222') },
    { id: 'linkedin',    title: 'LinkedIn',            handler: () => window.open('https://www.linkedin.com/in/atharvmandlavdiya') },
    { id: 'hackerrank',  title: 'HackerRank',          handler: () => window.open('https://www.hackerrank.com/profile/Atharv0M') },
    { id: 'gdev',        title: 'Google Dev Profile',  handler: () => window.open('https://g.dev/atharvmandlavdiya') },
    { id: 'itchio',      title: 'itch.io',             handler: () => window.open('https://itch.io/profile/atharvam') },
  ]
})
