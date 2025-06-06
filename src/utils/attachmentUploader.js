import { bitable } from '@lark-base-open/js-sdk';

/**
 * 上传附件到多维表格
 * @param {string} tableId - 表格ID
 * @param {string} fieldId - 字段ID
 * @param {string} recordId - 记录ID
 * @param {File|Blob} file - 要上传的文件
 * @param {string} fileName - 文件名
 * @returns {Promise<boolean>} - 上传是否成功
 */
export async function uploadAttachment(tableId, fieldId, recordId, file, fileName) {
  try {
    // 获取表格
    const table = await bitable.base.getTableById(tableId);
    
    // 获取附件字段
    const attachmentField = await table.getFieldById(fieldId);
    
    // 检查字段类型是否为附件类型 (17)
    if (attachmentField.type !== 17) {
      throw new Error(`字段 ${fieldId} 不是附件类型字段`);
    }
    
    // 确保文件是File对象
    const fileToUpload = file instanceof File ? file : new File([file], fileName, { type: file.type || 'application/pdf' });
    
    // 直接使用附件字段的setValue方法上传文件
    const result = await attachmentField.setValue(recordId, fileToUpload);
    
    return result;
  } catch (error) {
    console.error('上传附件失败:', error);
    throw error;
  }
}

/**
 * 获取表格中的所有附件字段
 * @param {string} tableId - 表格ID
 * @returns {Promise<Array>} - 附件字段列表
 */
export async function getAttachmentFields(tableId) {
  try {
    // 获取表格
    const table = await bitable.base.getTableById(tableId);
    
    // 获取所有字段
    const fieldMetaList = await table.getFieldMetaList();
    
    // 过滤出附件类型字段 (17)
    const attachmentFields = fieldMetaList.filter(field => field.type === 17);
    
    return attachmentFields;
  } catch (error) {
    console.error('获取附件字段失败:', error);
    throw error;
  }
}

/**
 * 将Blob转换为File对象
 * @param {Blob} blob - Blob对象
 * @param {string} fileName - 文件名
 * @returns {File} - File对象
 */
export function blobToFile(blob, fileName) {
  return new File([blob], fileName, { type: blob.type || 'application/pdf' });
}