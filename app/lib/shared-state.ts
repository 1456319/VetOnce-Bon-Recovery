import { BonEngineYield } from './bon-engine';
import { LLMLoadModelConfig } from '@lmstudio/sdk';

export interface SessionConfig {
    gradingModel: string;
    loadConfig?: LLMLoadModelConfig;
}

// This map stores active BonEngine generator instances, keyed by session ID.
export const engineInstances = new Map<string, Generator<BonEngineYield, any, any>>();

// This map stores session-specific configuration, such as the grading model.
export const sessionConfigs = new Map<string, SessionConfig>();
