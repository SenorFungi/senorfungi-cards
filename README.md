# SenorFungi Cards

Custom dashboard cards for Home Assistant. All cards ship in one file, `senorfungi-cards.js`.

## Install with HACS

1. In HACS, open the menu (⋮) and choose **Custom repositories**.
2. Repository: `https://github.com/SenorFungi/senorfungi-cards`, type: **Dashboard**.
3. Find **SenorFungi Cards** in HACS, download it, and reload the browser.

HACS adds the resource `/hacsfiles/senorfungi-cards/senorfungi-cards.js` for you.

## Cards

| Card | Type | What it does |
|---|---|---|
| Hello | `custom:senorfungi-hello-card` | Example card: shows the name and state of an entity |

```yaml
type: custom:senorfungi-hello-card
entity: sensor.outdoor_temperature
name: Outside
```

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
