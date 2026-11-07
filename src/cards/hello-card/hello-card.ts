import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, LovelaceCardConfig } from "../../shared/types";
import { registerCustomCard } from "../../shared/register";
import "./hello-card-editor";

export const HELLO_CARD_NAME = "senorfungi-hello-card";

export interface HelloCardConfig extends LovelaceCardConfig {
  entity: string;
  name?: string;
}

registerCustomCard({
  type: HELLO_CARD_NAME,
  name: "SenorFungi Hello",
  description: "Example card: shows the name and state of an entity.",
});

@customElement(HELLO_CARD_NAME)
export class HelloCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: HelloCardConfig;

  public static getConfigElement() {
    return document.createElement(`${HELLO_CARD_NAME}-editor`);
  }

  public static getStubConfig(hass: HomeAssistant): Partial<HelloCardConfig> {
    const entity = Object.keys(hass.states).find((id) => id.startsWith("sensor.")) ?? "";
    return { entity };
  }

  public setConfig(config: HelloCardConfig): void {
    if (!config.entity) {
      throw new Error("Please set an entity");
    }
    this._config = config;
  }

  public getCardSize(): number {
    return 1;
  }

  public getGridOptions() {
    return { columns: 6, rows: 1, min_columns: 3 };
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;
    const stateObj = this.hass.states[this._config.entity];
    if (!stateObj) {
      return html`<ha-card class="warning">Entity not found: ${this._config.entity}</ha-card>`;
    }
    const name = this._config.name ?? stateObj.attributes.friendly_name ?? stateObj.entity_id;
    const value = this.hass.formatEntityState?.(stateObj) ?? stateObj.state;
    return html`
      <ha-card>
        <ha-state-icon .hass=${this.hass} .stateObj=${stateObj}></ha-state-icon>
        <div class="info">
          <span class="name">${name}</span>
          <span class="state">${value}</span>
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    ha-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      height: 100%;
      box-sizing: border-box;
    }
    ha-state-icon {
      color: var(--state-icon-color);
    }
    .info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .state {
      color: var(--secondary-text-color);
    }
    .warning {
      color: var(--error-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    [HELLO_CARD_NAME]: HelloCard;
  }
}
