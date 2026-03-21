import { BaseDB } from './create-db';

const STORE_NAME = 'images';

class BackgroundImageDB extends BaseDB {
  constructor() {
    super('mdhd-reading-bg', 1);
  }

  protected onUpgrade(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  }

  async save(id: string, dataUrl: string): Promise<void> {
    return this.withStore(STORE_NAME, 'readwrite', (store) => store.put(dataUrl, id), {
      resolvedValue: undefined,
    });
  }

  async load(id: string): Promise<string | null> {
    return this.withStore(STORE_NAME, 'readonly', (store) => store.get(id), {
      defaultValue: null,
    });
  }

  async delete(id: string): Promise<void> {
    return this.withStore(STORE_NAME, 'readwrite', (store) => store.delete(id), {
      resolvedValue: undefined,
    });
  }
}

export const backgroundImageDB = new BackgroundImageDB();
