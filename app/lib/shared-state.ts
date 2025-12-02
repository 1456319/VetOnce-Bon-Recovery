import { BonEngineYield } from './bon-engine';

// This map stores active BonEngine generator instances, keyed by session ID.
export const engineInstances = new Map<string, Generator<BonEngineYield, any, any>>();
