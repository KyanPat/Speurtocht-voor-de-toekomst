const fs = require('fs');
const path = require('path');

const THEMED_4_TASKS = {
  autosleutels: [
    {
      step: 1,
      tag: 'Voorrang op gelijkwaardige kruising',
      scenario: 'Je rijdt in de auto op een gelijkwaardige kruising zonder borden of verkeerslichten. Van rechts komt een fietser aanrijden.',
      question: 'Wie heeft hier wettelijk voorrang volgens de verkeersregels?',
      imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @campbell',
      options: [
        { id: 'as1_a', text: 'De fietser heeft voorrang, want bestuurders van rechts hebben voorrang op een gelijkwaardige kruising.', isCorrect: true, letter: 'A' },
        { id: 'as1_b', text: 'Jij hebt voorrang, want een auto is gemotoriseerd verkeer en gaat voor op fietsers op een gelijkwaardige kruising.', isCorrect: false, letter: 'B' },
        { id: 'as1_c', text: 'De fietser heeft voorrang, maar alleen als de fietser al stilstaat en oogcontact heeft gemaakt.', isCorrect: false, letter: 'C' },
        { id: 'as1_d', text: 'Jij hebt voorrang, mits jij met een constante snelheid rechtdoor rijdt over de kruising.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Oranje verkeerslicht',
      scenario: 'Je nadert met 50 km/u een verkeerslicht. Op 15 meter afstand springt het licht op geel/oranje. Achter jou rijdt een bestelbus vrij dicht op je bumper.',
      question: 'Wat is de juiste en veiligste handeling?',
      imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @elishaterada',
      options: [
        { id: 'as2_a', text: 'Veilig en rustig doorrijden, want stoppen kan redelijkerwijs niet meer veilig zonder risico op een botsing.', isCorrect: true, letter: 'A' },
        { id: 'as2_b', text: 'Direct een noodstop maken en voluit remmen, want bij oranje ben je altijd verplicht om te stoppen.', isCorrect: false, letter: 'B' },
        { id: 'as2_c', text: 'Hard gas bijgeven en accelereren om het kruispunt vóór het rode licht met hoge snelheid te passeren.', isCorrect: false, letter: 'C' },
        { id: 'as2_d', text: 'Direct naar rechts uitwijken naar het fietspad en daar rustig tot stilstand komen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Rotonde verlaten',
      scenario: 'Je rijdt op een rotonde en wilt de eerstvolgende afrit nemen. Rechts van jou ligt een fietspad rondom de rotonde met dezelfde voorrang.',
      question: 'Welke handeling voer je uit bij het verlaten van de rotonde?',
      imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @markusspiske',
      options: [
        { id: 'as3_a', text: 'Tijdig richting aangeven naar rechts, in de spiegels en dode hoek kijken, en overstekende fietsers voor laten gaan.', isCorrect: true, letter: 'A' },
        { id: 'as3_b', text: 'Richting aangeven naar rechts en direct afslaan, want verkeer dat de rotonde verlaat heeft altijd voorrang op fietsers.', isCorrect: false, letter: 'B' },
        { id: 'as3_c', text: 'Richting aangeven naar links om fietsers te waarschuwen dat je van rijstrook verandert en daarna direct rechtsaf slaan.', isCorrect: false, letter: 'C' },
        { id: 'as3_d', text: 'Pas richting aangeven nádat je voorwielen de afrit van de rotonde al volledig zijn opgereden.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Aquaplaning en Gripverlies',
      scenario: 'Je rijdt op de snelweg tijdens een flinke regenbui door een diepe plas. Het stuur voelt plots vederlicht aan en reageert tijdelijk niet (aquaplaning).',
      question: 'Wat moet je direct doen om de grip zo snel mogelijk te herstellen?',
      imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @reza',
      options: [
        { id: 'as4_a', text: 'Rustig het gas loslaten, niet remmen en het stuur recht en stil houden tot je weer weerstand voelt.', isCorrect: true, letter: 'A' },
        { id: 'as4_b', text: 'Rustig het gas loslaten, lichtjes bijremmen en direct tegensturen in de richting van de berm.', isCorrect: false, letter: 'B' },
        { id: 'as4_c', text: 'Direct krachtig op de rem trappen, het stuur stevig naar links draaien en extra gas bijgeven.', isCorrect: false, letter: 'C' },
        { id: 'as4_d', text: 'Het gaspedaal gelijkmatig ingedrukt houden en korte rukjes aan het stuur geven om grip te zoeken.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  huissleutels: [
    {
      step: 1,
      tag: 'Inspectie bij sleuteloverdracht',
      scenario: 'Je krijgt de sleutels van je nieuwe huurwoning en loopt met de verhuurder door het huis voor de begininspectie.',
      question: 'Wat is het allerbelangrijkste om te doen vóórdat je het opnamerapport ondertekent?',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @tierneypead',
      options: [
        { id: 'hs1_a', text: 'Alle bestaande beschadigingen, vlekken en meterstanden nauwkeurig noteren en duidelijke foto\'s maken.', isCorrect: true, letter: 'A' },
        { id: 'hs1_b', text: 'Alleen de meterstanden noteren; eventuele beschadigingen mag je binnen zes maanden mondeling doorgeven.', isCorrect: false, letter: 'B' },
        { id: 'hs1_c', text: 'Direct alle beschadigingen zelf repareren zodat de verhuurder je borg niet direct inhoudt.', isCorrect: false, letter: 'C' },
        { id: 'hs1_d', text: 'Zo snel mogelijk tekenen zonder rond te kijken, want de begininspectie is juridisch niet bindend.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Piepende rookmelder',
      scenario: 'Midden in de nacht begint de rookmelder op de overloop elke 45 seconden een kort, schel piepgeluidje te maken, zonder rook of brand.',
      question: 'Wat betekent dit signaal en wat is de juiste actie?',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @spacejoy',
      options: [
        { id: 'hs2_a', text: 'De batterij van de rookmelder is bijna leeg; je moet de batterij (of het apparaat) zo snel mogelijk vervangen.', isCorrect: true, letter: 'A' },
        { id: 'hs2_b', text: 'De melder detecteert lichte luchtvochtigheid; je moet ramen openzetten en de melder besproeien met water.', isCorrect: false, letter: 'B' },
        { id: 'hs2_c', text: 'Het alarm is defect en moet direct van het plafond getrokken en weggegooid worden zonder vervanging.', isCorrect: false, letter: 'C' },
        { id: 'hs2_d', text: 'De melder voert een automatische maandelijkse zelftest uit en stopt na 48 uur vanzelf met piepen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Onderhoud: Kraan vs Verwarming',
      scenario: 'In je huurhuis lekt het rubbertje van de wastafelkraan en de centrale verwarmingsketel slaat helemaal niet meer aan door een storing.',
      question: 'Wie is volgens de standaard regels verantwoordelijk voor het herstel?',
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @danlefebvre',
      options: [
        { id: 'hs3_a', text: 'Jij vervangt het kraanleertje (klein dagelijks onderhoud); de verhuurder regelt en betaalt de reparatie van de CV-ketel.', isCorrect: true, letter: 'A' },
        { id: 'hs3_b', text: 'De verhuurder moet zowel het kraanleertje vervangen als de gehele CV-ketel repareren.', isCorrect: false, letter: 'B' },
        { id: 'hs3_c', text: 'Jij moet als huurder zowel de CV-monteur als het kraanrubbertje zelf volledig betalen.', isCorrect: false, letter: 'C' },
        { id: 'hs3_d', text: 'De energieleverancier is wettelijk verplicht om zowel kranen als verwarmingsketels gratis te onderhouden.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Verhuizing doorgeven aan gemeente',
      scenario: 'Je verhuist naar je eigen studio in een nieuwe wijk en hebt de sleuteloverdracht achter de rug.',
      question: 'Wat moet je doen om je officiële inschrijving en post op orde te hebben?',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @homajob',
      options: [
        { id: 'hs4_a', text: 'Je adreswijziging uiterlijk binnen 5 dagen na de verhuizing digitaal doorgeven bij de gemeente via DigiD.', isCorrect: true, letter: 'A' },
        { id: 'hs4_b', text: 'Je adreswijziging binnen 6 maanden doorgeven bij het postkantoor van je oude woonplaats.', isCorrect: false, letter: 'B' },
        { id: 'hs4_c', text: 'Niets doen; de verhuurder geeft jouw nieuwe adres automatisch door aan alle overheidsinstanties.', isCorrect: false, letter: 'C' },
        { id: 'hs4_d', text: 'Alleen een briefje in de brievenbus van de oude bewoner doen met je nieuwe telefoonnummer.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  diploma: [
    {
      step: 1,
      tag: 'Slim studeren voor tentamens',
      scenario: 'Over drie weken heb je een belangrijk tentamen met ruim 400 pagina\'s leerstof.',
      question: 'Welke studiestrategie levert volgens de leerpsychologie bewezen het hoogste leerrendement op?',
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @aaronburden',
      options: [
        { id: 'dp1_a', text: 'De stof verdelen over meerdere weken en regelmatig actief herhalen en oefentoetsen maken.', isCorrect: true, letter: 'A' },
        { id: 'dp1_b', text: 'De eerste twee weken rust nemen en de laatste 48 uur non-stop de samenvatting herlezen.', isCorrect: false, letter: 'B' },
        { id: 'dp1_c', text: 'Alle teksten drie keer met verschillende kleuren markeerstift overtrekken zonder te oefenen.', isCorrect: false, letter: 'C' },
        { id: 'dp1_d', text: 'Slechts één keer de koppen en afbeeldingen doornemen op de ochtend van het tentamen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Bronnen gebruiken in je verslag',
      scenario: 'Je schrijft een verslag en vindt een heel treffende theorie en cijfers op een betrouwbare kenniswebsite.',
      question: 'Wat moet je doen als je deze informatie in je eigen verslag overneemt?',
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @marclev',
      options: [
        { id: 'dp2_a', text: 'De informatie in eigen woorden uitleggen én een duidelijke bronvermelding toevoegen in de tekst en bronnenlijst.', isCorrect: true, letter: 'A' },
        { id: 'dp2_b', text: 'De tekst letterlijk kopiëren en alleen de naam van de website onderaan het document noemen.', isCorrect: false, letter: 'B' },
        { id: 'dp2_c', text: 'De zinnen een klein beetje herschrijven; dan is een bronvermelding niet meer nodig.', isCorrect: false, letter: 'C' },
        { id: 'dp2_d', text: 'Geen bron noemen zolang de informatie vrij toegankelijk online te vinden was.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Uitstelgedrag doorbreken',
      scenario: 'Je moet beginnen aan een grote afstudeeropdracht, maar je merkt dat je steeds wordt afgeleid door social media en het starten uitstelt.',
      question: 'Wat is een beproefde en effectieve methode om direct in actie te komen?',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @priscilladupreez',
      options: [
        { id: 'dp3_a', text: 'Het grote project opknippen in kleine taken van 25 minuten en direct beginnen met één klein mini-stapje.', isCorrect: true, letter: 'A' },
        { id: 'dp3_b', text: 'Wachten tot je plotselinge inspiratie voelt en ondertussen je mailbox en social feed blijven checken.', isCorrect: false, letter: 'B' },
        { id: 'dp3_c', text: 'Jezelf voornemen om vandaag direct 12 uur achter elkaar zonder pauze door te werken.', isCorrect: false, letter: 'C' },
        { id: 'dp3_d', text: 'De deadline verschuiven naar volgende maand zodat je er vandaag niet over hoeft na te denken.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Feedback verwerken van docent',
      scenario: 'Je levert een eerste conceptversie van je verslag in en je docent geeft kritische feedback en meerdere verbeterpunten.',
      question: 'Wat is de meest professionele en effectieve manier om met deze feedback om te gaan?',
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @pangs',
      options: [
        { id: 'dp4_a', text: 'De opmerkingen rustig doorlezen, een actielijstje maken en bij onduidelijkheden gerichte vragen stellen aan de docent.', isCorrect: true, letter: 'A' },
        { id: 'dp4_b', text: 'Direct in discussie gaan en uitleggen dat de docent je bedoeling verkeerd heeft begrepen.', isCorrect: false, letter: 'B' },
        { id: 'dp4_c', text: 'Alleen de spelling controleren en het document meteen opnieuw ongewijzigd inleveren.', isCorrect: false, letter: 'C' },
        { id: 'dp4_d', text: 'Het verslag weggooien en over een compleet nieuw onderwerp opnieuw beginnen.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  droomreis: [
    {
      step: 1,
      tag: 'Vertrekvoorbereiding op Schiphol',
      scenario: 'Je hebt een vlucht geboekt binnen Europa die vertrekt om 14:00 uur. Je hebt ruimbagage die ingecheckt moet worden.',
      question: 'Hoe laat is het verstandig en gebruikelijk om op de luchthaven aanwezig te zijn?',
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @earth',
      options: [
        { id: 'dr1_a', text: 'Circa 2 uur voor vertrek, zodat je ruim de tijd hebt voor bagage-afgifte en de veiligheidscontrole.', isCorrect: true, letter: 'A' },
        { id: 'dr1_b', text: 'Precies 15 minuten voor vertrek, want de gate sluit pas op het moment dat het vliegtuig wegrijdt.', isCorrect: false, letter: 'B' },
        { id: 'dr1_c', text: 'Minimaal 8 uur van tevoren, ongeacht of je met of zonder koffers reist.', isCorrect: false, letter: 'C' },
        { id: 'dr1_d', text: 'Pas ná de geplande vertrektijd, want vliegtuigen hebben standaard vertraging.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Paspoortgeldigheid buiten Europa',
      scenario: 'Je boekt een vakantie naar een zonnige bestemming buiten de Europese Unie (zoals Egypte of Thailand).',
      question: 'Wat moet je vóór het boeken en vertrek controleren aan je paspoort?',
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @glenncarstens',
      options: [
        { id: 'dr2_a', text: 'Of je paspoort bij aankomst nog minimaal 6 maanden geldig is, zoals veel landen buiten Europa eisen.', isCorrect: true, letter: 'A' },
        { id: 'dr2_b', text: 'Of je paspoort nog minimaal 1 dag geldig is na de dag van je vertrek uit Nederland.', isCorrect: false, letter: 'B' },
        { id: 'dr2_c', text: 'Of je rijbewijs mee is, want een Nederlands rijbewijs geldt wereldwijd als volwaardig paspoort.', isCorrect: false, letter: 'C' },
        { id: 'dr2_d', text: 'Niets, zolang je maar een geprinte foto van je paspoort op je telefoon hebt staan.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Powerbanks en Handbagageregels',
      scenario: 'Je pakt je koffers in voor je reis en wilt een powerbank meenemen om je telefoon onderweg op te laden.',
      question: 'Waar moet je losse powerbanks en lithium-batterijen wettelijk in vervoeren?',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @austin',
      options: [
        { id: 'dr3_a', text: 'Altijd in je handbagage; losse powerbanks mogen wegens brandgevaar nooit in de ruimbagage in het laadruim.', isCorrect: true, letter: 'A' },
        { id: 'dr3_b', text: 'Altijd onderin je grote koffer in de ruimbagage, zodat ze niet rondslingeren in de cabine.', isCorrect: false, letter: 'B' },
        { id: 'dr3_c', text: 'In de achterzak van je stoel vóór het boarden, of ingepakt in aluminiumfolie in je koffer.', isCorrect: false, letter: 'C' },
        { id: 'dr3_d', text: 'Powerbanks zijn op alle commerciële vluchten streng verboden en moeten worden achtergelaten.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Jetlag en Tijdzones aanpakken',
      scenario: 'Je vliegt over meerdere tijdzones naar het oosten en landt \'s ochtends vroeg lokale tijd, terwijl het in Nederland nog nacht is.',
      question: 'Wat is de beste tip om zo snel mogelijk aan het tijdsverschil te wennen?',
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @jezael',
      options: [
        { id: 'dr4_a', text: 'Meteen meegaan in het lokale dagschema, buiten in het daglicht actief blijven en pas \'s avonds gaan slapen.', isCorrect: true, letter: 'A' },
        { id: 'dr4_b', text: 'Direct bij aankomst in het hotel gordijnen dichthouden en de hele dag blijven uitslapen.', isCorrect: false, letter: 'B' },
        { id: 'dr4_c', text: 'Constant op je telefoon de Nederlandse tijd blijven volgen en eten op Nederlandse tijden.', isCorrect: false, letter: 'C' },
        { id: 'dr4_d', text: 'Zoveel mogelijk cafeïnedrankjes drinken en de eerste 48 uur helemaal niet slapen.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  job_interview: [
    {
      step: 1,
      tag: 'Voorbereiding op sollicitatie',
      scenario: 'Je hebt morgenochtend een eerste sollicitatiegesprek bij een bedrijf waar je graag wilt werken.',
      question: 'Wat is de meest effectieve voorbereiding die je vandaag kunt doen?',
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @wocintechchat',
      options: [
        { id: 'ji1_a', text: 'De website en recente projecten van het bedrijf bekijken, en bedenken wat jij kunt bijdragen aan hun doelen.', isCorrect: true, letter: 'A' },
        { id: 'ji1_b', text: 'De vacaturetekst uit je hoofd leren zonder verdere informatie over het bedrijf op te zoeken.', isCorrect: false, letter: 'B' },
        { id: 'ji1_c', text: 'Pas vijf minuten voor het gesprek de bedrijfsnaam googelen op je telefoon in de wachtruimte.', isCorrect: false, letter: 'C' },
        { id: 'ji1_d', text: 'Een standaardlijstje met grappen voorbereiden om het gesprek luchtig te houden.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Onverwachte vertraging onderweg',
      scenario: 'Je bent onderweg naar je sollicitatiegesprek en door een defecte trein kom je waarschijnlijk 10 minuten te laat aan.',
      question: 'Wat is de enige juiste en professionele actie?',
      imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @huntersrace',
      options: [
        { id: 'ji2_a', text: 'Direct netjes opbellen, rustig uitleggen wat er aan de hand is en je verwachte aankomsttijd doorgeven.', isCorrect: true, letter: 'A' },
        { id: 'ji2_b', text: 'Gewoon binnenlopen wanneer je er bent en pas aan tafel terloops zeggen dat de trein vertraagd was.', isCorrect: false, letter: 'B' },
        { id: 'ji2_c', text: 'Snel omdraaien en naar huis gaan, want te laat komen betekent dat je kans meteen verkeken is.', isCorrect: false, letter: 'C' },
        { id: 'ji2_d', text: 'Een boze tweet naar de NS sturen en hopen dat de interviewer het toevallig online leest.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Vraag naar je ontwikkelpunt',
      scenario: 'De interviewer vraagt: "Wat is een eigenschap waarin jij jezelf nog verder wilt ontwikkelen?"',
      question: 'Welke reactie getuigt van eerlijkheid en professionele volwassenheid?',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @homajob',
      options: [
        { id: 'ji3_a', text: 'Een echt verbeterpunt noemen (bijv. vaker overzicht bewaren) en uitleggen hoe je daar nu actief mee oefent.', isCorrect: true, letter: 'A' },
        { id: 'ji3_b', text: 'Zeggen: "Ik ben gewoon té perfectionistisch en ik werk simpelweg veel te hard voor de zaak."', isCorrect: false, letter: 'B' },
        { id: 'ji3_c', text: 'Zeggen: "Ik heb eerlijk gezegd geen zwakke punten, ik ben overal wel goed in."', isCorrect: false, letter: 'C' },
        { id: 'ji3_d', text: 'Vertellen dat je \'s ochtends vaak moeite hebt met opstaan en snel je geduld verliest bij collega\'s.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Eigen vragen aan het einde',
      scenario: 'Aan het einde van het gesprek zegt de interviewer: "Heb jij tot slot nog vragen voor ons?"',
      question: 'Welke wedervraag toont de meeste motivatie en interesse?',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @alexc',
      options: [
        { id: 'ji4_a', text: '"Hoe ziet een typische werkweek in dit team eruit en wat zijn de doelen voor de komende maanden?"', isCorrect: true, letter: 'A' },
        { id: 'ji4_b', text: '"Nee, eigenlijk niets meer, alles is wel duidelijk verteld."', isCorrect: false, letter: 'B' },
        { id: 'ji4_c', text: '"Hoeveel pauzes mag ik per dag nemen en hoe streng controleren jullie op ziekmeldingen?"', isCorrect: false, letter: 'C' },
        { id: 'ji4_d', text: '"Krijgen werknemers aan het einde van het jaar een duur kerstpakket?"', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  job_raise: [
    {
      step: 1,
      tag: 'Het juiste moment voor loonsverhoging',
      scenario: 'Je werkt al een jaar met veel plezier bij een bedrijf en hebt je doelen ruimschoots gehaald. Je wilt vragen om een salarisverhoging.',
      question: 'Wat is het meest geschikte moment om dit aan te kaarten?',
      imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @belart',
      options: [
        { id: 'jr1_a', text: 'Tijdens je officiële jaargesprek of een vooraf geplande afspraak met concrete voorbeelden van je prestaties.', isCorrect: true, letter: 'A' },
        { id: 'jr1_b', text: 'Bij het koffiezetapparaat op maandagochtend wanneer je leidinggevende haast heeft.', isCorrect: false, letter: 'B' },
        { id: 'jr1_c', text: 'Midden in een drukke teamvergadering waar al je collega\'s bij zitten.', isCorrect: false, letter: 'C' },
        { id: 'jr1_d', text: 'Door op vrijdagmiddag anoniem een briefje met een bedrag op het bureau van je baas te leggen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'De beste onderbouwing',
      scenario: 'Je zit aan tafel met je leidinggevende om je salarisverhoging te bespreken.',
      question: 'Welk argument is het meest overtuigend voor je werkgever?',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @sean',
      options: [
        { id: 'jr2_a', text: 'Laten zien welke extra taken je oppakt, welke resultaten je hebt geboekt en wat de marktwaarde van je functie is.', isCorrect: true, letter: 'A' },
        { id: 'jr2_b', text: 'Vertellen dat je huur en boodschappen duurder zijn geworden en je daarom meer geld nodig hebt.', isCorrect: false, letter: 'B' },
        { id: 'jr2_c', text: 'Zeggen dat een collega die hetzelfde werk doet meer verdient en dat je dat oneerlijk vindt.', isCorrect: false, letter: 'C' },
        { id: 'jr2_d', text: 'Dreigen dat je direct stopt met overwerken als je vandaag geen toezegging krijgt.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Bruto vs Netto salaris',
      scenario: 'Je werkgever biedt je een loonsverhoging van € 200,- bruto per maand aan.',
      question: 'Waarom staat er aan het eind van de maand minder dan € 200,- extra op je bankrekening?',
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @didssph',
      options: [
        { id: 'jr3_a', text: 'Omdat van het brutobedrag eerst loonbelasting, premies en pensioen worden ingehouden voordat het netto wordt uitbetaald.', isCorrect: true, letter: 'A' },
        { id: 'jr3_b', text: 'Omdat de werkgever wettelijk de helft van elke salarisverhoging mag inhouden als administratiekosten.', isCorrect: false, letter: 'B' },
        { id: 'jr3_c', text: 'Omdat een salarisverhoging pas na 12 maanden netto op je bankrekening mag worden bijgeschreven.', isCorrect: false, letter: 'C' },
        { id: 'jr3_d', text: 'Omdat banken een extra inhouding doen op alle bijschrijvingen die hoger zijn dan je basissalaris.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Mondelinge afspraak bevestigen',
      scenario: 'Je leidinggevende stemt mondeling in: "Akkoord, vanaf volgende maand krijg je er 5% bij."',
      question: 'Wat is direct na het gesprek de verstandigste professionele handeling?',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @luke',
      options: [
        { id: 'jr4_a', text: 'Een vriendelijke, korte mail sturen waarin je bedankt voor het gesprek en de gemaakte afspraak (percentage en datum) samenvat.', isCorrect: true, letter: 'A' },
        { id: 'jr4_b', text: 'Niets doen, want een mondelinge toezegging van een manager kan in de praktijk nooit meer vergeten worden.', isCorrect: false, letter: 'B' },
        { id: 'jr4_c', text: 'Het nieuws meteen met screenshots vieren op al je openbare social media kanalen.', isCorrect: false, letter: 'C' },
        { id: 'jr4_d', text: 'Alvast geld lenen bij vrienden omdat de belofte al mondeling is uitgesproken.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  date: [
    {
      step: 1,
      tag: 'Aandacht tijdens afspraakje',
      scenario: 'Je zit tegenover je date in een gezellig café en jullie zijn leuk in gesprek. Je telefoon trilt in je broekzak met een appje.',
      question: 'Wat is de beste sociale omgangsvorm om respect en oprechte interesse te tonen?',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @jaywennington',
      options: [
        { id: 'dt1_a', text: 'Je telefoon lekker in je zak laten zitten op stil; echte aandacht voor de persoon tegenover je gaat altijd voor.', isCorrect: true, letter: 'A' },
        { id: 'dt1_b', text: 'Je telefoon meteen op tafel leggen en het bericht direct openen terwijl de ander praat.', isCorrect: false, letter: 'B' },
        { id: 'dt1_c', text: 'Je telefoon pakken, naar het scherm kijken en zeggen: "Ga maar door hoor, ik luister met één oor."', isCorrect: false, letter: 'C' },
        { id: 'dt1_d', text: 'Een selfie maken van je date zonder te vragen en die direct op je verhaal plaatsen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Spreektijd en Balans',
      scenario: 'Je merkt dat je veel leuke verhalen hebt te vertellen over je werk, sport en vrienden.',
      question: 'Wat zorgt voor de prettigste gespreksdynamiek tijdens een eerste date?',
      imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @brookecagle',
      options: [
        { id: 'dt2_a', text: 'Een natuurlijke balans (ongeveer 50-50) waarin je de ander ook nieuwsgierige vragen stelt en echt luistert.', isCorrect: true, letter: 'A' },
        { id: 'dt2_b', text: 'Zelf minstens 90% van de tijd aan het woord blijven om te laten zien hoe gezellig en spontaan je bent.', isCorrect: false, letter: 'B' },
        { id: 'dt2_c', text: 'Bijna niets zeggen en alleen met \'ja\' of \'nee\' antwoorden om geheimzinnig en mysterieus over te komen.', isCorrect: false, letter: 'C' },
        { id: 'dt2_d', text: 'Alleen maar vragen stellen zoals bij een officieel politie-verhoor zonder iets over jezelf te delen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Grenzen en Vermoeidheid respecteren',
      scenario: 'Na een drankje zegt je date vriendelijk: "Het was echt supergezellig, maar ik heb morgen een vroege wekker en ben best moe."',
      question: 'Wat is de juiste en ontspannen reactie?',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @clem',
      options: [
        { id: 'dt3_a', text: 'Aandachtig en relaxed reageren: "Helemaal begrijpelijk! Ik vond het erg leuk vanavond, zullen we binnenkort weer afspreken?"', isCorrect: true, letter: 'A' },
        { id: 'dt3_b', text: 'Blijven pushen: "Kom op, eentje kan toch nog wel? Je bent toch geen watje, doe niet zo saai!"', isCorrect: false, letter: 'B' },
        { id: 'dt3_c', text: 'Geïrriteerd zuchten, de rekening op tafel gooien en zonder gedag te zeggen weglopen.', isCorrect: false, letter: 'C' },
        { id: 'dt3_d', text: 'Vragen of je date je stiekem niet leuk vindt en een uitgebreide verklaring eisen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'De rekening betalen',
      scenario: 'Aan het einde van de date brengt de ober de rekening naar de tafel.',
      question: 'Wat is de meest gangbare en ontspannen manier om dit op te lossen?',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @stefano',
      options: [
        { id: 'dt4_a', text: 'Vriendelijk overleggen en aanbieden om de rekening te delen of de ander te trakteren als je dat graag wilt.', isCorrect: true, letter: 'A' },
        { id: 'dt4_b', text: 'Naar het toilet lopen en wachten tot de ander de rekening noodgedwongen helemaal alleen betaalt.', isCorrect: false, letter: 'B' },
        { id: 'dt4_c', text: 'Boos worden als de ander voorstelt om de rekening eerlijk door tweeën te splitsen (Tikkie).', isCorrect: false, letter: 'C' },
        { id: 'dt4_d', text: 'Hardop aan het hele restaurant vragen wie van jullie het rijkst lijkt.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  trouwen: [
    {
      step: 1,
      tag: 'Meningsverschillen samen oplossen',
      scenario: 'Jij en je partner hebben een flinke onenigheid over de taakverdeling in het huishouden.',
      question: 'Wat is volgens relatie-experts de gezondste manier om hiermee om te gaan?',
      imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @leeloo',
      options: [
        { id: 'tr1_a', text: 'Rustig blijven, vanuit je eigen gevoel praten en samen naar een oplossing zoeken in plaats van verwijten te maken.', isCorrect: true, letter: 'A' },
        { id: 'tr1_b', text: 'Drie dagen lang zwijgen en de ander negeren totdat diegene uit zichzelf excuses aanbiedt.', isCorrect: false, letter: 'B' },
        { id: 'tr1_c', text: 'Oude koeien uit de sloot halen en alle fouten van de afgelopen twee jaar erbij betrekken.', isCorrect: false, letter: 'C' },
        { id: 'tr1_d', text: 'Gelijk naar je vrienden bellen om te klagen terwijl je partner in dezelfde kamer zit.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Getuigen bij burgerlijk huwelijk',
      scenario: 'Jullie gaan trouwen op het gemeentehuis en moeten getuigen aanwijzen voor de officiële akte.',
      question: 'Hoeveel meerderjarige getuigen mogen er minimaal en maximaal tekenen bij de Nederlandse burgerlijke stand?',
      imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @scott',
      options: [
        { id: 'tr2_a', text: 'Minimaal 2 en maximaal 4 meerderjarige getuigen in totaal.', isCorrect: true, letter: 'A' },
        { id: 'tr2_b', text: 'Minimaal 1 en maximaal 10 getuigen ongeacht hun leeftijd.', isCorrect: false, letter: 'B' },
        { id: 'tr2_c', text: 'Altijd exact 6 getuigen, waarvan er minimaal 3 directe familieleden moeten zijn.', isCorrect: false, letter: 'C' },
        { id: 'tr2_d', text: 'Getuigen zijn sinds kort afgeschaft; alleen de trouwambtenaar hoeft nog te tekenen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Financiën & Huwelijkse afspraken',
      scenario: 'Vóór het trouwen bespreken partners hoe ze hun geld en eventuele schulden willen regelen.',
      question: 'Waarom kiezen stellen er soms voor om bij de notaris huwelijkse voorwaarden op te stellen?',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @sandy',
      options: [
        { id: 'tr3_a', text: 'Om duidelijke afspraken te maken over vermogen, spaargeld en om elkaar te beschermen tegen elkaars eventuele zakelijke schulden.', isCorrect: true, letter: 'A' },
        { id: 'tr3_b', text: 'Omdat het wettelijk verplicht is voor iedereen die na zijn 25e besluit te trouwen.', isCorrect: false, letter: 'B' },
        { id: 'tr3_c', text: 'Om te voorkomen dat je na het trouwen nog samen op vakantie mag gaan.', isCorrect: false, letter: 'C' },
        { id: 'tr3_d', text: 'Om de gemeente te verplichten om de trouwceremonie gratis ter beschikking te stellen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Sleutel tot langdurig huwelijksgeluk',
      scenario: 'Onderzoekers interviewden stellen die al meer dan 30 jaar gelukkig getrouwd zijn.',
      question: 'Welk element noemen deze stellen vrijwel altijd als belangrijkste sleutel tot succes?',
      imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @jonathan',
      options: [
        { id: 'tr4_a', text: 'Blijven communiceren, elkaars dromen steunen, dankbaarheid tonen en als één hecht team samenwerken.', isCorrect: true, letter: 'A' },
        { id: 'tr4_b', text: 'Nooit van mening verschillen en alle moeilijke onderwerpen vermijden om de vrede te bewaren.', isCorrect: false, letter: 'B' },
        { id: 'tr4_c', text: 'Zoveel mogelijk dure cadeaus voor elkaar kopen op elke trouwdag.', isCorrect: false, letter: 'C' },
        { id: 'tr4_d', text: 'Altijd precies 50-50 op de cent nauwkeurig bijhouden wie wat heeft betaald.', isCorrect: false, letter: 'D' }
      ]
    }
  ]
};

// Update itemsData.js cleanly by loading the original definitions and attaching tasks
const itemsDataPath = path.join(__dirname, '..', 'public', 'js', 'itemsData.js');

// Read the base file content before our earlier modifications
// We can reconstruct itemsData.js with pristine syntax!
const baseItems = {
  autosleutels: {
    id: 'autosleutels',
    name: 'Autosleutels',
    location: 'LA227',
    code: '4222',
    points: 1,
    isLimited: false,
    icon: 'vpn_key',
    category: 'Algemeen Item',
    tag: 'Verkeersregels theorie',
    hintText: 'Zoek bij lokaal LA227 naar de 4-cijferige code.',
    hintVideoTitle: 'Verkeersregels samenvatting (15s)',
    tasks: THEMED_4_TASKS.autosleutels
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
    tag: 'Wonen & Huurrecht',
    hintText: 'Zoek bij lokaal LX200 naar de 4-cijferige code.',
    hintVideoTitle: 'Wonen & Onderhoud tips (15s)',
    tasks: THEMED_4_TASKS.huissleutels
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
    tag: 'Studie & Wetenschap',
    hintText: 'Zoek bij de LA Hoofdingang naar de 4-cijferige code.',
    hintVideoTitle: 'Studietips & Scriptie (15s)',
    tasks: THEMED_4_TASKS.diploma
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
    tag: 'Reizen & Topografie',
    hintText: 'Zoek op/bij de LA Balie naar de 4-cijferige code.',
    hintVideoTitle: 'Reisgids & Vliegveld tips (15s)',
    tasks: THEMED_4_TASKS.droomreis
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
    hintVideoTitle: 'Sollicitatietips & Valkuilen (15s)',
    tasks: THEMED_4_TASKS.job_interview
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
    hintVideoTitle: 'Salarisonderhandeling gids (15s)',
    tasks: THEMED_4_TASKS.job_raise
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
    hintVideoTitle: 'Dating etiquette & Gespreksstarters (15s)',
    tasks: THEMED_4_TASKS.date
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
    hintVideoTitle: 'Huwelijk & Duurzame Relaties (15s)',
    tasks: THEMED_4_TASKS.trouwen
  }
};

// Read existing OPENSOURCE_MEDIA_CATALOG and PUSH_NOTIFICATIONS
const currentFile = fs.readFileSync(itemsDataPath, 'utf8');
const tailMarker = '// DOOMSCROLL OPEN SOURCE VIDEO & MEDIA FEED';
const tailContent = currentFile.substring(currentFile.indexOf(tailMarker));

const newItemsDataContent = `// Content & Codes Dictionary voor Doomscroll Escape
const ITEMS_DATA = ${JSON.stringify(baseItems, null, 2)};

${tailContent}`;

fs.writeFileSync(itemsDataPath, newItemsDataContent, 'utf8');
console.log('Successfully generated clean public/js/itemsData.js!');
