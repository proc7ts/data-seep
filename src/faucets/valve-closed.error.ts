export class ValveClosedError extends TypeError {

  constructor(message = 'Valve closed', options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValveClosedError';
  }

}
