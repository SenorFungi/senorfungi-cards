// UI texts of the Matter pairing card. Add a language by adding a key.
const en = {
  title: "Add Matter device",
  code_label: "Setup code",
  code_helper: "11-digit code (dashes allowed) or the MT:… text of the QR code",
  pair_ble: "Pair over Bluetooth",
  pair_network: "Pair on network",
  hint_ble:
    "Put the device in pairing mode and keep it close to a Home Assistant Bluetooth adapter or proxy.",
  hint_network: "The device must already be on your Wi-Fi or Thread network.",
  pairing: "Pairing … this can take a minute or two.",
  waiting: "Paired. Waiting for the device to appear …",
  done: "Device added:",
  done_unknown: "Pairing finished.",
  open_device: "Open device",
  again: "Pair another device",
  invalid_code: "This does not look like a Matter setup code.",
  failed: "Pairing failed:",
  not_admin: "Only administrators can add Matter devices.",
  // Editor labels
  cfg_title: "Title (optional)",
  cfg_network_only: "Pair on network only (device already on Wi-Fi/Thread)",
};

type Texts = typeof en;

const de: Texts = {
  title: "Matter-Gerät hinzufügen",
  code_label: "Einrichtungscode",
  code_helper: "11-stelliger Code (mit oder ohne Bindestriche) oder der MT:…-Text des QR-Codes",
  pair_ble: "Über Bluetooth koppeln",
  pair_network: "Im Netzwerk koppeln",
  hint_ble:
    "Gerät in den Kopplungsmodus bringen und nah an einen Bluetooth-Adapter oder -Proxy von Home Assistant halten.",
  hint_network: "Das Gerät muss schon im WLAN oder Thread-Netz sein.",
  pairing: "Kopple … das kann ein bis zwei Minuten dauern.",
  waiting: "Gekoppelt. Warte, bis das Gerät erscheint …",
  done: "Gerät hinzugefügt:",
  done_unknown: "Kopplung abgeschlossen.",
  open_device: "Gerät öffnen",
  again: "Weiteres Gerät koppeln",
  invalid_code: "Das sieht nicht nach einem Matter-Einrichtungscode aus.",
  failed: "Kopplung fehlgeschlagen:",
  not_admin: "Nur Administratoren können Matter-Geräte hinzufügen.",
  cfg_title: "Titel (optional)",
  cfg_network_only: "Nur im Netzwerk koppeln (Gerät schon im WLAN/Thread)",
};

const TEXTS: Record<string, Texts> = { en, de };

export type TextKey = keyof Texts;

export function t(language: string | undefined, key: TextKey): string {
  const lang = (language ?? "en").split("-")[0].toLowerCase();
  return (TEXTS[lang] ?? en)[key];
}
