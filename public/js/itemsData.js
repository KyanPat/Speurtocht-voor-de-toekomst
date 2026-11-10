// Content & Codes Dictionary voor Doomscroll Escape
const ITEMS_DATA = {
  autosleutels: {
    id: 'autosleutels',
    name: 'Autosleutels',
    location: 'LA227',
    code: '4222',
    points: 1,
    isLimited: false,
    icon: 'vpn_key',
    category: 'Algemeen Item',
    tag: 'Verkeersbord taak',
    hintText: 'Zoek bij lokaal LA227 naar de 4-cijferige code.',
    questionType: 'multiple_choice',
    question: 'Welk verkeersbord zie je hier bij LA227?',
    hintVideoTitle: 'Verkeersregels samenvatting (15s)',
    signSvg: `
      <svg class="w-24 h-24 drop-shadow-md" viewBox="0 0 120 120" aria-label="Stopbord">
        <polygon points="35,5 85,5 115,35 115,85 85,115 35,115 5,85 5,35" fill="#bc0b3b" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"></polygon>
        <polygon points="36,9 84,9 111,36 111,84 84,111 36,111 9,84 9,36" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.6" stroke-linejoin="round"></polygon>
        <text x="60" y="68" fill="#ffffff" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="800" text-anchor="middle" letter-spacing="1">STOP</text>
      </svg>
    `,
    options: [
      { id: 'opt_a', text: 'Stopbord', isCorrect: true, letter: 'A' },
      { id: 'opt_b', text: 'Eenrichtingsbord', isCorrect: false, letter: 'B' },
      { id: 'opt_c', text: 'Erfbord', isCorrect: false, letter: 'C' }
    ]
  },

  huissleutels: {
    id: 'huissleutels',
    name: 'Huissleutels',
    location: 'LX200',
    code: '1412',
    points: 1,
    isLimited: false,
    icon: 'key',
    category: 'Algemeen Item',
    tag: 'Voorzieningen taak',
    hintText: 'Zoek bij lokaal LX200 naar de 4-cijferige code.',
    questionType: 'amenity_filter',
    question: 'Welke voorzieningen heeft een huis echt nodig? Tik de 2 overbodige luxe opties weg om alleen de 4 essentiële basisbehoeften te bewaren:',
    amenities: [
      { id: 'dak', text: 'Dak', icon: 'roofing', isEssential: true },
      { id: 'water', text: 'Water', icon: 'water_drop', isEssential: true },
      { id: 'elektriciteit', text: 'Elektriciteit', icon: 'bolt', isEssential: true },
      { id: 'slaapplek', text: 'Slaapplek', icon: 'bed', isEssential: true },
      { id: 'bioscoop', text: 'Bioscoopkamer', icon: 'theaters', isEssential: false },
      { id: 'zwembad', text: 'Zwembad', icon: 'pool', isEssential: false }
    ]
  },

  diploma: {
    id: 'diploma',
    name: 'Diploma',
    location: 'LA Hoofdingang',
    code: '3221',
    points: 1,
    isLimited: false,
    icon: 'school',
    category: 'Algemeen Item',
    tag: 'Kennisvraag',
    hintText: 'Zoek bij de LA Hoofdingang naar de 4-cijferige code.',
    questionType: 'multiple_choice',
    question: 'Welk dier zie je op de foto bij de LA Hoofdingang?',
    subtext: 'Snelle kennisvraag om je diploma te ontgrendelen:',
    imageUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=75',
    imageCaption: 'Fotovraag LA Hoofdingang • Detailopname',
    options: [
      { id: 'opt_a', text: 'Hond', isCorrect: false, letter: 'A' },
      { id: 'opt_b', text: 'Zebra', isCorrect: false, letter: 'B' },
      { id: 'opt_c', text: 'Paard', isCorrect: true, letter: 'C' }
    ]
  },

  droomreis: {
    id: 'droomreis',
    name: 'Ticket voor droomreis',
    location: 'LA Balie',
    code: '2143',
    points: 1,
    isLimited: false,
    icon: 'confirmation_number',
    category: 'Algemeen Item',
    tag: 'Topografie vraag',
    hintText: 'Zoek op/bij de LA Balie naar de 4-cijferige code.',
    questionType: 'multiple_choice',
    question: 'In welk land staat de Eiffeltoren?',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    options: [
      { id: 'opt_a', text: 'Nederland', isCorrect: false, letter: 'A' },
      { id: 'opt_b', text: 'België', isCorrect: false, letter: 'B' },
      { id: 'opt_c', text: 'Frankrijk', isCorrect: true, letter: 'C' }
    ]
  },

  job_interview: {
    id: 'job_interview',
    name: 'Job Interview',
    location: '❓ Verborgen (Los taak op)',
    secretLocation: 'LA500 Trap',
    code: '2413',
    points: 1,
    isLimited: true,
    icon: 'handshake',
    category: 'Limited Item',
    tag: 'Sollicitatiegesprek • 1x Wereldwijd',
    hintText: 'Vind de geheime envelop bij LA500 Trap.',
    locationTask: {
      riddle: 'Waar vind je de trap naar de 5e verdieping voor je sollicitatiegesprek?',
      options: [
        { id: 'loc_a', text: 'LA500 Trap', isCorrect: true, letter: 'A' },
        { id: 'loc_b', text: 'Fietsenkelder', isCorrect: false, letter: 'B' },
        { id: 'loc_c', text: 'Schoonmaakhok', isCorrect: false, letter: 'C' }
      ],
      revealedLocation: 'LA500 Trap',
      revealHint: 'Ren nu snel naar LA500 Trap en zoek de 4-cijferige fysieke code!'
    },
    questionType: 'multiple_choice',
    speaker: 'Vraag van de werkgever:',
    question: '"Waarom denk je dat je geschikt bent voor deze positie?"',
    subtext: 'Wees snel: slechts 1 speler kan deze kans pakken!',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    options: [
      {
        id: 'opt_a',
        text: 'Ik ben leergierig en werk graag samen in een team.',
        isCorrect: true,
        letter: 'A'
      },
      {
        id: 'opt_b',
        text: 'Ik wil gewoon snel rijk worden zonder veel moeite.',
        isCorrect: false,
        letter: 'B'
      },
      {
        id: 'opt_c',
        text: 'Eigenlijk weet ik niet eens of ik dit wel aankan...',
        isCorrect: false,
        letter: 'C'
      }
    ]
  },

  job_raise: {
    id: 'job_raise',
    name: 'Job Raise',
    location: '❓ Verborgen (Los taak op)',
    secretLocation: 'LD Kantine',
    code: '1243',
    points: 1,
    isLimited: true,
    isLocked: true,
    icon: 'trending_up',
    category: 'Limited Item',
    tag: 'Salarisverhoging • Alleen voor Interview winnaar',
    hintText: 'Ontgrendelt 1 minuut na het sollicitatiegesprek (exclusief voor de winnaar bij LD Kantine).',
    locationTask: {
      riddle: 'Waar verzamelen collega\'s zich om promoties en salarisverhogingen te vieren?',
      options: [
        { id: 'loc_a', text: 'LD Kantine', isCorrect: true, letter: 'A' },
        { id: 'loc_b', text: 'Parkeerplaats', isCorrect: false, letter: 'B' },
        { id: 'loc_c', text: 'Magazijn Kelder', isCorrect: false, letter: 'C' }
      ],
      revealedLocation: 'LD Kantine',
      revealHint: 'Ren nu naar de LD Kantine en voer de fysieke code in!'
    },
    questionType: 'multiple_choice',
    speaker: 'Vraag van de directie:',
    question: '"Je ontvangt onverwacht een flinke salarisverhoging! Wat doe je?"',
    subtext: 'Laat zien dat je verstandig met succes omgaat:',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    options: [
      {
        id: 'opt_a',
        text: 'Bedanken en gemotiveerd en professioneel doorwerken.',
        isCorrect: true,
        letter: 'A'
      },
      {
        id: 'opt_b',
        text: 'Meteen flink feesten tot in de vroege ochtend.',
        isCorrect: false,
        letter: 'B'
      },
      {
        id: 'opt_c',
        text: 'Per direct ontslag nemen want nu heb ik genoeg geld.',
        isCorrect: false,
        letter: 'C'
      }
    ]
  },

  date: {
    id: 'date',
    name: 'Date',
    location: '❓ Verborgen (Los taak op)',
    secretLocation: 'LD112',
    code: '3442',
    points: 1,
    isLimited: true,
    icon: 'favorite',
    category: 'Limited Item',
    tag: 'Eerste Date • 1x Wereldwijd',
    hintText: 'Zoek bij lokaal LD112 naar de 4-cijferige code.',
    locationTask: {
      riddle: 'Bij welk gezellig ontmoetingspunt in het LD gebouw spreken jullie af voor de eerste date?',
      options: [
        { id: 'loc_a', text: 'LD112', isCorrect: true, letter: 'A' },
        { id: 'loc_b', text: 'Fietsenstalling', isCorrect: false, letter: 'B' },
        { id: 'loc_c', text: 'Kopieerhok 01', isCorrect: false, letter: 'C' }
      ],
      revealedLocation: 'LD112',
      revealHint: 'Ren direct naar LD112, vind de fysieke code en claim je date!'
    },
    questionType: 'multiple_choice',
    speaker: 'Dilemma voor je date:',
    question: 'Je hebt een spannende eerste date bij LD112. Welk cadeau neem je mee?',
    subtext: 'Maak een goede eerste indruk:',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    options: [
      {
        id: 'opt_a',
        text: 'Een prachtige bos bloemen',
        isCorrect: true,
        letter: 'A'
      },
      {
        id: 'opt_b',
        text: 'Fart spray',
        isCorrect: false,
        letter: 'B'
      },
      {
        id: 'opt_c',
        text: 'Een wc-ontstopper (plunger)',
        isCorrect: false,
        letter: 'C'
      },
      {
        id: 'opt_d',
        text: 'Een rol toiletpapier',
        isCorrect: false,
        letter: 'D'
      }
    ]
  },

  trouwen: {
    id: 'trouwen',
    name: 'Trouwen',
    location: '❓ Verborgen (Los taak op)',
    secretLocation: 'Lovensdijkstraat Plein',
    code: '3443',
    points: 1,
    isLimited: true,
    isLocked: true,
    icon: 'diversity_1',
    category: 'Limited Item',
    tag: 'Huwelijk & Toekomst • Alleen voor Date winnaar',
    hintText: 'Ontgrendelt 1 minuut na de Date (exclusief voor de winnaar bij Lovensdijkstraat Plein).',
    locationTask: {
      riddle: 'Waar buiten op het grote plein verzamelen de gasten voor de feestelijke huwelijksceremonie?',
      options: [
        { id: 'loc_a', text: 'Lovensdijkstraat Plein', isCorrect: true, letter: 'A' },
        { id: 'loc_b', text: 'Parkeerkelder', isCorrect: false, letter: 'B' },
        { id: 'loc_c', text: 'Meterkast B2', isCorrect: false, letter: 'C' }
      ],
      revealedLocation: 'Lovensdijkstraat Plein',
      revealHint: 'Ren nu naar Lovensdijkstraat Plein, vind de 4-cijferige code en stap in het huwelijksbootje!'
    },
    questionType: 'multiple_choice',
    speaker: 'Grote levenskeuze:',
    question: 'Wat is het allerbelangrijkste fundament voor een gelukkig en langdurig huwelijk?',
    subtext: 'Wees snel: alleen de Date winnaar kan de huwelijksboot betreden!',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    options: [
      {
        id: 'opt_a',
        text: 'Goede communicatie en wederzijds vertrouwen',
        isCorrect: true,
        letter: 'A'
      },
      {
        id: 'opt_b',
        text: 'Een gigantische bruidstaart van 5 meter hoog',
        isCorrect: false,
        letter: 'B'
      },
      {
        id: 'opt_c',
        text: 'Elke week een peperduur cadeau eisen',
        isCorrect: false,
        letter: 'C'
      },
      {
        id: 'opt_d',
        text: 'Nooit sorry zeggen bij een ruzie',
        isCorrect: false,
        letter: 'D'
      }
    ]
  }
};

