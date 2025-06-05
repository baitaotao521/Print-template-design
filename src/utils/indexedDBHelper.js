const DB_NAME = 'hiprintDB';
const STORE_NAME = 'templates';
const DB_VERSION = 1;

// 打开数据库
function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // 添加描述字段索引
        store.createIndex('description', 'description', { unique: false });
      }
    };
  });
}

// 保存模板
export async function saveTemplate(id, data, description = '') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      // 确保数据可以被序列化
      const serializedData = JSON.parse(JSON.stringify(data));
      
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // 存储模板数据和描述
      store.put({ 
        id, 
        data: serializedData,
        description,
        createdAt: new Date().toISOString()
      });
      
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event.target.error);
    } catch (error) {
      reject(error);
    }
  });
}

// 获取模板
export async function getTemplate(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}

// 获取所有模板
export async function getAllTemplates() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
}

// 删除模板
export async function deleteTemplate(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject(event.target.error);
  });
}

// 更新模板
export async function updateTemplate(id, data, description) {
  try {
    // 先获取现有模板
    const template = await getTemplate(id);
    if (!template) {
      throw new Error('模板不存在');
    }
    
    // 更新数据和描述
    return saveTemplate(id, data, description);
  } catch (error) {
    throw error;
  }
} 