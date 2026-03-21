/**
 * Controls how `withStore` resolves its promise.
 *
 * @template T - The expected result type.
 */
export type StoreOperationOptions<T> = {
  /** If set, the promise resolves with this value instead of the request result. */
  resolvedValue?: T;
  /** Fallback value when the request result is `null` or `undefined`. */
  defaultValue?: T;
  /** Error message used when the request fails. */
  errorMessage?: string;
};

/**
 * Base class for lazy-initialized IndexedDB databases.
 *
 * Caches the database connection and provides a `withStore` helper to run
 * single-store transactions. The connection is opened on first use and
 * automatically resets if the database fires an `onclose` event.
 *
 * Subclasses must call `super(name, version)` and override `onUpgrade`
 * to define their schema.
 */
export abstract class BaseDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly name: string,
    private readonly version: number
  ) {}

  /** Called during `onupgradeneeded` to create or migrate object stores. */
  protected abstract onUpgrade(db: IDBDatabase, oldVersion: number): void;

  /** Returns the underlying database, opening it on first call. */
  protected getDB(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onupgradeneeded = (event) => {
        this.onUpgrade(request.result, event.oldVersion);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.db.onclose = () => {
          this.db = null;
          this.initPromise = null;
        };
        resolve(this.db);
      };

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  /**
   * Runs a single-store transaction and resolves with the request result.
   *
   * @template T - The expected result type of the operation.
   * @param storeName - Name of the object store to transact against.
   * @param mode - Transaction mode (`readonly` or `readwrite`).
   * @param operation - Callback that receives the store and returns an `IDBRequest`.
   * @param options - Optional overrides for the resolved value, default, or error message.
   */
  protected async withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest,
    options: StoreOperationOptions<T> = { errorMessage: 'Store operation failed' }
  ): Promise<T> {
    const database = await this.getDB();
    return new Promise((resolve, reject) => {
      const { resolvedValue, errorMessage, defaultValue } = options;
      const transaction = database.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () =>
        resolve(resolvedValue !== undefined ? resolvedValue : (request.result ?? defaultValue));
      request.onerror = () => reject(new Error(errorMessage));
    });
  }
}
