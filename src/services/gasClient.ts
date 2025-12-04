import type { Transaction } from '../types';

export const gasClient = {
  getTransactions: (): Promise<Transaction[]> => {
    return new Promise((resolve, reject) => {
      if (!(window as any).google) return reject('Not in GAS environment');
      (window as any).google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getTransactions();
    });
  },
  addTransaction: (txn: Transaction): Promise<Transaction> => {
    return new Promise((resolve, reject) => {
      if (!(window as any).google) return reject('Not in GAS environment');
      // GAS passes dates as strings or objects, ensure it's clean
      const cleanTxn = JSON.parse(JSON.stringify(txn));
      (window as any).google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .addTransaction(cleanTxn);
    });
  },
  deleteTransaction: (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!(window as any).google) return reject('Not in GAS environment');
      (window as any).google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .deleteTransaction(id);
    });
  },
  getHistory: (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      if (!(window as any).google) return reject('Not in GAS environment');
      (window as any).google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getHistory();
    });
  }
};
