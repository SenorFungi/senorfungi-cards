import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, LovelaceCardConfig } from "../../shared/types";
import { registerCustomCard } from "../../shared/register";
import { t, type TextKey } from "./translations";

export const MATTER_PAIRING_CARD_NAME = "senorfungi-matter-pairing-card";

export interface MatterPairingCardConfig extends LovelaceCardConfig {
  title?: string;
  /** true: only commission devices already on the network (no Bluetooth). */
  network_only?: boolean;
}

interface DeviceRegistryEntry {
  id: string;
  name: string | null;
  name_by_user: string | null;
  identifiers: [string, string][];
}

type Step = "idle" | "pairing" | "waiting" | "done" | "error";

/** How long to wait for the new device after the Matter Server reports success. */
const DEVICE_WAIT_MS = 60_000;

registerCustomCard({
  type: MATTER_PAIRING_CARD_NAME,
  name: "SenorFungi Matter Pairing",
  description:
    "Pairs a new Matter device by setup code, over Home Assistant's Bluetooth or on the network.",
});

/**
 * Returns the code in the form the Matter Server expects, or undefined if it is
 * not a setup code. Manual codes have 11 or 21 digits, QR payloads start with "MT:".
 */
export function normalizeSetupCode(input: string): string | undefined {
  const raw = input.trim();
  if (/^mt:/i.test(raw)) {
    const payload = raw.slice(3).toUpperCase();
    return /^[0-9A-Z.\-]{10,}$/.test(payload) ? `MT:${payload}` : undefined;
  }
  if (!/^[\d\s-]+$/.test(raw)) return undefined;
  const digits = raw.replace(/\D/g, "");
  return digits.length === 11 || digits.length === 21 ? digits : undefined;
}

const isMatterDevice = (d: DeviceRegistryEntry) =>
  d.identifiers.some((identifier) => identifier[0] === "matter");

