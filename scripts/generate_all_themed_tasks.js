const fs = require('fs');
const path = require('path');

const THEMED_TASKS = {
  autosleutels: [
    {
      step: 1,
      tag: 'Voorrang op gelijkwaardige kruising',
      scenario: 'Je nadert in de auto een gelijkwaardige kruising binnen de bebouwde kom. Van rechts nadert een fietser. Van links nadert een tram die rechtdoor wil rijden.',
      question: 'Wat is wettelijk de juiste volgorde van voorrang volgens het RVV?',
      options: [
        { id: 'a1', text: 'De tram gaat eerst, daarna de fietser van rechts, daarna jij.', isCorrect: true, letter: 'A' },
        { id: 'a2', text: 'De tram gaat eerst, daarna jij, daarna pas de fietser van rechts.', isCorrect: false, letter: 'B' },
        { id: 'a3', text: 'De fietser gaat eerst als kwetsbare verkeersdeelnemer, daarna de tram, daarna jij.', isCorrect: false, letter: 'C' },
        { id: 'a4', text: 'Jij gaat voor op de tram, maar moet de fietser van rechts voor laten gaan.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Rotonde met twee rijstroken',
      scenario: 'Je nadert een turborotonde met twee rijstroken. Je wilt driekwart rond om de rotonde aan de linkerzijde (derde afrit) te verlaten.',
      question: 'Welke handeling en voorsortering is wettelijk en verkeersveilig verplicht?',
      options: [
        { id: 'b1', text: 'Vóór het oprijden links voorsorteren en richting aangeven; bij het naderen van de afrit tijdig naar rechts kijken, richting naar rechts aangeven en voorrang verlenen aan fietsers op de rotonde.', isCorrect: true, letter: 'A' },
        { id: 'b2', text: 'Op de rechterrijstrook blijven rijden om fietsers niet af te snijden, en pas op de rotonde links inhalen.', isCorrect: false, letter: 'B' },
        { id: 'b3', text: 'Geen richting aangeven bij het oprijden en pas richting aangeven nádat je de rotonde al verlaten hebt.', isCorrect: false, letter: 'C' },
        { id: 'b4', text: 'Linker richtingaanwijzer aanzetten en constant aanhouden totdat je auto volledig tot stilstand is gekomen op de afrit.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Afslaan: Korte bocht vs Lange bocht',
      scenario: 'Op een kruispunt wil jij linksaf slaan (lange bocht). Een tegemoetkomende auto wil op hetzelfde kruispunt rechtsaf slaan (korte bocht). Een voetganger loopt op dezelfde weg rechtdoor.',
      question: 'Wat is de exacte voorrangsvolgorde van deze verkeersdeelnemers?',
      options: [
        { id: 'c1', text: 'Voetganger rechtdoor eerst, daarna de tegemoetkomende auto (korte bocht), daarna jij (lange bocht).', isCorrect: true, letter: 'A' },
        { id: 'c2', text: 'Tegemoetkomende auto eerst, daarna jij, en de voetganger moet altijd wachten op gemotoriseerd verkeer.', isCorrect: false, letter: 'B' },
        { id: 'c3', text: 'Jij mag eerst omdat verkeer dat linksaf slaat voorrang heeft op verkeer dat rechtsaf slaat.', isCorrect: false, letter: 'C' },
        { id: 'c4', text: 'De tegemoetkomende auto eerst, daarna de overstekende voetganger, daarna pas jij.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Wegmarkering en Inhaalverbod',
      scenario: 'Je rijdt achter een tractor die 25 km/u rijdt op een provinciale 80 km/u-weg. Op het wegdek ligt een dubbele asstreep: aan jouw kant is de streep doorgetrokken, aan de overzijde onderbroken.',
      question: 'Mag je de tractor inhalen als de weg over een kilometer kaarsrecht en volledig overzichtelijk is?',
      options: [
        { id: 'd1', text: 'Nee, een doorgetrokken streep aan jouw zijde mag onder geen enkel beding overschreden worden, ook niet voor langzaam verkeer.', isCorrect: true, letter: 'A' },
        { id: 'd2', text: 'Ja, mits het in te halen voertuig langzamer rijdt dan 30 km/u en er geen tegenligger in zicht is.', isCorrect: false, letter: 'B' },
        { id: 'd3', text: 'Ja, landbouwvoertuigen zijn wettelijk uitgezonderd van het inhaalverbod bij doorgetrokken strepen.', isCorrect: false, letter: 'C' },
        { id: 'd4', text: 'Alleen toegestaan als de bestuurder van de tractor met de linker richtingaanwijzer aangeeft dat het veilig kan.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 5,
      tag: 'Voorrangsbord B06 en Bijzondere Voertuigen',
      scenario: 'Je rijdt op een weg en nadert voorrangsbord B06 (omgekeerde witte driehoek met rode rand, haaientanden). Van links nadert een militaire colonne waarvan het eerste voertuig de kruising al op is gereden.',
      question: 'Wat is de geldende regel voor het doorkruisen van deze militaire colonne?',
      options: [
        { id: 'e1', text: 'Je moet de gehele militaire colonne voor laten gaan, omdat het eerste voertuig de kruising al rechtmatig is opgereden.', isCorrect: true, letter: 'A' },
        { id: 'e2', text: 'Je mag voorgaan op de rest van de colonne omdat de colonne van links komt en jij op een voorrangsweg rijdt.', isCorrect: false, letter: 'B' },
        { id: 'e3', text: 'Je hoeft alleen het eerste en laatste voertuig met de groene vlag voor te laten; tussenliggende voertuigen moeten wachten.', isCorrect: false, letter: 'C' },
        { id: 'e4', text: 'Militaire colonnes hebben bij haaientanden nooit voorrang op particuliere bestuurders.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 6,
      tag: 'Bijzondere verrichting en Uitritconstructie',
      scenario: 'Je verlaat een woonerf via een verlaagde trottoirband (uitritconstructie). Van links op het trottoir nadert een voetganger; van rechts op het fietspad nadert een fietser.',
      question: 'Wie moet je voor laten gaan bij het verlaten van deze uitrit?',
      options: [
        { id: 'f1', text: 'Zowel de voetganger als de fietser: bij een uitritconstructie moet je al het overige verkeer voor laten gaan.', isCorrect: true, letter: 'A' },
        { id: 'f2', text: 'Alleen de fietser van rechts, want bestuurders van rechts hebben altijd voorrang.', isCorrect: false, letter: 'B' },
        { id: 'f3', text: 'Alleen de voetganger, omdat voetgangers op trottoirs absolute voorrang genieten boven fietsers.', isCorrect: false, letter: 'C' },
        { id: 'f4', text: 'Geen van beiden, want verkeer dat een woonerf verlaat heeft voorrang ter voorkoming van opstopping in het erf.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 7,
      tag: 'Snelheid en Volgafstand bij regen',
      scenario: 'Je rijdt 100 km/u op de autosnelweg. Er valt zware regen en het wegdek staat vol waterplassen waardoor de remweg aanzienlijk toeneemt.',
      question: 'Wat is onder deze weersomstandigheden de minimale veilige volgafstand in seconden en meters?',
      options: [
        { id: 'g1', text: 'Minimaal 3 tot 4 seconden, wat bij 100 km/u neerkomt op circa 80 tot 110 meter afstand.', isCorrect: true, letter: 'A' },
        { id: 'g2', text: 'Exact 2 seconden, wat bij 100 km/u gelijk is aan circa 25 meter afstand.', isCorrect: false, letter: 'B' },
        { id: 'g3', text: 'Minimaal 1 seconde, zolang je cruise control met afstandssensor ingeschakeld is.', isCorrect: false, letter: 'C' },
        { id: 'g4', text: 'Precies 50 meter, ongeacht de weersomstandigheden of de toestand van het wegdek.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 8,
      tag: 'Aquaplaning en Noodhandeling',
      scenario: 'Je rijdt 100 km/u en rijdt door een diepe plas water. Het stuur voelt opeens vederlicht aan en de auto reageert tijdelijk niet meer op stuurbewegingen (aquaplaning).',
      question: 'Wat is de enige technisch en fysiek juiste reactie om de controle te herwinnen?',
      options: [
        { id: 'h1', text: 'Gas rustig loslaten, koppeling intrappen (of bij automaat gas loslaten), stuur recht houden en absoluut niet bruusk remmen.', isCorrect: true, letter: 'A' },
        { id: 'h2', text: 'Direct voluit krachtig op de rem trappen om het ABS-systeem maximaal te activeren.', isCorrect: false, letter: 'B' },
        { id: 'h3', text: 'Meteen extra gas bijgeven om de banden sneller door de waterlaag te laten snijden.', isCorrect: false, letter: 'C' },
        { id: 'h4', text: 'De handrem kort aantrekken en krachtig naar links sturen om grip op het asfalt te forceren.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  huissleutels: [
    {
      step: 1,
      tag: 'Huurrecht: Waarborgsom',
      scenario: 'Je tekent een nieuw huurcontract voor een zelfstandig appartement. De verhuurder vraagt in de offerte een waarborgsom.',
      question: 'Wat is volgens de Wet betaalbare huur het wettelijk maximum voor de waarborgsom die gevraagd mag worden?',
      options: [
        { id: 'hs1', text: 'Maximaal 2x de kale maandhuurprijs.', isCorrect: true, letter: 'A' },
        { id: 'hs2', text: 'Maximaal 1x de kale maandhuurprijs.', isCorrect: false, letter: 'B' },
        { id: 'hs3', text: 'Maximaal 3x de totale huur inclusief alle maandelijkse servicekosten.', isCorrect: false, letter: 'C' },
        { id: 'hs4', text: 'Er geldt geen wettelijk maximum zolang beide partijen schriftelijk akkoord gaan.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Servicekosten: Jaarafrekening',
      scenario: 'Je betaalt maandelijks een voorschot van € 120,- voor servicekosten en nutsvoorzieningen bovenop de kale huur.',
      question: 'Vóór welke datum moet de verhuurder wettelijk jaarlijks een gespecificeerde eindafrekening verstrekken?',
      options: [
        { id: 'hs2_1', text: 'Uiterlijk 1 juli van het daaropvolgende kalenderjaar (art. 7:259 lid 2 BW).', isCorrect: true, letter: 'A' },
        { id: 'hs2_2', text: 'Binnen 30 kalenderdagen na afloop van elk afzonderlijk kwartaal.', isCorrect: false, letter: 'B' },
        { id: 'hs2_3', text: 'Uiterlijk 31 december van het lopende kalenderjaar.', isCorrect: false, letter: 'C' },
        { id: 'hs2_4', text: 'Pas bij het beëindigen van de huurovereenkomst bij de definitieve eindoplevering.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Onderhoud: Besluit kleine herstellingen',
      scenario: 'De verwarmingsinstallatie in je huurwoning vertoont twee mankementen: de circulatiepomp is doorgebrand en de radiatoren moeten worden ontlucht en bijgevuld.',
      question: 'Wie is volgens het Besluit kleine herstellingen verantwoordelijk voor respectievelijk de pomp en het ontluchten?',
      options: [
        { id: 'hs3_1', text: 'De verhuurder moet de pomp vervangen; de huurder is verantwoordelijk voor het ontluchten en bijvullen.', isCorrect: true, letter: 'A' },
        { id: 'hs3_2', text: 'De huurder moet zowel de pomp vervangen als het ontluchten en bijvullen zelf bekostigen.', isCorrect: false, letter: 'B' },
        { id: 'hs3_3', text: 'De verhuurder is wettelijk verplicht om alle handelingen inclusief het ontluchten zelf uit te voeren.', isCorrect: false, letter: 'C' },
        { id: 'hs3_4', text: 'De energieleverancier is wettelijk verplicht om de CV-installatie kosteloos te herstellen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Opzegtermijn Huurder',
      scenario: 'Je hebt een huurovereenkomst voor onbepaalde tijd en betaalt je huur per de eerste van iedere kalendermaand. Je vindt een nieuwe woning en wilt opzeggen.',
      question: 'Wat is de wettelijke opzegtermijn die jij als huurder in acht moet nemen?',
      options: [
        { id: 'hs4_1', text: 'Gelijk aan de betalingstermijn, dus precies 1 volledige kalendermaand.', isCorrect: true, letter: 'A' },
        { id: 'hs4_2', text: 'Altijd minimaal 3 volle kalendermaanden ongeacht de betalingstermijn.', isCorrect: false, letter: 'B' },
        { id: 'hs4_3', text: 'Afhankelijk van de woonduur: 1 maand per gewoond jaar met een maximum van 6 maanden.', isCorrect: false, letter: 'C' },
        { id: 'hs4_4', text: 'Exact 14 werkdagen mits per aangetekende brief verstuurd.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 5,
      tag: 'Puntentelling en WWS',
      scenario: 'Het Woningwaarderingsstelsel (WWS) bepaalt de maximale huurprijsgrens van een zelfstandige woonruimte op basis van punten.',
      question: 'Welk effect heeft een verbetering van het energielabel van G naar label A op de woningwaardering?',
      options: [
        { id: 'hs5_1', text: 'Het levert fors meer WWS-punten op, waardoor de wettelijk maximaal toegestane huurprijsgrens hoger ligt.', isCorrect: true, letter: 'A' },
        { id: 'hs5_2', text: 'Het energielabel heeft geen enkele invloed op WWS-punten, uitsluitend op de gemeentelijke WOZ-belasting.', isCorrect: false, letter: 'B' },
        { id: 'hs5_3', text: 'Het verlaagt de WWS-punten omdat moderne woningen minder onderhoudsafschrijving genieten.', isCorrect: false, letter: 'C' },
        { id: 'hs5_4', text: 'Het energielabel telt uitsluitend mee voor woningen in de vrije sector boven de liberalisatiegrens.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 6,
      tag: 'Basisregistratie Personen (BRP)',
      scenario: 'Je verhuist naar je nieuwe studio en ontvangt op 1 september de sleutels.',
      question: 'Binnen welke termijn ben je wettelijk verplicht je verhuizing door te geven aan de gemeente?',
      options: [
        { id: 'hs6_1', text: 'Vanaf 4 weken vóór tot uiterlijk 5 dagen na de feitelijke verhuisdatum.', isCorrect: true, letter: 'A' },
        { id: 'hs6_2', text: 'Binnen exact 30 kalenderdagen na de notariële of huuroverdracht.', isCorrect: false, letter: 'B' },
        { id: 'hs6_3', text: 'Binnen 60 dagen mits het huurcontract al ingeschreven staat bij het Kadaster.', isCorrect: false, letter: 'C' },
        { id: 'hs6_4', text: 'Aangifte is alleen verplicht als je naar een andere gemeente of provincie verhuist.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 7,
      tag: 'Verzekeringen: Inboedel vs Opstal',
      scenario: 'Door een lekkage in het dak ontstaat waterschade aan je meubels en aan de door jou zelf gelegde en verlijmde laminaatvloer in je huurwoning.',
      question: 'Onder welke verzekering valt de schade aan je meubels en zelfgelegde vloer?',
      options: [
        { id: 'hs7_1', text: 'Onder jouw eigen inboedelverzekering (met de dekking huurdersbelang voor de vloer).', isCorrect: true, letter: 'A' },
        { id: 'hs7_2', text: 'Onder de opstalverzekering van de verhuurder voor zowel de meubels als de vloer.', isCorrect: false, letter: 'B' },
        { id: 'hs7_3', text: 'Onder de wettelijke aansprakelijkheidsverzekering (AVP) van de bovenburen.', isCorrect: false, letter: 'C' },
        { id: 'hs7_4', text: 'Onder de gemeentelijke calamiteitenverzekering voor huurders.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 8,
      tag: 'Woningveiligheid: Rookmelders',
      scenario: 'Sinds juli 2022 gelden er aangescherpte brandveiligheidseisen in het Besluit bouwwerken leefomgeving voor alle woningen in Nederland.',
      question: 'Wat is de wettelijke minimumeis voor rookmelders in een bestaande woning?',
      options: [
        { id: 'hs8_1', text: 'Op iedere woonverdieping moet minimaal één werkende rookmelder hangen in de vluchtroute (hal of overloop).', isCorrect: true, letter: 'A' },
        { id: 'hs8_2', text: 'Er hoeft alleen een rookmelder geplaatst te worden in de keuken direct naast het fornuis.', isCorrect: false, letter: 'B' },
        { id: 'hs8_3', text: 'Rookmelders zijn uitsluitend verplicht in slaapkamers van woningen gebouwd na 2020.', isCorrect: false, letter: 'C' },
        { id: 'hs8_4', text: 'Rookmelders zijn alleen verplicht als er een open gasinstallatie aanwezig is in het woongedeelte.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  diploma: [
    {
      step: 1,
      tag: 'Academische Integriteit: APA 7',
      scenario: 'Je parafraseert een theorie van De Jong en Smit (2021) in je eigen woorden in het theoretisch kader van je afstudeerscriptie.',
      question: 'Wat schrijft de APA 7-stijlstandaard voor om wetenschappelijk zuiver te handelen en plagiaat te voorkomen?',
      options: [
        { id: 'dp1', text: 'Zowel een bronvermelding in de lopende tekst (De Jong & Smit, 2021) als een volledige referentie in de literatuurlijst.', isCorrect: true, letter: 'A' },
        { id: 'dp2', text: 'Omdat het volledig in eigen woorden is geformuleerd, is alleen een algemene vermelding in de literatuurlijst voldoende.', isCorrect: false, letter: 'B' },
        { id: 'dp3', text: 'Je bent bij parafraseren verplicht om dubbele aanhalingstekens en het exacte paginanummer te gebruiken.', isCorrect: false, letter: 'C' },
        { id: 'dp4', text: 'Parafraseren van andermans ideeën mag alleen met voorafgaande schriftelijke toestemming van de auteurs.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Methodologie: Betrouwbaarheid vs Validiteit',
      scenario: 'Een onderzoeker meet studenttevredenheid met een enquête. Bij herhaalde meting onder gelijke omstandigheden zijn de scores exact gelijk, maar de vragen meten motivatie in plaats van tevredenheid.',
      question: 'Wat is de methodologisch correcte kwalificatie van dit meetinstrument?',
      options: [
        { id: 'dp2_1', text: 'Het instrument heeft een hoge betrouwbaarheid, maar een lage begripsvaliditeit.', isCorrect: true, letter: 'A' },
        { id: 'dp2_2', text: 'Het instrument heeft een hoge inhoudsvaliditeit, maar een zeer lage betrouwbaarheid.', isCorrect: false, letter: 'B' },
        { id: 'dp2_3', text: 'Zowel de validiteit als de betrouwbaarheid zijn uitstekend omdat de uitkomsten stabiel zijn.', isCorrect: false, letter: 'C' },
        { id: 'dp2_4', text: 'Het instrument is per definitie statistisch niet-significant en kan niet gecodeerd worden.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Onderzoeksdesign: Kwalitatief vs Kwantitatief',
      scenario: 'Je wilt diepgaand inzicht verwerven in de emotionele copingmechanismen en persoonlijke beweegredenen van jongeren bij problematisch smartphonegebruik.',
      question: 'Welk onderzoeksdesign sluit het beste aan bij deze verkennende vraagstelling?',
      options: [
        { id: 'dp3_1', text: 'Semigestructureerde diepte-interviews geanalyseerd via thematische inhoudsanalyse.', isCorrect: true, letter: 'A' },
        { id: 'dp3_2', text: 'Een grootschalige gestandaardiseerde online enquête met uitsluitend 5-punts Likert-schalen.', isCorrect: false, letter: 'B' },
        { id: 'dp3_3', text: 'Een kwantitatieve regressieanalyse op geanonimiseerde CBS-microdatabestanden.', isCorrect: false, letter: 'C' },
        { id: 'dp3_4', text: 'Een gerandomiseerd A/B-experiment met p-waarde toetsing van kliksnelheden.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Studievoortgang: ECTS-normering',
      scenario: 'In het Europese hoger onderwijs (Bologna-akkoord) wordt de studielast uitgedrukt in European Credit Transfer System (ECTS) studiepunten.',
      question: 'Hoeveel nominale studiebelastingsuren vertegenwoordigt 1 ECTS-punt in Nederland?',
      options: [
        { id: 'dp4_1', text: 'Precies 28 studiebelastingsuren (60 ECTS = 1.680 uur per academisch jaar).', isCorrect: true, letter: 'A' },
        { id: 'dp4_2', text: 'Precies 40 studiebelastingsuren (gelijk aan een reguliere werkweek).', isCorrect: false, letter: 'B' },
        { id: 'dp4_3', text: 'Precies 20 contacturen met een docent of practicumleider.', isCorrect: false, letter: 'C' },
        { id: 'dp4_4', text: 'Precies 32 studiebelastingsuren inclusief tentamentijd.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 5,
      tag: 'Statistiek: Correlatie vs Causaliteit',
      scenario: 'In een steekproef van 400 studenten vind je een sterke positieve correlatie (r = 0,78, p < 0,01) tussen dagelijkse schermtijd en het aantal herkansingen.',
      question: 'Welke wetenschappelijke conclusie mag je op basis van deze correlatieanalyse trekken?',
      options: [
        { id: 'dp5_1', text: 'Er is een sterke statistische samenhang, maar er kan sprake zijn van een derde variabele (zoals stress); causaliteit is hiermee niet bewezen.', isCorrect: true, letter: 'A' },
        { id: 'dp5_2', text: 'Hoge schermtijd veroorzaakt rechtstreeks dat studenten zakken voor hun tentamens.', isCorrect: false, letter: 'B' },
        { id: 'dp5_3', text: 'Het zakken voor tentamens is de directe oorzaak van toegenomen schermtijd bij studenten.', isCorrect: false, letter: 'C' },
        { id: 'dp5_4', text: 'De nulhypothese is hiermee bewezen en verder onderzoek is overbodig.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 6,
      tag: 'Scriptiestructuur: IMRAD-model',
      scenario: 'Je schrijft het academische eindrapport van je afstudeeronderzoek volgens de IMRAD-structuur (Introduction, Methods, Results, and Discussion).',
      question: 'In welk hoofdstuk hoort de confrontatie tussen jouw empirische bevindingen en eerdere theorieën thuis?',
      options: [
        { id: 'dp6_1', text: 'In de Discussie: hier interpreteer je resultaten, leg je de link met literatuur en bespreek je limitaties.', isCorrect: true, letter: 'A' },
        { id: 'dp6_2', text: 'In het Resultatenhoofdstuk: hier moet je de interpretatie direct bij de tabellen en cijfers opnemen.', isCorrect: false, letter: 'B' },
        { id: 'dp6_3', text: 'In de Methodologie: hier verantwoord je de theoriekeuze ten opzichte van je dataverzameling.', isCorrect: false, letter: 'C' },
        { id: 'dp6_4', text: 'In de Inleiding: eerdere theorieën mogen uitsluitend in de probleemstelling worden besproken.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 7,
      tag: 'Ethische toetsing en AVG',
      scenario: 'Voor je afstudeerproject neem je interviews af met respondenten over gevoelige persoonlijke studievertragingen en mentale gezondheid.',
      question: 'Wat is volgens de ethische commissie en de Algemene Verordening Gegevensbescherming (AVG) vooraf verplicht?',
      options: [
        { id: 'dp7_1', text: 'Een getekend Informed Consent-formulier met uitleg over doel, anonimisering, gegevensopslag en het recht op intrekking.', isCorrect: true, letter: 'A' },
        { id: 'dp7_2', text: 'Mondeling akkoord tijdens het interview volstaat, mits de opname op een openbare USB-stick wordt bewaard.', isCorrect: false, letter: 'B' },
        { id: 'dp7_3', text: 'De volledige ongecensureerde opnamen moeten verplicht als openbare bijlage bij de scriptie worden gepubliceerd.', isCorrect: false, letter: 'C' },
        { id: 'dp7_4', text: 'Er is geen toestemming nodig zolang de respondenten studenten zijn aan dezelfde onderwijsinstelling.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 8,
      tag: 'Judicium: Cum Laude vereisten',
      scenario: 'Je rondt je bachelor- of masteropleiding af en hebt hoge cijfers gehaald voor al je vakken.',
      question: 'Welke eiscombinatie is aan de meeste Nederlandse hogescholen en universiteiten gangbaar voor het judicium Cum Laude?',
      options: [
        { id: 'dp8_1', text: 'Een gewogen gemiddelde van minimaal 8,0 zonder onvoldoendes of herkansingen, én minimaal een 8,0 voor het afstudeerproject.', isCorrect: true, letter: 'A' },
        { id: 'dp8_2', text: 'Een gewogen gemiddelde van minimaal 7,5 voor alle theorievakken ongeacht herkansingen.', isCorrect: false, letter: 'B' },
        { id: 'dp8_3', text: 'Uitsluitend een 9,0 of hoger voor de scriptie; de overige studieresultaten tellen niet mee.', isCorrect: false, letter: 'C' },
        { id: 'dp8_4', text: 'Alle vakken in het eerste studiejaar foutloos met een 10 hebben afgesloten.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  droomreis: [
    {
      step: 1,
      tag: 'Geografie: Grenzen en Verdragen',
      scenario: 'Je stelt een internationale reisroute samen door Europa en wilt weten waar je te maken krijgt met paspoortcontroles.',
      question: 'Welk land maakt wél deel uit van het Schengengebied (vrij personenverkeer), maar is géén lid van de Europese Unie?',
      options: [
        { id: 'dr1', text: 'Zwitserland', isCorrect: true, letter: 'A' },
        { id: 'dr2', text: 'Ierland', isCorrect: false, letter: 'B' },
        { id: 'dr3', text: 'Cyprus', isCorrect: false, letter: 'C' },
        { id: 'dr4', text: 'Roemenië', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Navigatie en Tijdzones (UTC)',
      scenario: 'Je vliegt van Amsterdam (UTC+1, standaardtijd) naar Tokio (UTC+9). Je vlucht vertrekt om 14:00 uur Nederlandse tijd en duurt precies 13 uur non-stop.',
      question: 'Hoe laat is het op de lokale klok in Tokio op het moment dat je landt?',
      options: [
        { id: 'dr2_1', text: 'De volgende ochtend om 11:00 uur lokale tijd.', isCorrect: true, letter: 'A' },
        { id: 'dr2_2', text: 'De volgende nacht om 03:00 uur lokale tijd.', isCorrect: false, letter: 'B' },
        { id: 'dr2_3', text: 'Dezelfde avond om 22:00 uur lokale tijd.', isCorrect: false, letter: 'C' },
        { id: 'dr2_4', text: 'De volgende middag om 15:00 uur lokale tijd.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Internationale Reisdocumenten',
      scenario: 'Je boekt een rondreis naar Zuidoost-Azië (bijvoorbeeld Thailand en Indonesië).',
      question: 'Welke internationale paspoorteis hanteren deze landen strikt bij inreis voor buitenlandse toeristen?',
      options: [
        { id: 'dr3_1', text: 'Het paspoort moet bij inreis nog minimaal 6 maanden geldig zijn.', isCorrect: true, letter: 'A' },
        { id: 'dr3_2', text: 'Het paspoort hoeft alleen geldig te zijn tot de dag van geplande terugkeer in Nederland.', isCorrect: false, letter: 'B' },
        { id: 'dr3_3', text: 'Een Nederlandse identiteitskaart (ID-kaart) wordt wereldwijd erkend mits voorzien van biometrische chip.', isCorrect: false, letter: 'C' },
        { id: 'dr3_4', text: 'Het paspoort mag maximaal 3 jaar oud zijn vanaf de officiële uitgiftedatum.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Wereldtopografie: Hoofdsteden en Oceanen',
      scenario: 'Je plant een reis naar Australië en wilt weten welke kustplaatsen en oceanen het land omringen.',
      question: 'Wat is de federale hoofdstad van Australië, en aan welke oceaan grenst de gehele westkust van het continent?',
      options: [
        { id: 'dr4_1', text: 'Canberra is de hoofdstad; de westkust grenst aan de Indische Oceaan.', isCorrect: true, letter: 'A' },
        { id: 'dr4_2', text: 'Sydney is de hoofdstad; de westkust grenst aan de Stille Oceaan.', isCorrect: false, letter: 'B' },
        { id: 'dr4_3', text: 'Melbourne is de hoofdstad; de westkust grenst aan de Zuidelijke IJszee.', isCorrect: false, letter: 'C' },
        { id: 'dr4_4', text: 'Brisbane is de hoofdstad; de westkust grenst aan de Koraalzee.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 5,
      tag: 'Fysische Geografie: Bergketens',
      scenario: 'Je wilt bergwandelen in Europa en zoekt de hoogste bergtop van de Alpen (4.808 meter).',
      question: 'Hoe heet deze berg en op de grens van welke twee landen bevindt het massief zich?',
      options: [
        { id: 'dr5_1', text: 'Mont Blanc, gelegen op de grens tussen Frankrijk en Italië.', isCorrect: true, letter: 'A' },
        { id: 'dr5_2', text: 'Matterhorn, gelegen op de grens tussen Oostenrijk en Duitsland.', isCorrect: false, letter: 'B' },
        { id: 'dr5_3', text: 'Grossglockner, gelegen op de grens tussen Zwitserland en Liechtenstein.', isCorrect: false, letter: 'C' },
        { id: 'dr5_4', text: 'Pico de Aneto, gelegen op de grens tussen Spanje en Andorra.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 6,
      tag: 'Reisgezondheid: Gele Koorts Certificaat',
      scenario: 'Voor reizen naar bepaalde tropische bestemmingen in Midden-Afrika en Zuid-Amerika is een officieel vaccinatiebewijs wettelijk verplicht om het land binnen te mogen.',
      question: 'Hoe heet het officiële gele document dat door de Wereldgezondheidsorganisatie (WHO) hiervoor is vastgesteld?',
      options: [
        { id: 'dr6_1', text: 'Internationaal Certificaat van Inenting of Profylaxe (het Gele Boekje).', isCorrect: true, letter: 'A' },
        { id: 'dr6_2', text: 'Europees Zorgpaspoort (EHIC-kaart).', isCorrect: false, letter: 'B' },
        { id: 'dr6_3', text: 'Schengen Border Health Clearance Declaration.', isCorrect: false, letter: 'C' },
        { id: 'dr6_4', text: 'Global Quarantine Immunity Passport.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 7,
      tag: 'Klimatologie: Moessonseizoenen',
      scenario: 'Je wilt een rondreis maken door Zuidoost-Azië en wilt extreme tropische neerslag en overstromingen zoveel mogelijk ontlopen.',
      question: 'In welke periode waait in grote delen van Zuidoost-Azië de natte zuidwestmoesson die gepaard gaat met zware regenval?',
      options: [
        { id: 'dr7_1', text: 'Van circa mei/juni tot en met oktober.', isCorrect: true, letter: 'A' },
        { id: 'dr7_2', text: 'Van december tot en met februari.', isCorrect: false, letter: 'B' },
        { id: 'dr7_3', text: 'Uitsluitend gedurende de maand maart tijdens de lente-equinox.', isCorrect: false, letter: 'C' },
        { id: 'dr7_4', text: 'Moessons treden in tropische landen alleen op rond de jaarwisseling.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 8,
      tag: 'Luchtvaartveiligheid: IATA Accuregels',
      scenario: 'Je pakt je bagage in voor een intercontinentale vlucht en hebt een krachtige powerbank (lithium-ion batterij) voor je telefoon.',
      question: 'Wat zijn volgens de internationale IATA-veiligheidsvoorschriften de regels voor het meenemen van losse powerbanks?',
      options: [
        { id: 'dr8_1', text: 'Uitsluitend in de handbagage (maximaal 100 Wh per stuk), nooit in de ruimbagage wegens brandgevaar.', isCorrect: true, letter: 'A' },
        { id: 'dr8_2', text: 'Uitsluitend in de ruimbagage om oververhitting in de passagierscabine te voorkomen.', isCorrect: false, letter: 'B' },
        { id: 'dr8_3', text: 'Losse powerbanks zijn op alle commerciële vluchten wereldwijd ten strengste verboden.', isCorrect: false, letter: 'C' },
        { id: 'dr8_4', text: 'Alleen toegestaan als de batterij voor vertrek aantoonbaar 100% leeg is gemaakt.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  job_interview: [
    {
      step: 1,
      tag: 'Selectiemethodiek: STAR-methode',
      scenario: 'De interviewer vraagt: "Kun je een concreet voorbeeld noemen van een situatie waarin je een ernstig conflict in je projectteam hebt opgelost?"',
      question: 'Waar staat het acroniem STAR in professionele sollicitatiegesprekken voor?',
      options: [
        { id: 'ji1', text: 'Situatie, Taak, Actie, Resultaat.', isCorrect: true, letter: 'A' },
        { id: 'ji2', text: 'Strategie, Tactiek, Actieplan, Rendement.', isCorrect: false, letter: 'B' },
        { id: 'ji3', text: 'Samenwerking, Tijdsplanning, Analyse, Reflectie.', isCorrect: false, letter: 'C' },
        { id: 'ji4', text: 'Standpunt, Tegenargument, Argumentatie, Relativering.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Gelijke Behandeling: Verboden Vragen',
      scenario: 'Tijdens het sollicitatiegesprek vraagt de interviewer vriendelijk: "Heb je op korte termijn een kinderwens of plannen om zwanger te worden?"',
      question: 'Wat is de juridische status van deze vraag volgens de Algemene wet gelijke behandeling (Awgb)?',
      options: [
        { id: 'ji2_1', text: 'Deze vraag is wettelijk verboden wegens direct onderscheid op grond van geslacht; de sollicitant hoeft niet naar waarheid te antwoorden.', isCorrect: true, letter: 'A' },
        { id: 'ji2_2', text: 'Deze vraag is volledig toegestaan mits de functie fysiek veeleisende taken omvat.', isCorrect: false, letter: 'B' },
        { id: 'ji2_3', text: 'De vraag is verplicht zodat de werkgever vooraf UWV-verzuimverzekeringen kan afsluiten.', isCorrect: false, letter: 'C' },
        { id: 'ji2_4', text: 'De vraag mag alleen mondeling gesteld worden en niet schriftelijk worden vastgelegd.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Arbeidsrecht: Proeftijdbeding',
      scenario: 'Een werkgever biedt je een eerste tijdelijk arbeidscontract aan voor een bepaalde duur van precies 6 maanden. In het contract staat een proeftijd van 1 maand.',
      question: 'Wat is volgens artikel 7:652 van het Burgerlijk Wetboek de juridische geldigheid van deze proeftijdclausule?',
      options: [
        { id: 'ji3_1', text: 'Nietig (ongeldig): bij een tijdelijk contract van 6 maanden of korter mag wettelijk géén proeftijd worden afgesproken.', isCorrect: true, letter: 'A' },
        { id: 'ji3_2', text: 'Volledig geldig, want 1 maand is de standaard proeftijd voor alle contracten in Nederland.', isCorrect: false, letter: 'B' },
        { id: 'ji3_3', text: 'Geldig mits de werkgever en werknemer beiden hun handtekening vóór de eerste werkdag hebben geplaatst.', isCorrect: false, letter: 'C' },
        { id: 'ji3_4', text: 'Alleen geldig als de werknemer nog geen relevante eerdere werkervaring in de sector heeft.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Lichaamstaal en Psychologie',
      scenario: 'Je zit aan tafel met de selectiecommissie. Je wilt zelfvertrouwen, actieve betrokkenheid en openheid uitstralen.',
      question: 'Welke combinatie van non-verbale lichaamstaal zendt volgens psychologisch onderzoek het sterkste professionele signaal uit?',
      options: [
        { id: 'ji4_1', text: 'Een open zithouding met ontspannen schouders, lichte buiging naar voren, natuurlijk oogcontact (circa 60-70% van de tijd) en instemmend knikken.', isCorrect: true, letter: 'A' },
        { id: 'ji4_2', text: 'Ononderbroken 100% star oogcontact houden zonder ooit weg te kijken en rechtop met gekruiste armen zitten.', isCorrect: false, letter: 'B' },
        { id: 'ji4_3', text: 'Diep achterover leunen in de stoel met de handen achter het hoofd om nonchalante ontspanning te tonen.', isCorrect: false, letter: 'C' },
        { id: 'ji4_4', text: 'Voortdurend snelle notities maken op je smartphone om te laten zien dat je digitaal vaardig bent.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 5,
      tag: 'Zelfreflectie: Zwaktes benoemen',
      scenario: 'De interviewer vraagt: "Wat beschouw jij als jouw belangrijkste professionele ontwikkelpunt of zwakke plek?"',
      question: 'Welk antwoord getuigt van gezonde zelfkennis en professionele volwassenheid zonder jezelf te beschadigen?',
      options: [
        { id: 'ji5_1', text: '"Vroeger vond ik loslaten en delegeren lastig; ik heb geleerd duidelijke kaders af te spreken en vertrouw nu op teamgenoten, wat projecten merkbaar versnelt."', isCorrect: true, letter: 'A' },
        { id: 'ji5_2', text: '"Ik ben eigenlijk te perfectionistisch en ik werk simpelweg veel te hard voor de organisatie."', isCorrect: false, letter: 'B' },
        { id: 'ji5_3', text: '"Ik kom regelmatig te laat bij ochtendafspraken, maar dat haal ik s avonds weer in."', isCorrect: false, letter: 'C' },
        { id: 'ji5_4', text: '"Eerlijk gezegd heb ik op dit moment geen noemenswaardige zwakke punten op de werkvloer."', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 6,
      tag: 'Onderhandeling: Salarisindicatie',
      scenario: 'Vroeg in het eerste gesprek vraagt de recruiter: "Wat verdien je momenteel bij je huidige werkgever?"',
      question: 'Wat is volgens onderhandelingsexperts (zoals de Harvard Negotiation Project methode) de tactisch sterkste reactie?',
      options: [
        { id: 'ji6_1', text: 'Aangeven dat je focus ligt op de inhoud en verantwoordelijkheden van deze functie, en vragen naar de salarisbandbreedte die zij hanteren.', isCorrect: true, letter: 'A' },
        { id: 'ji6_2', text: 'Direct je exacte huidige brutosalaris noemen inclusief vakantiegeld en reiskostenvergoeding.', isCorrect: false, letter: 'B' },
        { id: 'ji6_3', text: 'Een extreem hoog bedrag noemen van het dubbele om de recruiter direct onder druk te zetten.', isCorrect: false, letter: 'C' },
        { id: 'ji6_4', text: 'Zeggen dat geld voor jou van ondergeschikt belang is en dat je elk openingsaanbod accepteert.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 7,
      tag: 'Arbeidsvoorwaarden: Primaire vs Secundaire',
      scenario: 'Bij de afronding van de onderhandelingen bespreken jullie de arbeidsvoorwaarden.',
      question: 'Wat valt volgens het Nederlandse arbeidsrecht strikt onder de primaire arbeidsvoorwaarden?',
      options: [
        { id: 'ji7_1', text: 'Het overeengekomen brutoloon en de contractuele arbeidsduur (aantal uren per week).', isCorrect: true, letter: 'A' },
        { id: 'ji7_2', text: 'De leaseauto, mobiele telefoon en de pensioenregeling.', isCorrect: false, letter: 'B' },
        { id: 'ji7_3', text: 'De thuiswerkvergoeding en de collectieve aanvullende zorgverzekering.', isCorrect: false, letter: 'C' },
        { id: 'ji7_4', text: 'Het aantal bovenwettelijke vakantiedagen en het persoonlijk opleidingsbudget.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 8,
      tag: 'Gespreksafsluiting: Wedervragen',
      scenario: 'Aan het einde van het gesprek vraagt de selectiecommissie: "Heb jij tot slot nog vragen voor ons?"',
      question: 'Welke vraag toont de hoogste mate van strategisch inzicht en oprechte interesse in het succes van de rol?',
      options: [
        { id: 'ji8_1', text: '"Hoe definieert het team succes voor deze functie binnen de eerste zes maanden, en wat is momenteel jullie grootste uitdaging?"', isCorrect: true, letter: 'A' },
        { id: 'ji8_2', text: '"Krijgen werknemers aan het eind van het jaar een uitgebreid kerstpakket en hoe streng controleren jullie ziekteverzuim?"', isCorrect: false, letter: 'B' },
        { id: 'ji8_3', text: '"Nee, alles is duidelijk verteld, ik heb eigenlijk geen enkele vraag meer voor jullie."', isCorrect: false, letter: 'C' },
        { id: 'ji8_4', text: '"Hoeveel pauzes mag ik op een werkdag nemen om koffie te halen of even naar buiten te gaan?"', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  job_raise: [
    {
      step: 1,
      tag: 'Belastingstelsel: Marginale druk',
      scenario: 'Je ontvangt een loonsverhoging van € 250,- bruto per maand. Op je bankrekening blijkt het nettobedrag lager uit te vallen dan je verwachtte op basis van het vlaktarief in box 1.',
      question: 'Wat is de fiscale oorzaak van deze hogere marginale belastingdruk in Nederland?',
      options: [
        { id: 'jr1', text: 'Door het hogere inkomen bouwen de algemene heffingskorting en de arbeidskorting geleidelijk af, waardoor je marginaal meer belasting betaalt.', isCorrect: true, letter: 'A' },
        { id: 'jr2', text: 'De werkgever mag bij salarisverhogingen een eenmalige administratieve inhouding van 40% verrichten.', isCorrect: false, letter: 'B' },
        { id: 'jr3', text: 'De Belastingdienst heft bij elke salarisstap een verplichte extra vermogensbelasting in box 3.', isCorrect: false, letter: 'C' },
        { id: 'jr4', text: 'Het pensioenfonds berekent bij een loonsprong alle voorgaande opbouwjaren opnieuw met terugwerkende kracht.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Beoordeling: KPI-onderbouwing',
      scenario: 'Je hebt een functioneringsgesprek en wilt een structurele salarisverhoging bepleiten bij je manager.',
      question: 'Welk argument heeft in zo\'n gesprek de sterkste professionele overtuigingskracht?',
      options: [
        { id: 'jr2_1', text: 'Aantoonbare resultaten overleggen: overtroffen KPI\'s, succesvolle projecten, procesverbeteringen en relevante markconforme salarisbenchmarks.', isCorrect: true, letter: 'A' },
        { id: 'jr2_2', text: 'Uitleggen dat je persoonlijke vaste lasten, boodschappen en energiekosten dit jaar flink zijn gestegen.', isCorrect: false, letter: 'B' },
        { id: 'jr2_3', text: 'Benoemen dat een directe collega minder uren draait maar toch evenveel verdient als jij.', isCorrect: false, letter: 'C' },
        { id: 'jr2_4', text: 'Dreigen dat je direct stopt met overwerken als er vandaag geen toezegging wordt gedaan.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'CAO-termen: Periodiek vs Initieel',
      scenario: 'In je CAO lees je over verschillende vormen van loonontwikkeling in salarisschalen.',
      question: 'Wat is het fundamentele verschil tussen een "periodiek" en een "initiële verhoging"?',
      options: [
        { id: 'jr3_1', text: 'Een periodiek is een individuele stap binnen een salarisschaal (vaak jaarlijks bij goed functioneren); een initiële verhoging is een algemene loonstijging voor alle schalen wegens CAO-afspraken.', isCorrect: true, letter: 'A' },
        { id: 'jr3_2', text: 'Een periodiek geldt alleen voor stagiairs; een initiële verhoging is uitsluitend bestemd voor directieleden.', isCorrect: false, letter: 'B' },
        { id: 'jr3_3', text: 'Een periodiek is een eenmalige bonus; een initiële verhoging is een structureel aandeel in de winst.', isCorrect: false, letter: 'C' },
        { id: 'jr3_4', text: 'Er is geen enkel verschil; beide begrippen zijn synoniem in het arbeidsrecht.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Werkkostenregeling (WKR)',
      scenario: 'De werkgever wil je belonen zonder dat er direct zware inkomstenbelasting over wordt geheven.',
      question: 'Wat kan de werkgever via de vrije ruimte van de Werkkostenregeling (WKR) belastingvrij vergoeden of verstrekken?',
      options: [
        { id: 'jr4_1', text: 'Onbelaste vergoedingen zoals een sportabonnement, ergonomische thuiswerkapparatuur of een kerstpakket.', isCorrect: true, letter: 'A' },
        { id: 'jr4_2', text: 'Het reguliere basissalaris en het wettelijk vakantiegeld.', isCorrect: false, letter: 'B' },
        { id: 'jr4_3', text: 'Wettelijke transitievergoedingen bij het beëindigen van een contract.', isCorrect: false, letter: 'C' },
        { id: 'jr4_4', text: 'De verplichte werkgeversbijdrage aan de Zorgverzekeringswet (Zvw).', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 5,
      tag: 'Pensioenopbouw: De Franchise',
      scenario: 'Op je pensioenoverzicht zie je dat je pensioenpremie wordt berekend over de "pensioengrondslag" na aftrek van de AOW-franchise.',
      question: 'Wat houdt deze AOW-franchise precies in?',
      options: [
        { id: 'jr5_1', text: 'Het deel van je brutosalaris waarover je geen pensioen opbouwt, omdat je later al een AOW-uitkering van de overheid ontvangt.', isCorrect: true, letter: 'A' },
        { id: 'jr5_2', text: 'Het maximale pensioenbedrag dat je na pensionering per kalenderjaar mag ontvangen.', isCorrect: false, letter: 'B' },
        { id: 'jr5_3', text: 'Een boeteclausule als je besluit vóór de officiële AOW-leeftijd met vroegpensioen te gaan.', isCorrect: false, letter: 'C' },
        { id: 'jr5_4', text: 'Het percentage dat de werkgever jaarlijks inhoudt voor de collectieve arbeidsongeschiktheidsverzekering.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 6,
      tag: 'Koopkracht: Nominaal vs Reëel',
      scenario: 'Je ontvangt een salarisverhoging van 4%. In datzelfde jaar stijgt het algemene prijspeil van goederen en diensten (inflatie/CPI) met 6%.',
      question: 'Wat gebeurt er in dit kalenderjaar met jouw reële koopkracht?',
      options: [
        { id: 'jr6_1', text: 'Je reële koopkracht daalt met circa 2%, ondanks dat je nominale brutosalaris is gestegen.', isCorrect: true, letter: 'A' },
        { id: 'jr6_2', text: 'Je reële koopkracht stijgt met 4% omdat je maandelijks meer euro\'s op je bankrekening ontvangt.', isCorrect: false, letter: 'B' },
        { id: 'jr6_3', text: 'Je koopkracht blijft exact gelijk door automatische wettelijke prijscompensatie.', isCorrect: false, letter: 'C' },
        { id: 'jr6_4', text: 'Je koopkracht daalt met precies 10% wegens het dubbele effect van belastingen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 7,
      tag: 'Vakantiebijslag (WML)',
      scenario: 'Iedere werknemer in Nederland bouwt wettelijk vakantiegeld op over zijn of haar brutoloon.',
      question: 'Wat is het wettelijk minimumpercentage aan vakantiebijslag en over welke periode wordt dit doorgaans opgebouwd?',
      options: [
        { id: 'jr7_1', text: 'Minimaal 8% van het bruto jaarloon, opgebouwd over de periode van 1 juni tot en met 31 mei (Wet minimumloon).', isCorrect: true, letter: 'A' },
        { id: 'jr7_2', text: 'Minimaal 5% van het nettovakantieloon, opgebouwd over het lopende kalenderjaar.', isCorrect: false, letter: 'B' },
        { id: 'jr7_3', text: 'Precies één vast bruto maandsalaris ongeacht het aantal gewerkte uren in het jaar.', isCorrect: false, letter: 'C' },
        { id: 'jr7_4', text: '10% van het jaarsalaris, verplicht uitbetaald in twee gelijke termijnen in december en mei.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 8,
      tag: 'Onderhandeling: Schriftelijke Bevestiging',
      scenario: 'Tijdens het voortgangsgesprek zegt je leidinggevende mondeling toe: "Vanaf komend kwartaal zetten we je over naar schaal 7 met een verhoging van 7%."',
      question: 'Wat is de professioneel en juridisch verstandigste vervolgstap?',
      options: [
        { id: 'jr8_1', text: 'Binnen 24 uur een beknopte, vriendelijke e-mail sturen met een gespreksbevestiging van de afgesproken schaal, percentage en ingangsdatum, en vragen om een aanhangsel op je contract.', isCorrect: true, letter: 'A' },
        { id: 'jr8_2', text: 'Niets doen; een mondelinge belofte van een manager heeft in de praktijk dezelfde rechtszekerheid als een getekend contract.', isCorrect: false, letter: 'B' },
        { id: 'jr8_3', text: 'Het nieuws direct vieren met een publieke post op LinkedIn over je nieuwe salarisschaal.', isCorrect: false, letter: 'C' },
        { id: 'jr8_4', text: 'Alvast een nieuwe lening afsluiten op basis van de mondelinge belofte van je leidinggevende.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  date: [
    {
      step: 1,
      tag: 'Empathie: Actief Luisteren',
      scenario: 'Je date vertelt openhartig: "Ik vond de afgelopen maanden op mijn werk mentaal erg zwaar omdat mijn leidinggevende me voortdurend bekritiseerde, waardoor ik erg onzeker werd."',
      question: 'Wat is de meest empathische en emotioneel intelligente reactie?',
      options: [
        { id: 'dt1', text: '"Dat klinkt als een heel uitputtende periode. Het lijkt me naar als je inzet niet gezien wordt; hoe ga je daar op dit moment mee om?"', isCorrect: true, letter: 'A' },
        { id: 'dt2', text: '"Dan moet je gewoon direct ontslag nemen. Dat had ik tenminste meteen gedaan."', isCorrect: false, letter: 'B' },
        { id: 'dt3', text: '"Ach, iedereen heeft wel eens stress op het werk; mijn baan was pas echt een ramp vorig jaar, moet je horen..."', isCorrect: false, letter: 'C' },
        { id: 'dt4', text: 'Snel het gesprek verplaatsen naar je eigen favoriete hobby om de sfeer direct luchtig te houden.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Gespreksdynamiek: De 50-50 Balans',
      scenario: 'Je wilt tijdens een eerste ontmoeting een fijne, wederzijdse klik opbouwen.',
      question: 'Welk patroon voorspelt volgens sociaal-psychologisch onderzoek de grootste kans op een succesvolle eerste date?',
      options: [
        { id: 'dt2_1', text: 'Een gebalanceerde dialoog (circa 50-50 spreektijd) met oprechte, open vragen over passies, waarden en ervaringen.', isCorrect: true, letter: 'A' },
        { id: 'dt2_2', text: 'Zelf 85% van de tijd praten om de ander te imponeren met boeiende verhalen over je successen.', isCorrect: false, letter: 'B' },
        { id: 'dt2_3', text: 'Zo min mogelijk praten en alleen antwoorden met korte zinnen om geheimzinnig en mysterieus over te komen.', isCorrect: false, letter: 'C' },
        { id: 'dt2_4', text: 'Direct in het eerste kwartier al je vroegere relaties en relatiebreuken in detail bespreken.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Grenzen Respecteren: Consent',
      scenario: 'Na een gezellig etentje stel je voor om nog een drankje te drinken in een café. Je date aarzelt zichtbaar en zegt: "Het was heel gezellig, maar ik moet morgen vroeg op en ben best moe."',
      question: 'Wat is de respectvolle en sociaal vaardige reactie?',
      options: [
        { id: 'dt3_1', text: '"Helemaal begrijpelijk! Ik vond het een erg leuke avond. Zal ik meelopen naar je fiets of tram, dan plannen we binnenkort weer iets?"', isCorrect: true, letter: 'A' },
        { id: 'dt3_2', text: '"Kom op, eentje kan toch nog wel? Doe niet zo ongezellig, het is nog vroeg!"', isCorrect: false, letter: 'B' },
        { id: 'dt3_3', text: 'Geïrriteerd de rekening betalen en zonder gedag te zeggen weglopen.', isCorrect: false, letter: 'C' },
        { id: 'dt3_4', text: 'Vragen waarom de ander een spelletje met je speelt om interessant te doen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Non-verbale Signalering',
      scenario: 'Terwijl je praat over een bepaald onderwerp, merk je dat je date wegkijkt, achterover leunt en de armen strak over elkaar kruist.',
      question: 'Welk communicatief inzicht pas je toe om de verbinding te herstellen?',
      options: [
        { id: 'dt4_1', text: 'Even rustig pauzeren, ruimte geven en de ander bij het gesprek betrekken met een open vraag over zijn of haar perspectief.', isCorrect: true, letter: 'A' },
        { id: 'dt4_2', text: 'Nog luider en sneller praten zodat je de aandacht weer krachtig naar je toe trekt.', isCorrect: false, letter: 'B' },
        { id: 'dt4_3', text: 'Concluderen dat de date mislukt is en direct je eigen telefoon pakken om op social media te scrollen.', isCorrect: false, letter: 'C' },
        { id: 'dt4_4', text: 'Boos opmerken dat de ander er ongeïnteresseerd bij zit en uitleg eisen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 5,
      tag: 'Sociale Etiquette: Restaurantgedrag',
      scenario: 'Jullie zitten samen in een druk restaurant voor een eerste ontmoeting.',
      question: 'Wat beschouwen relatiepsychologen als een van de meest betrouwbare waarschuwingssignalen ("rode vlaggen")?',
      options: [
        { id: 'dt5_1', text: 'Als iemand neerbuigend, ongeduldig of bot communiceert richting het bedienend personeel.', isCorrect: true, letter: 'A' },
        { id: 'dt5_2', text: 'Als iemand per ongeluk een servet of vork van tafel laat vallen.', isCorrect: false, letter: 'B' },
        { id: 'dt5_3', text: 'Als iemand liever bruisend mineraalwater bestelt in plaats van een alcoholisch drankje.', isCorrect: false, letter: 'C' },
        { id: 'dt5_4', text: 'Als iemand voorstelt om de rekening eerlijk 50-50 te verdelen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 6,
      tag: 'Digitale Etiquette: Smartphonegebruik',
      scenario: 'Je telefoon trilt tijdens het gesprek in je broekzak met een melding van een groepsapp en een push-bericht.',
      question: 'Wat is de etiquette om respect en oprechte aandacht te tonen tijdens een date?',
      options: [
        { id: 'dt6_1', text: 'Je telefoon in je zak of tas laten zitten op stil; de fysieke ontmoeting en aandacht voor de ander gaan altijd voor op schermen.', isCorrect: true, letter: 'A' },
        { id: 'dt6_2', text: 'Je telefoon direct op tafel leggen en het bericht direct lezen terwijl je date aan het woord is.', isCorrect: false, letter: 'B' },
        { id: 'dt6_3', text: 'Ongevraagd een foto of selfie maken van je date om meteen te delen op je Instagram Story.', isCorrect: false, letter: 'C' },
        { id: 'dt6_4', text: 'Draadloze oordopjes indoen zodat je binnenkomende spraakberichten onopvallend kunt afluisteren.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 7,
      tag: 'Verdieping: De 36 Vragen van Aron',
      scenario: 'Je wilt het gesprek naar een diepere, betekenisvolle laag brengen zonder overdreven formeel te worden.',
      question: 'Welke vraag stimuleert volgens het bekende psychologische onderzoek van Arthur Aron echte verbinding en kwetsbaarheid?',
      options: [
        { id: 'dt7_1', text: '"Als een kristallen bol je de waarheid kon vertellen over jezelf, je leven of de toekomst, wat zou je dan het liefst willen ontdekken?"', isCorrect: true, letter: 'A' },
        { id: 'dt7_2', text: '"Hoeveel geld staat er momenteel op je spaarrekening en wat is je huurprijs?"', isCorrect: false, letter: 'B' },
        { id: 'dt7_3', text: '"Welk type automerk vind jij het meest statusverhogend op de snelweg?"', isCorrect: false, letter: 'C' },
        { id: 'dt7_4', text: '"Wat is jouw mening over de wijzigingen in de vennootschapsbelasting voor het mkb?"', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 8,
      tag: 'Follow-up na de Ontmoeting',
      scenario: 'De date is ten einde en jullie zijn beiden veilig thuis aangekomen. Je hebt het erg leuk gehad.',
      question: 'Wat is volgens hedendaagse datingexperts de meest gezonde en volwassen manier van communiceren?',
      options: [
        { id: 'dt8_1', text: 'Dezelfde avond of de volgende ochtend een oprecht, warm bericht sturen waarin je bedankt voor de avond en aangeeft dat je het gezellig vond.', isCorrect: true, letter: 'A' },
        { id: 'dt8_2', text: 'Verplicht drie volle dagen wachten met reageren ("de 3-dagenregel") om vooral niet te gretig over te komen.', isCorrect: false, letter: 'B' },
        { id: 'dt8_3', text: 'Binnen tien minuten 15 opeenvolgende appjes sturen en direct bellen waarom er nog niet geantwoord is.', isCorrect: false, letter: 'C' },
        { id: 'dt8_4', text: 'De ander tijdelijk ontvolgen op sociale media om te testen of ze de afwezigheid opmerken.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  trouwen: [
    {
      step: 1,
      tag: 'Huwelijksvermogensrecht: Boedelscheiding',
      scenario: 'Sinds 1 januari 2018 geldt in Nederland automatisch de wettelijke beperkte gemeenschap van goederen bij een huwelijk zonder huwelijkse voorwaarden.',
      question: 'Wat valt volgens artikel 1:94 BW hierdoor NIET meer automatisch in de gezamenlijke huwelijksboedel?',
      options: [
        { id: 'tr1', text: 'Voorhuwelijkse bezittingen, voorhuwelijkse schulden, erfenissen en persoonlijke schenkingen.', isCorrect: true, letter: 'A' },
        { id: 'tr2', text: 'Alle inkomsten en spaargelden die tijdens het huwelijk worden vergaard door beide partners.', isCorrect: false, letter: 'B' },
        { id: 'tr3', text: 'De inboedel en huishoudelijke apparaten die tijdens het huwelijk samen worden aangeschaft.', isCorrect: false, letter: 'C' },
        { id: 'tr4', text: 'De gezamenlijke betaal- en spaarrekening geopend na de trouwdatum.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 2,
      tag: 'Burgerlijk Huwelijk: Getuigenvereiste',
      scenario: 'Jullie plannen de huwelijksvoltrekking bij de ambtenaar van de burgerlijke stand in het gemeentehuis.',
      question: 'Hoeveel meerderjarige getuigen moeten er volgens artikel 1:63 van het Burgerlijk Wetboek minimaal en maximaal aanwezig zijn?',
      options: [
        { id: 'tr2_1', text: 'Minimaal 2 en maximaal 4 meerderjarige getuigen.', isCorrect: true, letter: 'A' },
        { id: 'tr2_2', text: 'Minimaal 1 getuige; er geldt wettelijk geen maximum aantal getuigen.', isCorrect: false, letter: 'B' },
        { id: 'tr2_3', text: 'Altijd exact 4 getuigen, waarvan twee verplicht bloedverwanten in de eerste graad.', isCorrect: false, letter: 'C' },
        { id: 'tr2_4', text: 'Getuigen zijn in Nederland sinds 2021 digitaal optioneel geworden via DigiD.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Ondertrouw: Melding Voorgenomen Huwelijk',
      scenario: 'Vóór de officiële ceremonie moet het voorgenomen huwelijk formeel gemeld worden bij de burgerlijke stand.',
      question: 'Wat is de wettelijke termijn voor deze melding voorgenomen huwelijk?',
      options: [
        { id: 'tr3_1', text: 'Minimaal 14 dagen en maximaal 1 jaar vóór de geplande huwelijksdatum.', isCorrect: true, letter: 'A' },
        { id: 'tr3_2', text: 'Minimaal 6 maanden van tevoren per notariële akte aangemeld.', isCorrect: false, letter: 'B' },
        { id: 'tr3_3', text: 'Uiterlijk 48 uur vóór de ceremonie bij de receptie van de gemeente.', isCorrect: false, letter: 'C' },
        { id: 'tr3_4', text: 'Precies 30 kalenderdagen, geen dag eerder en geen dag later.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Relatiepsychologie: De Vier Ruiters van Gottman',
      scenario: 'Dr. John Gottman onderzocht decennialang de communicatiepatronen van getrouwde stellen en identificeerde vier destructieve gedragingen ("De Vier Ruiters").',
      question: 'Welke van de vier ruiters bleek in het onderzoek de krachtigste voorspeller van een echtscheiding te zijn?',
      options: [
        { id: 'tr4_1', text: 'Minachting (cynisme, sarcasme, oogrollen en morele superioriteit).', isCorrect: true, letter: 'A' },
        { id: 'tr4_2', text: 'Kritiek (klagen over specifiek gedrag van de partner).', isCorrect: false, letter: 'B' },
        { id: 'tr4_3', text: 'Verdediging (defensief reageren bij een opmerking).', isCorrect: false, letter: 'C' },
        { id: 'tr4_4', text: 'Stilte of terugtrekking (stonewalling bij overprikkeling).', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 5,
      tag: 'Conflicthantering: De 5:1 Regel',
      scenario: 'Zelfs in de meest gelukkige huwelijken ontstaan er meningsverschillen en discussies.',
      question: 'Welke verhouding tussen positieve en negatieve interacties tijdens conflicten is volgens longitudinaal onderzoek nodig voor een stabiele relatie?',
      options: [
        { id: 'tr5_1', text: 'Minimaal 5 positieve interacties (luisteren, grapje, aanraking, begrip) tegenover elke 1 negatieve uiting.', isCorrect: true, letter: 'A' },
        { id: 'tr5_2', text: 'Precies 1 positieve tegenover 1 negatieve interactie (een evenredige 50-50 balans).', isCorrect: false, letter: 'B' },
        { id: 'tr5_3', text: '100% positieve interacties; elke vorm van onenigheid duidt op een incompatibele relatie.', isCorrect: false, letter: 'C' },
        { id: 'tr5_4', text: '2 negatieve uitingen tegenover 1 positieve om de partner scherp en gemotiveerd te houden.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 6,
      tag: 'Huwelijkse Voorwaarden: Periodiek Verrekenbeding',
      scenario: 'Een stel laat bij de notaris huwelijkse voorwaarden opstellen met een "Amsterdams periodiek verrekenbeding".',
      question: 'Wat houdt deze notariële bepaling tijdens het huwelijk in?',
      options: [
        { id: 'tr6_1', text: 'Het inkomen dat aan het eind van het jaar overblijft na betaling van de huishoudkosten, moet jaarlijks 50-50 worden verrekend.', isCorrect: true, letter: 'A' },
        { id: 'tr6_2', text: 'Al het gezamenlijke spaargeld moet verplicht worden vastgezet in een gemeenschappelijk beleggingsfonds.', isCorrect: false, letter: 'B' },
        { id: 'tr6_3', text: 'De echtgenoten moeten de woningwaarde elk jaar opnieuw beëdigd laten hertaxeren.', isCorrect: false, letter: 'C' },
        { id: 'tr6_4', text: 'Alle privéschulden van de ene partner worden automatisch overgedragen aan de ander.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 7,
      tag: 'Wet Verevening Pensioenrechten',
      scenario: 'Bij de huwelijkse planning kijken partners ook naar hun oudedagsvoorzieningen en wettelijke regelingen bij een eventuele echtscheiding.',
      question: 'Wat is de standaard wettelijke hoofdregel voor tijdens het huwelijk opgebouwde ouderdomspensioenen bij scheiding?',
      options: [
        { id: 'tr7_1', text: 'De tijdens het huwelijk opgebouwde ouderdomspensioenen worden 50-50 verevend (gedeeld), tenzij in voorwaarden uitgesloten.', isCorrect: true, letter: 'A' },
        { id: 'tr7_2', text: 'Iedere partner behoudt te allen tijde zijn of haar eigen pensioen volledig zonder enige verrekening.', isCorrect: false, letter: 'B' },
        { id: 'tr7_3', text: 'Het pensioen van de meestverdienende partner vervalt automatisch aan het pensioenfonds.', isCorrect: false, letter: 'C' },
        { id: 'tr7_4', text: 'Verevening van pensioen geldt pas als het huwelijk minimaal 25 jaar stand heeft gehouden.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 8,
      tag: 'Levenslang Partnerschap: Gezamenlijke Waarden',
      scenario: 'Onderzoekers volgden echtparen die meer dan 40 jaar gelukkig getrouwd bleven.',
      question: 'Welk relationeel fundament wordt wetenschappelijk gezien als de doorslaggevende factor voor langdurig huwelijksgeluk?',
      options: [
        { id: 'tr8_1', text: 'Gedeelde betekenis en levensdoelen creëren, oprechte dankbaarheid tonen, elkaars dromen steunen en opereren als een loyaal team.', isCorrect: true, letter: 'A' },
        { id: 'tr8_2', text: 'Nooit meningsverschillen of conflicten toelaten en alle lastige onderwerpen consequent vermijden.', isCorrect: false, letter: 'B' },
        { id: 'tr8_3', text: 'Strikt gescheiden financiën combineren met het doorbrengen van vakanties op afzonderlijke bestemmingen.', isCorrect: false, letter: 'C' },
        { id: 'tr8_4', text: 'Alle dagelijkse taken en beslissingen juridisch contractueel vastleggen in een taakverdelingsovereenkomst.', isCorrect: false, letter: 'D' }
      ]
    }
  ]
};

const itemsDataPath = path.join(__dirname, '..', 'public', 'js', 'itemsData.js');
let content = fs.readFileSync(itemsDataPath, 'utf8');

// Update each item in ITEMS_DATA with tasks array
Object.keys(THEMED_TASKS).forEach(itemId => {
  const tasksJson = JSON.stringify(THEMED_TASKS[itemId], null, 4);
  // Indent appropriately
  const indentedTasks = tasksJson.split('\n').map((line, idx) => idx === 0 ? line : '    ' + line).join('\n');
  
  // We can inject tasks: [...] into each item block in ITEMS_DATA
  const regex = new RegExp(`(${itemId}:\\s*\\{[\\s\\S]*?id:\\s*'${itemId}',[\\s\\S]*?)(tag:[^\\n]+,)`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `$1$2\n    tasks: ${indentedTasks},`);
    console.log(`Updated ${itemId} with 8 tasks!`);
  } else {
    console.log(`Regex not matched for ${itemId}, looking for alternative injection...`);
  }
});

fs.writeFileSync(itemsDataPath, content, 'utf8');
console.log('itemsData.js updated successfully!');

