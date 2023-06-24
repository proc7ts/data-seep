export interface Inflow {
  [key: symbol]: unknown;
}

export type InflowHandle = () => Inflow;

export function startInflow(baseInflow: InflowHandle): InflowHandle {
  const prevInflow = currentInflow;
  let inflow: Inflow | undefined;

  currentInflow = () => (inflow ??= Object.create(baseInflow()) as Inflow);

  return prevInflow;
}

export function inflowHandle(): InflowHandle {
  return currentInflow;
}

export function endInflow(baseInflow: InflowHandle): void {
  currentInflow = baseInflow;
}

const rootInflow = {};

let currentInflow: InflowHandle = () => rootInflow;
