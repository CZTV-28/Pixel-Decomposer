"use strict";

// Cross-page projects can exceed Web Storage limits. IndexedDB keeps the active
// workspace local without requiring users to save a file before changing views.
(() => {
  const databaseName = "pixel-decomposer-workspace";
  const storeName = "drafts";
  let databasePromise;

  function openDatabase() {
    if (databasePromise) return databasePromise;
    if (!window.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable"));
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Unable to open workspace storage"));
    });
    return databasePromise;
  }

  function complete(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Workspace storage transaction failed"));
      transaction.onabort = () => reject(transaction.error || new Error("Workspace storage transaction aborted"));
    });
  }

  async function save(key, value) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put({ key, value, updatedAt: Date.now() });
    await complete(transaction);
  }

  async function take(key) {
    const database = await openDatabase();
    const readTransaction = database.transaction(storeName, "readonly");
    const request = readTransaction.objectStore(storeName).get(key);
    const record = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Unable to read workspace draft"));
    });
    await complete(readTransaction);
    if (!record) return null;
    const deleteTransaction = database.transaction(storeName, "readwrite");
    deleteTransaction.objectStore(storeName).delete(key);
    await complete(deleteTransaction);
    return record.value;
  }

  async function remove(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    list.forEach((key) => store.delete(key));
    await complete(transaction);
  }

  window.PixelWorkspaceTransfer = { save, take, remove };
})();
