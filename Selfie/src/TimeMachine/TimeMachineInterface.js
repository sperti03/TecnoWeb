
class TimeMachineInterface {
  constructor() {
    this.virtualTime = null; // Quando è null, usa il tempo reale.
  }

  // Restituisce il tempo attuale (virtuale o reale)
  getCurrentTime() {
    return this.virtualTime || new Date();
  }

  // Imposta un nuovo tempo virtuale
  setTime(newTime) {
    this.virtualTime = new Date(newTime);
  }

  // Resetta al tempo reale
  resetToSystemTime() {
    this.virtualTime = null;
  }

  // Avanza il tempo virtuale di una quantità di millisecondi
  advanceTime(milliseconds) {
    if (this.virtualTime) {
      this.virtualTime = new Date(this.virtualTime.getTime() + milliseconds);
    } else {
      this.virtualTime = new Date(Date.now() + milliseconds);
    }
  }
}

// Esporta bene una singola istanza della classe, accessibile ovunque nel progetto
export default new TimeMachineInterface();
