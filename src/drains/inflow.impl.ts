export interface Inflow {
  readonly id: number;
  readonly name?: string;
  data(): InflowData;
}

export interface InflowData {
  [key: symbol]: unknown;
}

export function startInflow(baseInflow: Inflow, name: string | undefined): Inflow {
  let inflow: InflowData | undefined;

  return (currentInflow = {
    id: ++inflowSeq,
    name,
    data() {
      return (inflow ??= Object.create(baseInflow.data()) as InflowData);
    },
  });
}

export function getInflow(): Inflow {
  return currentInflow;
}

export function setInflow(prevInflow: Inflow): void {
  currentInflow = prevInflow;
}

const rootInflowData = {};

let inflowSeq = 0;
let currentInflow: Inflow = {
  id: 0,
  name: 'root',
  data() {
    return rootInflowData;
  },
};
