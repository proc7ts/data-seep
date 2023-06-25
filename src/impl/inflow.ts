export interface Inflow {
  readonly id: number;
  readonly name?: string;
  data(): InflowData;
}

export interface InflowData {
  [key: symbol]: unknown;
}

export function startInflow(baseInflow: Inflow | undefined, name: string | undefined): Inflow {
  let inflow: InflowData | undefined;

  return (currentInflow = {
    id: ++inflowSeq,
    name,
    data() {
      return (inflow ??= baseInflow ? (Object.create(baseInflow.data()) as InflowData) : {});
    },
  });
}

export function getInflow(): Inflow | undefined {
  return currentInflow;
}

export function setInflow(prevInflow: Inflow | undefined): void {
  currentInflow = prevInflow;
}

let inflowSeq = 0;
let currentInflow: Inflow | undefined;
