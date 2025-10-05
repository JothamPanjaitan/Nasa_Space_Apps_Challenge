import { computeImpactEstimates } from '../lib/impactCalc';
import { applyDeltaVToElements, keplerianToPosition } from '../lib/orbitPhysics';
import type { ImpactData, OrbitalElements } from '../types/impact';

// Worker message types
interface WorkerMessage {
  type: string;
  payload: any;
  id?: string;
}

interface WorkerResponse {
  type: string;
  payload: any;
  id?: string;
  error?: string;
}

// Handle incoming messages
// eslint-disable-next-line no-restricted-globals
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;
  
  try {
    let response: WorkerResponse;
    
    switch (type) {
      case 'RECALC_IMPACT':
        response = {
          type: 'IMPACT_RESULT',
          payload: computeImpactEstimates(payload.impact),
          id
        };
        break;
        
      case 'APPLY_DV':
        response = {
          type: 'DV_RESULT',
          payload: applyDeltaVToElements(payload.elements, payload.dv, payload.direction),
          id
        };
        break;
        
      case 'PROPAGATE_ORBIT':
        response = {
          type: 'ORBIT_RESULT',
          payload: propagateOrbit(payload.elements, payload.startTime, payload.endTime, payload.stepSize),
          id
        };
        break;
        
      case 'BATCH_CALCULATIONS':
        response = {
          type: 'BATCH_RESULT',
          payload: batchCalculations(payload.calculations),
          id
        };
        break;
        
      case 'DEFLECTION_ANALYSIS':
        response = {
          type: 'DEFLECTION_RESULT',
          payload: analyzeDeflection(payload.params),
          id
        };
        break;
        
      default:
        response = {
          type: 'ERROR',
          payload: null,
          error: `Unknown message type: ${type}`,
          id
        };
    }
    
    // eslint-disable-next-line no-restricted-globals
    self.postMessage(response);
    
  } catch (error) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'ERROR',
      payload: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
  }
};

/**
 * Propagate orbit for visualization
 */
function propagateOrbit(
  elements: OrbitalElements,
  startTime: number,
  endTime: number,
  stepSize: number
): Array<{ time: number; position: { x: number; y: number; z: number } }> {
  const positions: Array<{ time: number; position: { x: number; y: number; z: number } }> = [];
  
  const numSteps = Math.floor((endTime - startTime) / stepSize);
  
  for (let i = 0; i <= numSteps; i++) {
    const time = startTime + i * stepSize;
    const position = keplerianToPosition(elements, time);
    
    positions.push({
      time,
      position
    });
  }
  
  return positions;
}

/**
 * Batch calculations for multiple scenarios
 */
function batchCalculations(calculations: Array<{
  type: string;
  params: any;
}>): Array<any> {
  return calculations.map(calc => {
    switch (calc.type) {
      case 'impact':
        return computeImpactEstimates(calc.params);
      case 'orbit':
        return applyDeltaVToElements(calc.params.elements, calc.params.dv);
      default:
        return null;
    }
  }).filter(result => result !== null);
}

/**
 * Analyze deflection scenarios
 */
function analyzeDeflection(params: {
  elements: OrbitalElements;
  deltaVOptions: number[];
  leadTimeOptions: number[];
  missionTypes: string[];
}): Array<{
  deltaV: number;
  leadTime: number;
  missionType: string;
  success: boolean;
  deflectionDistance: number;
  newElements: OrbitalElements;
}> {
  const results: Array<{
    deltaV: number;
    leadTime: number;
    missionType: string;
    success: boolean;
    deflectionDistance: number;
    newElements: OrbitalElements;
  }> = [];
  
  for (const deltaV of params.deltaVOptions) {
    for (const leadTime of params.leadTimeOptions) {
      for (const missionType of params.missionTypes) {
        const newElements = applyDeltaVToElements(params.elements, deltaV);
        const deflectionDistance = calculateDeflectionDistance(deltaV, leadTime, 30000); // 30 km/s typical
        const success = deflectionDistance > 6400; // Earth radius
        
        results.push({
          deltaV,
          leadTime,
          missionType,
          success,
          deflectionDistance,
          newElements
        });
      }
    }
  }
  
  return results;
}

/**
 * Calculate deflection distance (simplified)
 */
function calculateDeflectionDistance(deltaVms: number, leadTimeDays: number, currentVelocity: number): number {
  const leadTimeSeconds = leadTimeDays * 24 * 3600;
  const deflectionVelocity = deltaVms;
  const deflectionDistance = deflectionVelocity * leadTimeSeconds;
  return deflectionDistance / 1000; // convert to km
}

// Export for TypeScript
export {};