@customElement(MATTER_PAIRING_CARD_NAME)
export class MatterPairingCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: MatterPairingCardConfig;
  @state() private _code = "";
  @state() private _step: Step = "idle";
  @state() private _error?: string;
  @state() private _device?: DeviceRegistryEntry;

  private _knownDevices?: Set<string>;
  private _unsubDevices?: () => Promise<void>;
  private _waitTimer?: number;

  public static getConfigForm() {
    return {
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "network_only", selector: { boolean: {} } },
      ],
      // HA passes (schema, localize); the UI language is on <html lang>.
      computeLabel: (schema: { name: string }) => {
        const lang = document.documentElement.lang;
        if (schema.name === "title") return t(lang, "cfg_title");
        if (schema.name === "network_only") return t(lang, "cfg_network_only");
        return undefined;
      },
    };
  }

  public static getStubConfig(): Partial<MatterPairingCardConfig> {
    return {};
  }

  public setConfig(config: MatterPairingCardConfig): void {
    if (!config) throw new Error("Invalid configuration");
    this._config = config;
  }

  public getCardSize(): number {
    return 4;
  }

  public getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopWatching();
  }

  private _t(key: TextKey): string {
    return t(this.hass?.language, key);
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;
    const title = this._config.title || this._t("title");

    if (!this.hass.user?.is_admin) {
      return html`<ha-card .header=${title}>
        <div class="card-content secondary">${this._t("not_admin")}</div>
      </ha-card>`;
    }

    return html`<ha-card .header=${title}>
      <div class="card-content">${this._renderBody()}</div>
    </ha-card>`;
  }

  private _renderBody() {
    const networkOnly = this._config!.network_only === true;
    switch (this._step) {
      case "pairing":
      case "waiting":
        return html`<div class="progress">
          <ha-spinner size="small"></ha-spinner>
          <span>${this._t(this._step)}</span>
        </div>`;
      case "done":
        return html`
          <ha-alert alert-type="success">
            ${
              this._device
                ? html`${this._t("done")} <b>${this._deviceName(this._device)}</b>`
                : this._t("done_unknown")
            }
          </ha-alert>
          <div class="actions">
            ${
              this._device
                ? html`<ha-button @click=${this._openDevice}>${this._t("open_device")}</ha-button>`
                : nothing
            }
            <ha-button appearance="plain" @click=${this._reset}>${this._t("again")}</ha-button>
          </div>
        `;
      default: {
        const valid = normalizeSetupCode(this._code) !== undefined;
        const showInvalid = this._code.trim() !== "" && !valid;
        return html`
          ${
            this._step === "error"
              ? html`<ha-alert alert-type="error">${this._t("failed")} ${this._error}</ha-alert>`
              : nothing
          }
          <p class="secondary">${this._t(networkOnly ? "hint_network" : "hint_ble")}</p>
          <label class="field">
            <span class="label">${this._t("code_label")}</span>
            <input
              type="text"
              class=${showInvalid ? "invalid" : ""}
              .value=${this._code}
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              @input=${this._codeChanged}
              @keydown=${this._keyDown}
            />
            <span class="helper ${showInvalid ? "invalid" : ""}">
              ${showInvalid ? this._t("invalid_code") : this._t("code_helper")}
            </span>
          </label>
          <div class="actions">
            <ha-button .disabled=${!valid} @click=${this._pair}>
              ${this._t(networkOnly ? "pair_network" : "pair_ble")}
            </ha-button>
          </div>
        `;
      }
    }
  }

  private _codeChanged(ev: Event): void {
    this._code = (ev.target as HTMLInputElement).value;
  }

  private _keyDown(ev: KeyboardEvent): void {
    if (ev.key === "Enter") this._pair();
  }

  private _deviceName(device: DeviceRegistryEntry): string {
    return device.name_by_user || device.name || device.id;
  }

  private async _pair(): Promise<void> {
    const code = normalizeSetupCode(this._code);
    if (!code || !this.hass || this._step === "pairing" || this._step === "waiting") return;
    this._error = undefined;
    this._device = undefined;
    this._step = "pairing";
    try {
      await this._startWatching();
      await this.hass.callWS({
        type: "matter/commission",
        code,
        network_only: this._config?.network_only === true,
      });
    } catch (err: any) {
      this._stopWatching();
      this._error = err?.message ?? String(err);
      this._step = "error";
      return;
    }
    this._code = "";
    if (this._device) {
      this._step = "done";
      return;
    }
    // The device registry entry can appear a little after the command returns.
    this._step = "waiting";
    await this._checkForNewDevice();
    if (this._step === "waiting") {
      this._waitTimer = window.setTimeout(() => {
        this._stopWatching();
        if (this._step === "waiting") this._step = "done";
      }, DEVICE_WAIT_MS);
    }
  }

  private async _listMatterDevices(): Promise<DeviceRegistryEntry[]> {
    const devices = await this.hass!.callWS<DeviceRegistryEntry[]>({
      type: "config/device_registry/list",
    });
    return devices.filter(isMatterDevice);
  }

  private async _startWatching(): Promise<void> {
    this._stopWatching();
    this._knownDevices = new Set((await this._listMatterDevices()).map((d) => d.id));
    this._unsubDevices = await this.hass!.connection.subscribeEvents(
      (event: { data?: { action?: string } }) => {
        if (event.data?.action === "create") this._checkForNewDevice();
      },
      "device_registry_updated",
    );
  }

  private async _checkForNewDevice(): Promise<void> {
    if (!this._knownDevices) return;
    const found = (await this._listMatterDevices()).find((d) => !this._knownDevices?.has(d.id));
    if (!found || !this._knownDevices) return;
    this._device = found;
    this._stopWatching();
    if (this._step === "waiting") this._step = "done";
  }

  private _stopWatching(): void {
    this._knownDevices = undefined;
    if (this._waitTimer !== undefined) {
      clearTimeout(this._waitTimer);
      this._waitTimer = undefined;
    }
    if (this._unsubDevices) {
      this._unsubDevices().catch(() => undefined);
      this._unsubDevices = undefined;
    }
  }

  private _openDevice(): void {
    if (!this._device) return;
    history.pushState(null, "", `/config/devices/device/${this._device.id}`);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  private _reset(): void {
    this._stopWatching();
    this._step = "idle";
    this._error = undefined;
    this._device = undefined;
  }

  static styles = css`
    .card-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .secondary {
      color: var(--secondary-text-color);
      margin: 0;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .label {
      font-size: 0.875em;
      color: var(--secondary-text-color);
    }
    input {
      font: inherit;
      font-size: 1.1em;
      letter-spacing: 0.05em;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-border-radius-md, 8px);
      background: var(--input-fill-color, var(--secondary-background-color));
      color: var(--primary-text-color);
      outline: none;
      box-sizing: border-box;
      width: 100%;
    }
    input:focus {
      border-color: var(--primary-color);
    }
    input.invalid {
      border-color: var(--error-color);
    }
    .helper {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .helper.invalid {
      color: var(--error-color);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .progress {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    [MATTER_PAIRING_CARD_NAME]: MatterPairingCard;
  }
}
