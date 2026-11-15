# SenorFungi Cards

Custom dashboard cards for Home Assistant. All cards ship in one file, `senorfungi-cards.js`.

## Install with HACS

1. In HACS, open the menu (⋮) and choose **Custom repositories**.
2. Repository: `https://github.com/SenorFungi/senorfungi-cards`, type: **Dashboard**.
3. Find **SenorFungi Cards** in HACS, download it, and reload the browser.

HACS adds the resource `/hacsfiles/senorfungi-cards/senorfungi-cards.js` for you.

## Cards

| Card           | Type                                    | What it does                                                             |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| Hello          | `custom:senorfungi-hello-card`          | Example card: shows the name and state of an entity                      |
| Matter pairing | `custom:senorfungi-matter-pairing-card` | Pairs a new Matter device by setup code, over Home Assistant's Bluetooth |

```yaml
type: custom:senorfungi-hello-card
entity: sensor.outdoor_temperature
name: Outside
```

### Matter pairing card

Home Assistant's own "Add Matter device" dialog in the browser only adds devices that are already on the network. Pairing over Bluetooth is left to the companion apps. This card pairs a new device by its setup code through Home Assistant's own Bluetooth, a local adapter or an ESPHome Bluetooth proxy, so you don't need a phone.

```yaml
type: custom:senorfungi-matter-pairing-card
title: Add Matter device # optional
network_only: false # optional, true = device is already on Wi-Fi/Thread
```

How to use it:

1. Put the device in pairing mode and keep it close to a Bluetooth adapter or proxy that Home Assistant uses.
2. Enter the setup code: the 11-digit manual code (dashes allowed) or the `MT:…` text from the QR code.
3. Select **Pair over Bluetooth**. It can take a minute or two. When the device shows up in Home Assistant, the card links to it.

Requirements:

- The Matter integration with a Matter Server that can commission over Bluetooth. The Matter Server app needs Bluetooth access, for example its option for Bluetooth proxies. Thread devices also need a Thread border router with a preferred network in Home Assistant.
- An administrator account. Other users see a note instead of the form.

The card sends the WebSocket command `matter/commission` with `network_only: false`. With `network_only: true` it only adds devices that are already on the network, like the built-in dialog.

## Development

```bash
npm install
npm run build   # writes dist/senorfungi-cards.js
npm start       # rebuilds on every change
```

### Add a card

1. Create `src/cards/<name>/<name>.ts`, using `hello-card` as a template. Prefix the element name with `senorfungi-`.
2. Import it in `src/senorfungi-cards.ts`.
3. Add it to the table above.

### Release

Bump `version` in `package.json` and `VERSION` in `src/senorfungi-cards.ts`, then push a tag:

```bash
git tag v0.2.0 && git push origin v0.2.0
```

The Release workflow builds the bundle and attaches it to a GitHub release. HACS offers it as an update.
