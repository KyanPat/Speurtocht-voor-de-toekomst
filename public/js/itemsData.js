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
    creator: '@nature_wildlife_nl',
    creatorName: 'Wildernis Avontuur',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '3.4M volgers',
    caption: 'Wat een natuurgeweld! Gigantische beer vangt verse vis in de woeste stroomversnelling 🐻🐟 #wildlife #nature #river #salmon',
    sound: 'Origineel Geluid - Ruisende Bergrivier & Beer Plons',
    videoUrl: '/assets/videos/bear_stream.mp4',
    bgImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
    likes: 142800,
    dislikes: 120,
    comments: '1.4K',
    shares: '8.9K',
    credits: 'W3C Open Media • Licentie: CC0 Public Domain'
  },
  {
    id: 'os_media_2',
    creator: '@sunset_vibes_nl',
    creatorName: 'Sunset Ocean Beats',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '5.9M volgers',
    caption: 'De golven tijdens een gouden zonsondergang op vrijdagavond... 🌅🌊 Zet je geluid even lekker aan! #sunset #ocean #relax #chill',
    sound: 'Origineel Geluid - Friday Sunset Chill (Akkoorden & Golven)',
    videoUrl: '/assets/videos/friday_chill.mp4',
    bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    likes: 384200,
    dislikes: 340,
    comments: '4.9K',
    shares: '29.3K',
    credits: 'Mozilla Open Web Media • Licentie: CC0 Public Domain'
  },
  {
    id: 'os_media_3',
    creator: '@echo_band_official',
    creatorName: 'Echo Band NL',
    creatorAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '4.1M volgers',
    caption: 'Onze nieuwe single "Here We Are" is uit! 🎸🔥 Wat vinden jullie van het refrein? #newmusic #indierock #vibes #live',
    sound: 'Origineel Geluid - Echo: Here We Are (Vocal & Drums)',
    videoUrl: '/assets/videos/echo_music.mp4',
    bgImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    likes: 512900,
    dislikes: 410,
    comments: '6.3K',
    shares: '42.1K',
    credits: 'Echo Band / MediaElement • Licentie: CC-BY Open Track'
  },
  {
    id: 'os_media_4',
    creator: '@open_cinema_hub',
    creatorName: 'Open Cinema Studio',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '1.9M volgers',
    caption: 'Sintel: epische zoektocht van een dappere krijger door de besneeuwde bergen ⚔️🐉 Prachtige cinematische animatie! #sintel #openmovie #cgi',
    sound: 'Origineel Geluid - Jan Morgenstern (Sintel Score & Dragon Roar)',
    videoUrl: '/assets/videos/sintel_trailer.mp4',
    bgImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    likes: 820300,
    dislikes: 640,
    comments: '9.4K',
    shares: '71.0K',
    credits: 'Blender Open Movie (Sintel) • Licentie: CC-BY 3.0'
  },
  {
    id: 'os_media_5',
    creator: '@blender_open_anim',
    creatorName: 'Blender Open Studio',
    creatorAvatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '2.8M volgers',
    caption: 'De legendarische Big Buck Bunny ontwaakt in het bos! 🐰🌳 100% gemaakt met open source 3D software! #blender3d #animation #openmovie',
    sound: 'Origineel Geluid - Fluitende Vogels & Vrolijke Bunny Score',
    videoUrl: '/assets/videos/bunny_cartoon.mp4',
    bgImage: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=800&q=80',
    likes: 679100,
    dislikes: 512,
    comments: '7.8K',
    shares: '53.2K',
    credits: 'Blender Foundation (Big Buck Bunny) • Licentie: CC-BY 3.0'
  },
  {
    id: 'os_media_6',
    creator: '@action_visuals_nl',
    creatorName: 'Action & VFX Lab',
    creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '2.5M volgers',
    caption: 'Kijk naar die camerahoek en cinematische slow motion! 🎥💥 Prachtig staaltje actiewerk. #action #visuals #epic #slowmo',
    sound: 'Origineel Geluid - Hollywood Action Drums & Effects',
    videoUrl: '/assets/videos/movie_300.mp4',
    bgImage: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&w=800&q=80',
    likes: 432100,
    dislikes: 310,
    comments: '3.9K',
    shares: '34.5K',
    credits: 'W3C HTML5 Video Test Suite • Licentie: CC-BY'
  },
  {
    id: 'os_media_7',
    creator: '@deep_ocean_explorer',
    creatorName: 'Deep Sea Life NL',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    verified: true,
    followers: '4.1M volgers',
    caption: 'Duik mee in de diepblauwe oceaan tussen de dolfijnen en koraalriffen 🐬🌊 Onwerkelijk rustgevend! #oceanlife #marinelife #deepblue',
    sound: 'Origineel Geluid - Ocean Symphony & Onderwater Ambience',
    videoUrl: '/assets/videos/oceans.mp4',
    bgImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    likes: 912000,
    dislikes: 410,
    comments: '12.3K',
    shares: '82.1K',
    credits: 'VideoJS Oceans Open Project • Licentie: Open Media'
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
    message: 'Heb je deze leuke video al gezien? 😂 Wat wil je vanavond eten?',
    time: 'Zojuist'
  },
  {
    app: 'WhatsApp',
    icon: 'chat',
    color: '#25D366',
    title: 'WhatsApp • Vriendengroep',
    message: 'Daan: Wie heeft er straks zin om een potje te gamen? 🎮',
    time: 'Nu'
  },
  {
    app: 'Instagram',
    icon: 'send',
    color: '#E1306C',
    title: 'Instagram DM • Sarah',
    message: 'Hey! Heb je even tijd? Moet je echt even een leuke video laten zien 😂',
    time: 'Nu'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ITEMS_DATA, OPENSOURCE_MEDIA_CATALOG, PUSH_NOTIFICATIONS };
}
