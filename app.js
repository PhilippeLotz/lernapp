const faecher = {
  "deutsch-plus": [
    { name: "Netzplantechnik", datei: "netzplantechnik" }
  ],
  "aeup": [
    { name: "Software-Ergonomie", datei: "softwareergonomie" }
  ,
    { name: "Daten", datei: "daten" }
  ],
  "pug": [
    { name: "Staatsaufgaben", datei: "staatsaufgaben" }
  ],
  "bgwp": [
    { name: "Ablauforganisation", datei: "ablauforganisation" }
  ],

  "fu-it": [],
  "englisch": [],
  "r-plus": []
};


// --------------------------------------------------
// LERNKARTEN UND LERNSTAND
// --------------------------------------------------

let alleKarten = [];
let karten = [];

let aktuelleKarte = 0;
let anzahlOriginal = 0;
let anzahlSicher = 0;

let gespeicherterLernstand = {};


// --------------------------------------------------
// SESSION
// --------------------------------------------------

let sessionStartzeit = null;
let sessionBearbeitet = 0;
let sessionSicher = 0;
let sessionTeilweise = 0;
let sessionUnsicher = 0;


// --------------------------------------------------
// HTML-ELEMENTE
// --------------------------------------------------

const fachAuswahl =
  document.getElementById("fachAuswahl");

const themaAuswahl =
  document.getElementById("themaAuswahl");

const lernartAuswahl =
  document.getElementById("lernartAuswahl");

const lernmodusAuswahl =
  document.getElementById("lernmodusAuswahl");

const mischenCheckbox =
  document.getElementById("mischenCheckbox");


const bereich =
  document.getElementById("bereich");

const frage =
  document.getElementById("frage");

const fortschritt =
  document.getElementById("fortschritt");


const antwortButton =
  document.getElementById("antwortButton");

const antwortBereich =
  document.getElementById("antwortBereich");

const antwortText =
  document.getElementById("antwortText");


const quizBereich =
  document.getElementById("quizBereich");

const quizAntwort =
  document.getElementById("quizAntwort");

const quizPruefenButton =
  document.getElementById("quizPruefenButton");


const bewertungBereich =
  document.getElementById("bewertungBereich");

const unsicherButton =
  document.getElementById("unsicherButton");

const teilweiseButton =
  document.getElementById("teilweiseButton");

const sicherButton =
  document.getElementById("sicherButton");


const weiterButton =
  document.getElementById("weiterButton");

const alleWiederholenButton =
  document.getElementById("alleWiederholenButton");

const lernstandResetButton =
  document.getElementById("lernstandResetButton");


// Lernstand-Übersicht
const lernstandUebersicht =
  document.getElementById("lernstandUebersicht");

const statistikGesamt =
  document.getElementById("statistikGesamt");

const statistikSicher =
  document.getElementById("statistikSicher");

const statistikTeilweise =
  document.getElementById("statistikTeilweise");

const statistikUnsicher =
  document.getElementById("statistikUnsicher");

const statistikOffen =
  document.getElementById("statistikOffen");

const fortschrittsBalken =
  document.getElementById("fortschrittsBalken");

const fortschrittsProzent =
  document.getElementById("fortschrittsProzent");


// Session-Auswertung
const sessionAuswertung =
  document.getElementById("sessionAuswertung");

const sessionBearbeitetElement =
  document.getElementById("sessionBearbeitet");

const sessionSicherElement =
  document.getElementById("sessionSicher");

const sessionTeilweiseElement =
  document.getElementById("sessionTeilweise");

const sessionUnsicherElement =
  document.getElementById("sessionUnsicher");

const sessionDauerElement =
  document.getElementById("sessionDauer");


// --------------------------------------------------
// GRUNDFUNKTIONEN
// --------------------------------------------------

function mischenAktiv() {
  return Boolean(
    mischenCheckbox &&
    mischenCheckbox.checked
  );
}


function aktuelleLernartLesen() {
  if (!lernartAuswahl) {
    return "lernkarten";
  }

  return lernartAuswahl.value;
}


function quizAktiv() {
  return aktuelleLernartLesen() === "quiz";
}


