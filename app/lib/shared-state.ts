import { BonEngineYield } from './bon-engine';

// This map stores active BonEngine generator instances, keyed by session ID.
export const engineInstances = new Map<string, Generator<BonEngineYield, any, any>>();

// This map stores session-specific configuration, such as the grading model.
export const sessionConfigs = new Map<string, { gradingModel: string }>();
