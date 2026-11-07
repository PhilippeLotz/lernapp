const faecher = {
  "deutsch-plus": {
    name: "Deutsch+",
    themen: [
      {
        name: "Netzplantechnik",
        datei: "netzplantechnik"
      }
    ]
  },

  "aeup": {
    name: "AEuP",
    themen: [
      {
        name: "Software-Ergonomie",
        datei: "softwareergonomie"
      },
      {
        name: "Daten",
        datei: "daten"
      }
    ]
  },

  "pug": {
    name: "PuG",
    themen: [
      {
        name: "Staatsaufgaben",
        datei: "staatsaufgaben"
      }
    ]
  },

  "bgwp": {
    name: "BGWP",
    themen: [
      {
        name: "Ablauforganisation",
        datei: "ablauforganisation"
      }
    ]
  },

  "fu-it": {
    name: "FU-IT",
    themen: []
  },

  "englisch": {
    name: "Englisch",
    themen: []
  },

  "r-plus": {
    name: "R-Plus",
    themen: []
  }
};

const ALLE_THEMEN_WERT = "__alle__";


// --------------------------------------------------
// LERNKARTEN UND LERNSTAND
// --------------------------------------------------

let alleKarten = [];
let karten = [];

let aktuelleKarte = 0;
let anzahlOriginal = 0;
let anzahlSicher = 0;

let gespeicherterLernstand = {};

// Multiple-Choice-Zustand
let multipleChoiceOptionenAktuell = [];
let multipleChoiceGeprueft = false;


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

const multipleChoiceBereich =
  document.getElementById("multipleChoiceBereich");

const multipleChoiceOptionen =
  document.getElementById("multipleChoiceOptionen");

const multipleChoicePruefenButton =
  document.getElementById("multipleChoicePruefenButton");

const multipleChoiceErgebnis =
  document.getElementById("multipleChoiceErgebnis");

const multipleChoiceRueckmeldung =
  document.getElementById("multipleChoiceRueckmeldung");

const multipleChoiceRichtigeAntwort =
  document.getElementById("multipleChoiceRichtigeAntwort");

const multipleChoiceErklaerungBereich =
  document.getElementById("multipleChoiceErklaerungBereich");

const multipleChoiceErklaerung =
  document.getElementById("multipleChoiceErklaerung");


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


function alleThemenAktiv() {
  return themaAuswahl.value === ALLE_THEMEN_WERT;
}