function aktuellenLernmodusLesen() {
  if (!lernmodusAuswahl) {
    return "offen";
  }

  return lernmodusAuswahl.value;
}


function lernmodusNameErmitteln() {
  const lernmodus =
    aktuellenLernmodusLesen();

  if (lernmodus === "unsicher") {
    return "Nur Unsichere";
  }

  if (lernmodus === "problematisch") {
    return "Unsichere + Teilweise";
  }

  if (lernmodus === "alle") {
    return "Alle Karten";
  }

  return "Offene Karten";
}


// --------------------------------------------------
// MISCHEN
// --------------------------------------------------

function kartenMischen(liste) {
  const gemischt = [...liste];

  for (
    let i = gemischt.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      gemischt[i],
      gemischt[j]
    ] = [
      gemischt[j],
      gemischt[i]
    ];
  }

  return gemischt;
}


function lernrundeVorbereiten(liste) {
  if (mischenAktiv()) {
    return kartenMischen(liste);
  }

  return [...liste];
}


// --------------------------------------------------
// LERNMODI
// --------------------------------------------------

function kartenNachLernmodusFiltern() {
  const lernmodus =
    aktuellenLernmodusLesen();

  if (lernmodus === "alle") {
    return [...alleKarten];
  }

  if (lernmodus === "unsicher") {
    return alleKarten.filter(karte => {
      const status =
        gespeicherterLernstand[
          karte.frage
        ];

      return (
        status?.bewertung === "unsicher"
      );
    });
  }

  if (lernmodus === "problematisch") {
    return alleKarten.filter(karte => {
      const status =
        gespeicherterLernstand[
          karte.frage
        ];

      return (
        status?.bewertung === "unsicher" ||
        status?.bewertung === "teilweise"
      );
    });
  }

  return alleKarten.filter(karte => {
    const status =
      gespeicherterLernstand[
        karte.frage
      ];

    return (
      status?.bewertung !== "sicher"
    );
  });
}


function lernrundeErstellen() {
  if (alleKarten.length === 0) {
    karten = [];
    aktuelleKarte = 0;
    return;
  }

  const gefilterteKarten =
    kartenNachLernmodusFiltern();

  karten =
    lernrundeVorbereiten(
      gefilterteKarten
    );

  aktuelleKarte = 0;
}


// --------------------------------------------------
// FÄCHER UND THEMEN
// --------------------------------------------------

function themenAktualisieren() {
  const fach =
    fachAuswahl.value;

  themaAuswahl.innerHTML =
    '<option value="">Thema auswählen</option>';

  if (!fach) {
    return;
  }

  const themen =
    faecher[fach];

  if (!themen) {
    console.error(
      `Das Fach "${fach}" ist nicht eingetragen.`
    );

    return;
  }

  if (themen.length === 0) {
    const option =
      document.createElement("option");

    option.value = "";

    option.textContent =
      "Noch keine Themen vorhanden";

    themaAuswahl.appendChild(option);

    return;
  }

  themen.forEach(thema => {
    const option =
      document.createElement("option");

    option.value =
      thema.datei;

    option.textContent =
      thema.name;

    themaAuswahl.appendChild(option);
  });
}


// --------------------------------------------------
// LOCALSTORAGE
// --------------------------------------------------

function speicherSchluesselErstellen() {
  const fach =
    fachAuswahl.value;

  const thema =
    themaAuswahl.value;

  if (!fach || !thema) {
    return "";
  }

  return `lernapp-${fach}-${thema}`;
}


function lernstandLaden() {
  const speicherSchluessel =
    speicherSchluesselErstellen();

  if (!speicherSchluessel) {
    return {};
  }

  try {
    const gespeicherterText =
      localStorage.getItem(
        speicherSchluessel
      );

    if (!gespeicherterText) {
      return {};
    }

    const daten =
      JSON.parse(
        gespeicherterText
      );

    if (
      daten === null ||
      typeof daten !== "object" ||
      Array.isArray(daten)
    ) {
      return {};
    }

    return daten;

  } catch (fehler) {
    console.error(
      "Lernstand konnte nicht geladen werden:",
      fehler
    );

    return {};
  }
}


