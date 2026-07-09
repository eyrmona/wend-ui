export interface FlatToken {
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  value: string | number | boolean;
}

export interface ImportTokensMessage {
  type: 'import-tokens';
  tokens: FlatToken[];
}

export interface ImportResultMessage {
  type: 'import-result';
  created: number;
  updated: number;
  total: number;
}

export interface ImportErrorMessage {
  type: 'import-error';
  message: string;
}

export type PluginMessage = ImportResultMessage | ImportErrorMessage;