function mischenSteuerungAktualisieren() {
  if (!mischenCheckbox) {
    return;
  }

  if (alleThemenAktiv()) {
    mischenCheckbox.checked = true;
    mischenCheckbox.disabled = true;
    mischenCheckbox.title =
      "Bei Alle Themen werden die Karten immer gemischt.";
  } else {
    mischenCheckbox.disabled = false;
    mischenCheckbox.title = "";
  }
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

function multipleChoiceAktiv() {
  return aktuelleLernartLesen() === "multiplechoice";
}

function karteHatGueltigesMultipleChoice(karte) {
  const multipleChoice =
    karte?.multipleChoice;

  if (
    !multipleChoice ||
    multipleChoice.typ !== "single" ||
    !Array.isArray(multipleChoice.optionen) ||
    multipleChoice.optionen.length < 2
  ) {
    return false;
  }

  const richtigeOptionen =
    multipleChoice.optionen.filter(
      option => option?.richtig === true
    );

  return richtigeOptionen.length === 1;
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
// FÄCHER ALPHABETISCH ERZEUGEN
// --------------------------------------------------

function faecherAktualisieren() {
  fachAuswahl.innerHTML =
    '<option value="">Fach auswählen</option>';

  const sortierteFaecher =
    Object.entries(faecher).sort(
      ([, fachA], [, fachB]) =>
        fachA.name.localeCompare(
          fachB.name,
          "de",
          {
            sensitivity: "base"
          }
        )
    );

  sortierteFaecher.forEach(
    ([fachId, fach]) => {
      const option =
        document.createElement("option");

      option.value = fachId;
      option.textContent = fach.name;

      fachAuswahl.appendChild(option);
    }
  );
}


// --------------------------------------------------
// THEMEN ALPHABETISCH ERZEUGEN
// --------------------------------------------------

function themenAktualisieren() {
  const fachId =
    fachAuswahl.value;

  themaAuswahl.innerHTML =
    '<option value="">Thema auswählen</option>';

  if (!fachId) {
    mischenSteuerungAktualisieren();
    return;
  }

  const fach =
    faecher[fachId];

  if (!fach) {
    console.error(
      `Das Fach "${fachId}" ist nicht eingetragen.`
    );
    mischenSteuerungAktualisieren();
    return;
  }

  if (fach.themen.length === 0) {
    const option =
      document.createElement("option");

    option.value = "";
    option.textContent =
      "Noch keine Themen vorhanden";

    themaAuswahl.appendChild(option);
    mischenSteuerungAktualisieren();
    return;
  }

  const alleOption =
    document.createElement("option");

  alleOption.value = ALLE_THEMEN_WERT;
  alleOption.textContent = "Alle Themen";
  themaAuswahl.appendChild(alleOption);

  const sortierteThemen =
    [...fach.themen].sort(
      (themaA, themaB) =>
        themaA.name.localeCompare(
          themaB.name,
          "de",
          { sensitivity: "base" }
        )
    );

  sortierteThemen.forEach(thema => {
    const option =
      document.createElement("option");

    option.value = thema.datei;
    option.textContent = thema.name;
    themaAuswahl.appendChild(option);
  });

  mischenSteuerungAktualisieren();
}


// --------------------------------------------------
// KARTEN MISCHEN
// --------------------------------------------------

function kartenMischen(liste) {
  const gemischt =
    [...liste];

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
  if (
    alleThemenAktiv() ||
    mischenAktiv()
  ) {
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
          karte.id
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
          karte.id
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
        karte.id
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

  let gefilterteKarten =
    kartenNachLernmodusFiltern();

  if (multipleChoiceAktiv()) {
    gefilterteKarten =
      gefilterteKarten.filter(
        karteHatGueltigesMultipleChoice
      );
  }

  karten =
    lernrundeVorbereiten(
      gefilterteKarten
    );

  aktuelleKarte = 0;
}


// --------------------------------------------------
// LOCALSTORAGE
// --------------------------------------------------

function speicherSchluesselErstellen(
  karte = null,
  themaOverride = ""
) {
  const fach =
    karte?.__fach || fachAuswahl.value;

  const thema =
    karte?.__thema ||
    themaOverride ||
    themaAuswahl.value;

  if (
    !fach ||
    !thema ||
    thema === ALLE_THEMEN_WERT
  ) {
    return "";
  }

  return `lernapp-${fach}-${thema}`;
}


function lernstandAusSchluesselLaden(
  speicherSchluessel
) {
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
      JSON.parse(gespeicherterText);

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


function lernstandLaden() {
  if (!alleThemenAktiv()) {
    return lernstandAusSchluesselLaden(
      speicherSchluesselErstellen()
    );
  }

  const fachId =
    fachAuswahl.value;
  const fach =
    faecher[fachId];
  const zusammengefuehrt = {};

  if (!fach) {
    return zusammengefuehrt;
  }

  fach.themen.forEach(thema => {
    const schluessel =
      speicherSchluesselErstellen(
        null,
        thema.datei
      );

    Object.assign(
      zusammengefuehrt,
      lernstandAusSchluesselLaden(
        schluessel
      )
    );
  });

  return zusammengefuehrt;
}


function lernstandSpeichern(
  karte,
  bewertung
) {
  if (!karte) {
    return;
  }

  const speicherSchluessel =
    speicherSchluesselErstellen(karte);

  if (!speicherSchluessel) {
    return;
  }

  const eintrag = {
    bewertung: bewertung,
    zuletztGelernt:
      new Date().toISOString()
  };

  gespeicherterLernstand[karte.id] =
    eintrag;

  const themenLernstand =
    lernstandAusSchluesselLaden(
      speicherSchluessel
    );

  themenLernstand[karte.id] = eintrag;

  try {
    localStorage.setItem(
      speicherSchluessel,
      JSON.stringify(themenLernstand)
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
        karte.id
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

async function deckDatenValidieren(
  daten,
  dateiName
) {
  if (!Array.isArray(daten)) {
    throw new Error(
      `${dateiName}: JSON enthält keine Kartenliste.`
    );
  }

  const ungueltigeKarte =
    daten.find(karte => (
      !karte ||
      typeof karte !== "object" ||
      typeof karte.id !== "string" ||
      !karte.id.trim() ||
      typeof karte.frage !== "string" ||
      typeof karte.antwort !== "string"
    ));

  if (ungueltigeKarte) {
    throw new Error(
      `${dateiName}: Mindestens eine Karte besitzt keine gültige ID, Frage oder Antwort.`
    );
  }
}


async function einzelnesDeckLaden(
  fachId,
  thema
) {
  const response =
    await fetch(
      `decks/${fachId}/${thema.datei}.json`
    );

  if (!response.ok) {
    throw new Error(
      `${thema.datei}.json: HTTP ${response.status}`
    );
  }

  const daten =
    await response.json();

  deckDatenValidieren(
    daten,
    thema.datei
  );

  return daten.map(karte => ({
    ...karte,
    __fach: fachId,
    __thema: thema.datei,
    __themaName: thema.name
  }));
}


async function deckLaden() {
  const fachId =
    fachAuswahl.value;
  const themaId =
    themaAuswahl.value;
  const fach =
    faecher[fachId];

  if (
    !fachId ||
    !themaId ||
    !fach
  ) {
    return;
  }

  try {
    if (alleThemenAktiv()) {
      const deckListen =
        await Promise.all(
          fach.themen.map(thema =>
            einzelnesDeckLaden(
              fachId,
              thema
            )
          )
        );

      alleKarten =
        deckListen.flat();
    } else {
      const thema =
        fach.themen.find(
          eintrag =>
            eintrag.datei === themaId
        );

      if (!thema) {
        throw new Error(
          `Thema "${themaId}" wurde nicht gefunden.`
        );
      }

      alleKarten =
        await einzelnesDeckLaden(
          fachId,
          thema
        );
    }

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
    multipleChoicePruefenButton.disabled = true;
    weiterButton.disabled = true;
    alleWiederholenButton.disabled = true;
    lernstandResetButton.disabled = true;
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

  multipleChoiceBereich.classList.add(
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

  quizBereich.classList.add(
    "versteckt"
  );

  multipleChoiceBereich.classList.add(
    "versteckt"
  );

  antwortButton.classList.add(
    "versteckt"
  );

  quizAntwort.value = "";
  quizAntwort.disabled = false;
  quizAntwort.setCustomValidity("");
  quizPruefenButton.disabled = false;

  multipleChoiceZuruecksetzen();

  if (quizAktiv()) {
    quizBereich.classList.remove(
      "versteckt"
    );

    setTimeout(
      () => quizAntwort.focus(),
      0
    );

    return;
  }

  if (multipleChoiceAktiv()) {
    multipleChoiceBereich.classList.remove(
      "versteckt"
    );

    multipleChoiceAnzeigen(
      karten[aktuelleKarte]
    );

    return;
  }

  antwortButton.classList.remove(
    "versteckt"
  );

  antwortButton.textContent =
    "Antwort anzeigen";
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
  multipleChoicePruefenButton.disabled = true;
  weiterButton.disabled = true;

  sessionAuswertungAnzeigen();
}


function karteAnzeigen() {
  if (karten.length === 0) {
    leereLernrundeAnzeigen();
    return;
  }

  if (aktuelleKarte >= karten.length) {
    aktuelleKarte = 0;
  }

  const karte =
    karten[aktuelleKarte];

  const bereichText =
    karte.bereich || "";

  bereich.textContent =
    alleThemenAktiv()
      ? `${karte.__themaName} · ${bereichText}`
          .replace(/ · $/, "")
      : bereichText;

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
// MULTIPLE CHOICE
// --------------------------------------------------

function multipleChoiceZuruecksetzen() {
  multipleChoiceOptionenAktuell = [];
  multipleChoiceGeprueft = false;

  multipleChoiceOptionen.innerHTML = `
    <legend>Wähle eine Antwort aus</legend>
  `;

  multipleChoicePruefenButton.disabled = true;

  multipleChoiceErgebnis.classList.add(
    "versteckt"
  );

  multipleChoiceErgebnis.classList.remove(
    "richtig",
    "falsch"
  );

  multipleChoiceRueckmeldung.textContent = "";
  multipleChoiceRichtigeAntwort.textContent = "";
  multipleChoiceErklaerung.textContent = "";

  multipleChoiceErklaerungBereich.classList.add(
    "versteckt"
  );

  unsicherButton.disabled = false;
  teilweiseButton.disabled = false;
  sicherButton.disabled = false;
}

function multipleChoiceAnzeigen(karte) {
  if (!karteHatGueltigesMultipleChoice(karte)) {
    multipleChoiceOptionen.innerHTML = `
      <legend>Multiple Choice</legend>
      <p>Für diese Karte sind keine gültigen Antwortoptionen vorhanden.</p>
    `;

    multipleChoicePruefenButton.disabled = true;
    return;
  }

  multipleChoiceOptionenAktuell =
    kartenMischen(
      karte.multipleChoice.optionen
    );

  multipleChoiceOptionen.innerHTML = `
    <legend>Wähle eine Antwort aus</legend>
  `;

  multipleChoiceOptionenAktuell.forEach(
    option => {
      const label =
        document.createElement("label");

      label.className =
        "multiple-choice-option";

      const input =
        document.createElement("input");

      input.type = "radio";
      input.name = "multipleChoiceAntwort";
      input.value = option.id;

      const text =
        document.createElement("span");

      text.textContent = option.text;

      label.append(
        input,
        text
      );

      multipleChoiceOptionen.appendChild(
        label
      );
    }
  );
}

function multipleChoiceAntwortPruefen() {
  if (
    !multipleChoiceAktiv() ||
    karten.length === 0 ||
    multipleChoiceGeprueft
  ) {
    return;
  }

  const auswahl =
    multipleChoiceOptionen.querySelector(
      'input[name="multipleChoiceAntwort"]:checked'
    );

  if (!auswahl) {
    multipleChoiceRueckmeldung.textContent =
      "Bitte wähle zuerst eine Antwort aus.";

    multipleChoiceErgebnis.classList.remove(
      "richtig"
    );

    multipleChoiceErgebnis.classList.add(
      "falsch"
    );

    multipleChoiceErgebnis.classList.remove(
      "versteckt"
    );

    return;
  }

  const karte =
    karten[aktuelleKarte];

  const gewaehlteOption =
    multipleChoiceOptionenAktuell.find(
      option => option.id === auswahl.value
    );

  const richtigeOption =
    karte.multipleChoice.optionen.find(
      option => option.richtig === true
    );

  multipleChoiceGeprueft = true;
  multipleChoicePruefenButton.disabled = true;

  multipleChoiceOptionen
    .querySelectorAll(
      'input[name="multipleChoiceAntwort"]'
    )
    .forEach(input => {
      input.disabled = true;
    });

  if (gewaehlteOption?.richtig === true) {
    multipleChoiceRueckmeldung.textContent =
      "✅ Richtig!";

    multipleChoiceRichtigeAntwort.textContent =
      "";

    multipleChoiceErgebnis.classList.remove(
      "falsch"
    );

    multipleChoiceErgebnis.classList.add(
      "richtig"
    );

    unsicherButton.disabled = true;
    teilweiseButton.disabled = false;
    sicherButton.disabled = false;
  } else {
    multipleChoiceRueckmeldung.textContent =
      "❌ Leider falsch.";

    multipleChoiceRichtigeAntwort.textContent =
      `Richtige Antwort: ${richtigeOption?.text || "nicht gefunden"}`;

    multipleChoiceErgebnis.classList.remove(
      "richtig"
    );

    multipleChoiceErgebnis.classList.add(
      "falsch"
    );

    unsicherButton.disabled = false;
    teilweiseButton.disabled = true;
    sicherButton.disabled = true;
  }

  const erklaerung =
    karte.multipleChoice.erklaerung?.trim();

  if (erklaerung) {
    multipleChoiceErklaerung.textContent =
      erklaerung;

    multipleChoiceErklaerungBereich.classList.remove(
      "versteckt"
    );
  }

  multipleChoiceErgebnis.classList.remove(
    "versteckt"
  );

  bewertungBereich.classList.remove(
    "versteckt"
  );
}

// --------------------------------------------------
// FREITEXT
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

  lernrundeErstellen();

  aktuelleKarte = 0;

  anzahlSicher =
    sichereKartenZaehlen();

  sessionStarten();

  karteAnzeigen();
}


function lernstandZuruecksetzen() {
  if (alleKarten.length === 0) {
    return;
  }

  const alleAktiv =
    alleThemenAktiv();

  const bestaetigt =
    window.confirm(
      alleAktiv
        ? "Möchtest du den Lernstand für alle Themen dieses Fachs wirklich zurücksetzen?"
        : "Möchtest du den Lernstand für dieses Thema wirklich zurücksetzen?"
    );

  if (!bestaetigt) {
    return;
  }

  try {
    if (alleAktiv) {
      const fach =
        faecher[fachAuswahl.value];

      fach.themen.forEach(thema => {
        const schluessel =
          speicherSchluesselErstellen(
            null,
            thema.datei
          );

        localStorage.removeItem(
          schluessel
        );
      });
    } else {
      localStorage.removeItem(
        speicherSchluesselErstellen()
      );
    }
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
    lernmodusAuswahl.value = "offen";
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
  multipleChoicePruefenButton.disabled = true;
  weiterButton.disabled = true;

  alleWiederholenButton.disabled =
    alleKarten.length === 0;

  lernstandResetButton.disabled =
    alleKarten.length === 0;

  lernstandUebersichtAktualisieren();

  sessionAuswertungAnzeigen();
}


// --------------------------------------------------
// ANSICHT ZURÜCKSETZEN
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
  multipleChoicePruefenButton.disabled = true;
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
  if (alleKarten.length === 0) {
    lernbereicheVerstecken();

    antwortButton.classList.remove(
      "versteckt"
    );

    antwortButton.disabled = true;
    quizPruefenButton.disabled = true;
    multipleChoicePruefenButton.disabled = true;

    return;
  }

  lernrundeErstellen();
  sessionStarten();

  if (karten.length === 0) {
    leereLernrundeAnzeigen();
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

  if (
    event.key === "Enter" &&
    multipleChoiceAktiv()
  ) {
    event.preventDefault();

    if (!multipleChoicePruefenButton.disabled) {
      multipleChoiceAntwortPruefen();
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
      !multipleChoiceAktiv() &&
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

antwortButton.addEventListener(
  "click",
  () => {
    if (
      quizAktiv() ||
      multipleChoiceAktiv()
    ) {
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


quizPruefenButton.addEventListener(
  "click",
  quizAntwortPruefen
);

multipleChoicePruefenButton.addEventListener(
  "click",
  multipleChoiceAntwortPruefen
);

multipleChoiceOptionen.addEventListener(
  "change",
  event => {
    if (
      event.target.matches(
        'input[name="multipleChoiceAntwort"]'
      ) &&
      !multipleChoiceGeprueft
    ) {
      multipleChoicePruefenButton.disabled = false;

      multipleChoiceErgebnis.classList.add(
        "versteckt"
      );
    }
  }
);


quizAntwort.addEventListener(
  "input",
  () => {
    quizAntwort.setCustomValidity("");
  }
);


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


alleWiederholenButton.addEventListener(
  "click",
  alleKartenWiederholen
);


lernstandResetButton.addEventListener(
  "click",
  lernstandZuruecksetzen
);


lernartAuswahl.addEventListener(
  "change",
  lernartWechseln
);


lernmodusAuswahl.addEventListener(
  "change",
  lernmodusWechseln
);


fachAuswahl.addEventListener(
  "change",
  () => {
    themenAktualisieren();
    ansichtZuruecksetzen();
  }
);


themaAuswahl.addEventListener(
  "change",
  () => {
    mischenSteuerungAktualisieren();

    if (!themaAuswahl.value) {
      ansichtZuruecksetzen();
      return;
    }

    deckLaden();
  }
);


document.addEventListener(
  "keydown",
  tastaturSteuern
);


mischenCheckbox.addEventListener(
  "change",
  () => {
    // Die Einstellung gilt bei der
    // nächsten neu erzeugten Lernrunde.
  }
);


// --------------------------------------------------
// START
// --------------------------------------------------

faecherAktualisieren();
themenAktualisieren();
ansichtZuruecksetzen();