/*
  Contenido editable.
  - PASSCODE_HASH: SHA-256 de tu clave de 8 dígitos (nunca guardes la clave en texto plano).
    Genera el hash en la consola del navegador:
      crypto.subtle.digest('SHA-256', new TextEncoder().encode('14022024'))
        .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
    El valor de abajo corresponde a la clave de ejemplo 14022024.
  - LETTERS: añade más objetos para tener más cartas (las flechas y los puntos se activan solos).
  - TRACKS: "src" apunta a tus archivos de audio; "cover" puede ser una URL de imagen o un gradiente;
    "logo" (opcional) es la URL o ruta de la imagen del artista, p. ej. 'img/daft-punk.png'.
*/
window.CARTAS = {
  LOCK_ENABLED: true,         // true = pide la clave al entrar
  PASSCODE_HASH: '',
  PASSCODE_FALLBACK: '20261016',

  LETTERS: [
    {
      date: '16 de octubre de 2026 🥳🎉🌹♥️💞',
      greeting: 'Pequitas, mi amor:',
      body: [
        'Mi amor este es un día muy especial para ti, y por eso quiero celebrar y agradecer a Dios por tu nacimiento, quiero que sepas que te amo que eres lo más bonito, puro y tierno que hay en este mundo, espero que pases un cumpleaños súper bonito junto a los seres que te quieren y junto a mí... TE AMO mi amor feliz cumple! 🎉🌹♥️',
        'Te quiero dedicar un poema por ser tan hermosa:',
        '"Te amo sin saber cómo, ni cuándo, ni de dónde,',
        'te amo directamente sin problemas ni orgullo:',
        'así te amo porque no sé amar de otra manera..."',
        'Pablo Neruda...'
      ],
      signature: 'De parte de tu novio que te ama muchoooo..! 😁♥️♥️♥️ '
    }
  ],

  TRACKS: [
    { title: 'Something About Us', artist: 'Daft Punk',                       logo: '../assets/imgs/daftpunk.jpg', src: '../assets/audio/Daft Punk - Something About Us (Official Video).mp3',          duration: 228, cover: 'linear-gradient(135deg,#FFD45C 0%,#EC5C8A 100%)' },
    { title: 'Instant Crush',      artist: 'Daft Punk ft. Julian Casablancas', logo: '../assets/imgs/daftpunk.jpg', src: '../assets/audio/Daft Punk - Instant Crush (Video) ft. Julian Casablancas.mp3', duration: 340, cover: 'linear-gradient(160deg,#FFE0EA 0%,#EC5C8A 60%,#B8365F 100%)' },
    { title: 'Te quiero',          artist: 'Hombres G',                       logo: '../assets/imgs/hombresg.jpg', src: '../assets/audio/Hombres G - Te quiero (Letra Lyrics).mp3',                       duration: 225, cover: 'linear-gradient(135deg,#C9D3FF 0%,#3F5FD9 100%)' },
    { title: 'Locos',              artist: 'León Larregui',                   logo: '../assets/imgs/zoe.jpg',      src: '../assets/audio/León Larregui - Locos (Video Oficial).mp3',                     duration: 238, cover: 'linear-gradient(200deg,#FFF6D6 0%,#FFD45C 45%,#D62F45 100%)' }
  ]
};
