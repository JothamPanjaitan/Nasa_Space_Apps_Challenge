import type { ImpactData, OrbitalElements } from '../types/impact';

// Worker manager for handling simulation calculations
export class WorkerManager {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingMessages = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      // Create worker from the simulation worker file
      this.worker = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url));
      
      this.worker.onmessage = (event) => {
        const { type, payload, id, error } = event.data;
        
        if (id && this.pendingMessages.has(id)) {
          const { resolve, reject } = this.pendingMessages.get(id)!;
          this.pendingMessages.delete(id);
          
          if (error) {
            reject(new Error(error));
          } else {
            resolve(payload);
          }
        }
      };
      
      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending messages
        for (const [id, { reject }] of Array.from(this.pendingMessages.entries())) {
          reject(new Error('Worker error'));
        }
        this.pendingMessages.clear();
      };
      
    } catch (error) {
      console.warn('Failed to initialize worker, falling back to main thread:', error);
      this.worker = null;
    }
  }

  private sendMessage(type: string, payload: any): Promise<any> {
    const id = ++this.messageId;
    
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        // Fallback to main thread if worker not available
        this.handleMainThreadCalculation(type, payload)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      this.pendingMessages.set(id, { resolve, reject });
      
      this.worker.postMessage({
        type,
        payload,
        id
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 30000);
    });
  }

  // Main thread fallback calculations
  private async handleMainThreadCalculation(type: string, payload: any): Promise<any> {
    const { computeImpactEstimates } = await import('./impactCalc');
    const { applyDeltaVToElements, keplerianToPosition } = await import('./orbitPhysics');
    
    switch (type) {
      case 'RECALC_IMPACT':
        return computeImpactEstimates(payload.impact);
        
      case 'APPLY_DV':
        return applyDeltaVToElements(payload.elements, payload.dv, payload.direction);
        
      case 'PROPAGATE_ORBIT':
        return await this.propagateOrbitMainThread(payload.elements, payload.startTime, payload.endTime, payload.stepSize);
        
      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }
  }

  private async propagateOrbitMainThread(
    elements: OrbitalElements,
    startTime: number,
    endTime: number,
    stepSize: number
  ): Promise<Array<{ time: number; position: { x: number; y: number; z: number } }>> {
    const { keplerianToPosition } = await import('./orbitPhysics');
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

  // Public API methods
  async recalculateImpact(impact: ImpactData): Promise<ImpactData> {
    return this.sendMessage('RECALC_IMPACT', { impact });
  }

  async applyDeltaV(
    elements: OrbitalElements, 
    deltaV: number, 
    direction: 'prograde' | 'retrograde' | 'radial' = 'prograde'
  ): Promise<OrbitalElements> {
    return this.sendMessage('APPLY_DV', { elements, dv: deltaV, direction });
  }

  async propagateOrbit(
    elements: OrbitalElements,
    startTime: number,
    endTime: number,
    stepSize: number
  ): Promise<Array<{ time: number; position: { x: number; y: number; z: number } }>> {
    return this.sendMessage('PROPAGATE_ORBIT', { elements, startTime, endTime, stepSize });
  }

  async batchCalculations(calculations: Array<{
    type: string;
    params: any;
  }>): Promise<Array<any>> {
    return this.sendMessage('BATCH_CALCULATIONS', { calculations });
  }

  async analyzeDeflection(params: {
    elements: OrbitalElements;
    deltaVOptions: number[];
    leadTimeOptions: number[];
    missionTypes: string[];
  }): Promise<Array<{
    deltaV: number;
    leadTime: number;
    missionType: string;
    success: boolean;
    deflectionDistance: number;
    newElements: OrbitalElements;
  }>> {
    return this.sendMessage('DEFLECTION_ANALYSIS', { params });
  }

  // Cleanup
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject all pending messages
    for (const [id, { reject }] of Array.from(this.pendingMessages.entries())) {
      reject(new Error('Worker destroyed'));
    }
    this.pendingMessages.clear();
  }
}

// Singleton instance
let workerManagerInstance: WorkerManager | null = null;

export function getWorkerManager(): WorkerManager {
  if (!workerManagerInstance) {
    workerManagerInstance = new WorkerManager();
  }
  return workerManagerInstance;
}

export function destroyWorkerManager() {
  if (workerManagerInstance) {
    workerManagerInstance.destroy();
    workerManagerInstance = null;
  }
}
