export class StorageManager {
    private dbName = "architect-ai-db";
    private dbVersion = 1;

    async init(): Promise<void> {
        if (!("indexedDB" in window)) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject("Error opening database");

            request.onsuccess = () => resolve();

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains("analysis-results")) {
                    db.createObjectStore("analysis-results", { keyPath: "id" });
                }
            };
        });
    }

    async saveAnalysis(id: string, data: unknown): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["analysis-results"], "readwrite");
            const store = transaction.objectStore("analysis-results");
            const request = store.put({ id, data, timestamp: Date.now() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error saving analysis");
        });
    }

    async getAnalysis(id: string): Promise<unknown> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["analysis-results"], "readonly");
            const store = transaction.objectStore("analysis-results");
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching analysis");
        });
    }

    private getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error opening DB");
        });
    }
}

export const storage = new StorageManager();