function lernstandSpeichern(
  karte,
  bewertung
) {
  const speicherSchluessel =
    speicherSchluesselErstellen();

  if (
    !speicherSchluessel ||
    !karte
  ) {
    return;
  }

  gespeicherterLernstand[
    karte.frage
  ] = {
    bewertung: bewertung,
    zuletztGelernt:
      new Date().toISOString()
  };

  try {
    localStorage.setItem(
      speicherSchluessel,
      JSON.stringify(
        gespeicherterLernstand
      )
    );

  } catch (fehler) {
    console.error(
      "Lernstand konnte nicht gespeichert werden:",
      fehler
    );
  }
}


// --------------------------------------------------
// LERNSTAND-STATISTIK
// --------------------------------------------------

function lernstandZaehlen() {
  let sicher = 0;
  let teilweise = 0;
  let unsicher = 0;
  let offen = 0;

  alleKarten.forEach(karte => {
    const status =
      gespeicherterLernstand[
        karte.frage
      ];

    if (
      status?.bewertung === "sicher"
    ) {
      sicher++;

    } else if (
      status?.bewertung === "teilweise"
    ) {
      teilweise++;

    } else if (
      status?.bewertung === "unsicher"
    ) {
      unsicher++;

    } else {
      offen++;
    }
  });

  return {
    sicher,
    teilweise,
    unsicher,
    offen
  };
}


function sichereKartenZaehlen() {
  return lernstandZaehlen().sicher;
}


function lernstandUebersichtAktualisieren() {
  if (alleKarten.length === 0) {
    lernstandUebersicht.classList.add(
      "versteckt"
    );

    return;
  }

  const zaehler =
    lernstandZaehlen();

  const gesamt =
    alleKarten.length;

  const prozent =
    gesamt > 0
      ? Math.round(
          (
            zaehler.sicher /
            gesamt
          ) * 100
        )
      : 0;

  statistikGesamt.textContent =
    gesamt;

  statistikSicher.textContent =
    zaehler.sicher;

  statistikTeilweise.textContent =
    zaehler.teilweise;

  statistikUnsicher.textContent =
    zaehler.unsicher;

  statistikOffen.textContent =
    zaehler.offen;

  fortschrittsBalken.value =
    prozent;

  fortschrittsBalken.textContent =
    `${prozent} %`;

  fortschrittsProzent.textContent =
    `${prozent} % sicher`;

  lernstandUebersicht.classList.remove(
    "versteckt"
  );
}


// --------------------------------------------------
// SESSION
// --------------------------------------------------

function sessionStarten() {
  sessionStartzeit =
    new Date();

  sessionBearbeitet = 0;
  sessionSicher = 0;
  sessionTeilweise = 0;
  sessionUnsicher = 0;

  sessionAuswertung.classList.add(
    "versteckt"
  );

  sessionAuswertungAktualisieren();
}


function dauerFormatieren(
  dauerInSekunden
) {
  const minuten =
    Math.floor(
      dauerInSekunden / 60
    );

  const sekunden =
    dauerInSekunden % 60;

  return (
    String(minuten).padStart(2, "0") +
    ":" +
    String(sekunden).padStart(2, "0")
  );
}


function sessionAuswertungAktualisieren() {
  sessionBearbeitetElement.textContent =
    sessionBearbeitet;

  sessionSicherElement.textContent =
    sessionSicher;

  sessionTeilweiseElement.textContent =
    sessionTeilweise;

  sessionUnsicherElement.textContent =
    sessionUnsicher;

  let dauerInSekunden = 0;

  if (sessionStartzeit) {
    dauerInSekunden =
      Math.max(
        0,
        Math.floor(
          (
            new Date() -
            sessionStartzeit
          ) / 1000
        )
      );
  }

  sessionDauerElement.textContent =
    dauerFormatieren(
      dauerInSekunden
    );
}


function sessionBewertungSpeichern(
  bewertung
) {
  if (!sessionStartzeit) {
    sessionStarten();
  }

  sessionBearbeitet++;

  if (bewertung === "sicher") {
    sessionSicher++;
  }

  if (bewertung === "teilweise") {
    sessionTeilweise++;
  }

  if (bewertung === "unsicher") {
    sessionUnsicher++;
  }

  sessionAuswertungAktualisieren();
}


