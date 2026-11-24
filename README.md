# SoundMarket - Marketplace Musicale Verticale

**Progetto Individuale**  
**Classe:** 5G Informatica  
**Studente:** Andrea Fallucchi  
**Docente:** Prof. Buccino  
**Anno Scolastico:** 2026/2027  
**Tema di riferimento:** D - Vendita dell'usato (Marketplace verticale musicale)

---

## 1. Descrizione del Progetto

SoundMarket è una Progressive Web App (PWA) che realizza la simulazione di un marketplace verticale dedicato esclusivamente al settore musicale. La piattaforma consente a musicisti, collezionisti e appassionati di acquistare e vendere strumenti musicali, supporti audio (vinili, CD, cassette) e accessori, gestendo specifiche tecniche proprie del dominio musicale quali il grading dei dischi, le caratteristiche elettriche degli accessori e le anteprime audio dei prodotti.

Il progetto è stato sviluppato nell'ambito del percorso didattico di Informatica della classe quinta, con l'obiettivo di applicare i principi della progettazione di basi di dati relazionali e dello sviluppo di applicazioni web moderne.

---

## 2. Funzionalità Principali

Il sistema implementa le seguenti funzionalità core:

- **Catalogo dinamico:** pubblicazione e consultazione di articoli suddivisi per categoria (Strumenti Musicali, Supporti Audio, Accessori), con attributi specifici per ciascuna tipologia.
- **Sistema di trattativa:** messaggistica interna tra utenti per la negoziazione informale precedente all'acquisto.
- **Gestione transazionale:** carrello, simulazione di pagamenti, tracciamento dello stato degli ordini e delle spedizioni.
- **Sistema di recensioni:** feedback post-acquisto con valutazione numerica e testuale.
- **Lista preferiti:** possibilità per gli utenti di salvare articoli di interesse.
- **Ricerca avanzata:** filtri per categoria, genere musicale e caratteristiche tecniche.

---

## 3. Progettazione del Database

Il modello di dati è stato progettato secondo i principi della modellazione concettuale e logica relazionale. Il diagramma Entità-Relazione comprende:

- **11 entità principali** (Utente, Articolo, Ordine, Trattativa, Messaggio, Recensione, Supporto_Audio, Strumento_Musicale, Accessorio, Genere_Musicale, Sample_Audio)
- **2 relazioni molti-a-molti (N:M)**, risolte mediante tabelle associative (Preferito, Partecipazione)
- **1 generalizzazione** dell'entità Utente nei ruoli di Venditore e Acquirente
- **1 entità debole** (Messaggio), la cui esistenza è vincolata all'entità Trattativa

La documentazione completa, comprensiva di diagramma E/R, specifiche delle entità e degli attributi, è disponibile nel documento PDF allegato alla repository.

---

## 4. Architettura Tecnologica

L'applicazione è stata sviluppata utilizzando tecnologie web standard, senza ricorso a framework esterni:

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Architettura:** Progressive Web App (PWA) con manifest.json e service worker per il funzionamento offline e l'installabilità su dispositivi desktop e mobile
- **Ambiente di sviluppo:** Visual Studio Code
- **Versioning e deploy:** GitHub con pubblicazione tramite GitHub Pages

---

## 5. Documentazione

| Documento | Descrizione |
|-----------|-------------|
| [Fallucchi_Andrea_SoundMarket.pdf](./Fallucchi_Andrea_SoundMarket.pdf) | Relazione tecnica completa: analisi del tema, modello concettuale E/R, modello logico con tabelle e attributi, relazioni e cardinalità |
| Diagramma E/R | Rappresentazione grafica del modello concettuale (presente nella relazione PDF) |

---

## 6. Installazione e Utilizzo

L'applicazione è pubblicata e accessibile tramite GitHub Pages. Essendo una PWA, è possibile installarla sul dispositivo (desktop o mobile) utilizzando la funzione "Installa applicazione" offerta dal browser, per un'esperienza di utilizzo nativa.

---

*Progetto realizzato nell'ambito del percorso di studi di Informatica, Istituto Tecnico Tecnologico, indirizzo Informatica e Telecomunicazioni.*
