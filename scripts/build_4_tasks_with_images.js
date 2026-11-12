const fs = require('fs');
const path = require('path');

const THEMED_4_TASKS = {
  autosleutels: [
    {
      step: 1,
      tag: 'Voorrang op gelijkwaardige kruising',
      scenario: 'Je nadert in de auto een gelijkwaardige kruising binnen de bebouwde kom. Van rechts nadert een fietser. Van links nadert een tram die rechtdoor wil rijden.',
      question: 'Wat is wettelijk de juiste volgorde van voorrang volgens het RVV?',
      imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @campbell',
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
      imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @markusspiske',
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
      imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @chuttersnap',
      options: [
        { id: 'c1', text: 'Voetganger rechtdoor eerst, daarna de tegemoetkomende auto (korte bocht), daarna jij (lange bocht).', isCorrect: true, letter: 'A' },
        { id: 'c2', text: 'Tegemoetkomende auto eerst, daarna jij, en de voetganger moet altijd wachten op gemotoriseerd verkeer.', isCorrect: false, letter: 'B' },
        { id: 'c3', text: 'Jij mag eerst omdat verkeer dat linksaf slaat voorrang heeft op verkeer dat rechtsaf slaat.', isCorrect: false, letter: 'C' },
        { id: 'c4', text: 'De tegemoetkomende auto eerst, daarna de overstekende voetganger, daarna pas jij.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Aquaplaning en Noodhandeling',
      scenario: 'Je rijdt 100 km/u op de snelweg en rijdt door een diepe plas water. Het stuur voelt opeens vederlicht aan en de auto reageert tijdelijk niet meer op stuurbewegingen (aquaplaning).',
      question: 'Wat is de enige technisch en fysiek juiste reactie om de controle te herwinnen?',
      imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @reza',
      options: [
        { id: 'd1', text: 'Gas rustig loslaten, koppeling intrappen (of bij automaat gas loslaten), stuur recht houden en absoluut niet bruusk remmen.', isCorrect: true, letter: 'A' },
        { id: 'd2', text: 'Direct voluit krachtig op de rem trappen om het ABS-systeem maximaal te activeren.', isCorrect: false, letter: 'B' },
        { id: 'd3', text: 'Meteen extra gas bijgeven om de banden sneller door de waterlaag te laten snijden.', isCorrect: false, letter: 'C' },
        { id: 'd4', text: 'De handrem kort aantrekken en krachtig naar links sturen om grip op het asfalt te forceren.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  huissleutels: [
    {
      step: 1,
      tag: 'Huurrecht: Waarborgsom',
      scenario: 'Je tekent een nieuw huurcontract voor een zelfstandig appartement. De verhuurder vraagt in de offerte een waarborgsom.',
      question: 'Wat is volgens de Wet betaalbare huur het wettelijk maximum voor de waarborgsom die gevraagd mag worden?',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @tierneypead',
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
      imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @homajob',
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
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @danlefebvre',
      options: [
        { id: 'hs3_1', text: 'De verhuurder moet de pomp vervangen; de huurder is verantwoordelijk voor het ontluchten en bijvullen.', isCorrect: true, letter: 'A' },
        { id: 'hs3_2', text: 'De huurder moet zowel de pomp vervangen als het ontluchten en bijvullen zelf bekostigen.', isCorrect: false, letter: 'B' },
        { id: 'hs3_3', text: 'De verhuurder is wettelijk verplicht om alle handelingen inclusief het ontluchten zelf uit te voeren.', isCorrect: false, letter: 'C' },
        { id: 'hs3_4', text: 'De energieleverancier is wettelijk verplicht om de CV-installatie kosteloos te herstellen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Woningveiligheid: Rookmeldersverplichting',
      scenario: 'Sinds juli 2022 gelden er aangescherpte brandveiligheidseisen in het Besluit bouwwerken leefomgeving voor alle woningen in Nederland.',
      question: 'Wat is de wettelijke minimumeis voor rookmelders in een bestaande woning?',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @spacejoy',
      options: [
        { id: 'hs4_1', text: 'Op iedere woonverdieping moet minimaal één werkende rookmelder hangen in de vluchtroute (hal of overloop).', isCorrect: true, letter: 'A' },
        { id: 'hs4_2', text: 'Er hoeft alleen een rookmelder geplaatst te worden in de keuken direct naast het fornuis.', isCorrect: false, letter: 'B' },
        { id: 'hs4_3', text: 'Rookmelders zijn uitsluitend verplicht in slaapkamers van woningen gebouwd na 2020.', isCorrect: false, letter: 'C' },
        { id: 'hs4_4', text: 'Rookmelders zijn alleen verplicht als er een open gasinstallatie aanwezig is in het woongedeelte.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  diploma: [
    {
      step: 1,
      tag: 'Academische Integriteit: APA 7',
      scenario: 'Je parafraseert een theorie van De Jong en Smit (2021) in je eigen woorden in het theoretisch kader van je afstudeerscriptie.',
      question: 'Wat schrijft de APA 7-stijlstandaard voor om wetenschappelijk zuiver te handelen en plagiaat te voorkomen?',
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @aaronburden',
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
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @marclev',
      options: [
        { id: 'dp2_1', text: 'Het instrument heeft een hoge betrouwbaarheid, maar een lage begripsvaliditeit.', isCorrect: true, letter: 'A' },
        { id: 'dp2_2', text: 'Het instrument heeft een hoge inhoudsvaliditeit, maar een zeer lage betrouwbaarheid.', isCorrect: false, letter: 'B' },
        { id: 'dp2_3', text: 'Zowel de validiteit als de betrouwbaarheid zijn uitstekend omdat de uitkomsten stabiel zijn.', isCorrect: false, letter: 'C' },
        { id: 'dp2_4', text: 'Het instrument is per definitie statistisch niet-significant en kan niet gecodeerd worden.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Studievoortgang: ECTS-normering',
      scenario: 'In het Europese hoger onderwijs (Bologna-akkoord) wordt de studielast uitgedrukt in European Credit Transfer System (ECTS) studiepunten.',
      question: 'Hoeveel nominale studiebelastingsuren vertegenwoordigt 1 ECTS-punt in Nederland?',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @priscilladupreez',
      options: [
        { id: 'dp3_1', text: 'Precies 28 studiebelastingsuren (60 ECTS = 1.680 uur per academisch jaar).', isCorrect: true, letter: 'A' },
        { id: 'dp3_2', text: 'Precies 40 studiebelastingsuren (gelijk aan een reguliere werkweek).', isCorrect: false, letter: 'B' },
        { id: 'dp3_3', text: 'Precies 20 contacturen met een docent of practicumleider.', isCorrect: false, letter: 'C' },
        { id: 'dp3_4', text: 'Precies 32 studiebelastingsuren inclusief tentamentijd.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Judicium: Cum Laude vereisten',
      scenario: 'Je rondt je bachelor- of masteropleiding af en hebt hoge cijfers gehaald voor al je vakken.',
      question: 'Welke eiscombinatie is aan de meeste Nederlandse hogescholen en universiteiten gangbaar voor het judicium Cum Laude?',
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @pangs',
      options: [
        { id: 'dp4_1', text: 'Een gewogen gemiddelde van minimaal 8,0 zonder onvoldoendes of herkansingen, én minimaal een 8,0 voor het afstudeerproject.', isCorrect: true, letter: 'A' },
        { id: 'dp4_2', text: 'Een gewogen gemiddelde van minimaal 7,5 voor alle theorievakken ongeacht herkansingen.', isCorrect: false, letter: 'B' },
        { id: 'dp4_3', text: 'Uitsluitend een 9,0 of hoger voor de scriptie; de overige studieresultaten tellen niet mee.', isCorrect: false, letter: 'C' },
        { id: 'dp4_4', text: 'Alle vakken in het eerste studiejaar foutloos met een 10 hebben afgesloten.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  droomreis: [
    {
      step: 1,
      tag: 'Geografie: Grenzen en Verdragen',
      scenario: 'Je stelt een internationale reisroute samen door Europa en wilt weten waar je te maken krijgt met paspoortcontroles.',
      question: 'Welk land maakt wél deel uit van het Schengengebied (vrij personenverkeer), maar is géén lid van de Europese Unie?',
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @earth',
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
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @jezael',
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
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @glenncarstens',
      options: [
        { id: 'dr3_1', text: 'Het paspoort moet bij inreis nog minimaal 6 maanden geldig zijn.', isCorrect: true, letter: 'A' },
        { id: 'dr3_2', text: 'Het paspoort hoeft alleen geldig te zijn tot de dag van geplande terugkeer in Nederland.', isCorrect: false, letter: 'B' },
        { id: 'dr3_3', text: 'Een Nederlandse identiteitskaart (ID-kaart) wordt wereldwijd erkend mits voorzien van biometrische chip.', isCorrect: false, letter: 'C' },
        { id: 'dr3_4', text: 'Het paspoort mag maximaal 3 jaar oud zijn vanaf de officiële uitgiftedatum.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Luchtvaartveiligheid: IATA Accuregels',
      scenario: 'Je pakt je bagage in voor een intercontinentale vlucht en hebt een krachtige powerbank (lithium-ion batterij) voor je telefoon.',
      question: 'Wat zijn volgens de internationale IATA-veiligheidsvoorschriften de regels voor het meenemen van losse powerbanks?',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @austin',
      options: [
        { id: 'dr4_1', text: 'Uitsluitend in de handbagage (maximaal 100 Wh per stuk), nooit in de ruimbagage wegens brandgevaar.', isCorrect: true, letter: 'A' },
        { id: 'dr4_2', text: 'Uitsluitend in de ruimbagage om oververhitting in de passagierscabine te voorkomen.', isCorrect: false, letter: 'B' },
        { id: 'dr4_3', text: 'Losse powerbanks zijn op alle commerciële vluchten wereldwijd ten strengste verboden.', isCorrect: false, letter: 'C' },
        { id: 'dr4_4', text: 'Alleen toegestaan als de batterij voor vertrek aantoonbaar 100% leeg is gemaakt.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  job_interview: [
    {
      step: 1,
      tag: 'Selectiemethodiek: STAR-methode',
      scenario: 'De interviewer vraagt: "Kun je een concreet voorbeeld noemen van een situatie waarin je een ernstig conflict in je projectteam hebt opgelost?"',
      question: 'Waar staat het acroniem STAR in professionele sollicitatiegesprekken voor?',
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @wocintechchat',
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
      imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @huntersrace',
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
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @homajob',
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
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @alexc',
      options: [
        { id: 'ji4_1', text: 'Een open zithouding met ontspannen schouders, lichte buiging naar voren, natuurlijk oogcontact (circa 60-70% van de tijd) en instemmend knikken.', isCorrect: true, letter: 'A' },
        { id: 'ji4_2', text: 'Ononderbroken 100% star oogcontact houden zonder ooit weg te kijken en rechtop met gekruiste armen zitten.', isCorrect: false, letter: 'B' },
        { id: 'ji4_3', text: 'Diep achterover leunen in de stoel met de handen achter het hoofd om nonchalante ontspanning te tonen.', isCorrect: false, letter: 'C' },
        { id: 'ji4_4', text: 'Voortdurend snelle notities maken op je smartphone om te laten zien dat je digitaal vaardig bent.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  job_raise: [
    {
      step: 1,
      tag: 'Belastingstelsel: Marginale druk',
      scenario: 'Je ontvangt een loonsverhoging van € 250,- bruto per maand. Op je bankrekening blijkt het nettobedrag lager uit te vallen dan je verwachtte op basis van het vlaktarief in box 1.',
      question: 'Wat is de fiscale oorzaak van deze hogere marginale belastingdruk in Nederland?',
      imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @belart',
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
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @sean',
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
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @luke',
      options: [
        { id: 'jr3_1', text: 'Een periodiek is een individuele stap binnen een salarisschaal (vaak jaarlijks bij goed functioneren); een initiële verhoging is een algemene loonstijging voor alle schalen wegens CAO-afspraken.', isCorrect: true, letter: 'A' },
        { id: 'jr3_2', text: 'Een periodiek geldt alleen voor stagiairs; een initiële verhoging is uitsluitend bestemd voor directieleden.', isCorrect: false, letter: 'B' },
        { id: 'jr3_3', text: 'Een periodiek is een eenmalige bonus; een initiële verhoging is een structureel aandeel in de winst.', isCorrect: false, letter: 'C' },
        { id: 'jr3_4', text: 'Er is geen enkel verschil; beide begrippen zijn synoniem in het arbeidsrecht.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Koopkracht: Nominaal vs Reëel',
      scenario: 'Je ontvangt een salarisverhoging van 4%. In datzelfde jaar stijgt het algemene prijspeil van goederen en diensten (inflatie/CPI) met 6%.',
      question: 'Wat gebeurt er in dit kalenderjaar met jouw reële koopkracht?',
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @didssph',
      options: [
        { id: 'jr4_1', text: 'Je reële koopkracht daalt met circa 2%, ondanks dat je nominale brutosalaris is gestegen.', isCorrect: true, letter: 'A' },
        { id: 'jr4_2', text: 'Je reële koopkracht stijgt met 4% omdat je maandelijks meer euro\'s op je bankrekening ontvangt.', isCorrect: false, letter: 'B' },
        { id: 'jr4_3', text: 'Je koopkracht blijft exact gelijk door automatische wettelijke prijscompensatie.', isCorrect: false, letter: 'C' },
        { id: 'jr4_4', text: 'Je koopkracht daalt met precies 10% wegens het dubbele effect van belastingen.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  date: [
    {
      step: 1,
      tag: 'Empathie: Actief Luisteren',
      scenario: 'Je date vertelt openhartig: "Ik vond de afgelopen maanden op mijn werk mentaal erg zwaar omdat mijn leidinggevende me voortdurend bekritiseerde, waardoor ik erg onzeker werd."',
      question: 'Wat is de meest empathische en emotioneel intelligente reactie?',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @jaywennington',
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
      imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @brookecagle',
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
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @clem',
      options: [
        { id: 'dt3_1', text: '"Helemaal begrijpelijk! Ik vond het een erg leuke avond. Zal ik meelopen naar je fiets of tram, dan plannen we binnenkort weer iets?"', isCorrect: true, letter: 'A' },
        { id: 'dt3_2', text: '"Kom op, eentje kan toch nog wel? Doe niet zo ongezellig, het is nog vroeg!"', isCorrect: false, letter: 'B' },
        { id: 'dt3_3', text: 'Geïrriteerd de rekening betalen en zonder gedag te zeggen weglopen.', isCorrect: false, letter: 'C' },
        { id: 'dt3_4', text: 'Vragen waarom de ander een spelletje met je speelt om interessant te doen.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Sociale Etiquette: Restaurantgedrag',
      scenario: 'Jullie zitten samen in een druk restaurant voor een eerste ontmoeting.',
      question: 'Wat beschouwen relatiepsychologen als een van de meest betrouwbare waarschuwingssignalen ("rode vlaggen")?',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @stefano',
      options: [
        { id: 'dt4_1', text: 'Als iemand neerbuigend, ongeduldig of bot communiceert richting het bedienend personeel.', isCorrect: true, letter: 'A' },
        { id: 'dt4_2', text: 'Als iemand per ongeluk een servet of vork van tafel laat vallen.', isCorrect: false, letter: 'B' },
        { id: 'dt4_3', text: 'Als iemand liever bruisend mineraalwater bestelt in plaats van een alcoholisch drankje.', isCorrect: false, letter: 'C' },
        { id: 'dt4_4', text: 'Als iemand voorstelt om de rekening eerlijk 50-50 te verdelen.', isCorrect: false, letter: 'D' }
      ]
    }
  ],

  trouwen: [
    {
      step: 1,
      tag: 'Huwelijksvermogensrecht: Boedelscheiding',
      scenario: 'Sinds 1 januari 2018 geldt in Nederland automatisch de wettelijke beperkte gemeenschap van goederen bij een huwelijk zonder huwelijkse voorwaarden.',
      question: 'Wat valt volgens artikel 1:94 BW hierdoor NIET meer automatisch in de gezamenlijke huwelijksboedel?',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @sandy',
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
      imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @scott',
      options: [
        { id: 'tr2_1', text: 'Minimaal 2 en maximaal 4 meerderjarige getuigen.', isCorrect: true, letter: 'A' },
        { id: 'tr2_2', text: 'Minimaal 1 getuige; er geldt wettelijk geen maximum aantal getuigen.', isCorrect: false, letter: 'B' },
        { id: 'tr2_3', text: 'Altijd exact 4 getuigen, waarvan twee verplicht bloedverwanten in de eerste graad.', isCorrect: false, letter: 'C' },
        { id: 'tr2_4', text: 'Getuigen zijn in Nederland sinds 2021 digitaal optioneel geworden via DigiD.', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 3,
      tag: 'Relatiepsychologie: De Vier Ruiters van Gottman',
      scenario: 'Dr. John Gottman onderzocht decennialang de communicatiepatronen van getrouwde stellen en identificeerde vier destructieve gedragingen ("De Vier Ruiters").',
      question: 'Welke van de vier ruiters bleek in het onderzoek de krachtigste voorspeller van een echtscheiding te zijn?',
      imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @leeloo',
      options: [
        { id: 'tr3_1', text: 'Minachting (cynisme, sarcasme, oogrollen en morele superioriteit).', isCorrect: true, letter: 'A' },
        { id: 'tr3_2', text: 'Kritiek (klagen over specifiek gedrag van de partner).', isCorrect: false, letter: 'B' },
        { id: 'tr3_3', text: 'Verdediging (defensief reageren bij een opmerking).', isCorrect: false, letter: 'C' },
        { id: 'tr3_4', text: 'Stilte of terugtrekking (stonewalling bij overprikkeling).', isCorrect: false, letter: 'D' }
      ]
    },
    {
      step: 4,
      tag: 'Conflicthantering: De 5:1 Regel',
      scenario: 'Zelfs in de meest gelukkige huwelijken ontstaan er meningsverschillen en discussies.',
      question: 'Welke verhouding tussen positieve en negatieve interacties tijdens conflicten is volgens longitudinaal onderzoek nodig voor een stabiele relatie?',
      imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=80',
      imageSource: 'Bron: Unsplash / @jonathan',
      options: [
        { id: 'tr4_1', text: 'Minimaal 5 positieve interacties (luisteren, grapje, aanraking, begrip) tegenover elke 1 negatieve uiting.', isCorrect: true, letter: 'A' },
        { id: 'tr4_2', text: 'Precies 1 positieve tegenover 1 negatieve interactie (een evenredige 50-50 balans).', isCorrect: false, letter: 'B' },
        { id: 'tr4_3', text: '100% positieve interacties; elke vorm van onenigheid duidt op een incompatibele relatie.', isCorrect: false, letter: 'C' },
        { id: 'tr4_4', text: '2 negatieve uitingen tegenover 1 positieve om de partner scherp en gemotiveerd te houden.', isCorrect: false, letter: 'D' }
      ]
    }
  ]
};

// 1. Update itemsData.js
const itemsDataPath = path.join(__dirname, '..', 'public', 'js', 'itemsData.js');
let itemsDataContent = fs.readFileSync(itemsDataPath, 'utf8');

Object.keys(THEMED_4_TASKS).forEach(itemId => {
  const tasksJson = JSON.stringify(THEMED_4_TASKS[itemId], null, 4);
  const indentedTasks = tasksJson.split('\n').map((line, idx) => idx === 0 ? line : '    ' + line).join('\n');

  // Replace existing tasks array for itemId
  const itemRegex = new RegExp(`(${itemId}:\\s*\\{[\\s\\S]*?tasks:\\s*\\[)[\\s\\S]*?(\\]\\s*,)`, 'm');
  if (itemRegex.test(itemsDataContent)) {
    itemsDataContent = itemsDataContent.replace(itemRegex, `$1\n${indentedTasks.substring(indentedTasks.indexOf('['))},`);
    console.log(`Updated ${itemId} with 4 tasks + images & sources!`);
  } else {
    console.log(`Could not find tasks regex for ${itemId}`);
  }
});

fs.writeFileSync(itemsDataPath, itemsDataContent, 'utf8');
console.log('itemsData.js written successfully!');

// 2. Update playerApp.js for 4 tasks and displaying image with source attribution
const playerAppPath = path.join(__dirname, '..', 'public', 'js', 'playerApp.js');
let playerContent = fs.readFileSync(playerAppPath, 'utf8');

const startMarker = `  // ==========================================
  // 8 THEMA-TAKEN OM EEN ITEM TE BEHALEN / CLAIMEN`;

const endMarker = `  function renderQuestionModal(item) {
    openItemTaskConfirmationModal(item);
  }`;

const startIndex = playerContent.indexOf(startMarker);
const endIndex = playerContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found in playerApp.js! startIndex:', startIndex, 'endIndex:', endIndex);
  process.exit(1);
}

const replacement = `  // ==========================================
  // 4 THEMA-TAKEN OM EEN ITEM TE BEHALEN / CLAIMEN
  // (OF: Korte video om te skippen -> Doomscroll feed!)
  // ==========================================

  // STAP 1: CONFIRMATIE- & KEUZESCHERM VOOR DE 4 THEMA-TAKEN
  function openItemTaskConfirmationModal(item) {
    if (!item) item = ITEMS_DATA[state.activeItemId];
    if (!item) return;

    state.activeItemId = item.id;
    state.activeModal = 'ITEM_TASK_CONFIRM';

    if (!state.itemTaskSequence || state.itemTaskSequence.itemId !== item.id) {
      state.itemTaskSequence = null;
    }

    modalContent.innerHTML = \`
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-6 text-center space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl shadow-sm">
          <span class="material-symbols-outlined text-3xl">verified</span>
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">Code Goedgekeurd</span>
          <h3 class="font-display text-xl font-black text-stone-900 mt-1">\${item.name}</h3>
          <p class="text-xs text-stone-600 mt-1 leading-snug">
            Code klopt! Om dit item definitief te claimen en je punt te verdienen, moet je <b>4 uitdagende thema-taken</b> voltooien.
          </p>
        </div>

        <div class="space-y-2.5 pt-2">
          <!-- KEUZE 1: 4 TAKEN VOOR ITEM -->
          <button type="button" id="btn-start-item-tasks" class="w-full p-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-emerald-200 group-hover:scale-110 transition">task_alt</span>
              <div>
                <div class="text-sm font-black">Doe 4 Taken voor \${item.name}</div>
                <div class="text-[11px] text-emerald-100 font-normal">Voltooi alle 4 diepgaande thema-situaties achter elkaar om je punt te claimen.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-emerald-200 text-lg">chevron_right</span>
          </button>

          <!-- KEUZE 2: SKIP MET KORTE VIDEO (GEEN VALSTRIK TEKST!) -->
          <button type="button" id="btn-skip-item-tasks-video" class="w-full p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 font-bold shadow-sm active:scale-95 transition flex items-center justify-between gap-3 text-left cursor-pointer group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-amber-600 group-hover:scale-110 transition">play_circle</span>
              <div>
                <div class="text-sm font-black text-amber-900 flex items-center gap-1.5">
                  <span>Korte video kijken om te skippen</span>
                  <span class="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Snel</span>
                </div>
                <div class="text-[11px] text-amber-800 font-normal">Geen zin in taken? Sla over met een korte video.</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-amber-600 text-lg">arrow_forward</span>
          </button>

          <button type="button" onclick="window.playerApp.openItemDetailModal(ITEMS_DATA['\${item.id}'])" class="w-full py-2.5 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1 mt-1">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Terug naar item</span>
          </button>
        </div>
      </div>
    \`;

    document.getElementById('btn-start-item-tasks').addEventListener('click', () => {
      if (window.sounds) window.sounds.playClick();
      startItemTaskSequence(item);
    });

    document.getElementById('btn-skip-item-tasks-video').addEventListener('click', () => {
      skipItemTasksWithVideo(item);
    });

    openModal();
  }

  function skipItemTasksWithVideo(item) {
    if (window.sounds) window.sounds.playError();
    state.itemTaskSequence = null;
    state.previousModalState = {
      type: 'ITEM_DETAIL',
      itemId: item.id
    };
    closeModal();
    showToast('⚠️ Video feed geopend! (Geen item behaald - tijd tikt door!)', 'warning');
    openAppFeed('TikTok', item.id);
  }

  function startItemTaskSequence(item) {
    state.itemTaskSequence = {
      itemId: item.id,
      currentStep: 1,
      totalSteps: 4
    };
    renderCurrentItemTaskStep(item);
  }

  function renderCurrentItemTaskStep(item) {
    if (!state.itemTaskSequence) {
      startItemTaskSequence(item);
      return;
    }

    state.activeModal = 'ITEM_TASK';
    const currentStep = state.itemTaskSequence.currentStep;
    const totalSteps = state.itemTaskSequence.totalSteps || 4;

    const fullItem = ITEMS_DATA[item.id] || item;
    const taskList = (fullItem && fullItem.tasks) || [];
    const currentTask = taskList[currentStep - 1] || {
      tag: fullItem.tag || 'Thema Taak',
      scenario: fullItem.question || 'Lees de situatie nauwkeurig door:',
      question: fullItem.question,
      options: fullItem.options || []
    };

    let selectedOptionCorrect = null;

    // Header HTML met voortgang (1 t/m 4 bolletjes)
    const progressDotsHtml = [1, 2, 3, 4].map(s => \`
      <div class="w-3 h-3 rounded-full transition-all \${
        s < currentStep
          ? 'bg-emerald-600'
          : (s === currentStep ? 'bg-emerald-500 ring-2 ring-emerald-300 scale-125' : 'bg-stone-300')
      }"></div>
    \`).join('');

    // Shuffled opties met A, B, C, D badges
    const letters = ['A', 'B', 'C', 'D'];
    const shuffledOptions = [...(currentTask.options || [])]
      .sort(() => Math.random() - 0.5)
      .map((opt, idx) => ({
        ...opt,
        letter: letters[idx] || String.fromCharCode(65 + idx)
      }));

    modalContent.innerHTML = \`
      <div class="w-full bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 p-5 text-center space-y-3 max-h-[88vh] overflow-y-auto">
        
        <!-- Header met stap & 4 voortgangsbollen -->
        <div class="flex items-center justify-between pb-2.5 border-b border-stone-200 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-emerald-700 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
              \${currentStep}
            </span>
            <div class="text-left">
              <span class="text-xs font-black text-stone-900 block leading-tight">Taak \${currentStep} van \${totalSteps}</span>
              <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">\${currentTask.tag || fullItem.name}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            \${progressDotsHtml}
          </div>
        </div>

        <!-- Afbeelding met bronvermelding in het klein rechtsonder -->
        \${currentTask.imageUrl ? \`
          <div class="w-full h-36 rounded-2xl overflow-hidden relative shadow-sm border border-stone-200 my-1 group">
            <img src="\${currentTask.imageUrl}" alt="\${currentTask.tag || 'Taak afbeelding'}" class="w-full h-full object-cover">
            <div class="absolute bottom-1.5 right-2 bg-black/65 text-white/90 text-[9px] px-2 py-0.5 rounded-md backdrop-blur-xs font-mono font-medium tracking-tight shadow-sm select-none">
              \${currentTask.imageSource || 'Bron: Unsplash'}
            </div>
          </div>
        \` : ''}

        <!-- Optionele sign SVG (als extra bord aanwezig is) -->
        \${currentTask.signSvg ? \`<div class="flex justify-center p-2 bg-stone-50 rounded-2xl border border-stone-200">\${currentTask.signSvg}</div>\` : ''}

        <!-- Situatieschets -->
        \${currentTask.scenario ? \`
          <div class="w-full bg-stone-50 rounded-2xl p-3.5 border border-stone-200/90 text-left space-y-1 shadow-inner">
            <div class="flex items-center gap-1.5 text-[10px] font-black uppercase text-stone-500 tracking-wider">
              <span class="material-symbols-outlined text-xs text-primary">info</span>
              <span>Situatieschets</span>
            </div>
            <p class="text-xs text-stone-800 leading-relaxed font-medium">\${currentTask.scenario}</p>
          </div>
        \` : ''}

        <!-- Vraagstelling -->
        <div class="text-left pt-0.5">
          <h4 class="text-xs font-extrabold text-stone-900 leading-snug">\${currentTask.question}</h4>
        </div>

        <!-- Keuzelijst met A-D opties (Zonder weggeef-antwoorden!) -->
        <div class="flex flex-col gap-2 text-left" id="quiz-options-group">
          \${shuffledOptions.map(opt => \`
            <button type="button" class="task-quiz-btn w-full p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 active:scale-[0.98] transition flex items-center justify-between text-left cursor-pointer group" data-correct="\${opt.isCorrect}">
              <div class="flex items-start gap-2.5 min-w-0 pr-2">
                <span class="w-6 h-6 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 group-hover:bg-primary/20 transition">\${opt.letter}</span>
                <span class="text-xs font-medium text-stone-900 leading-snug">\${opt.text}</span>
              </div>
              <span class="material-symbols-outlined text-[18px] text-stone-300 status-icon shrink-0">radio_button_unchecked</span>
            </button>
          \`).join('')}
        </div>

        <!-- Actieknoppen & Verleiding (ZONDER valstrik!) -->
        <div class="pt-3 space-y-2 border-t border-stone-200/80 mt-2">
          <button type="button" id="btn-submit-task-step" class="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-lg">\${currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}</span>
            <span>\${currentStep === totalSteps ? 'Antwoord Bevestigen & Claim Item' : \`Volgende Taak (\${currentStep + 1}/\${totalSteps})\`}</span>
          </button>
          <button type="button" id="btn-step-skip-video" class="w-full py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm">
            <span class="material-symbols-outlined text-base text-amber-700">play_circle</span>
            <span>Te saai? Kijk video om te skippen</span>
          </button>
          <button type="button" id="btn-step-cancel" class="w-full py-2 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Annuleren en terug naar item</span>
          </button>
        </div>

      </div>
    \`;

    // Event handlers voor keuze-opties
    const optionBtns = modalContent.querySelectorAll('.task-quiz-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.sounds) window.sounds.playClick();
        optionBtns.forEach(b => {
          b.classList.remove('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30');
          const icon = b.querySelector('.status-icon');
          if (icon) {
            icon.textContent = 'radio_button_unchecked';
            icon.classList.remove('text-emerald-700');
            icon.classList.add('text-stone-300');
          }
        });

        btn.classList.add('border-emerald-600', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/30');
        const activeIcon = btn.querySelector('.status-icon');
        if (activeIcon) {
          activeIcon.textContent = 'check_circle';
          activeIcon.classList.remove('text-stone-300');
          activeIcon.classList.add('text-emerald-700');
        }

        selectedOptionCorrect = btn.getAttribute('data-correct') === 'true';
      });
    });

    // Bevestig knop
    document.getElementById('btn-submit-task-step').addEventListener('click', () => {
      if (selectedOptionCorrect === null) {
        showToast('Kies eerst een antwoord!');
        return;
      }

      if (selectedOptionCorrect === true) {
        if (currentStep < totalSteps) {
          if (window.sounds) window.sounds.playSuccess();
          showToast(\`Taak \${currentStep} goed! Nog \${totalSteps - currentStep} te gaan.\`, 'success');
          state.itemTaskSequence.currentStep++;
          renderCurrentItemTaskStep(item);
        } else {
          // Alle 4 taken succesvol afgerond!
          state.itemTaskSequence = null;
          submitTaskAnswer(item, true);
        }
      } else {
        // FOUT ANTWOORD -> Cooldown straftijd!
        if (window.sounds) window.sounds.playError();
        showToast('Helaas, fout antwoord! Je krijgt 45s straftijd.', 'error');
        state.itemTaskSequence = null;
        submitTaskAnswer(item, false);
      }
    });

    document.getElementById('btn-step-skip-video').onclick = () => skipItemTasksWithVideo(item);
    document.getElementById('btn-step-cancel').onclick = () => {
      state.itemTaskSequence = null;
      openItemDetailModal(fullItem);
    };
  }

  function renderQuestionModal(item) {
    openItemTaskConfirmationModal(item);
  }`;

playerContent = playerContent.substring(0, startIndex) + replacement + playerContent.substring(endIndex + endMarker.length);
fs.writeFileSync(playerAppPath, playerContent, 'utf8');
console.log('playerApp.js written successfully!');