function sessionAuswertungAnzeigen() {
  sessionAuswertungAktualisieren();

  sessionAuswertung.classList.remove(
    "versteckt"
  );
}


// --------------------------------------------------
// DECK LADEN
// --------------------------------------------------

async function deckLaden() {
  const fach =
    fachAuswahl.value;

  const thema =
    themaAuswahl.value;

  if (!fach || !thema) {
    return;
  }

  try {
    const response =
      await fetch(
        `decks/${fach}/${thema}.json`
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const daten =
      await response.json();

    if (!Array.isArray(daten)) {
      throw new Error(
        "JSON enthält keine Kartenliste."
      );
    }

    alleKarten =
      [...daten];

    anzahlOriginal =
      alleKarten.length;

    gespeicherterLernstand =
      lernstandLaden();

    anzahlSicher =
      sichereKartenZaehlen();

    lernrundeErstellen();

    lernstandUebersichtAktualisieren();

    sessionStarten();

    alleWiederholenButton.disabled =
      alleKarten.length === 0;

    lernstandResetButton.disabled =
      alleKarten.length === 0;

    if (karten.length === 0) {
      leereLernrundeAnzeigen();
      return;
    }

    karteAnzeigen();

  } catch (fehler) {
    console.error(
      "Deck konnte nicht geladen werden:",
      fehler
    );

    alleKarten = [];
    karten = [];

    aktuelleKarte = 0;
    anzahlOriginal = 0;
    anzahlSicher = 0;

    gespeicherterLernstand = {};

    bereich.textContent = "";

    frage.textContent =
      "Lernkarten konnten nicht geladen werden.";

    antwortText.textContent = "";
    fortschritt.textContent = "";

    lernbereicheVerstecken();

    lernstandUebersicht.classList.add(
      "versteckt"
    );

    sessionAuswertung.classList.add(
      "versteckt"
    );

    antwortButton.disabled = true;
    quizPruefenButton.disabled = true;
    weiterButton.disabled = true;

    alleWiederholenButton.disabled =
      true;

    lernstandResetButton.disabled =
      true;
  }
}


// --------------------------------------------------
// OBERFLÄCHE
// --------------------------------------------------

function lernbereicheVerstecken() {
  antwortBereich.classList.add(
    "versteckt"
  );

  bewertungBereich.classList.add(
    "versteckt"
  );

  quizBereich.classList.add(
    "versteckt"
  );
}


function lernartOberflaecheAktualisieren() {
  antwortBereich.classList.add(
    "versteckt"
  );

  bewertungBereich.classList.add(
    "versteckt"
  );

  quizAntwort.value = "";
  quizAntwort.disabled = false;
  quizAntwort.setCustomValidity("");

  quizPruefenButton.disabled = false;

  if (quizAktiv()) {
    quizBereich.classList.remove(
      "versteckt"
    );

    antwortButton.classList.add(
      "versteckt"
    );

    setTimeout(
      () => quizAntwort.focus(),
      0
    );

  } else {
    quizBereich.classList.add(
      "versteckt"
    );

    antwortButton.classList.remove(
      "versteckt"
    );

    antwortButton.textContent =
      "Antwort anzeigen";
  }
}


function leereLernrundeAnzeigen() {
  const lernmodus =
    aktuellenLernmodusLesen();

  bereich.textContent =
    lernmodusNameErmitteln();

  if (
    anzahlOriginal > 0 &&
    anzahlSicher === anzahlOriginal &&
    lernmodus === "offen"
  ) {
    frage.textContent =
      `Alle ${anzahlOriginal} Karten sind bereits sicher.`;

  } else if (
    lernmodus === "unsicher"
  ) {
    frage.textContent =
      "Es sind keine unsicheren Karten gespeichert.";

  } else if (
    lernmodus === "problematisch"
  ) {
    frage.textContent =
      "Es sind keine unsicheren oder teilweise bekannten Karten gespeichert.";

  } else if (
    lernmodus === "alle"
  ) {
    frage.textContent =
      "Für dieses Thema sind keine Karten vorhanden.";

  } else {
    frage.textContent =
      "Für diesen Lernmodus sind keine Karten vorhanden.";
  }

  antwortText.textContent = "";

  fortschritt.textContent =
    `${anzahlSicher} von ${anzahlOriginal} Karten sicher`;

  lernbereicheVerstecken();

  antwortButton.classList.remove(
    "versteckt"
  );

  antwortButton.textContent =
    "Antwort anzeigen";

  antwortButton.disabled = true;
  quizPruefenButton.disabled = true;
  weiterButton.disabled = true;

  sessionAuswertungAnzeigen();
}


function karteAnzeigen() {
  if (karten.length === 0) {
    leereLernrundeAnzeigen();
    return;
  }

  if (
    aktuelleKarte >= karten.length
  ) {
    aktuelleKarte = 0;
  }

  const karte =
    karten[aktuelleKarte];

  bereich.textContent =
    karte.bereich || "";

  frage.textContent =
    karte.frage;

  antwortText.textContent =
    karte.antwort;

  fortschritt.textContent =
    `${lernmodusNameErmitteln()} · Noch ${karten.length} Karten · ${anzahlSicher} sicher`;

  antwortButton.disabled = false;
  weiterButton.disabled = false;

  lernartOberflaecheAktualisieren();
}


// --------------------------------------------------
// WIEDERHOLUNGSLOGIK
// --------------------------------------------------

function wiederholungsPositionBestimmen(
  bewertung,
  aktuellePosition,
  anzahlVerbleibend
) {
  if (anzahlVerbleibend <= 2) {
    return anzahlVerbleibend;
  }

  if (anzahlVerbleibend <= 4) {
    if (bewertung === "unsicher") {
      return Math.min(
        aktuellePosition + 1,
        anzahlVerbleibend
      );
    }

    return anzahlVerbleibend;
  }

  if (anzahlVerbleibend <= 7) {
    if (bewertung === "unsicher") {
      return Math.min(
        aktuellePosition + 2,
        anzahlVerbleibend
      );
    }

    return Math.min(
      aktuellePosition + 4,
      anzahlVerbleibend
    );
  }

  if (bewertung === "unsicher") {
    return Math.min(
      aktuellePosition + 2,
      anzahlVerbleibend
    );
  }

  return Math.min(
    aktuellePosition + 5,
    anzahlVerbleibend
  );
}


function karteBewerten(bewertung) {
  if (karten.length === 0) {
    return;
  }

  const bewerteteKarte =
    karten[aktuelleKarte];

  lernstandSpeichern(
    bewerteteKarte,
    bewertung
  );

  sessionBewertungSpeichern(
    bewertung
  );

  anzahlSicher =
    sichereKartenZaehlen();

  lernstandUebersichtAktualisieren();

  karten.splice(
    aktuelleKarte,
    1
  );

  if (
    bewertung === "unsicher" ||
    bewertung === "teilweise"
  ) {
    const neuePosition =
      wiederholungsPositionBestimmen(
        bewertung,
        aktuelleKarte,
        karten.length
      );

    karten.splice(
      neuePosition,
      0,
      bewerteteKarte
    );
  }

  if (karten.length === 0) {
    if (
      anzahlSicher === anzahlOriginal
    ) {
      lernrundeBeenden();
    } else {
      leereLernrundeAnzeigen();
    }

    return;
  }

  if (
    aktuelleKarte >= karten.length
  ) {
    aktuelleKarte = 0;
  }

  karteAnzeigen();
}


// --------------------------------------------------
// QUIZ
// --------------------------------------------------

function quizAntwortPruefen() {
  if (
    !quizAktiv() ||
    karten.length === 0
  ) {
    return;
  }

  const eigeneAntwort =
    quizAntwort.value.trim();

  if (!eigeneAntwort) {
    quizAntwort.setCustomValidity(
      "Bitte schreibe zuerst eine Antwort."
    );

    quizAntwort.reportValidity();
    quizAntwort.focus();

    return;
  }

  quizAntwort.setCustomValidity("");

  quizAntwort.disabled = true;
  quizPruefenButton.disabled = true;

  antwortBereich.classList.remove(
    "versteckt"
  );

  bewertungBereich.classList.remove(
    "versteckt"
  );
}


// --------------------------------------------------
// LERNRUNDE UND RESET
// --------------------------------------------------

function alleKartenWiederholen() {
  if (alleKarten.length === 0) {
    return;
  }

  karten =
    lernrundeVorbereiten(
      alleKarten
    );

  aktuelleKarte = 0;

  anzahlSicher =
    sichereKartenZaehlen();

  sessionStarten();

  karteAnzeigen();
}


function lernstandZuruecksetzen() {
  const speicherSchluessel =
    speicherSchluesselErstellen();

  if (
    !speicherSchluessel ||
    alleKarten.length === 0
  ) {
    return;
  }

  const bestaetigt =
    window.confirm(
      "Möchtest du den Lernstand für dieses Thema wirklich zurücksetzen?"
    );

  if (!bestaetigt) {
    return;
  }

  try {
    localStorage.removeItem(
      speicherSchluessel
    );

  } catch (fehler) {
    console.error(
      "Lernstand konnte nicht gelöscht werden:",
      fehler
    );

    return;
  }

  gespeicherterLernstand = {};
  anzahlSicher = 0;

  lernrundeErstellen();

  if (
    karten.length === 0 &&
    alleKarten.length > 0
  ) {
    lernmodusAuswahl.value =
      "offen";

    lernrundeErstellen();
  }

  lernstandUebersichtAktualisieren();

  sessionStarten();

  karteAnzeigen();
}


function lernrundeBeenden() {
  bereich.textContent =
    "Lernrunde abgeschlossen";

  frage.textContent =
    `Du hast alle ${anzahlOriginal} Karten als sicher bewertet.`;

  antwortText.textContent = "";

  fortschritt.textContent =
    `Noch 0 Karten · ${anzahlSicher} sicher`;

  lernbereicheVerstecken();

  antwortButton.classList.remove(
    "versteckt"
  );

  antwortButton.disabled = true;
  quizPruefenButton.disabled = true;
  weiterButton.disabled = true;

  alleWiederholenButton.disabled =
    alleKarten.length === 0;

  lernstandResetButton.disabled =
    alleKarten.length === 0;

  lernstandUebersichtAktualisieren();

  sessionAuswertungAnzeigen();
}


// --------------------------------------------------
// RESET DER ANSICHT
// --------------------------------------------------

function ansichtZuruecksetzen() {
  alleKarten = [];
  karten = [];

  aktuelleKarte = 0;
  anzahlOriginal = 0;
  anzahlSicher = 0;

  gespeicherterLernstand = {};

  sessionStartzeit = null;
  sessionBearbeitet = 0;
  sessionSicher = 0;
  sessionTeilweise = 0;
  sessionUnsicher = 0;

  bereich.textContent = "";

  frage.textContent =
    "Bitte ein Thema auswählen.";

  antwortText.textContent = "";
  fortschritt.textContent = "";

  quizAntwort.value = "";
  quizAntwort.disabled = false;
  quizAntwort.setCustomValidity("");

  lernbereicheVerstecken();

  lernstandUebersicht.classList.add(
    "versteckt"
  );

  sessionAuswertung.classList.add(
    "versteckt"
  );

  antwortButton.classList.remove(
    "versteckt"
  );

  antwortButton.textContent =
    "Antwort anzeigen";

  antwortButton.disabled = true;
  quizPruefenButton.disabled = true;
  weiterButton.disabled = true;

  alleWiederholenButton.disabled =
    true;

  lernstandResetButton.disabled =
    true;
}


// --------------------------------------------------
// MODUSWECHSEL
// --------------------------------------------------

function lernmodusWechseln() {
  if (alleKarten.length === 0) {
    return;
  }

  anzahlSicher =
    sichereKartenZaehlen();

  lernrundeErstellen();

  sessionStarten();

  if (karten.length === 0) {
    leereLernrundeAnzeigen();
    return;
  }

  karteAnzeigen();
}


function lernartWechseln() {
  if (karten.length === 0) {
    lernbereicheVerstecken();

    antwortButton.classList.remove(
      "versteckt"
    );

    antwortButton.disabled = true;
    quizPruefenButton.disabled = true;

    return;
  }

  karteAnzeigen();
}


// --------------------------------------------------
// TASTATURSTEUERUNG
// --------------------------------------------------

function eingabefeldAktiv() {
  const element =
    document.activeElement;

  return (
    element === quizAntwort ||
    element?.tagName === "INPUT" ||
    element?.tagName === "TEXTAREA" ||
    element?.tagName === "SELECT"
  );
}


function tastaturSteuern(event) {
  const schreibtGerade =
    eingabefeldAktiv();

  if (
    event.key === "Enter" &&
    quizAktiv() &&
    document.activeElement === quizAntwort
  ) {
    event.preventDefault();

    if (!quizPruefenButton.disabled) {
      quizAntwortPruefen();
    }

    return;
  }

  if (schreibtGerade) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();

    if (
      !quizAktiv() &&
      !antwortButton.disabled
    ) {
      antwortButton.click();
    }

    return;
  }

  if (
    event.key === "1" &&
    !bewertungBereich.classList.contains(
      "versteckt"
    )
  ) {
    unsicherButton.click();
    return;
  }

  if (
    event.key === "2" &&
    !bewertungBereich.classList.contains(
      "versteckt"
    )
  ) {
    teilweiseButton.click();
    return;
  }

  if (
    event.key === "3" &&
    !bewertungBereich.classList.contains(
      "versteckt"
    )
  ) {
    sicherButton.click();
    return;
  }

  if (
    event.key === "ArrowRight" &&
    !weiterButton.disabled
  ) {
    event.preventDefault();

    weiterButton.click();
  }
}