// DOOMSCROLL OPEN SOURCE VIDEO & MEDIA FEED (UNLIMITED SCROLLING CATALOGUS MET VERIFIEERDE VIDEO'S)
const OPENSOURCE_MEDIA_CATALOG = [
  {
    id: 'os_media_1',
    creator: '@nature_timelapse',
    creatorName: 'Botanical Bloom NL',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '3.4M volgers',
    caption: 'Time-lapse van bloeiende voorjaarsbloemen in 4K 🌸✨ Puur natuurlijk wonder! #fyp #nature #timelapse #satisfying #bloemen',
    sound: 'Origineel Geluid - MDN Nature Sounds (Loop)',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    bgImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
    likes: 142800,
    dislikes: 120,
    comments: '1.4K',
    shares: '8.9K',
    credits: 'Bron: Mozilla Developer Network (MDN) CC0 Open Media • Licentie: CC0 Public Domain'
  },
  {
    id: 'os_media_2',
    creator: '@beach_vibes_nl',
    creatorName: 'Sunset Ocean Beats',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '5.9M volgers',
    caption: 'De golven tijdens een gouden zonsondergang op vrijdagavond... 🌅🌊 Zet je geluid even lekker aan! #sunset #ocean #relax #chill',
    sound: 'Beach Waves Ambience - MDN Open Sounds HQ',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    likes: 384200,
    dislikes: 340,
    comments: '4.9K',
    shares: '29.3K',
    credits: 'Bron: Mozilla Open Web Media Archive • Licentie: CC0 Public Domain'
  },
  {
    id: 'os_media_3',
    creator: '@ocean_explorer',
    creatorName: 'Deep Sea Life NL',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '4.1M volgers',
    caption: 'Duik mee in de diepblauwe oceaan tussen de dolfijnen en koraalriffen 🐬🌊 Onwerkelijk mooi! #oceanlife #marinelife #deepblue',
    sound: 'Deep Ocean Soundscape - VideoJS Wildlife Project',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    bgImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    likes: 512900,
    dislikes: 410,
    comments: '6.3K',
    shares: '42.1K',
    credits: 'Bron: VideoJS Oceans Open Project (Disney Nature / VideoJS) • Licentie: Open Media'
  },
  {
    id: 'os_media_4',
    creator: '@blender_open_anim',
    creatorName: 'Blender Open Studio',
    creatorAvatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '2.8M volgers',
    caption: 'De legendarische Big Buck Bunny ontwaakt in het bos! 🐰🌳 100% gemaakt met open source 3D software! #blender3d #animation #openmovie',
    sound: 'Blender Foundation Soundtracks - Forest Morning',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    bgImage: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=800&q=80',
    likes: 679100,
    dislikes: 512,
    comments: '7.8K',
    shares: '53.2K',
    credits: 'Bron: Blender Foundation (Big Buck Bunny) • Licentie: Creative Commons Attribution 3.0 (CC-BY 3.0)'
  },
  {
    id: 'os_media_5',
    creator: '@w3c_media_project',
    creatorName: 'Open Web Cinema',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '1.9M volgers',
    caption: 'Sintel: epische zoektocht van een dappere krijger door de besneeuwde bergen ⚔️🐉 Prachtige cinematische animatie! #sintel #openmovie #cgi',
    sound: 'Epic Orchestral Fantasy - Jan Morgenstern',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    bgImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    likes: 820300,
    dislikes: 640,
    comments: '9.4K',
    shares: '71.0K',
    credits: 'Bron: W3C / Blender Open Movie (Sintel) • Licentie: Creative Commons Attribution 3.0 (CC-BY 3.0)'
  },
  {
    id: 'os_media_6',
    creator: '@bunny_animation_nl',
    creatorName: 'Open Animation Lab',
    creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '2.5M volgers',
    caption: 'De officiële teaser trailer van Big Buck Bunny in volle glorie! 🐰✨ Blijft een absolute klassieker. #animation #funny #viral #nostalgia',
    sound: 'Blender Orchestral Score - Classic Bunny Theme',
    videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    bgImage: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&w=800&q=80',
    likes: 432100,
    dislikes: 310,
    comments: '3.9K',
    shares: '34.5K',
    credits: 'Bron: W3C HTML5 Video Test Suite • Licentie: Creative Commons Attribution (CC-BY)'
  },
  {
    id: 'os_media_7',
    creator: '@creative_clips',
    creatorName: 'Creative Craft NL',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '3.4M volgers',
    caption: 'Dit vakmanschap is zó satisfying om naar te kijken 🤤✨ Prachtige actie! #fyp #satisfying #viral #craft',
    sound: 'Origineel Geluid - Dynamic Beats & Ambient Sound',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    bgImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    likes: 142800,
    dislikes: 95,
    comments: '1.4K',
    shares: '8.9K',
    credits: 'Bron: Google Open Media Sample • Licentie: Creative Commons (CC-BY 3.0)'
  },
  {
    id: 'os_media_8',
    creator: '@barista_latte_art',
    creatorName: 'Coffee Craftsman',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '1.8M volgers',
    caption: 'Even ontsnappen naar de mooiste plekken ter wereld ☕🌿 Zet je geluid even aan! #nature #vibes #satisfying #relax',
    sound: 'Lofi Café Ambience - Gentle Espresso Beats',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    bgImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    likes: 294000,
    dislikes: 180,
    comments: '2.8K',
    shares: '15.6K',
    credits: 'Bron: Google Open Media Sample (Escapes) • Licentie: CC0 Public Domain'
  },
  {
    id: 'os_media_8_zen',
    creator: '@zen_fun_art',
    creatorName: 'Extreme Fun Lab',
    creatorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '1.2M volgers',
    caption: 'Dit moet je zien! Wat een timing en energie 🚀🎉 #fun #energy #satisfying #hype',
    sound: 'High Energy Beat - Creative Commons HQ',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    bgImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    likes: 198500,
    comments: '1.9K',
    shares: '12.8K',
    credits: 'Bron: Google Media Open Bucket • Licentie: Creative Commons (CC-BY 2.0)'
  },
  {
    id: 'os_media_9',
    creator: '@blender_simulations',
    creatorName: 'Fluid & Physics 3D',
    creatorAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '3.7M volgers',
    caption: 'Pure vreugde en kleurexplosie in 60fps 🔮🌊 Bizar hoe scherp dit is! #blender3d #cgi #satisfying #simulation',
    sound: 'Synthwave Neon Waves - Infinite Loop HQ',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80',
    likes: 742100,
    comments: '8.1K',
    shares: '64.9K',
    credits: 'Bron: Google Open Media Sample • Licentie: Creative Commons (CC-BY 4.0)'
  },
  {
    id: 'os_media_10',
    creator: '@nature_timelapse',
    creatorName: 'Earth Timelapse Co.',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '4.8M volgers',
    caption: 'Als alles even te veel wordt... adem in en kijk dit 🌌✨ Magische effecten! #chill #satisfying #relax #timelapse',
    sound: 'Deep Ambient Universe - Ethereal Strings',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    bgImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=800&q=80',
    likes: 915300,
    comments: '11.2K',
    shares: '89.4K',
    credits: 'Bron: Google Open Media Sample • Licentie: CC0 Public Domain'
  },
  {
    id: 'os_media_11',
    creator: '@scifi_tears',
    creatorName: 'Tears of Steel Sci-Fi',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '1.6M volgers',
    caption: 'De legendarische sci-fi actiescène van Tears of Steel in Amsterdam! 🤖💥 100% open source CGI! #tearsOfSteel #blender3d #vfx #cgi',
    sound: 'Sci-Fi Orchestral Beat - Jarno Sarkula',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    bgImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    likes: 341800,
    comments: '3.1K',
    shares: '21.5K',
    credits: 'Bron: Blender Foundation Open Movie Project • Licentie: CC-BY 3.0'
  },
  {
    id: 'os_media_12',
    creator: '@bullrun_roadtrip',
    creatorName: 'Epic Roadtrips NL',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '2.9M volgers',
    caption: 'We are going on a bullrun! 🏎️💨 Het motorgeluid is echt ongeëvenaard! #roadtrip #cars #supercars #soundon',
    sound: 'High Octane Engine Roar - Open Audio Suite',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    bgImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    likes: 567200,
    comments: '7.0K',
    shares: '48.3K',
    credits: 'Bron: Google Open Media Sample (Bullrun) • Licentie: CC-BY 3.0'
  },
  {
    id: 'os_media_13',
    creator: '@car_deals_nl',
    creatorName: 'Auto Avontuur NL',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '3.1M volgers',
    caption: 'Wat voor auto kun je scoren voor 1000 euro?! 🚗👀 Je gelooft nooit wat er rijdt! #budgetcars #autotips #funny #challenge',
    sound: 'Upbeat Funk Groove - Open Media Audio',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    bgImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    likes: 412000,
    comments: '4.2K',
    shares: '31.0K',
    credits: 'Bron: Google Open Media Sample • Licentie: CC-BY 3.0'
  },
  {
    id: 'os_media_14',
    creator: '@elephants_dream',
    creatorName: 'Elephants Dream Studio',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '1.4M volgers',
    caption: 'De allereerste open-source 3D film ooit gemaakt ter wereld! 🎬🐘 Pure geschiedenis! #elephantsdream #openmovie #retro3d',
    sound: 'Jan Morgenstern - Sound of Machine Dreams',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    bgImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    likes: 389000,
    comments: '5.1K',
    shares: '27.4K',
    credits: 'Bron: Blender Foundation (Elephants Dream) • Licentie: CC-BY 2.5'
  }
];

