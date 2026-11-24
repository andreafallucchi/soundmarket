/* ============================================================
   SOUNDMARKET — CATALOGO E IMMAGINI REALI
   Foto autentiche risolte dalla voce enciclopedica di ogni modello
   (Wikipedia/Wikimedia REST, nessuna API key, CORS aperto).
   Cache persistente · fallback tipografico, nessun disegno finto.
   API invariata: ITEMS, imagesFor, art, audioProfile, priceHistory…
   ============================================================ */
'use strict';

const SMData = (() => {

  const CATEGORIES = ['Chitarre Elettriche','Chitarre Acustiche','Bassi','Tastiere','Batterie','Vinili','CD','Pedali Effetto','Amplificatori','Microfoni','Archi'];

  const GRADING = [
    { id:'Mint', desc:'Perfetto, nessun segno di utilizzo. Pari al nuovo, completo di imballo originale.' },
    { id:'Near Mint', desc:'Condizioni eccellenti, micro-segni non percepibili durante l\u2019uso normale.' },
    { id:'Eccellente', desc:'Usura minima, pienamente funzionale in ogni componente. Setup recente.' },
    { id:'Molto Buono', desc:'Segni cosmetici leggeri, nessuna compromissione funzionale o strutturale.' },
    { id:'Buono', desc:'Usura visibile coerente con l\u2019età, funzionalità integra e verificata.' },
    { id:'Discreto', desc:'Difetti estetici marcati dichiarati in descrizione. Strumento suonabile.' }
  ];

  const SIZES = [
    { id:'P', label:'Piccolo', desc:'Fino a 2 kg — pedali, CD, microfoni, accessori', cost:4.90 },
    { id:'M', label:'Medio', desc:'Fino a 8 kg — vinili multipli, tastiere compatte, rullanti', cost:8.90 },
    { id:'G', label:'Grande', desc:'Oltre 8 kg — chitarre, amplificatori, batterie complete', cost:16.90 }
  ];

  const COURIERS = [
    { id:'brt', name:'BRT Corriere Espresso', eta:'2–3 giorni lavorativi', insured:true },
    { id:'dhl', name:'DHL Express', eta:'1–2 giorni lavorativi', insured:true },
    { id:'poste', name:'Poste Italiane Pacco Celere', eta:'3–5 giorni lavorativi', insured:true }
  ];

  const protectionFee = (p) => SMU.round2(Math.max(0.90, p * 0.045 + 0.90));
  const shipCost = (s) => (SIZES.find(x => x.id === s) || SIZES[1]).cost;

  /* ---------- venditori: nessuna foto esterna, solo iniziali ---------- */
  const SELLERS = {
    marco:{ name:'Marco_R', city:'Milano', rating:4.9, sales:132, response:'1 h', verified:true, joined:'2021', reviews:[
      { author:'Luca B.', rating:5, text:'Strumento identico alla descrizione, imballo professionale con doppio cartone. Spedizione BRT in 2 giorni.', date:'12 set 2024' },
      { author:'Giulia T.', rating:5, text:'Comunicazione impeccabile, ha inviato foto aggiuntive del manico prima dell\u2019acquisto. Setup perfetto all\u2019arrivo.', date:'3 ago 2024' }]},
    giulia:{ name:'Giulia_V', city:'Torino', rating:4.8, sales:87, response:'2 h', verified:true, joined:'2022', reviews:[
      { author:'Andrea M.', rating:5, text:'Venditrice seria e preparata. La chitarra era esattamente come nelle foto, corde nuove montate prima della spedizione.', date:'1 ott 2024' },
      { author:'Davide R.', rating:4, text:'Tutto ok, piccolo ritardo nella risposta ma spedizione puntuale e imballo curato.', date:'19 lug 2024' }]},
    vinile:{ name:'VinileLover', city:'Bologna', rating:5.0, sales:214, response:'1 h', verified:true, joined:'2020', reviews:[
      { author:'Sara P.', rating:5, text:'Grading Goldmine rispettato alla lettera. Vinile pulito, copertina protetta con sleeve esterna. Un professionista.', date:'2 nov 2024' },
      { author:'Matteo C.', rating:5, text:'Ho comprato 4 dischi, tutti perfetti. Imballo antiurto specifico per vinili. Tornerò sicuramente.', date:'28 set 2024' }]},
    guitar:{ name:'GuitarHero88', city:'Roma', rating:4.7, sales:65, response:'3 h', verified:true, joined:'2023', reviews:[
      { author:'Federico L.', rating:5, text:'Pedale funzionante al 100%, scatola originale inclusa. Ottimo rapporto qualità-prezzo.', date:'22 ago 2024' },
      { author:'Chiara D.', rating:4, text:'Prodotto conforme, spedizione nella media. Venditore disponibile per chiarimenti.', date:'14 giu 2024' }]},
    piano:{ name:'PianoPlayer', city:'Padova', rating:4.9, sales:41, response:'2 h', verified:true, joined:'2022', reviews:[
      { author:'Elena V.', rating:5, text:'Tastiera arrivata perfettamente imballata, tutti i tasti funzionanti. Incluso il pedale sustain originale.', date:'15 ott 2024' }]},
    bass:{ name:'BassMan_Funk', city:'Firenze', rating:4.8, sales:98, response:'2 h', verified:true, joined:'2021', reviews:[
      { author:'Simone G.', rating:5, text:'Il basso suona da dio. Elettronica attiva perfetta, action regolata a dovere. Spedizione DHL rapidissima.', date:'5 set 2024' },
      { author:'Valentina S.', rating:5, text:'Descrizione accuratissima, nessun difetto nascosto. Venditore top.', date:'30 lug 2024' }]},
    drum:{ name:'DrummerBoy', city:'Verona', rating:4.6, sales:53, response:'4 h', verified:true, joined:'2023', reviews:[
      { author:'Alessandro F.', rating:5, text:'Batteria completa come descritto, pelli nuove. Smontaggio e imballo professionali.', date:'11 ago 2024' }]},
    synth:{ name:'SynthWave', city:'Milano', rating:4.9, sales:76, response:'1 h', verified:true, joined:'2021', reviews:[
      { author:'Nicola B.', rating:5, text:'Sintetizzatore perfetto, tutte le voci funzionanti. Ha inviato un video dimostrativo prima della vendita.', date:'20 ott 2024' },
      { author:'Martina R.', rating:5, text:'Imballo a prova di bomba, alimentatore originale incluso. Esperienza eccellente.', date:'14 set 2024' }]},
    studio:{ name:'StudioPro', city:'Bergamo', rating:5.0, sales:167, response:'2 h', verified:true, joined:'2020', reviews:[
      { author:'Roberto M.', rating:5, text:'Microfono da studio immacolato, sospensione elastica originale. Professionalità assoluta.', date:'8 nov 2024' },
      { author:'Laura T.', rating:5, text:'Attrezzatura testata e certificata. Il migliore venditore su SoundMarket.', date:'2 ott 2024' }]},
    folk:{ name:'FolkSinger', city:'Napoli', rating:4.7, sales:38, response:'5 h', verified:true, joined:'2023', reviews:[
      { author:'Antonio C.', rating:5, text:'Acustica bellissima, suono caldo. Corde nuove e custodia inclusa come promesso.', date:'19 set 2024' }]}
  };

  /* ---------- catalogo: sku, cat, titolo, brand, anno, grade, prezzo, size, seller, wiki, desc, specs, condition ---------- */
  const RAW = [
['STR-001','Chitarre Elettriche','Fender Player Stratocaster MIM 2019 Sunburst','Fender',2019,'Eccellente',649.00,'G','marco','Fender Stratocaster','Player Series Messico, corpo ontano, manico acero Modern C, tre pickup Player Alnico 5. Setup professionale marzo 2024 con corde D\u2019Addario 10-46. Tremolo a 2 punti, elettronica silenziosa. Custodia imbottita Fender inclusa.',{'Serie':'Player (MIM)','Corpo':'Ontano','Manico':'Acero Modern C','Tastiera':'Pau Ferro','Pickup':'3x Player Alnico 5','Scala':'25,5" (648 mm)','Tasti':'22 Medium Jumbo','Ponte':'Tremolo 2 punti','Made in':'Messico'},{estetica:88,meccanica:96,elettronica:98,difetti:'Micro-graffio sul retro del corpo, visibile solo in controluce'}],
['STR-002','Chitarre Elettriche','Gibson Les Paul Standard 60s Bourbon Burst','Gibson',2020,'Near Mint',2190.00,'G','guitar','Gibson Les Paul','Standard 60s con top acero fiammato AAA, coppia Burstbucker 61R/61T, manico Slim Taper. Hardware nickel, meccaniche Grover Rotomatic. Custodia rigida Gibson e certificato di autenticità. Usata solo in studio.',{'Serie':'Standard 60s','Corpo':'Mogano','Top':'Acero fiammato AAA','Manico':'Mogano Slim Taper','Tastiera':'Palissandro','Pickup':'Burstbucker 61R + 61T','Scala':'24,75" (628 mm)','Peso':'4,05 kg','Made in':'USA'},{estetica:94,meccanica:98,elettronica:99,difetti:'Nessun difetto rilevante'}],
['STR-003','Chitarre Elettriche','Ibanez RG550 Genesis Collection Purple Neon','Ibanez',2019,'Eccellente',879.00,'G','guitar','Ibanez RG','Genesis Collection giapponese, ponte Edge a doppia bloccatura, configurazione HSH con DiMarzio. Manico Super Wizard HP 5 pezzi acero/noce. Astuccio originale Ibanez.',{'Serie':'Genesis Collection','Corpo':'Tiglio','Manico':'Super Wizard HP 5pz','Tastiera':'Ebano','Pickup':'DiMarzio HSH','Ponte':'Edge Double Locking','Scala':'25,5"','Tasti':'24 Jumbo','Made in':'Giappone'},{estetica:90,meccanica:95,elettronica:97,difetti:'Lieve ossidazione sulle viti del battipenna'}],
['STR-004','Chitarre Elettriche','Fender American Professional II Telecaster MN','Fender',2021,'Near Mint',1590.00,'G','marco','Fender Telecaster','American Pro II con pickup V-Mod II Single-Coil, manico Deep C con rolled edges, ponte a 3 sellette compensate in ottone. Finitura 3-Color Sunburst. Custodia rigida Elite inclusa.',{'Serie':'American Professional II','Corpo':'Ontano','Manico':'Acero Deep C','Tastiera':'Acero','Pickup':'2x V-Mod II Single-Coil','Ponte':'3 sellette ottone','Scala':'25,5"','Tasti':'22 Narrow Tall','Made in':'USA'},{estetica:95,meccanica:99,elettronica:99,difetti:'Nessuno'}],
['STR-005','Chitarre Elettriche','PRS SE Custom 24 Eriza Verde','PRS',2022,'Eccellente',749.00,'G','giulia','PRS Guitars','SE Custom 24 coreana, top acero fiammato, pickup 85/15 S con coil tap, tremolo PRS brevettato. Manico Wide Thin, tastiera palissandro. Gig bag PRS premium inclusa.',{'Serie':'SE Custom 24','Corpo':'Mogano','Top':'Acero fiammato','Manico':'Acero Wide Thin','Tastiera':'Palissandro','Pickup':'2x 85/15 S','Ponte':'PRS Tremolo','Scala':'25"','Tasti':'24','Made in':'Corea'},{estetica:92,meccanica:97,elettronica:98,difetti:'Nessun difetto funzionale'}],
['STR-006','Chitarre Elettriche','Gretsch G6120T Players Edition Nashville','Gretsch',2018,'Molto Buono',2350.00,'G','giulia','Gretsch White Falcon','Hollow body con Bigsby B6CP, pickup Filter\u2019Tron braced, finitura Orange Stain lacca nitro. Suono rockabilly/jazz autentico. Custodia rigida Gretsch inclusa.',{'Serie':'Players Edition','Tipo':'Hollow Body','Corpo':'Acero laminato','Manico':'Acero','Tastiera':'Ebano','Pickup':'2x Filter\u2019Tron','Ponte':'Bigsby B6CP','Scala':'24,6"','Made in':'Giappone'},{estetica:82,meccanica:93,elettronica:95,difetti:'Checking sulla lacca nitro, tipico dello strumento vintage-style'}],
['STR-007','Chitarre Elettriche','Rickenbacker 360/12 Fireglo 12 corde','Rickenbacker',1996,'Buono',2490.00,'G','folk','Rickenbacker 330','Il jangle dodici corde di McGuinn e Harrison. Corpo semi-hollow in acero, due pickup toaster, finitura Fireglo. Revisione elettronica 2023. Custodia originale Rickenbacker.',{'Modello':'360/12','Corde':'12','Corpo':'Acero semi-hollow','Manico':'Acero','Tastiera':'Palissandro','Pickup':'2x Toaster Top','Scala':'24,75"','Made in':'USA'},{estetica:74,meccanica:88,elettronica:92,difetti:'Segni d\u2019uso sul bordo superiore e sul retro del manico'}],
['STR-008','Chitarre Elettriche','Epiphone Les Paul Standard 50s Heritage Cherry','Epiphone',2021,'Eccellente',429.00,'G','guitar','Epiphone','Replica fedele della 50s con ProBucker 2/3, manico rounded C, cablaggio CTS. Finitura Heritage Cherry Sunburst. Ottima prima solid body.',{'Serie':'Inspired by Gibson 50s','Corpo':'Mogano','Top':'Acero','Manico':'Mogano Rounded C','Tastiera':'Laurel Indiano','Pickup':'ProBucker 2 + 3','Scala':'24,75"','Tasti':'22 Medium Jumbo'},{estetica:91,meccanica:96,elettronica:97,difetti:'Nessuno'}],
['ACU-001','Chitarre Acustiche','Martin D-28 Standard Reimagined','Martin',2017,'Eccellente',2390.00,'G','folk','Martin D-28','Dreadnought di riferimento: top abete Sitka, fasce e fondo palissandro indiano, bracing forward-shifted X scalloped. Voce piena e bilanciata. Custodia Martin moulded inclusa.',{'Modello':'D-28 Reimagined','Formato':'Dreadnought','Top':'Abete Sitka massello','Fasce/Fondo':'Palissandro indiano','Tastiera':'Ebano','Bracing':'Forward-shifted X scalloped','Scala':'25,4"','Capotasto':'1,75"','Made in':'USA'},{estetica:89,meccanica:97,elettronica:100,difetti:'Lieve patina sul top, nessun crack'}],
['ACU-002','Chitarre Acustiche','Taylor 314ce Grand Auditorium V-Class','Taylor',2020,'Near Mint',1890.00,'G','folk','Taylor Guitars','Grand Auditorium con cutaway veneziano, top abete Sitka, fasce sapele, bracing V-Class per sustain e intonazione superiori. Sistema Expression System 2. Custodia Taylor deluxe.',{'Modello':'314ce','Formato':'Grand Auditorium','Top':'Abete Sitka','Fasce/Fondo':'Sapele','Bracing':'V-Class','Elettronica':'Expression System 2','Cutaway':'Veneziano','Scala':'25,5"','Made in':'Messico'},{estetica:94,meccanica:98,elettronica:99,difetti:'Nessuno'}],
['ACU-003','Chitarre Acustiche','Gibson J-45 Standard Vintage Sunburst','Gibson',2019,'Eccellente',2090.00,'G','giulia','Gibson J-45','La workhorse Gibson: top abete Sitka, corpo mogano, finitura Vintage Sunburst nitro. Suono caldo e compresso, ideale per accompagnamento vocale. LR Baggs VTC installato.',{'Modello':'J-45 Standard','Formato':'Round Shoulder Dreadnought','Top':'Abete Sitka','Fasce/Fondo':'Mogano','Elettronica':'LR Baggs VTC','Scala':'24,75"','Capotasto':'1,725"','Made in':'USA'},{estetica:88,meccanica:96,elettronica:97,difetti:'Micro-segni sul battipenna'}],
['ACU-004','Chitarre Acustiche','Yamaha FG830 Folk Dreadnought Natural','Yamaha',2022,'Near Mint',289.00,'G','piano','Acoustic guitar','Folk dreadnought con top abete massello e fasce palissandro, bracing scalloped per bassi più profondi. Perfetta per principianti esigenti e fingerstyle. Corde nuove Elixir.',{'Modello':'FG830','Formato':'Dreadnought','Top':'Abete massello','Fasce/Fondo':'Palissandro','Bracing':'Scalloped','Scala':'25" (634 mm)','Capotasto':'43 mm'},{estetica:95,meccanica:99,elettronica:100,difetti:'Nessuno'}],
['BAS-001','Bassi','Fender American Vintage II 1966 Jazz Bass','Fender',2023,'Near Mint',1990.00,'G','bass','Fender Jazz Bass','Reissue fedele del \u201966 con pickup Pure Vintage \u201964 Jazz Bass, manico C \u201966, tastiera palissandro round-lam. Cablaggio vintage con concentric stack. Custodia vintage inclusa.',{'Serie':'American Vintage II 1966','Corpo':'Ontano','Manico':'Acero C \u201966','Tastiera':'Palissandro round-lam','Pickup':'2x Pure Vintage \u201964 JB','Controlli':'Concentric stack','Scala':'34"','Tasti':'20 Vintage Tall','Made in':'USA'},{estetica:96,meccanica:99,elettronica:99,difetti:'Nessuno'}],
['BAS-002','Bassi','Rickenbacker 4003 Fireglo','Rickenbacker',2003,'Eccellente',2290.00,'G','bass','Rickenbacker 4001','Il basso di Squire, Lemmy e McCartney. Due pickup hi-gain, selettore Rick-O-Sound stereo, push-pull per condensatore vintage. Finitura Fireglo brillante. Custodia originale.',{'Modello':'4003','Corpo':'Acero','Manico':'Acero through-neck','Tastiera':'Palissandro','Pickup':'2x Hi-Gain','Uscite':'Mono + Rick-O-Sound','Scala':'33,25"','Tasti':'20','Made in':'USA'},{estetica:90,meccanica:96,elettronica:97,difetti:'Lieve buckle rash sul retro'}],
['BAS-003','Bassi','Music Man StingRay 5 HH Ebony','Ernie Ball Music Man',2019,'Near Mint',2190.00,'G','bass','Music Man (company)','Cinque corde attivo con preamplificatore 3 bande 18V e coppia humbucker neodymium. Selettore serie/parallelo/split. Suono moderno e definito per funk, fusion e metal.',{'Modello':'StingRay 5 HH','Corde':'5','Corpo':'Frassino selezionato','Manico':'Acero roasted','Tastiera':'Ebano','Pickup':'2x Humbucker Neodymium','Preamp':'3 bande 18V','Scala':'34"','Made in':'USA'},{estetica:94,meccanica:99,elettronica:99,difetti:'Nessuno'}],
['BAS-004','Bassi','Fender Precision Bass 1974 Sunburst','Fender',1974,'Buono',1350.00,'G','bass','Fender Precision Bass','Il basso che ha inventato il ruolo. Corpo frassino, pickup split single-coil originale, manico acero con tastiera acero. Elettronica revisionata 2023, meccaniche originali funzionanti. Custodia non originale inclusa.',{'Modello':'Precision Bass','Anno':'1974','Corpo':'Frassino','Manico':'Acero','Tastiera':'Acero','Pickup':'Split single-coil originale','Scala':'34"','Tasti':'20 Vintage','Made in':'USA'},{estetica:72,meccanica:90,elettronica:94,difetti:'Buckle rash sul retro, vernice consumata sul bordo del body, ossidazione hardware'}],
['KEY-001','Tastiere','Korg Minilogue XD Module','Korg',2021,'Near Mint',429.00,'M','synth','Korg Minilogue','Sintetizzatore analogico polifonico 4 voci in formato desktop. Terzo oscillatore digitale multi-engine con user oscillators SDK. Sequencer 16 step, effetti digitali stereo. Alimentatore originale.',{'Modello':'Minilogue XD Module','Voci':'4 analogiche','Oscillatori':'2 VCO + Multi-Engine digitale','Filtro':'2 poli risonante','Sequencer':'16 step','Effetti':'Modulation/Delay/Reverb','Formato':'Desktop module','Uscite':'Stereo + Cuffie'},{estetica:95,meccanica:99,elettronica:99,difetti:'Nessuno'}],
['KEY-002','Tastiere','Roland Juno-DS61','Roland',2019,'Eccellente',649.00,'M','synth','Synthesizer','Workstation leggera da palco: 61 tasti velocity-sensitive, oltre 1000 suoni derivati dalla serie JUNO, pad performance, ingresso mic con vocoder e auto-harmony. Flight case incluso.',{'Modello':'JUNO-DS61','Tasti':'61 velocity','Suoni':'1000+ (JUNO legacy)','Pad':'8 performance','Polifonia':'128 voci','Ingressi':'Mic XLR con vocoder','Peso':'5,3 kg','Alimentazione':'Adattatore o batterie AA'},{estetica:90,meccanica:97,elettronica:98,difetti:'Lieve usura sui bordi dei tasti più usati'}],
['KEY-003','Tastiere','Nord Electro 6D 73','Clavia Nord',2022,'Near Mint',2290.00,'M','synth','Nord Electro','Stage piano con sezione organ B3 drawbar fisici, piano section con filtri e synth section campionata. 73 tasti semi-pesati a cascata. Custodia imbottita Nord originale.',{'Modello':'Electro 6D 73','Tasti':'73 semi-pesati waterfall','Sezioni':'Organ / Piano / Synth','Memoria piano':'1 GB','Drawbar':'9 fisici LED','Effetti':'Amp sim, delay, reverb','Made in':'Svezia'},{estetica:96,meccanica:99,elettronica:99,difetti:'Nessuno'}],
['KEY-004','Tastiere','Yamaha P-125 Digital Piano Nero','Yamaha',2020,'Eccellente',479.00,'M','piano','Digital piano','Digital piano 88 tasti GHS pesati, campionatura del concert grand CFX, polifonia 192 voci. Include pedale sustain FC3A, leggio e alimentatore originale. Utilizzato solo in ambiente domestico.',{'Modello':'P-125','Tasti':'88 GHS (Graded Hammer Standard)','Campionatura':'Yamaha CFX','Polifonia':'192 voci','Voci':'24','Connettività':'USB to Host','Pedale':'FC3A incluso','Peso':'11,8 kg'},{estetica:92,meccanica:98,elettronica:99,difetti:'Nessuno'}],
['KEY-005','Tastiere','Moog Subsequent 37','Moog',2020,'Near Mint',1490.00,'M','synth','Moog synthesizer','Sintetizzatore analogico para-monofonico 2 voci, 37 tasti velocity con aftertouch, ladder filter Moog leggendario, Multidrive per saturazione asimmetrica. Scatola e alimentatore originali.',{'Modello':'Subsequent 37','Voci':'2 (paraphonic)','Tasti':'37 velocity + aftertouch','Oscillatori':'2 + sub','Filtro':'Ladder 4 poli Moog','Multidrive':'Saturazione asimmetrica','Sequencer':'64 note','Made in':'USA'},{estetica:95,meccanica:99,elettronica:99,difetti:'Nessuno'}],
['DRU-001','Batterie','Pearl Export EXX 5 pezzi Jet Black','Pearl',2019,'Molto Buono',589.00,'G','drum','Drum kit','Kit completo: cassa 22x18, tom 10x7 e 12x8, timpano 16x16, rullante 14x5,5. Hardware 830 series e piatti Zildjian Planet Z inclusi. Pelli Remo UT sostituite gennaio 2024.',{'Serie':'Export EXX','Fusti':'Pioppo/Mahogany 6 ply','Configurazione':'5 pezzi','Cassa':'22x18"','Tom':'10x7" + 12x8"','Timpano':'16x16"','Rullante':'14x5,5"','Hardware':'830 series incluso','Piatti':'Zildjian Planet Z pack'},{estetica:80,meccanica:92,elettronica:100,difetti:'Graffi sui cerchi della cassa, pelli con segni di bacchette'}],
['DRU-002','Batterie','DW Collector\u2019s Series Snare 14x5.5 Acero','DW',2016,'Eccellente',549.00,'M','drum','Snare drum','Rullante Collector\u2019s in acero nordamericano 10 ply, cerchi True-Hoops, sistema True-Tone, throw-off MAG. Cristallino sui ghost note, potente sui rimshot. Custodia DW inclusa.',{'Serie':'Collector\u2019s Series','Materiale':'Acero nordamericano 10 ply','Misura':'14x5,5"','Cerchi':'True-Hoops','Throw-off':'MAG','Finitura':'Lacca FinishPly','Made in':'USA'},{estetica:91,meccanica:98,elettronica:100,difetti:'Nessun difetto strutturale'}],
['DRU-003','Batterie','Roland TD-17KVX V-Drums','Roland',2022,'Near Mint',1590.00,'G','drum','Electronic drum','Kit elettronico con mesh heads su tutti i pad, rullante PDX-12, modulo TD-17 con Bluetooth audio/MIDI e coaching functions. Rack MDS-Compact e pedale cassa inclusi. Ideale per studio silenzioso.',{'Modello':'TD-17KVX','Modulo':'TD-17','Rullante':'PDX-12 (12")','Tom':'PDX-8 x3','Piatti':'CY-12C/CY-13R + VH-10','Mesh':'Integrale','Connettività':'Bluetooth MIDI/Audio','Rack':'MDS-Compact'},{estetica:95,meccanica:99,elettronica:99,difetti:'Nessuno'}],
['VIN-001','Vinili','Pink Floyd — The Dark Side of the Moon (UK 1st)','Harvest',1973,'Near Mint',189.00,'P','vinile','The Dark Side of the Moon','Prima stampa UK Harvest SHVL 804, matrici A-2/B-2, copertina gatefold con poster e sticker originali presenti. Vinile lucido, fruscio minimo in ascolto. Grado conservativo NM/NM.',{'Anno stampa':'1973','Etichetta':'Harvest','Catalogo':'SHVL 804','Matrici':'A-2 / B-2','Formato':'LP Gatefold','Grading disco':'Near Mint','Grading copertina':'Near Mint','Poster/Sticker':'Presenti entrambi'},{estetica:92,meccanica:95,elettronica:100,difetti:'Lieve ringwear sulla copertina'}],
['VIN-002','Vinili','Miles Davis — Kind of Blue (180g Legacy)','Columbia Legacy',2015,'Mint',34.90,'P','vinile','Kind of Blue','Ristampa audiophile 180 grammi rimasterizzata dai nastri originali a 3 canali. Sigillo aperto ma disco mai suonato, inner sleeve antistatico incluso. Edizione Legacy definitiva.',{'Anno stampa':'2015','Etichetta':'Columbia Legacy','Grammatura':'180 g','Remaster':'Nastri originali 3-track','Grading disco':'Mint (mai suonato)','Grading copertina':'Mint','Inner sleeve':'Antistatico'},{estetica:100,meccanica:100,elettronica:100,difetti:'Nessuno'}],
['VIN-003','Vinili','Led Zeppelin — IV (2014 Deluxe Remaster)','Atlantic',2014,'Mint',42.50,'P','vinile','Led Zeppelin IV','Remaster supervisionato da Jimmy Page, LP nero 180g con copertina tipografica interna e companion disc di outtake. Audio di riferimento, confezione completa come nuova.',{'Anno stampa':'2014','Etichetta':'Atlantic','Remaster':'Jimmy Page 2014','Grammatura':'180 g','Formato':'LP + companion disc','Grading':'Mint/Mint'},{estetica:100,meccanica:100,elettronica:100,difetti:'Nessuno'}],
['VIN-004','Vinili','The Beatles — Abbey Road (IT 1st 1969)','Parlophone Italiana',1969,'Buono',149.00,'P','vinile','Abbey Road','Prima stampa italiana Parlophone PMCQ 31508, etichetta nera con logo Parlophone. Copertina con lieve ringwear, vinile VG+ con occasionali click in lato B. Pezzo da collezione documentato.',{'Anno stampa':'1969','Etichetta':'Parlophone Italiana','Catalogo':'PMCQ 31508','Grading disco':'VG+','Grading copertina':'VG','Note':'Etichetta nera primo tipo'},{estetica:72,meccanica:85,elettronica:100,difetti:'Ringwear copertina, click occasionali lato B'}],
['VIN-005','Vinili','Radiohead — OK Computer OKNOTOK 1997-2017','XL Recordings',2017,'Near Mint',54.90,'P','vinile','OK Computer','Edizione anniversario 3xLP con 8 tracce bonus e outtake mai pubblicate. Vinile nero 180g, booklet di 16 pagine con artwork originale. Ascolto pulito su tutti i lati.',{'Anno stampa':'2017','Etichetta':'XL Recordings','Formato':'3xLP 180 g','Bonus':'8 tracce inedite','Booklet':'16 pagine','Grading':'NM/NM'},{estetica:94,meccanica:97,elettronica:100,difetti:'Nessuno'}],
['VIN-006','Vinili','Michael Jackson — Thriller (US 1st 1982)','Epic',1982,'Near Mint',95.00,'P','vinile','Thriller (album)','Stampa originale Epic QE 38112 con copertina apribile e inner sleeve illustrata. Il disco più venduto della storia in condizioni eccellenti per l\u2019età. Matrici PAL/PBL.',{'Anno stampa':'1982','Etichetta':'Epic','Catalogo':'QE 38112','Matrici':'PAL / PBL','Formato':'LP Gatefold','Grading':'NM/VG+'},{estetica:88,meccanica:93,elettronica:100,difetti:'Lieve usura sugli spigoli della copertina'}],
['VIN-007','Vinili','David Bowie — Ziggy Stardust (Audiophile)','RCA Victor',2012,'Mint',38.90,'P','vinile','The Rise and Fall of Ziggy Stardust and the Spiders from Mars','Ristampa audiophile RCA del capolavoro glam, rimasterizzazione 2012 da nastri originali. Disco e copertina perfetti, inner sleeve illustrata con testi inclusa.',{'Anno stampa':'2012','Etichetta':'RCA Victor','Remaster':'2012 dai nastri originali','Grammatura':'180 g','Grading':'Mint/Mint'},{estetica:100,meccanica:100,elettronica:100,difetti:'Nessuno'}],
['VIN-008','Vinili','Nirvana — Nevermind (US 1st 1991)','DGC',1991,'Near Mint',129.00,'P','vinile','Nevermind','Stampa originale DGC DGCS-24425 con inner sleeve originale e inserto. Copertina senza pieghe, disco con fruscio trascurabile. Icona grunge in condizioni notevoli per 33 anni.',{'Anno stampa':'1991','Etichetta':'DGC','Catalogo':'DGCS-24425','Formato':'LP + inner + insert','Grading':'NM/VG+'},{estetica:86,meccanica:92,elettronica:100,difetti:'Lieve shelf wear sulla copertina'}],
['CD-001','CD','Queen — Greatest Hits (Remastered 2011)','Hollywood Records',2011,'Near Mint',14.90,'P','giulia','Greatest Hits (Queen album)','Edizione remastered 2011 con booklet di 16 pagine e testi. Disco senza graffi, jewel case sostituito nuovo. Riproduzione verificata integralmente su lettore reference.',{'Anno':'2011','Etichetta':'Hollywood Records','Formato':'CD Album Remastered','Booklet':'16 pagine con testi','Grading disco':'Near Mint','Grading case':'Nuovo'},{estetica:95,meccanica:98,elettronica:100,difetti:'Nessuno'}],
['CD-002','CD','Depeche Mode — Violator (Original 1990)','Mute',1990,'Mint',22.50,'P','synth','Violator (album)','CD originale Mute CD STUMM 64, prima edizione 1990. Il capolavoro synth-pop in condizioni perfette, booklet e retrocopertina integri. Jewel case originale senza crepe.',{'Anno':'1990','Etichetta':'Mute','Catalogo':'CD STUMM 64','Formato':'CD Album','Edizione':'Prima 1990','Grading':'Mint'},{estetica:100,meccanica:100,elettronica:100,difetti:'Nessuno'}],
['CD-003','CD','Amy Winehouse — Back to Black (Deluxe)','Island',2007,'Mint',16.90,'P','giulia','Back to Black','Edizione Deluxe Island con bonus disc di remix e B-side. Disco immacolato, booklet completo con foto inedite. Custodia digipak originale senza usura.',{'Anno':'2007','Etichetta':'Island','Formato':'2xCD Deluxe','Bonus':'Remix + B-side','Packaging':'Digipak','Grading':'Mint'},{estetica:100,meccanica:100,elettronica:100,difetti:'Nessuno'}],
['PED-001','Pedali Effetto','Boss DD-7 Digital Delay','Boss',2015,'Molto Buono',119.00,'P','guitar','Effects unit','Delay digitale con 40 secondi di tempo massimo, modalità Analog con modulazione, Reverse, Modulate e Tap Tempo. Ingresso espressione per controllo remoto. Scatola e manuale originali.',{'Modello':'DD-7','Tempo max':'40 secondi','Modalità':'Analog/Modulate/Reverse/Tap','Tap Tempo':'Sì (jack esterno)','Bypass':'Buffered','Alimentazione':'9V DC o batteria','Consumo':'55 mA'},{estetica:82,meccanica:95,elettronica:98,difetti:'Velcro residuo sul retro, graffi sul telaio'}],
['PED-002','Pedali Effetto','Ibanez TS9 Tube Screamer (RI Japan)','Ibanez',2018,'Eccellente',149.00,'P','guitar','Ibanez Tube Screamer','Riedizione giapponese del Tube Screamer con chip JRC4558D originale, vero bypass modificato professionalmente. L\u2019overdrive che ha definito il blues-rock di SRV. Scatola originale.',{'Modello':'TS9 RI','Chip':'JRC4558D','Circuito':'Analogico','Bypass':'True bypass (mod pro)','Alimentazione':'9V DC','Made in':'Giappone'},{estetica:90,meccanica:97,elettronica:99,difetti:'Nessun difetto funzionale'}],
['PED-003','Pedali Effetto','Electro-Harmonix Big Muff Pi NYC','Electro-Harmonix',2016,'Buono',89.00,'P','guitar','Big Muff','Il fuzz di Gilmour e Corgan. Versione NYC reissue con sustain infinito e tono scolpito. Grafica usurata ma circuito impeccabile, transistor originali verificati.',{'Modello':'Big Muff Pi NYC','Tipo':'Fuzz/Sustain','Circuito':'Analogico 4 stadi','Controlli':'Volume / Tone / Sustain','Bypass':'True bypass','Alimentazione':'9V DC','Made in':'USA'},{estetica:70,meccanica:92,elettronica:96,difetti:'Grafica seriamente usurata, serigrafia parzialmente illeggibile'}],
['PED-004','Pedali Effetto','Strymon BigSky Multidimensional Reverb','Strymon',2021,'Near Mint',429.00,'P','synth','Effects unit','Dodici algoritmi di riverbero di classe studio: Hall, Plate, Spring, Bloom, Cloud, Chorale, Shimmer, Magneto, Nonlinear, Reflections, Room, Swell. MIDI in/out, 300 preset. Alimentatore originale.',{'Modello':'BigSky','Algoritmi':'12','Preset':'300','MIDI':'In / Out / Thru','DSP':'SHARC','Bypass':'Selectable buffered/true','Alimentazione':'9V DC 300 mA','Made in':'USA'},{estetica:95,meccanica:99,elettronica:99,difetti:'Nessuno'}],
['AMP-001','Amplificatori','Marshall DSL40CR Combo','Marshall',2020,'Eccellente',649.00,'G','marco','Marshall Amplification','Testata combo valvolare 40W con finale EL34, due canali commutabili (Classic Gain / Ultra Gain), riverbero digitale, speaker Celestion V-Type 12". Valvole originali con circa 200 ore. Cover inclusa.',{'Modello':'DSL40CR','Potenza':'40W (riducibile 20W)','Finale':'2x EL34','Preamp':'3x ECC83','Speaker':'Celestion V-Type 12"','Canali':'Classic Gain + Ultra Gain','Riverbero':'Digitale','Loop effetti':'Sì','Peso':'22,5 kg'},{estetica:89,meccanica:96,elettronica:97,difetti:'Lieve usura sul tolex agli spigoli'}],
['AMP-002','Amplificatori','Fender Blues Junior IV','Fender',2021,'Molto Buono',579.00,'G','giulia','Guitar amplifier','Combo 15W con finale EL84, speaker Celestion A-Type 12", riverbero a molla reale, controllo Fat switch. Il clean caldo Fender perfetto per blues, jazz e indie. Cover Fender inclusa.',{'Modello':'Blues Junior IV','Potenza':'15W','Finale':'2x EL84','Preamp':'3x 12AX7','Speaker':'Celestion A-Type 12"','Riverbero':'A molla reale','Fat switch':'Sì','Peso':'14,3 kg'},{estetica:85,meccanica:95,elettronica:97,difetti:'Segni sul tolex, griglia anteriore con lieve ossidazione'}],
['AMP-003','Amplificatori','Vox AC30C2 Combo','Vox',2018,'Eccellente',1090.00,'G','marco','Vox AC30','Il chime britannico: 30W EL84, canali Normal e Top Boost, 2x12 Celestion G12M Greenback, tremolo e riverbero a molla integrati. Il suono dei Beatles e di Brian May. Spedizione dedicata.',{'Modello':'AC30C2','Potenza':'30W','Finale':'4x EL84','Speaker':'2x12 Celestion G12M Greenback','Canali':'Normal + Top Boost','Tremolo':'Sì','Riverbero':'A molla','Peso':'32,2 kg'},{estetica:88,meccanica:96,elettronica:97,difetti:'Lieve usura sul piping dorato'}],
['MIC-001','Microfoni','Shure SM7B Cardioid Dynamic','Shure',2020,'Near Mint',359.00,'P','studio','Shure SM7','Il riferimento per voce broadcast, podcast e registrazione rock. Risposta 50Hz-20kHz, filtro low-cut e presence boost commutabili, schermatura elettromagnetica avanzata. Include windscreen A7WS e yoke.',{'Modello':'SM7B','Tipo':'Dinamico bobina mobile','Pattern':'Cardioide','Risposta':'50 Hz – 20 kHz','Filtri':'Low-cut + Presence boost','Sensibilità':'-59 dBV/Pa','Impedenza':'150 ohm','Accessori':'A7WS + yoke mount'},{estetica:95,meccanica:99,elettronica:99,difetti:'Nessuno'}],
['MIC-002','Microfoni','Neumann U87 Ai Studio Set Nickel','Neumann',2014,'Eccellente',2790.00,'M','studio','Neumann U87','Lo standard assoluto per voce e strumenti in studio. Tre pattern commutabili (omni/cardio/fig-8), filtro low-cut e pad -10dB. Sospensione elastica EA87, scatola legno originale.',{'Modello':'U87 Ai','Tipo':'Condensatore a doppia membrana','Pattern':'Omni / Cardioide / Figura 8','Risposta':'20 Hz – 20 kHz','Pad':'-10 dB','Sensibilità':'28 mV/Pa','Accessori':'EA87 + box legno + cavo','Made in':'Germania'},{estetica:92,meccanica:99,elettronica:99,difetti:'Micro-segni sul corpo nichelato'}],
['MIC-003','Microfoni','Shure SM58 LC Vocal Dynamic','Shure',2019,'Molto Buono',89.00,'P','studio','Shure SM58','Il microfono da live più venduto al mondo. Pattern cardioide, risposta ottimizzata per voce, griglia antischiacciamento e filtro anti-pop integrato. Griglia originale senza ammaccature. Clip inclusa.',{'Modello':'SM58 LC','Tipo':'Dinamico','Pattern':'Cardioide','Risposta':'50 Hz – 15 kHz','Sensibilità':'-54,5 dBV/Pa','Impedenza':'300 ohm nominale','Connettore':'XLR 3 pin','Accessori':'Clip + pouch'},{estetica:84,meccanica:96,elettronica:98,difetti:'Lievi segni sul corpo, griglia intatta'}],
['ARC-001','Archi','Violino Stentor Student II 4/4 Completo','Stentor',2021,'Buono',219.00,'M','folk','Violin','Violino da studio 4/4 con top abete massello e fondo acero fiammato, piroli in ebano, cordiera con fine tuners. Completo di arco in crine autentico, pece e custodia sagomata imbottita.',{'Modello':'Student II','Misura':'4/4','Top':'Abete massello','Fondo/Fasce':'Acero fiammato','Piroli':'Ebano','Cordiera':'Con 4 fine tuners','Corde':'Steel core','Dotazione':'Arco crine + pece + custodia'},{estetica:78,meccanica:90,elettronica:100,difetti:'Vernice usurata sulla mentoniera, lievi segni sul top'}],
['ARC-002','Archi','Violoncello Cremona SC-100 4/4','Cremona',2018,'Molto Buono',649.00,'G','folk','Cello','Violoncello da studio con setup professionale: ponticello Aubert regolato, corde Larsen Soloist, anima posizionata da liutaio. Archetto brasilwood e custodia imbottita con ruote inclusi.',{'Modello':'SC-100','Misura':'4/4','Top':'Abete massello','Fondo/Fasce':'Acero','Ponticello':'Aubert regolato','Corde':'Larsen Soloist','Dotazione':'Arco brasilwood + custodia ruote','Setup':'Liutaio 2023'},{estetica:86,meccanica:95,elettronica:100,difetti:'Lieve usura sulla vernice in prossimità del ponticello'}]
  ];

  const NOW = Date.now();
  const ITEMS = RAW.map((r, i) => ({
    sku:r[0], category:r[1], title:r[2], brand:r[3], year:r[4], grading:r[5], price:r[6], size:r[7],
    seller:SELLERS[r[8]], wiki:r[9], desc:r[10], specs:r[11], condition:r[12],
    images:[PENDING_IMG()], audioProfile:null, createdAt:NOW - (i * 7 + 3) * 3600000,
    verified:true, seed:true
  }));

  /* ---------- immagini: pending, tile, cache ---------- */
  function PENDING_IMG() {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 4"><rect width="3" height="4" fill="#EEF2F6"/></svg>');
  }
  const PENDING = PENDING_IMG();

  const TONES = {
    'Chitarre Elettriche':['#0A3540','#136276'],'Chitarre Acustiche':['#3B2A1A','#8A5A12'],
    'Bassi':['#062A33','#0F4C5C'],'Tastiere':['#0F4C5C','#177A93'],'Batterie':['#421913','#8A3B22'],
    'Vinili':['#0B1220','#1E293B'],'CD':['#293548','#5A6B82'],'Pedali Effetto':['#0A3540','#A8500C'],
    'Amplificatori':['#1C1917','#3F3A36'],'Microfoni':['#0F172A','#2E3B4E'],'Archi':['#3B2A1A','#6D4C41']
  };

  /* Fallback tipografico: identità del prodotto, nessuna illustrazione. */
  const art = (cat, label) => {
    const t = TONES[cat] || ['#0F4C5C','#0A3540'];
    const clean = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const words = clean(label).split(' ');
    const lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > 24) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; });
    if (cur.trim()) lines.push(cur.trim());
    const body = lines.slice(0,3).map((l,i) => '<text x="300" y="' + (420 + i*36) + '" font-family="Inter,Helvetica,sans-serif" font-size="26" fill="#EAF2F4" text-anchor="middle">' + l + '</text>').join('');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">' +
      '<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + t[0] + '"/><stop offset="1" stop-color="' + t[1] + '"/></linearGradient></defs>' +
      '<rect width="600" height="800" fill="url(#t)"/>' +
      '<g fill="none" stroke="#E8B04B" stroke-opacity=".07"><circle cx="300" cy="320" r="150"/><circle cx="300" cy="320" r="205"/><circle cx="300" cy="320" r="260"/></g>' +
      '<text x="300" y="290" font-family="Inter,Helvetica,sans-serif" font-size="15" letter-spacing="6" fill="#E8B04B" text-anchor="middle">' + clean(cat).toUpperCase() + '</text>' +
      body +
      '<text x="300" y="742" font-family="Inter,Helvetica,sans-serif" font-size="13" letter-spacing="3" fill="#8FB0B8" text-anchor="middle">FOTO IN CARICAMENTO</text></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  const CK = 'sm.photo.v1';
  const cache = SMU.store.get(CK, {});
  const busy = new Set();
  const BAD = /(logo|icon|symbol|commons|wiki|edit|lock|star|flag|map|stub|question|book|note|speaker|play|arrow|badge|medal|ambox|padlock|crystal|nuvola|folder|magnify|disambig|portal|category|sound|audio|video|ogg|svg|blank|placeholder)/i;

  const parseMedia = (j) => {
    const out = [];
    (j.items || []).forEach(m => {
      if (m.type && m.type !== 'image') return;
      let s = m.src || '';
      if (!s && Array.isArray(m.srcset) && m.srcset.length) s = m.srcset[m.srcset.length-1].src || '';
      if (!s) return;
      if (s.indexOf('//') === 0) s = 'https:' + s;
      if (!/^https:\/\//.test(s)) return;
      if (!/\.(jpe?g|png)(\?|$)/i.test(s)) return;
      if (BAD.test(String(m.title || ''))) return;
      let a = (Array.isArray(m.srcset) && m.srcset[0] && m.srcset[0].src) || s;
      if (a.indexOf('//') === 0) a = 'https:' + a;
      out.push({ u:s, a:a });
    });
    return out;
  };

  const getJSON = async (url) => {
    const r = await fetch(url, { headers:{ Accept:'application/json' }, mode:'cors' });
    if (!r.ok) throw new Error('http');
    return r.json();
  };

  const resolveWiki = async (title) => {
    for (const lang of ['en','it']) {
      try {
        const j = await getJSON('https://' + lang + '.wikipedia.org/api/rest_v1/page/media-list/' + encodeURIComponent(title));
        const l = parseMedia(j);
        if (l.length) return l.slice(0,4);
      } catch (e) {}
      try {
        const j = await getJSON('https://' + lang + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title));
        const th = j.thumbnail && j.thumbnail.source;
        if (th) return [{ u: th.replace(/\/(\d+)px-/, '/900px-'), a: th }];
      } catch (e) {}
    }
    return [];
  };

  const pair = (it, idx) => {
    if (!it) return { u:PENDING, a:'' };
    if (it.seed === false) {
      const arr = it.images || [];
      return { u: arr[Math.min(idx, arr.length-1)] || art(it.category, it.title), a:'' };
    }
    const c = cache[it.sku];
    if (c && c.ok && c.list && c.list.length) {
      const p = c.list[Math.min(idx, c.list.length-1)];
      return { u:p.u, a:p.a || '' };
    }
    if (c && c.ok === false) return { u: art(it.category, it.title), a:'' };
    return { u:PENDING, a:'' };
  };

  const imagesFor = (cat, offset) => {
    const pool = ITEMS.filter(i => i.category === cat);
    if (!pool.length) return [art(cat, cat)];
    const it = pool[(offset || 0) % pool.length];
    const c = cache[it.sku];
    if (c && c.ok && c.list && c.list.length) return c.list.map(x => x.u);
    return [PENDING];
  };

  const findAny = (sku) => ITEMS.find(i => i.sku === sku) || (SMU.store.get('sm.userItems', []).find(i => i.sku === sku) || null);

  const paintDom = (sku) => {
    const it = findAny(sku); if (!it) return;
    const c = cache[sku];
    if (c && c.ok && c.list && c.list.length) it.images = c.list.map(x => x.u);
    else if (c && c.ok === false) it.images = [art(it.category, it.title)];
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      const isPending = src === PENDING || img.dataset.smPending === '1';
      const belongs = img.dataset.smSku === sku ||
        (img.alt && img.alt === it.title) ||
        (isPending && closestSku(img) === sku);
      if (!belongs) return;
      const holder = img.closest('.g-thumbs') || img.closest('.gallery') || img.closest('.card-img');
      let idx = 0;
      if (holder && holder.classList.contains('g-thumbs')) {
        const kids = Array.from(holder.querySelectorAll('img'));
        idx = Math.max(0, kids.indexOf(img));
      }
      const p = pair(it, idx);
      if (src === p.u) return;
      img.dataset.smSku = sku;
      img.dataset.smPending = (p.u === PENDING) ? '1' : '0';
      if (p.a) img.dataset.smAlt = p.a; else delete img.dataset.smAlt;
      delete img.dataset.smAltTry; delete img.dataset.smFb;
      img.src = p.u;
    });
    const u = SMAuth && SMAuth.current ? SMAuth.current() : null;
    if (u) {
      const k = 'sm.threads.' + u.id;
      const th = SMU.store.get(k, []);
      let ch = false;
      th.forEach(t => { if (t.sku === sku && it.images[0] && t.img !== it.images[0]) { t.img = it.images[0]; ch = true; } });
      if (ch) SMU.store.set(k, th);
    }
  };

  const closestSku = (el) => {
    let n = el;
    while (n && n !== document.body) {
      if (n.dataset && n.dataset.sku) return n.dataset.sku;
      n = n.parentElement;
    }
    const h = location.hash || '';
    const m = h.match(/#\/articolo\/([^?]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  };

  const ensure = async (sku) => {
    const it = findAny(sku);
    if (!it || it.seed === false) return;
    if (busy.has(sku)) return;
    const c = cache[sku];
    if (c && (c.ok || (c.at && Date.now() - c.at < 600000))) return;
    busy.add(sku);
    try {
      const list = await resolveWiki(it.wiki || it.title);
      cache[sku] = { ok: list.length > 0, list: list, at: Date.now() };
    } catch (e) {
      cache[sku] = { ok:false, list:[], at:Date.now() };
    }
    SMU.store.set(CK, cache);
    busy.delete(sku);
    paintDom(sku);
  };

  const scan = () => {
    const need = new Set();
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (src !== PENDING && img.dataset.smPending !== '1') return;
      let sku = img.dataset.smSku || closestSku(img);
      if (!sku && img.alt) { const f = ITEMS.find(i => i.title === img.alt); if (f) sku = f.sku; }
      if (sku) need.add(sku);
    });
    need.forEach(ensure);
  };

  const prefetch = async () => {
    const todo = ITEMS.filter(i => !cache[i.sku]);
    for (let k = 0; k < todo.length; k += 5) {
      await Promise.all(todo.slice(k, k+5).map(i => ensure(i.sku)));
    }
    ITEMS.forEach(i => { const c = cache[i.sku]; if (c && c.ok && c.list.length) i.images = c.list.map(x => x.u); });
    if (window.SMApp && SMApp.renderAll) { try { SMApp.renderAll(); } catch (e) {} }
  };

  /* ---------- audio Web Audio API ---------- */
  const AUDIO = {
    'Chitarre Elettriche':{ type:'sawtooth', notes:[82.41,110,164.81,196,246.94,329.63], decay:1.8, filter:2200, label:'Accordo Mi maggiore (E)' },
    'Chitarre Acustiche':{ type:'triangle', notes:[110,164.81,220,277.18,329.63,440], decay:2.2, filter:3000, label:'Accordo La maggiore (A)' },
    'Bassi':{ type:'sine', notes:[41.20,55,61.74,82.41], decay:2.6, filter:800, label:'Groove in Mi basso' },
    'Tastiere':{ type:'sine', notes:[261.63,329.63,392,523.25], decay:2.4, filter:4000, label:'Accordo Do maggiore (C)' },
    'Batterie':{ type:'noise', notes:[60,80,120,200], decay:0.4, filter:6000, label:'Pattern ritmico 4/4' },
    'Vinili':{ type:'triangle', notes:[220,277.18,329.63,440], decay:2.0, filter:2600, label:'Estratto rimasterizzato' },
    'CD':{ type:'sine', notes:[293.66,369.99,440,587.33], decay:2.0, filter:3400, label:'Estratto digitale' },
    'Pedali Effetto':{ type:'square', notes:[164.81,246.94,329.63,493.88], decay:1.6, filter:1800, label:'Dimostrazione overdrive' },
    'Amplificatori':{ type:'sawtooth', notes:[82.41,123.47,164.81,246.94], decay:2.0, filter:2000, label:'Clean channel demo' },
    'Microfoni':{ type:'sine', notes:[440,554.37,659.25], decay:1.4, filter:5000, label:'Test risposta in frequenza' },
    'Archi':{ type:'sawtooth', notes:[196,293.66,440,659.25], decay:3.0, filter:3200, label:'Accordo Sol maggiore (G)' }
  };
  const audioProfile = (c) => AUDIO[c] || AUDIO['Vinili'];
  ITEMS.forEach(i => { i.audioProfile = audioProfile(i.category); });

  const brands = () => Array.from(new Set(ITEMS.map(i => i.brand))).sort((a,b) => a.localeCompare(b));

  const priceHistory = (it) => {
    const M = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    const n = new Date(), labels = [], data = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(n.getFullYear(), n.getMonth()-i, 1);
      labels.push(M[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2));
      data.push(SMU.round2(it.price * (1 + (11-i)*0.008) * (1 + Math.sin(i*2.3 + it.price)*0.04)));
    }
    return { labels, data };
  };

  const INFO = {
    protezione:{ title:'Protezione Acquisti Musicista', html:'<h3>Copertura integrale</h3><p>Ogni acquisto è coperto da Protezione Acquisti Musicista. La tariffa (4,5% + € 0,90) finanzia la verifica delle inserzioni, l\u2019assistenza dedicata e il rimborso integrale in caso di articolo non conforme, danneggiato o non ricevuto.</p><h3>Quando si attiva</h3><p>Il rimborso viene disposto quando l\u2019articolo non corrisponde alla descrizione o al grading dichiarato, presenta danni non documentati, o non viene consegnato. Contestazione entro 48 ore dalla consegna.</p><h3>Esclusioni</h3><p>Le transazioni concluse fuori dalla piattaforma non sono coperte.</p>' },
    imballaggio:{ title:'Standard di Imballaggio Corrieri', html:'<h3>Requisiti obbligatori</h3><table class="info-table"><tr><th>Categoria</th><th>Standard</th></tr><tr><td>Chitarre e bassi</td><td>Custodia rigida + doppio cartone onda B + angolari. Manico immobilizzato, corde allentate di 1 tono.</td></tr><tr><td>Amplificatori</td><td>Imballo originale o cassa su misura con foam. Valvole rimosse e imballate separatamente.</td></tr><tr><td>Vinili</td><td>Mailer specifici per LP con stiffener. Disco separato dalla copertina per evitare seam split.</td></tr><tr><td>Tastiere e synth</td><td>Flight case o doppio cartone con foam sagomato. Alimentatore in busta separata.</td></tr><tr><td>Batterie</td><td>Smontaggio completo, ogni fusto in cartone singolo. Hardware in scatola separata.</td></tr></table><h3>Responsabilità</h3><p>Danni da imballo inadeguato comportano rimborso integrale a carico del venditore.</p>' },
    grading:{ title:'Guida al Grading', html:'<p>Il grading certifica lo stato di conservazione. In caso di contestazione, il grado dichiarato è il riferimento vincolante.</p><table class="info-table"><tr><th>Grado</th><th>Definizione</th></tr>' + GRADING.map(g => '<tr><td><b>' + g.id + '</b></td><td>' + g.desc + '</td></tr>').join('') + '</table><h3>Supporti audio</h3><p>Per vinili e CD si applica lo standard Goldmine: Mint, Near Mint, VG+, VG, G. Grado del disco e della copertina vanno dichiarati separatamente.</p>' },
    spedizioni:{ title:'Spedizioni e Tracking', html:'<h3>Corrieri convenzionati</h3><table class="info-table"><tr><th>Corriere</th><th>Tempistiche</th><th>Assicurazione</th></tr>' + COURIERS.map(c => '<tr><td><b>' + c.name + '</b></td><td>' + c.eta + '</td><td>Fino a € 3.000</td></tr>').join('') + '</table><h3>Tariffe</h3><table class="info-table"><tr><th>Fascia</th><th>Descrizione</th><th>Tariffa</th></tr>' + SIZES.map(s => '<tr><td><b>' + s.label + '</b></td><td>' + s.desc + '</td><td>' + SMU.fmtMoney(s.cost) + '</td></tr>').join('') + '</table>' },
    escrow:{ title:'Deposito in Escrow', html:'<h3>Come funziona</h3><p>Alla conferma d\u2019ordine l\u2019importo è trattenuto in deposito vincolato. Il venditore spedisce; l\u2019acquirente verifica entro 48 ore.</p><h3>Sblocco</h3><p>Alla conferma di ricezione, o decorse 48 ore senza contestazione, il netto viene accreditato al venditore.</p>' },
    termini:{ title:'Termini e Condizioni', html:'<h3>Oggetto</h3><p>SoundMarket S.r.l. gestisce una piattaforma marketplace C2C per beni musicali di seconda mano.</p><h3>Registrazione</h3><p>L\u2019utente fornisce dati veritieri e mantiene la riservatezza delle credenziali. Ogni account è personale e non cedibile.</p><h3>Responsabilità</h3><p>SoundMarket agisce come intermediario tecnologico. Il contratto di compravendita si conclude tra acquirente e venditore.</p><h3>Proprietà intellettuale</h3><p>I marchi citati appartengono ai rispettivi titolari. Le immagini fotografiche provengono da archivi con licenza d\u2019uso.</p>' },
    privacy:{ title:'Informativa Privacy', html:'<h3>Titolare</h3><p>SoundMarket S.r.l., Via Montenapoleone 8, 20121 Milano (MI), P.IVA 04871220968.</p><h3>Dati trattati</h3><p>Dati anagrafici e di contatto, dati transazionali, dati tecnici di navigazione. In questo ambiente i dati sono archiviati esclusivamente nel localStorage del browser.</p><h3>Diritti</h3><p>Accesso, rettifica, cancellazione, limitazione, portabilità e opposizione (artt. 15-22 GDPR). La cancellazione dei dati del browser rimuove ogni informazione locale.</p>' },
    recessi:{ title:'Politica di Rimborso', html:'<h3>Finestra</h3><p>48 ore dalla consegna per aprire contestazione motivata. Oltre tale termine i fondi vengono sbloccati.</p><h3>Rimborso integrale</h3><p>Articolo non ricevuto, non conforme al grading, danni da imballo inadeguato, componente mancante non dichiarato.</p><h3>Tempi</h3><p>Accredito sul metodo originale entro 5-7 giorni lavorativi dall\u2019accoglimento.</p>' },
    assistenza:{ title:'Centro Assistenza', html:'<h3>Canali</h3><p>Per questioni transazionali usare la messaggistica interna: ogni conversazione è registrata e costituisce prova.</p><h3>Contatti</h3><p>Email: <b>assistenza@soundmarket.it</b><br>Telefono: <b>+39 02 8736 4512</b> (Lun-Ven 9:00-18:00)<br>Sede: Via Montenapoleone 8, 20121 Milano</p><h3>Tempi</h3><p>Assistenza transazionale: 4 ore lavorative. Segnalazioni: 12 ore. Amministrazione: 2 giorni.</p>' }
  };

  /* ---------- avvio idratazione immagini ---------- */
  const boot = () => {
    ITEMS.forEach(i => { const c = cache[i.sku]; if (c && c.ok && c.list.length) i.images = c.list.map(x => x.u); });
    document.addEventListener('error', (e) => {
      const im = e.target;
      if (!im || im.tagName !== 'IMG') return;
      if (im.dataset.smAlt && im.dataset.smAltTry !== '1') { im.dataset.smAltTry = '1'; im.src = im.dataset.smAlt; return; }
      if (im.dataset.smFb === '1') return;
      im.dataset.smFb = '1';
      const sku = im.dataset.smSku || closestSku(im);
      const it = sku ? findAny(sku) : ITEMS.find(x => x.title === im.alt);
      im.src = art(it ? it.category : '', it ? it.title : (im.alt || 'SoundMarket'));
      const w = im.closest('.card-img'); if (w) w.classList.add('loaded');
    }, true);
    document.addEventListener('load', (e) => {
      const im = e.target;
      if (!im || im.tagName !== 'IMG') return;
      if (im.dataset.smPending === '1' || (im.getAttribute('src') || '') === PENDING) return;
      const w = im.closest('.card-img'); if (w) w.classList.add('loaded');
    }, true);
    try {
      const mo = new MutationObserver(() => { scan(); });
      mo.observe(document.body, { childList:true, subtree:true });
    } catch (e) {}
    setInterval(scan, 1200);
    scan();
    prefetch();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return {
    CATEGORIES, GRADING, SIZES, COURIERS, protectionFee, shipCost,
    imagesFor, audioProfile, art, ITEMS, SELLERS, brands, priceHistory, INFO,
    refreshImages: scan
  };
})();