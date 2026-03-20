import { BonEngine } from '../app/lib/bon-engine';
import { engineInstances } from '../app/lib/shared-state';

console.log('Imports successful');
const params: any = { harmful_text: 'test' };
const engine = new BonEngine(params);
const runner = engine.run();
console.log('Engine instantiated and runner created');
