// Minimal Home Assistant types. Extend as cards need more.
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language: string;
  callService(
    domain: string,
    service: string,
    data?: Record<string, any>,
  ): Promise<unknown>;
  formatEntityState?(stateObj: HassEntity, state?: string): string;
}

export interface LovelaceCardConfig {
  type: string;
  [key: string]: any;
}

export interface CustomCardEntry {
  type: string;
  name: string;
  description?: string;
  preview?: boolean;
  documentationURL?: string;
}

declare global {
  interface Window {
    customCards?: CustomCardEntry[];
  }
}
