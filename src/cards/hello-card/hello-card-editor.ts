import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant } from "../../shared/types";
import type { HelloCardConfig } from "./hello-card";

// Uses Home Assistant's built-in <ha-form>, so no UI code of our own is needed.
const SCHEMA = [
  { name: "entity", required: true, selector: { entity: {} } },
  { name: "name", selector: { text: {} } },
] as const;

@customElement("senorfungi-hello-card-editor")
export class HelloCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: HelloCardConfig;

  public setConfig(config: HelloCardConfig): void {
    this._config = config;
  }

  protected render() {
    if (!this.hass || !this._config) return nothing;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${(s: { name: string }) =>
          s.name === "entity" ? "Entity" : s.name === "name" ? "Name (optional)" : s.name}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: ev.detail.value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