// --------------------------------------------------
// EVENT-LISTENER
// --------------------------------------------------

// Antwort anzeigen / ausblenden
antwortButton.addEventListener(
  "click",
  () => {
    if (quizAktiv()) {
      return;
    }

    const versteckt =
      antwortBereich.classList.toggle(
        "versteckt"
      );

    antwortButton.textContent =
      versteckt
        ? "Antwort anzeigen"
        : "Antwort ausblenden";

    if (versteckt) {
      bewertungBereich.classList.add(
        "versteckt"
      );
    } else {
      bewertungBereich.classList.remove(
        "versteckt"
      );
    }
  }
);


// Quizantwort prüfen
quizPruefenButton.addEventListener(
  "click",
  quizAntwortPruefen
);


// Quiz-Fehler zurücksetzen
quizAntwort.addEventListener(
  "input",
  () => {
    quizAntwort.setCustomValidity("");
  }
);


// Bewertungen
unsicherButton.addEventListener(
  "click",
  () => {
    karteBewerten("unsicher");
  }
);


teilweiseButton.addEventListener(
  "click",
  () => {
    karteBewerten("teilweise");
  }
);


sicherButton.addEventListener(
  "click",
  () => {
    karteBewerten("sicher");
  }
);


// Nächste Karte
weiterButton.addEventListener(
  "click",
  () => {
    if (karten.length === 0) {
      return;
    }

    aktuelleKarte =
      (
        aktuelleKarte + 1
      ) % karten.length;

    karteAnzeigen();
  }
);


// Alle Karten wiederholen
alleWiederholenButton.addEventListener(
  "click",
  alleKartenWiederholen
);


// Lernstand zurücksetzen
lernstandResetButton.addEventListener(
  "click",
  lernstandZuruecksetzen
);


// Lernart wechseln
lernartAuswahl.addEventListener(
  "change",
  lernartWechseln
);


// Lernmodus wechseln
lernmodusAuswahl.addEventListener(
  "change",
  lernmodusWechseln
);


// Fach wechseln
fachAuswahl.addEventListener(
  "change",
  () => {
    themenAktualisieren();
    ansichtZuruecksetzen();
  }
);


// Thema wechseln
themaAuswahl.addEventListener(
  "change",
  () => {
    if (!themaAuswahl.value) {
      ansichtZuruecksetzen();
      return;
    }

    deckLaden();
  }
);


// Tastatursteuerung
document.addEventListener(
  "keydown",
  tastaturSteuern
);


// Mischen wird bei der nächsten
// neu erzeugten Lernrunde angewendet
mischenCheckbox.addEventListener(
  "change",
  () => {
    // Absichtlich keine direkte Aktion.
  }
);


// --------------------------------------------------
// START
// --------------------------------------------------

themenAktualisieren();
ansichtZuruecksetzen();