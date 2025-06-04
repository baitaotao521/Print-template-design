import { bitable } from '@lark-base-open/js-sdk';

/**
 * 获取表格中所有可见字段的信息
 * @param {string} tableId - 表格ID
 * @param {string} viewId - 视图ID
 * @returns {Promise<Array<{id: string, name: string, type: number}>>}
 */
export async function fetchVisibleFields(tableId, viewId) {
  try {
    // 获取当前表格
    const table = await bitable.base.getTableById(tableId);
    const view = await table.getViewById(viewId);
    
    // 获取可见字段ID列表
    const visibleFieldIds = await view.getVisibleFieldIdList();
    
    // 获取所有可见字段的详细信息
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

    return fields;
  } catch (err) {
    console.error('获取字段信息时出错:', err);
    throw err;
  }
}

/**
 * 获取表格中所有字段的信息（包括不可见字段）
 * @param {string} tableId - 表格ID
 * @returns {Promise<Array<{id: string, name: string, type: number}>>}
 */
export async function fetchAllFields(tableId) {
  try {
    const table = await bitable.base.getTableById(tableId);
    const fieldList = await table.getFieldList();
    
    const fields = await Promise.all(
      fieldList.map(async (field) => {
        return {
          id: field.id,
          name: await field.getName(),
          type: field.type
        };
      })
    );

    return fields;
  } catch (err) {
    console.error('获取所有字段信息时出错:', err);
    throw err;
  }
} 