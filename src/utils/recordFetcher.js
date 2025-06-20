import { bitable } from '@lark-base-open/js-sdk';
import { formatFieldValue } from './fieldFormatter';

// 重试函数
async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}

/**
 * 获取记录和字段值
 * @param {string} tableId - 表格ID
 * @param {string} viewId - 视图ID
 * @param {string} [recordId] - 记录ID，如果为空则获取所有记录
 * @param {boolean} [shouldFormat=false] - 是否返回格式化后的值
 * @param {function} [onBatchLoaded] - 每批数据加载完成时的回调函数，参数为已加载的记录
 * @param {number} [maxRecords] - 最大记录数量限制，如果为空则获取所有记录
 * @returns {Promise<Array<{recordId: string, field: Array<{name: string, value: any, type: number, field: string}>}>>}
 */
export async function fetchRecordsAndValues(tableId, viewId, recordId = null, shouldFormat = false, onBatchLoaded = null, maxRecords = null) {
  try {
    // 获取当前表格
    const table = await bitable.base.getTableById(tableId);
    const view = await table.getViewById(viewId);
    const visibleFieldIds = await view.getVisibleFieldIdList();
    
    // 获取字段信息
    const fields = await Promise.all(
      visibleFieldIds.map(async (fieldId) => {
        const field = await table.getFieldById(fieldId);
        return {
          id: fieldId,
          name: await field.getName(),
          type: field.type
        };
      })
    );

    // 如果指定了recordId，只获取该记录
    if (recordId) {
      const fieldValues = [];
      for (const field of fields) {
        try {
          const fieldObj = await table.getFieldById(field.id);
          const rawValue = await retry(async () => {
            try {
              return await fieldObj.getValue(recordId);
            } catch (err) {
              console.warn(`获取字段 ${field.id} 的值失败，正在重试...`, err);
              throw err;
            }
          });
          const formattedValue = shouldFormat ? formatFieldValue(rawValue, field.type) : null;
          fieldValues.push({
            name: field.name,
            value: shouldFormat ? formattedValue : rawValue,
            type: field.type,
            field: field.id
          });
        } catch (fieldErr) {
          console.warn(`获取字段 ${field.id} 的值失败:`, fieldErr);
          fieldValues.push({
            name: field.name,
            value: null,
            type: field.type,
            field: field.id
          });
        }
      }
      const result = [{
        recordId,
        field: fieldValues
      }];
      
      // 调用回调函数
      if (onBatchLoaded && typeof onBatchLoaded === 'function') {
        onBatchLoaded(result);
      }
      
      return result;
    }

    // 获取所有记录
    const records = [];
    let pageToken = null;
    let hasMore = true;
    let batchCount = 0;

    while (hasMore) {
      batchCount++;

      // 如果设置了最大记录数量限制，计算本次应该获取的数量
      let currentPageSize = 200;
      if (maxRecords && maxRecords > 0) {
        const remainingRecords = maxRecords - records.length;
        if (remainingRecords <= 0) {
          break; // 已达到最大记录数量
        }
        currentPageSize = Math.min(200, remainingRecords);
      }

      const response = await table.getRecords({
        pageSize: currentPageSize,
        pageToken,
        viewId
      });

      const { records: pageRecords, pageToken: nextPageToken } = response;
      
      // 批量获取所有记录的字段值
      const recordPromises = pageRecords.map(async (record) => {
        try {
          const fieldValues = [];
          for (const field of fields) {
            try {
              const fieldObj = await table.getFieldById(field.id);
              const rawValue = await retry(async () => {
                try {
                  const rawValue = await fieldObj.getValue(record.recordId);
                  return rawValue;
                } catch (err) {
                  console.warn(`获取字段 ${field.id} 的值失败，正在重试...`, err);
                  throw err;
                }
              });
              const formattedValue = shouldFormat ? formatFieldValue(rawValue, field.type) : null;
              fieldValues.push({
                name: field.name,
                value: shouldFormat ? formattedValue : rawValue,
                type: field.type,
                field: field.id
              });
            } catch (fieldErr) {
              console.warn(`获取字段 ${field.id} 的值失败:`, fieldErr);
              fieldValues.push({
                name: field.name,
                value: null,
                type: field.type,
                field: field.id
              });
            }
          }
          return {
            recordId: record.recordId,
            field: fieldValues
          };
        } catch (recordErr) {
          console.warn('处理记录时出错:', recordErr);
          return null;
        }
      });

      // 并行处理所有记录
      const newRecords = await Promise.all(recordPromises);
      const validRecords = newRecords.filter(Boolean);

      // 如果设置了最大记录数量限制，确保不超过限制
      if (maxRecords && maxRecords > 0) {
        const remainingSlots = maxRecords - records.length;
        const recordsToAdd = validRecords.slice(0, remainingSlots);
        records.push(...recordsToAdd);

        // 如果达到最大记录数量，停止获取
        if (records.length >= maxRecords) {
          hasMore = false;
        }
      } else {
        records.push(...validRecords);
      }

      // 调用回调函数，返回当前批次的数据
      if (onBatchLoaded && typeof onBatchLoaded === 'function') {
        const isComplete = !nextPageToken || (maxRecords && records.length >= maxRecords);
        onBatchLoaded(records.slice(), batchCount, isComplete);
      }

      // 检查是否还有更多记录
      if (maxRecords && records.length >= maxRecords) {
        hasMore = false;
      } else {
        hasMore = !!nextPageToken;
        pageToken = nextPageToken;
      }
    }

    return records;
  } catch (err) {
    console.error('获取记录和字段值时出错:', err);
    throw err;
  }
} 