// FAKE AMBIENT PUSH NOTIFICATIES (ENGAGEMENT BAIT IN HET NEDERLANDS - ZONDER SCHOOL THEMA)
const PUSH_NOTIFICATIONS = [
  {
    app: 'TikTok',
    icon: 'play_arrow',
    color: '#000000',
    title: 'TikTok',
    message: 'Kijk deze virale video: "Bizarre ontdekking op camera vastgelegd..." 😱',
    time: 'Zojuist'
  },
  {
    app: 'Instagram',
    icon: 'favorite',
    color: '#E1306C',
    title: 'Instagram',
    message: '@lisa.kramer heeft je recente foto geliket ❤️',
    time: '1m geleden'
  },
  {
    app: 'Instagram',
    icon: 'group_add',
    color: '#E1306C',
    title: 'Instagram',
    message: 'Je hebt 3 nieuwe volgers! Kijk wie ze zijn.',
    time: '2m geleden'
  },
  {
    app: 'Snapchat',
    icon: 'chat_bubble',
    color: '#FFFC00',
    textColor: '#000',
    title: 'Snapchat',
    message: '🔥 Je streak met Daan staat op 56 dagen! Stuur snel een snap terug!',
    time: 'Zojuist'
  },
  {
    app: 'BeReal',
    icon: 'warning',
    color: '#000000',
    title: 'BeReal.',
    message: '⚠️ Tijd voor BeReal! Je hebt nog 2 minuten om je foto te posten.',
    time: 'Zojuist'
  },
  {
    app: 'TikTok',
    icon: 'alternate_email',
    color: '#000000',
    title: 'TikTok',
    message: '@lars_visser heeft je getagd in een reactie: "Dit ben jij letterlijk 😂"',
    time: 'Nu'
  },
  {
    app: 'WhatsApp',
    icon: 'chat',
    color: '#25D366',
    title: 'WhatsApp • Moeder',
    message: 'Vergeet je fietssleutels niet! En hoe gaat de speurtocht?',
    time: 'Zojuist'
  },
  {
    app: 'Instagram',
    icon: 'send',
    color: '#E1306C',
    title: 'Instagram DM • Sarah',
    message: 'Ben jij nu ook in de kantine?? Ik zag je net lopen!',
    time: 'Nu'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ITEMS_DATA, OPENSOURCE_MEDIA_CATALOG, PUSH_NOTIFICATIONS };
}
