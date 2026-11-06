import json
import sys
from pathlib import Path


PROJEKT = Path(__file__).resolve().parent
DECKS = PROJEKT / "decks"

fehler = []
alle_ids = {}


def fehler_melden(text):
    fehler.append(text)


def multiple_choice_pruefen(karte, datei, nummer):
    mc = karte.get("multipleChoice")

    if mc is None:
        return

    if not isinstance(mc, dict):
        fehler_melden(
            f"{datei}: Karte {nummer}: "
            "multipleChoice muss ein Objekt sein."
        )
        return

    typ = mc.get("typ")

    if typ != "single":
        fehler_melden(
            f"{datei}: Karte {nummer}: "
            f"MC-Typ '{typ}' wird aktuell nicht unterstützt."
        )

    optionen = mc.get("optionen")

    if not isinstance(optionen, list):
        fehler_melden(
            f"{datei}: Karte {nummer}: "
            "MC-optionen müssen eine Liste sein."
        )
        return

    if len(optionen) < 2:
        fehler_melden(
            f"{datei}: Karte {nummer}: "
            "Multiple Choice benötigt mindestens 2 Antworten."
        )

    option_ids = set()
    richtige_anzahl = 0

    for option_nummer, option in enumerate(
        optionen,
        start=1
    ):
        if not isinstance(option, dict):
            fehler_melden(
                f"{datei}: Karte {nummer}: "
                f"MC-Option {option_nummer} ist ungültig."
            )
            continue

        option_id = option.get("id")
        text = option.get("text")
        richtig = option.get("richtig")

        if (
            not isinstance(option_id, str)
            or not option_id.strip()
        ):
            fehler_melden(
                f"{datei}: Karte {nummer}: "
                f"MC-Option {option_nummer} hat keine ID."
            )
        elif option_id in option_ids:
            fehler_melden(
                f"{datei}: Karte {nummer}: "
                f"doppelte MC-Option-ID '{option_id}'."
            )
        else:
            option_ids.add(option_id)

        if (
            not isinstance(text, str)
            or not text.strip()
        ):
            fehler_melden(
                f"{datei}: Karte {nummer}: "
                f"MC-Option {option_nummer} hat keinen Text."
            )

        if not isinstance(richtig, bool):
            fehler_melden(
                f"{datei}: Karte {nummer}: "
                f"MC-Option {option_nummer}: "
                "'richtig' muss true oder false sein."
            )

        if richtig is True:
            richtige_anzahl += 1

    if typ == "single" and richtige_anzahl != 1:
        fehler_melden(
            f"{datei}: Karte {nummer}: "
            "Single Choice muss genau eine richtige Antwort besitzen. "
            f"Gefunden: {richtige_anzahl}."
        )


def datei_pruefen(datei):
    relativ = datei.relative_to(PROJEKT)

    try:
        with datei.open(
            "r",
            encoding="utf-8"
        ) as handle:
            daten = json.load(handle)

    except json.JSONDecodeError as exc:
        fehler_melden(
            f"{relativ}: ungültiges JSON, "
            f"Zeile {exc.lineno}, Spalte {exc.colno}: "
            f"{exc.msg}"
        )
        return

    except OSError as exc:
        fehler_melden(
            f"{relativ}: kann nicht gelesen werden: {exc}"
        )
        return

    if not isinstance(daten, list):
        fehler_melden(
            f"{relativ}: oberste JSON-Struktur muss eine Liste sein."
        )
        return

    for nummer, karte in enumerate(
        daten,
        start=1
    ):
        if not isinstance(karte, dict):
            fehler_melden(
                f"{relativ}: Karte {nummer} ist kein Objekt."
            )
            continue

        karten_id = karte.get("id")
        frage = karte.get("frage")
        antwort = karte.get("antwort")

        if (
            not isinstance(karten_id, str)
            or not karten_id.strip()
        ):
            fehler_melden(
                f"{relativ}: Karte {nummer} hat keine gültige ID."
            )
        else:
            karten_id = karten_id.strip()

            if karten_id in alle_ids:
                erste_datei, erste_nummer = alle_ids[karten_id]

                fehler_melden(
                    f"Doppelte Karten-ID '{karten_id}': "
                    f"{erste_datei}, Karte {erste_nummer} "
                    f"und {relativ}, Karte {nummer}."
                )
            else:
                alle_ids[karten_id] = (
                    relativ,
                    nummer
                )

        if (
            not isinstance(frage, str)
            or not frage.strip()
        ):
            fehler_melden(
                f"{relativ}: Karte {nummer} hat keine gültige Frage."
            )

        if (
            not isinstance(antwort, str)
            or not antwort.strip()
        ):
            fehler_melden(
                f"{relativ}: Karte {nummer} hat keine gültige Antwort."
            )

        multiple_choice_pruefen(
            karte,
            relativ,
            nummer
        )


def main():
    print()
    print("Lernapp-Validierung")
    print("===================")
    print()

    if not DECKS.is_dir():
        print("FEHLER: decks-Ordner nicht gefunden.")
        return 1

    dateien = sorted(
        DECKS.rglob("*.json")
    )

    if not dateien:
        print("FEHLER: Keine JSON-Dateien gefunden.")
        return 1

    for datei in dateien:
        datei_pruefen(datei)

    if fehler:
        print("VALIDIERUNG FEHLGESCHLAGEN")
        print()

        for punkt in fehler:
            print(f"❌ {punkt}")

        print()
        print(
            f"{len(fehler)} Fehler gefunden."
        )
        print(
            "Git-Commit und Push dürfen nicht ausgeführt werden."
        )
        print()

        return 1

    print(
        f"✅ {len(dateien)} JSON-Dateien geprüft."
    )
    print(
        f"✅ {len(alle_ids)} Karten-IDs eindeutig."
    )
    print(
        "✅ Alle Karten besitzen Frage und Antwort."
    )
    print(
        "✅ Multiple-Choice-Daten sind gültig."
    )
    print()
    print("Lernapp ist bereit für den Push.")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())