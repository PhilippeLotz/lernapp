import json
import re
import sys
from pathlib import Path


PROJEKT_ORDNER = Path(__file__).resolve().parent
DECKS_ORDNER = PROJEKT_ORDNER / "decks"


def normalisieren(text):
    text = text.lower().strip()

    ersetzungen = {
        "ä": "ae",
        "ö": "oe",
        "ü": "ue",
        "ß": "ss"
    }

    for alt, neu in ersetzungen.items():
        text = text.replace(alt, neu)

    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text)

    return text.strip("-")


def json_laden(datei):
    try:
        with datei.open("r", encoding="utf-8") as f:
            return json.load(f)

    except json.JSONDecodeError as fehler:
        print(f"\nFEHLER in JSON-Datei: {datei}")
        print(
            f"Zeile {fehler.lineno}, "
            f"Spalte {fehler.colno}: "
            f"{fehler.msg}\n"
        )
        return None

    except OSError as fehler:
        print(f"\nDatei konnte nicht gelesen werden: {datei}")
        print(f"{fehler}\n")
        return None


def json_speichern(datei, daten):
    try:
        with datei.open("w", encoding="utf-8") as f:
            json.dump(
                daten,
                f,
                ensure_ascii=False,
                indent=2
            )
            f.write("\n")

        return True

    except OSError as fehler:
        print(f"\nDatei konnte nicht gespeichert werden: {datei}")
        print(f"{fehler}\n")
        return False


def deck_bearbeiten(datei):
    daten = json_laden(datei)

    if daten is None:
        return None

    if not isinstance(daten, list):
        print(f"FEHLER: {datei} enthält keine Kartenliste.")
        return None

    fach = normalisieren(datei.parent.name)
    thema = normalisieren(datei.stem)

    geaendert = False
    neue_ids = 0

    for nummer, karte in enumerate(daten, start=1):
        if not isinstance(karte, dict):
            print(
                f"FEHLER: Karte {nummer} in {datei} "
                "ist kein Objekt."
            )
            return None

        vorhandene_id = karte.get("id")

        if (
            isinstance(vorhandene_id, str)
            and vorhandene_id.strip()
        ):
            continue

        neue_id = f"{fach}-{thema}-{nummer:03d}"

        neue_karte = {
            "id": neue_id,
            **karte
        }

        daten[nummer - 1] = neue_karte

        geaendert = True
        neue_ids += 1

    if geaendert:
        if not json_speichern(datei, daten):
            return None

    return {
        "karten": len(daten),
        "neue_ids": neue_ids,
        "geaendert": geaendert
    }


def ids_validieren(json_dateien):
    verwendete_ids = {}
    fehler = []
    gesamt_karten = 0

    for datei in json_dateien:
        daten = json_laden(datei)

        if daten is None:
            fehler.append(f"Ungültige JSON-Datei: {datei}")
            continue

        if not isinstance(daten, list):
            fehler.append(f"Keine Kartenliste: {datei}")
            continue

        for nummer, karte in enumerate(daten, start=1):
            gesamt_karten += 1

            if not isinstance(karte, dict):
                fehler.append(
                    f"{datei}: Karte {nummer} ist kein Objekt."
                )
                continue

            karten_id = karte.get("id")

            if (
                not isinstance(karten_id, str)
                or not karten_id.strip()
            ):
                fehler.append(
                    f"{datei}: Karte {nummer} hat keine gültige ID."
                )
                continue

            karten_id = karten_id.strip()

            if karten_id in verwendete_ids:
                erste_datei, erste_nummer = verwendete_ids[karten_id]

                fehler.append(
                    f"Doppelte ID '{karten_id}': "
                    f"{erste_datei}, Karte {erste_nummer} "
                    f"und {datei}, Karte {nummer}"
                )
            else:
                verwendete_ids[karten_id] = (
                    datei,
                    nummer
                )

    return {
        "gesamt_karten": gesamt_karten,
        "ids": len(verwendete_ids),
        "fehler": fehler
    }


def main():
    print()
    print("Lernapp - Karten-ID-Umstellung")
    print("================================")
    print()

    if not DECKS_ORDNER.exists():
        print("FEHLER: Der Ordner 'decks' wurde nicht gefunden.")
        return 1

    json_dateien = sorted(
        DECKS_ORDNER.rglob("*.json")
    )

    if not json_dateien:
        print("FEHLER: Keine JSON-Dateien gefunden.")
        return 1

    print(f"{len(json_dateien)} JSON-Datei(en) gefunden.")
    print()

    gesamt_neue_ids = 0
    bearbeitete_dateien = 0

    for datei in json_dateien:
        relativ = datei.relative_to(PROJEKT_ORDNER)

        ergebnis = deck_bearbeiten(datei)

        if ergebnis is None:
            print(
                "\nABBRUCH: Beim Bearbeiten "
                "ist ein Fehler aufgetreten."
            )
            return 1

        gesamt_neue_ids += ergebnis["neue_ids"]

        if ergebnis["geaendert"]:
            bearbeitete_dateien += 1

            print(
                f"GEÄNDERT: {relativ} "
                f"({ergebnis['neue_ids']} neue ID(s))"
            )
        else:
            print(
                f"OK:       {relativ} "
                "(bereits vollständig)"
            )

    print()
    print("Validiere Karten-IDs ...")
    print()

    validierung = ids_validieren(json_dateien)

    if validierung["fehler"]:
        print("FEHLER bei der Validierung:")
        print()

        for fehler in validierung["fehler"]:
            print(f"- {fehler}")

        print()
        print(
            "Die ID-Umstellung ist nicht vollständig gültig."
        )

        return 1

    print("Validierung erfolgreich.")
    print()

    print(f"JSON-Dateien:      {len(json_dateien)}")
    print(
        f"Karten insgesamt:  "
        f"{validierung['gesamt_karten']}"
    )
    print(
        f"Eindeutige IDs:    "
        f"{validierung['ids']}"
    )
    print(f"Neue IDs vergeben: {gesamt_neue_ids}")
    print(f"Dateien geändert:  {bearbeitete_dateien}")

    print()
    print("Alle Karten besitzen eine eindeutige ID.")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())