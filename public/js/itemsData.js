// Content & Codes Dictionary voor Doomscroll Escape
const ITEMS_DATA = {
  "autosleutels": {
    "id": "autosleutels",
    "name": "Autosleutels",
    "location": "LA227",
    "code": "4222",
    "points": 1,
    "isLimited": false,
    "icon": "vpn_key",
    "category": "Algemeen Item",
    "tag": "Verkeersregels theorie",
    "hintText": "Zoek bij lokaal LA227 naar de 4-cijferige code.",
    "hintVideoTitle": "Verkeersregels theorie (15s)",
    "tasks": [
      {
        "step": 1,
        "type": "single_choice",
        "tag": "Verkeersbord herkennen",
        "scenario": "Je nadert een kruising in de auto en ziet een achthoekig rood verkeersbord met de witte letters STOP.",
        "question": "Wat voor verkeersbord is dit?",
        "options": [
          {
            "id": "as1_a",
            "text": "Stopbord (volledig stoppen en voorrang verlenen)",
            "isCorrect": true
          },
          {
            "id": "as1_b",
            "text": "Eenrichtingsweg (inrijden toegestaan)",
            "isCorrect": false
          },
          {
            "id": "as1_c",
            "text": "Erfbord (stapvoets rijden)",
            "isCorrect": false
          },
          {
            "id": "as1_d",
            "text": "Voorrangskruising bord",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 2,
        "type": "single_choice",
        "tag": "Snelheidslimiet overdag",
        "scenario": "Je rijdt op een Nederlandse snelweg. Het is 13:00 uur 's middags op een doordeweekse dag.",
        "question": "Hoe hard mag je over het algemeen maximaal rijden om 13:00 uur?",
        "options": [
          {
            "id": "as2_a",
            "text": "100 km/u",
            "isCorrect": true
          },
          {
            "id": "as2_b",
            "text": "130 km/u",
            "isCorrect": false
          },
          {
            "id": "as2_c",
            "text": "80 km/u",
            "isCorrect": false
          },
          {
            "id": "as2_d",
            "text": "30 km/u",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 3,
        "type": "single_choice",
        "tag": "Voertuigkennis",
        "scenario": "Bekijk een standaard personenauto zoals die dagelijks op de weg rijdt.",
        "question": "Hoeveel wielen heeft een normale personenauto over het algemeen op de weg?",
        "options": [
          {
            "id": "as3_a",
            "text": "4 wielen",
            "isCorrect": true
          },
          {
            "id": "as3_b",
            "text": "3 wielen",
            "isCorrect": false
          },
          {
            "id": "as3_c",
            "text": "5 wielen",
            "isCorrect": false
          },
          {
            "id": "as3_d",
            "text": "6 wielen",
            "isCorrect": false
          },
          {
            "id": "as3_e",
            "text": "8 wielen",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 4,
        "type": "multi_select",
        "tag": "Auto-onderdelen selecteren",
        "scenario": "Een auto bestaat uit verschillende technische en structurele onderdelen.",
        "question": "Welke onderdelen horen echt bij een auto? Klik alle juiste onderdelen aan:",
        "options": [
          {
            "id": "as4_a",
            "text": "Stuur",
            "isCorrect": true
          },
          {
            "id": "as4_b",
            "text": "Motor",
            "isCorrect": true
          },
          {
            "id": "as4_c",
            "text": "Wielen",
            "isCorrect": true
          },
          {
            "id": "as4_d",
            "text": "Deuren",
            "isCorrect": true
          },
          {
            "id": "as4_e",
            "text": "Baksteen",
            "isCorrect": false
          },
          {
            "id": "as4_f",
            "text": "Stopbord",
            "isCorrect": false
          },
          {
            "id": "as4_g",
            "text": "Zaklamp",
            "isCorrect": false
          },
          {
            "id": "as4_h",
            "text": "Kamerplant",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  "huissleutels": {
    "id": "huissleutels",
    "name": "Huissleutels",
    "location": "LA114",
    "code": "8114",
    "points": 1,
    "isLimited": false,
    "icon": "home",
    "category": "Algemeen Item",
    "tag": "Wonen en veiligheid",
    "hintText": "Zoek bij lokaal LA114 naar de 4-cijferige code.",
    "hintVideoTitle": "Veilig wonen tips (15s)",
    "tasks": [
      {
        "step": 1,
        "type": "eliminate",
        "tag": "Basisvoorzieningen van een huis",
        "scenario": "Een leefbare woning heeft basisbehoeften nodig om veilig en gezond te kunnen wonen.",
        "question": "Welke voorzieningen heeft een huis echt nodig? Klik weg wat NIET noodzakelijk is:",
        "options": [
          {
            "id": "hs1_a",
            "text": "Dak boven je hoofd",
            "isEliminateTarget": false
          },
          {
            "id": "hs1_b",
            "text": "Stromend water",
            "isEliminateTarget": false
          },
          {
            "id": "hs1_c",
            "text": "Elektriciteit",
            "isEliminateTarget": false
          },
          {
            "id": "hs1_d",
            "text": "Slaapplek / bed",
            "isEliminateTarget": false
          },
          {
            "id": "hs1_e",
            "text": "Bioscoopkamer",
            "isEliminateTarget": true
          },
          {
            "id": "hs1_f",
            "text": "Verwarmd binnenzwembad",
            "isEliminateTarget": true
          }
        ]
      },
      {
        "step": 2,
        "type": "single_choice",
        "tag": "Maandelijkse kosten berekenen",
        "scenario": "Alle vaste basisvoorzieningen in je huis kosten bij elkaar precies € 300 per maand.",
        "question": "Hoeveel kosten deze voorzieningen voor precies een halve maand?",
        "options": [
          {
            "id": "hs2_a",
            "text": "€ 150",
            "isCorrect": true
          },
          {
            "id": "hs2_b",
            "text": "€ 100",
            "isCorrect": false
          },
          {
            "id": "hs2_c",
            "text": "€ 200",
            "isCorrect": false
          },
          {
            "id": "hs2_d",
            "text": "€ 75",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 3,
        "type": "single_choice",
        "tag": "Inbraakpreventie & Veiligheid",
        "scenario": "Je verlaat je woning om even snel een boodschap te doen bij de supermarkt.",
        "question": "Wat doe je met de voordeur als je weggaat?",
        "options": [
          {
            "id": "hs3_a",
            "text": "Deur dichttrekken en met de sleutel op slot draaien",
            "isCorrect": true
          },
          {
            "id": "hs3_b",
            "text": "Deur gewoon dichttrekken zonder op slot te draaien",
            "isCorrect": false
          },
          {
            "id": "hs3_c",
            "text": "Voordeur wijd open laten staan voor frisse lucht",
            "isCorrect": false
          },
          {
            "id": "hs3_d",
            "text": "De sleutel aan de buitenkant in het sleutelgat laten zitten",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 4,
        "type": "single_choice",
        "tag": "Sleutels bewaren",
        "scenario": "Je komt na een lange schooldag thuis en doet je jas uit.",
        "question": "Waar bewaar je je huissleutels het verstandigst zodat je ze nooit kwijtraakt?",
        "options": [
          {
            "id": "hs4_a",
            "text": "Op een vaste, veilige plek (bijv. sleutelbakje of wandhaakje)",
            "isCorrect": true
          },
          {
            "id": "hs4_b",
            "text": "Los tussen de groenten in de koelkast",
            "isCorrect": false
          },
          {
            "id": "hs4_c",
            "text": "Buiten op de stoep voor de voordeur",
            "isCorrect": false
          },
          {
            "id": "hs4_d",
            "text": "Onderin de vuilnisemmer",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  "diploma": {
    "id": "diploma",
    "name": "Diploma",
    "location": "LA223",
    "code": "5223",
    "points": 1,
    "isLimited": false,
    "icon": "school",
    "category": "Algemeen Item",
    "tag": "Algemene schoolkennis",
    "hintText": "Zoek bij lokaal LA223 naar de 4-cijferige code.",
    "hintVideoTitle": "Schoolkennis opfrissen (15s)",
    "tasks": [
      {
        "step": 1,
        "type": "single_choice",
        "tag": "Rekenen & Wiskunde",
        "scenario": "Een snelle hoofdrekenopgave om je wiskundige basiskennis te testen.",
        "question": "Wat is de uitkomst van de basissom: 2 + 3?",
        "options": [
          {
            "id": "dp1_a",
            "text": "5",
            "isCorrect": true
          },
          {
            "id": "dp1_b",
            "text": "4",
            "isCorrect": false
          },
          {
            "id": "dp1_c",
            "text": "6",
            "isCorrect": false
          },
          {
            "id": "dp1_d",
            "text": "7",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 2,
        "type": "single_choice",
        "tag": "Biologie dierenkennis",
        "scenario": "In de biologieles leer je over zoogdieren. Dit dier heeft manen, vier hoeven en galoppeert over het veld.",
        "question": "Hoe heet dit dier?",
        "options": [
          {
            "id": "dp2_a",
            "text": "Paard",
            "isCorrect": true
          },
          {
            "id": "dp2_b",
            "text": "Zebra",
            "isCorrect": false
          },
          {
            "id": "dp2_c",
            "text": "Hond",
            "isCorrect": false
          },
          {
            "id": "dp2_d",
            "text": "Ezel",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 3,
        "type": "single_choice",
        "tag": "Engelse taal",
        "scenario": "Je begroet iemand in het buitenland in de Engelse taal.",
        "question": "Wat is het Engelse woord voor 'Hallo'?",
        "options": [
          {
            "id": "dp3_a",
            "text": "Hello",
            "isCorrect": true
          },
          {
            "id": "dp3_b",
            "text": "Bonjour",
            "isCorrect": false
          },
          {
            "id": "dp3_c",
            "text": "Guten Tag",
            "isCorrect": false
          },
          {
            "id": "dp3_d",
            "text": "Ciao",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 4,
        "type": "single_choice",
        "tag": "Meetkunde",
        "scenario": "Denk aan geometrische basisvormen in het platte vlak.",
        "question": "Hoeveel zijden heeft een standaard driehoek?",
        "options": [
          {
            "id": "dp4_a",
            "text": "3 zijden",
            "isCorrect": true
          },
          {
            "id": "dp4_b",
            "text": "2 zijden",
            "isCorrect": false
          },
          {
            "id": "dp4_c",
            "text": "180 zijden",
            "isCorrect": false
          },
          {
            "id": "dp4_d",
            "text": "360 zijden",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  "droomreis": {
    "id": "droomreis",
    "name": "Ticket voor droomreis",
    "location": "LA118",
    "code": "3118",
    "points": 1,
    "isLimited": false,
    "icon": "flight_takeoff",
    "category": "Algemeen Item",
    "tag": "Reizen en planning",
    "hintText": "Zoek bij lokaal LA118 naar de 4-cijferige code.",
    "hintVideoTitle": "Reisvoorbereiding (15s)",
    "tasks": [
      {
        "step": 1,
        "type": "single_choice",
        "tag": "Topografie monumenten",
        "scenario": "Je ziet een wereldberoemd 330 meter hoog ijzeren bouwwerk aan de rivier de Seine (de Eiffeltoren).",
        "question": "In welk land staat het beroemde monument de Eiffeltoren?",
        "options": [
          {
            "id": "dr1_a",
            "text": "Frankrijk",
            "isCorrect": true
          },
          {
            "id": "dr1_b",
            "text": "Nederland",
            "isCorrect": false
          },
          {
            "id": "dr1_c",
            "text": "België",
            "isCorrect": false
          },
          {
            "id": "dr1_d",
            "text": "Duitsland",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 2,
        "type": "single_choice",
        "tag": "Reisbudget controleren",
        "scenario": "Je hebt € 100.000 spaargeld op je bankrekening staan. De complete droomreis kost in totaal € 10.000.",
        "question": "Heb je genoeg geld op je bankrekening om deze reis te betalen?",
        "options": [
          {
            "id": "dr2_a",
            "text": "Ja, ruim voldoende",
            "isCorrect": true
          },
          {
            "id": "dr2_b",
            "text": "Nee, je hebt niet genoeg saldo",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 3,
        "type": "eliminate",
        "tag": "Koffer inpakken",
        "scenario": "Je pakt je handbagage en reiskoffer in voor vertrek naar het buitenland.",
        "question": "Wat neem je mee op reis? Klik weg wat er ABSOLUUT NIET in je koffer hoort:",
        "options": [
          {
            "id": "dr3_a",
            "text": "Tandenborstel & tandpasta",
            "isEliminateTarget": false
          },
          {
            "id": "dr3_b",
            "text": "Kleding & ondergoed",
            "isEliminateTarget": false
          },
          {
            "id": "dr3_c",
            "text": "Paspoort / ID-kaart",
            "isEliminateTarget": false
          },
          {
            "id": "dr3_d",
            "text": "Zonnebrandcrème",
            "isEliminateTarget": false
          },
          {
            "id": "dr3_e",
            "text": "Inbouw vaatwasser",
            "isEliminateTarget": true
          }
        ]
      },
      {
        "step": 4,
        "type": "single_choice",
        "tag": "Brandstof & Tanken",
        "scenario": "Je auto rijdt precies 450 km op één volle tank benzine. De totale autoreis naar je bestemming is 1.200 km.",
        "question": "Hoe vaak moet je minimaal onderweg tanken om de eindbestemming te halen?",
        "options": [
          {
            "id": "dr4_a",
            "text": "3 keer",
            "isCorrect": true
          },
          {
            "id": "dr4_b",
            "text": "2 keer",
            "isCorrect": false
          },
          {
            "id": "dr4_c",
            "text": "4 keer",
            "isCorrect": false
          },
          {
            "id": "dr4_d",
            "text": "8 keer",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  "job_interview": {
    "id": "job_interview",
    "name": "Job interview",
    "location": "LA113",
    "secretLocation": "LA113 (Hoofdingang achter de receptie)",
    "code": "7113",
    "points": 3,
    "isLimited": true,
    "icon": "badge",
    "category": "Limited Item",
    "tag": "Solliciteren en etiquette",
    "hintText": "Zoek bij lokaal LA113 naar de 4-cijferige code.",
    "hintVideoTitle": "Sollicitatietips (15s)",
    "tasks": [
      {
        "step": 1,
        "type": "single_choice",
        "tag": "Motivatiegesprek",
        "scenario": "De interviewer vraagt met een glimlach: 'Waarom denk je dat je geschikt bent voor deze functie binnen ons bedrijf?'",
        "question": "Welk antwoord getuigt van een professionele en gemotiveerde houding?",
        "options": [
          {
            "id": "ji1_a",
            "text": "Ik ben leergierig, enthousiast en werk graag goed samen in een team om doelen te bereiken.",
            "isCorrect": true
          },
          {
            "id": "ji1_b",
            "text": "Omdat ik simpelweg de beste ben en jullie blij mogen zijn dat ik überhaupt de moeite neem.",
            "isCorrect": false
          },
          {
            "id": "ji1_c",
            "text": "Geen flauw idee eigenlijk, ik solliciteer maar gewoon omdat iemand zei dat het moest.",
            "isCorrect": false
          },
          {
            "id": "ji1_d",
            "text": "Het maakt me eigenlijk niks uit wat ik doe, zolang ik maar betaald krijg om te niksen.",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 2,
        "type": "single_choice",
        "tag": "Ontmoeting & Etiquette",
        "scenario": "Je klopt aan en loopt de gespreksruimte binnen waar de recruiter op je wacht.",
        "question": "Wat is het eerste dat je doet als je binnenstapt?",
        "options": [
          {
            "id": "ji2_a",
            "text": "Je geeft een stevige hand, maakt oogcontact en stelt jezelf netjes voor",
            "isCorrect": true
          },
          {
            "id": "ji2_b",
            "text": "Je gaat direct gezellig op schoot zitten bij de interviewer",
            "isCorrect": false
          },
          {
            "id": "ji2_c",
            "text": "Je ploft zwijgend op een stoel en pakt direct je mobiel om te scrollen",
            "isCorrect": false
          },
          {
            "id": "ji2_d",
            "text": "Je draait je stilletjes om en loopt direct weer het pand uit",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 3,
        "type": "multi_select",
        "tag": "Op tijd arriveren",
        "scenario": "Je interview begint stipt om 10:00 uur. De uitnodiging vermeldt dat je minimaal 15 minuten vooraf aanwezig moet zijn (uiterlijk 09:45 uur of eerder).",
        "question": "Welke van de onderstaande aankomsttijden zijn op tijd volgens deze afspraak? Klik alle juiste aan:",
        "options": [
          {
            "id": "ji3_a",
            "text": "09:30 uur",
            "isCorrect": true
          },
          {
            "id": "ji3_b",
            "text": "09:45 uur",
            "isCorrect": true
          },
          {
            "id": "ji3_c",
            "text": "09:46 uur",
            "isCorrect": false
          },
          {
            "id": "ji3_d",
            "text": "10:00 uur",
            "isCorrect": false
          },
          {
            "id": "ji3_e",
            "text": "10:15 uur",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 4,
        "type": "single_choice",
        "tag": "Kledingkeuze",
        "scenario": "Je bereidt je 's ochtends voor in je kledingkast voor het sollicitatiegesprek.",
        "question": "Welke kleding trek je aan naar een serieus sollicitatiegesprek?",
        "options": [
          {
            "id": "ji4_a",
            "text": "Nette, verzorgde en professionele kleding",
            "isCorrect": true
          },
          {
            "id": "ji4_b",
            "text": "Een versleten pyjama met badslippers",
            "isCorrect": false
          },
          {
            "id": "ji4_c",
            "text": "Zwemkleding en een duikbril",
            "isCorrect": false
          },
          {
            "id": "ji4_d",
            "text": "Een opblaasbaar dinosaurus carnavalskostuum",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  "job_raise": {
    "id": "job_raise",
    "name": "Job raise",
    "location": "LA111",
    "secretLocation": "LA111 (Direct naast de trap op de 1e verdieping)",
    "code": "6111",
    "points": 3,
    "isLimited": true,
    "icon": "trending_up",
    "category": "Limited Item",
    "tag": "Carrière en salaris",
    "hintText": "Zoek bij lokaal LA111 naar de 4-cijferige code.",
    "hintVideoTitle": "Onderhandelen over salaris (15s)",
    "tasks": [
      {
        "step": 1,
        "type": "single_choice",
        "tag": "Omgaan met promotie",
        "scenario": "Je leidinggevende roept je naar kantoor en feliciteert je met een mooie loonsverhoging wegens uitstekende prestaties.",
        "question": "Wat is het eerste dat je doet?",
        "options": [
          {
            "id": "jr1_a",
            "text": "De leidinggevende vriendelijk bedanken en gemotiveerd hard blijven doorwerken",
            "isCorrect": true
          },
          {
            "id": "jr1_b",
            "text": "Meteen een feestje vieren en luidkeels gaan zuipen op kantoor",
            "isCorrect": false
          },
          {
            "id": "jr1_c",
            "text": "Triomfantelijk roepen en ter plekke per direct je ontslag indienen",
            "isCorrect": false
          },
          {
            "id": "jr1_d",
            "text": "Boos de deur dichtslaan omdat je nog veel meer wilde hebben",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 2,
        "type": "single_choice",
        "tag": "Vast loonbedrag berekenen",
        "scenario": "Je verdient momenteel € 2.000 bruto per maand. De baas geeft je een salarisverhoging van € 350 per maand.",
        "question": "Wat is je nieuwe bruto maandsalaris?",
        "options": [
          {
            "id": "jr2_a",
            "text": "€ 2.350 per maand",
            "isCorrect": true
          },
          {
            "id": "jr2_b",
            "text": "€ 2.150 per maand",
            "isCorrect": false
          },
          {
            "id": "jr2_c",
            "text": "€ 2.450 per maand",
            "isCorrect": false
          },
          {
            "id": "jr2_d",
            "text": "€ 1.650 per maand",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 3,
        "type": "single_choice",
        "tag": "Percentage loonsverhoging",
        "scenario": "Je basisloon is € 2.000 per maand. Je krijgt een loonsverhoging van precies 15% (15% van 2.000 = 300).",
        "question": "Wat wordt je nieuwe maandsalaris na deze procentuele verhoging?",
        "options": [
          {
            "id": "jr3_a",
            "text": "€ 2.300 per maand",
            "isCorrect": true
          },
          {
            "id": "jr3_b",
            "text": "€ 2.150 per maand",
            "isCorrect": false
          },
          {
            "id": "jr3_c",
            "text": "€ 2.500 per maand",
            "isCorrect": false
          },
          {
            "id": "jr3_d",
            "text": "€ 2.015 per maand",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 4,
        "type": "single_choice",
        "tag": "Verantwoordelijkheid & Communicatie",
        "scenario": "Door onverwachte file op weg naar je werk dreig je zo'n 20 minuten later op kantoor te arriveren.",
        "question": "Wat doe je als verantwoordelijke werknemer?",
        "options": [
          {
            "id": "jr4_a",
            "text": "Meteen je werkgever of collega's bellen/appen dat je wat later bent door file",
            "isCorrect": true
          },
          {
            "id": "jr4_b",
            "text": "Omdraaien en naar de McDonald's gaan; je bent nu immers toch al te laat",
            "isCorrect": false
          },
          {
            "id": "jr4_c",
            "text": "Helemaal niets laten weten en stilletjes naar binnen sluipen",
            "isCorrect": false
          },
          {
            "id": "jr4_d",
            "text": "De rest van de dag thuisblijven en je mobiel uitschakelen",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  "date": {
    "id": "date",
    "name": "Date",
    "location": "LA110",
    "secretLocation": "LA110 (Grote studiezaal in de hoek)",
    "code": "9110",
    "points": 3,
    "isLimited": true,
    "icon": "favorite",
    "category": "Limited Item",
    "tag": "Romantiek en respect",
    "hintText": "Zoek bij lokaal LA110 naar de 4-cijferige code.",
    "hintVideoTitle": "Flirttips en etiquette (15s)",
    "tasks": [
      {
        "step": 1,
        "type": "single_choice",
        "tag": "Attent cadeau meenemen",
        "scenario": "Je hebt vanavond je eerste spannende date met iemand die je erg leuk vindt.",
        "question": "Wat voor attent cadeau neem je mee voor je date?",
        "options": [
          {
            "id": "dt1_a",
            "text": "Een mooie bos bloemen",
            "isCorrect": true
          },
          {
            "id": "dt1_b",
            "text": "Een spuitbus stinkende fart spray",
            "isCorrect": false
          },
          {
            "id": "dt1_c",
            "text": "Een gebruikte gootsteenontstopper (plunger)",
            "isCorrect": false
          },
          {
            "id": "dt1_d",
            "text": "Een voordeelpak toiletpapier",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 2,
        "type": "single_choice",
        "tag": "Ongemakkelijke stilte doorbreken",
        "scenario": "Jullie zitten gezellig aan tafel, maar plots valt het gesprek een halve minuut stil.",
        "question": "Het valt even stil tijdens je date. Wat doe je?",
        "options": [
          {
            "id": "dt2_a",
            "text": "Een leuke, oprechte vraag stellen over de passies of vakanties van je date",
            "isCorrect": true
          },
          {
            "id": "dt2_b",
            "text": "Zonder iets te zeggen opstaan en snel naar buiten rennen",
            "isCorrect": false
          },
          {
            "id": "dt2_c",
            "text": "Je telefoon erbij pakken en intensief social media gaan checken",
            "isCorrect": false
          },
          {
            "id": "dt2_d",
            "text": "Luid beginnen te snurken en net doen alsof je diep slaapt",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 3,
        "type": "multi_select",
        "tag": "Gezellige date locaties",
        "scenario": "Je mag twee sfeervolle locaties voorstellen om elkaar beter te leren kennen.",
        "question": "Wat zijn goede, gezellige date locaties? Klik alle juiste aan:",
        "options": [
          {
            "id": "dt3_a",
            "text": "Een sfeervol en gezellig café",
            "isCorrect": true
          },
          {
            "id": "dt3_b",
            "text": "Een bioscoop voor een leuke film",
            "isCorrect": true
          },
          {
            "id": "dt3_c",
            "text": "Een overvolle, hectische supermarkt op zaterdagmiddag",
            "isCorrect": false
          },
          {
            "id": "dt3_d",
            "text": "Een donkere, verlaten begraafplaats om middernacht",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 4,
        "type": "single_choice",
        "tag": "Goede indruk achterlaten",
        "scenario": "Je wilt dat je date zich op zijn of haar gemak voelt en met een fijn gevoel naar huis gaat.",
        "question": "Hoe maak je een oprechte, charmante en goede indruk op je date?",
        "options": [
          {
            "id": "dt4_a",
            "text": "Aandachtig luisteren, oogcontact maken en echte interesse tonen",
            "isCorrect": true
          },
          {
            "id": "dt4_b",
            "text": "Urenlang alleen maar onafgebroken over jezelf en je ex opscheppen",
            "isCorrect": false
          },
          {
            "id": "dt4_c",
            "text": "De hele avond staren naar je telefoonscherm",
            "isCorrect": false
          },
          {
            "id": "dt4_d",
            "text": "Onbeleefd en nors doen tegen de ober van het restaurant",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  "trouwen": {
    "id": "trouwen",
    "name": "Trouwen",
    "location": "LA109",
    "secretLocation": "LA109 (Vergaderruimte achter de glazen wand)",
    "code": "2109",
    "points": 3,
    "isLimited": true,
    "icon": "favorite",
    "category": "Limited Item",
    "tag": "Feest en verbintenis",
    "hintText": "Zoek bij lokaal LA109 naar de 4-cijferige code.",
    "hintVideoTitle": "Bruiloft etiquette (15s)",
    "tasks": [
      {
        "step": 1,
        "type": "multi_select",
        "tag": "Bruiloftstradities",
        "scenario": "Jullie organiseren een traditioneel en feestelijk huwelijksfeest voor vrienden en familie.",
        "question": "Welke 3 dingen horen traditioneel bij een feestelijke bruiloft? Klik de 3 juiste aan:",
        "options": [
          {
            "id": "tr1_a",
            "text": "Trouwringen",
            "isCorrect": true
          },
          {
            "id": "tr1_b",
            "text": "Bruidstaart",
            "isCorrect": true
          },
          {
            "id": "tr1_c",
            "text": "Bruiloft feestlocatie",
            "isCorrect": true
          },
          {
            "id": "tr1_d",
            "text": "Voetbalshirt",
            "isCorrect": false
          },
          {
            "id": "tr1_e",
            "text": "Vuilniszak",
            "isCorrect": false
          },
          {
            "id": "tr1_f",
            "text": "Parkeerbon",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 2,
        "type": "single_choice",
        "tag": "Tafels voor gasten berekenen",
        "scenario": "Er komen in totaal 90 gasten naar het feestelijke bruiloftsdiner. Aan elke grote ronde tafel passen maximaal 20 personen.",
        "question": "Hoeveel tafels heb je minimaal nodig zodat iedereen aan een tafel kan zitten?",
        "options": [
          {
            "id": "tr2_a",
            "text": "5 tafels",
            "isCorrect": true
          },
          {
            "id": "tr2_b",
            "text": "4 tafels",
            "isCorrect": false
          },
          {
            "id": "tr2_c",
            "text": "6 tafels",
            "isCorrect": false
          },
          {
            "id": "tr2_d",
            "text": "7 tafels",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 3,
        "type": "single_choice",
        "tag": "Vakantie na de bruiloft",
        "scenario": "Direct na het voltrekken van de bruiloft vertrekt het pasgetrouwde echtpaar samen op reis.",
        "question": "Hoe heet de speciale reis die een pasgetrouwd stel na het huwelijk maakt?",
        "options": [
          {
            "id": "tr3_a",
            "text": "Huwelijksreis (Honeymoon)",
            "isCorrect": true
          },
          {
            "id": "tr3_b",
            "text": "Zakelijke handelsreis",
            "isCorrect": false
          },
          {
            "id": "tr3_c",
            "text": "Schoolreisje",
            "isCorrect": false
          },
          {
            "id": "tr3_d",
            "text": "Verhuisrit",
            "isCorrect": false
          }
        ]
      },
      {
        "step": 4,
        "type": "eliminate",
        "tag": "Trouwfotograaf selecteren",
        "scenario": "Je wilt prachtige, blijvende professionele foto's van deze onvergetelijke dag.",
        "question": "Wie laat je de officiële trouwfoto's absoluut NIET maken? Klik weg wie er NIET bij hoort:",
        "options": [
          {
            "id": "tr4_a",
            "text": "Professionele trouwfotograaf",
            "isEliminateTarget": false
          },
          {
            "id": "tr4_b",
            "text": "Gespecialiseerde portretstudio",
            "isEliminateTarget": false
          },
          {
            "id": "tr4_c",
            "text": "De lokale loodgieter",
            "isEliminateTarget": true
          },
          {
            "id": "tr4_d",
            "text": "Je 8-jarige ongeduldige neefje Thomas",
            "isEliminateTarget": true
          }
        ]
      }
    ]
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ITEMS_DATA };
}
