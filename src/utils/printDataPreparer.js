/**
 * 打印数据准备工具类
 * 用于处理各种数据源并准备成hiprint可用的打印数据格式
 * 注意：不需要再次格式化数据，因为获取记录时已经返回了格式化后的数据
 */

/**
 * 数据类型枚举
 */
export const DATA_TYPES = {
  TEST_DATA: 'testData',
  RECORD_DATA: 'recordData',
  FIELD_SAMPLE: 'fieldSample',
  EMPTY: 'empty'
};

/**
 * 打印数据准备器类
 */
export class PrintDataPreparer {
  constructor() {
    this.debugMode = false;
  }

  /**
   * 启用调试模式
   * @param {boolean} enabled - 是否启用调试模式
   */
  setDebugMode(enabled = true) {
    this.debugMode = enabled;
  }

  /**
   * 记录调试信息
   * @param {string} message - 调试信息
   * @param {any} data - 相关数据
   */
  _debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[PrintDataPreparer] ${message}`, data || '');
    }
  }

  /**
   * 准备单条记录的打印数据
   * @param {Object} templateData - 模板数据对象
   * @param {Object} options - 选项配置
   * @returns {Object} 准备好的打印数据
   */
  prepareSinglePrintData(templateData, options = {}) {
    const {
      includeTableData = true,
      preferTestData = true,
      fallbackToSample = true
    } = options;

    this._debug('开始准备单条记录打印数据', { templateData, options });

    let printData = {};
    let dataType = DATA_TYPES.EMPTY;

    // 1. 优先使用测试数据
    if (preferTestData && templateData.testData && Object.keys(templateData.testData).length > 0) {
      printData = { ...templateData.testData };
      dataType = DATA_TYPES.TEST_DATA;
      this._debug('使用测试数据', printData);
    }
    // 2. 使用第一条记录数据
    else if (templateData.recordsData && templateData.recordsData.length > 0) {
      const firstRecord = templateData.recordsData[0];
      printData = this._extractRecordData(firstRecord);
      dataType = DATA_TYPES.RECORD_DATA;
      this._debug('使用第一条记录数据', printData);
    }
    // 3. 根据字段信息生成示例数据
    else if (fallbackToSample && templateData.fields && templateData.fields.length > 0) {
      printData = this._generateSampleData(templateData.fields);
      dataType = DATA_TYPES.FIELD_SAMPLE;
      this._debug('生成字段示例数据', printData);
    }

    // 添加表格数据（如果需要）
    if (includeTableData) {
      printData.table = this._prepareTableData(templateData, dataType);
    }

    this._debug('单条记录打印数据准备完成', { dataType, printData });
    return printData;
  }

  /**
   * 准备多条记录的打印数据
   * @param {Object} templateData - 模板数据对象
   * @param {Array} selectedRecords - 选中的记录数组
   * @param {Object} options - 选项配置
   * @returns {Array} 准备好的打印数据数组
   */
  prepareMultiplePrintData(templateData, selectedRecords = [], options = {}) {
    const {
      includeTableData = true,
      maxRecords = 100
    } = options;

    this._debug('开始准备多条记录打印数据', { 
      recordCount: selectedRecords.length, 
      options 
    });

    if (!selectedRecords || selectedRecords.length === 0) {
      this._debug('没有选中的记录，返回空数组');
      return [];
    }

    // 限制记录数量
    const records = selectedRecords.slice(0, maxRecords);
    if (selectedRecords.length > maxRecords) {
      console.warn(`记录数量超过限制，只处理前 ${maxRecords} 条记录`);
    }

    const printDataArray = records.map((record, index) => {
      this._debug(`处理第 ${index + 1} 条记录`, record);

      // 提取记录数据
      const recordData = this._extractRecordData(record);

      // 构造打印数据对象
      const printItem = { ...recordData };

      // 添加表格数据（如果需要）
      if (includeTableData) {
        printItem.table = [recordData];
      }

      return printItem;
    });

    this._debug('多条记录打印数据准备完成', { 
      processedCount: printDataArray.length,
      printDataArray 
    });

    return printDataArray;
  }

  /**
   * 从记录对象中提取数据
   * @param {Object} record - 记录对象
   * @returns {Object} 提取的数据
   */
  _extractRecordData(record) {
    if (!record) return {};

    // 复制所有字段数据，排除recordId和field
    const recordData = { ...record };
    delete recordData.recordId;
    delete recordData.field;

    return recordData;
  }

  /**
   * 根据字段信息生成示例数据
   * @param {Array} fields - 字段数组
   * @returns {Object} 生成的示例数据
   */
  _generateSampleData(fields) {
    const sampleData = {};

    fields.forEach(field => {
      sampleData[field.id] = this._generateFieldSampleValue(field);
    });

    return sampleData;
  }

  /**
   * 为单个字段生成示例值
   * @param {Object} field - 字段对象
   * @returns {any} 示例值
   */
  _generateFieldSampleValue(field) {
    const fieldName = field.name || field.id;

    switch (field.type) {
      case 1: // 多行文本
        return `${fieldName}示例文本内容`;
      case 2: // 数字
        return 123.45;
      case 3: // 单选
        return `${fieldName}选项A`;
      case 4: // 多选
        return `${fieldName}选项1, ${fieldName}选项2`;
      case 5: // 日期
        return new Date().toLocaleDateString('zh-CN');
      case 7: // 复选框
        return true;
      case 11: // 人员
        return '示例用户';
      case 17: // 附件
        return '示例附件.pdf';
      case 18: // 单向关联
        return `关联${fieldName}`;
      case 19: // 查找引用
        return `引用${fieldName}值`;
      case 20: // 公式
        return `公式计算结果`;
      case 1001: // 创建时间
        return new Date().toLocaleString('zh-CN');
      case 1002: // 修改时间
        return new Date().toLocaleString('zh-CN');
      case 1003: // 创建人
        return '创建者';
      case 1004: // 修改人
        return '修改者';
      case 1005: // 自动编号
        return 'AUTO-001';
      default:
        return `${fieldName}示例值`;
    }
  }

  /**
   * 准备表格数据
   * @param {Object} templateData - 模板数据对象
   * @param {string} dataType - 数据类型
   * @returns {Array} 表格数据数组
   */
  _prepareTableData(templateData, dataType) {
    switch (dataType) {
      case DATA_TYPES.TEST_DATA:
        // 如果有测试数据，将其作为表格的一行
        return [templateData.testData];

      case DATA_TYPES.RECORD_DATA:
        // 如果有记录数据，使用所有记录或前几条记录
        if (templateData.recordsData && templateData.recordsData.length > 0) {
          return templateData.recordsData.slice(0, 10).map(record => 
            this._extractRecordData(record)
          );
        }
        return [];

      case DATA_TYPES.FIELD_SAMPLE:
        // 如果是示例数据，生成几行示例表格数据
        if (templateData.fields && templateData.fields.length > 0) {
          return Array.from({ length: 3 }, (_, index) => {
            const rowData = {};
            templateData.fields.forEach(field => {
              rowData[field.id] = this._generateFieldSampleValue(field) + (index > 0 ? ` ${index + 1}` : '');
            });
            return rowData;
          });
        }
        return [];

      default:
        return [];
    }
  }

  /**
   * 验证打印数据的有效性
   * @param {any} printData - 打印数据
   * @returns {Object} 验证结果
   */
  validatePrintData(printData) {
    const result = {
      isValid: false,
      errors: [],
      warnings: [],
      dataInfo: {}
    };

    try {
      // 检查数据是否存在
      if (!printData) {
        result.errors.push('打印数据为空');
        return result;
      }

      // 检查数据类型
      if (Array.isArray(printData)) {
        result.dataInfo.type = 'array';
        result.dataInfo.count = printData.length;
        
        if (printData.length === 0) {
          result.warnings.push('打印数据数组为空');
        } else {
          // 检查数组中的每个元素
          printData.forEach((item, index) => {
            if (!item || typeof item !== 'object') {
              result.errors.push(`第 ${index + 1} 条记录数据无效`);
            }
          });
        }
      } else if (typeof printData === 'object') {
        result.dataInfo.type = 'object';
        result.dataInfo.fieldCount = Object.keys(printData).length;
        
        if (Object.keys(printData).length === 0) {
          result.warnings.push('打印数据对象为空');
        }
      } else {
        result.errors.push('打印数据类型无效，应为对象或数组');
        return result;
      }

      // 如果没有错误，标记为有效
      result.isValid = result.errors.length === 0;

      this._debug('打印数据验证完成', result);
      return result;

    } catch (error) {
      result.errors.push(`验证过程出错: ${error.message}`);
      return result;
    }
  }


}

/**
 * 创建打印数据准备器实例
 * @param {boolean} debugMode - 是否启用调试模式
 * @returns {PrintDataPreparer} 准备器实例
 */
export function createPrintDataPreparer(debugMode = false) {
  const preparer = new PrintDataPreparer();
  preparer.setDebugMode(debugMode);
  return preparer;
}

/**
 * 快速准备单条记录打印数据的便捷函数
 * @param {Object} templateData - 模板数据对象（数据已经格式化）
 * @param {Object} options - 选项配置
 * @returns {Object} 准备好的打印数据
 */
export function prepareSinglePrintData(templateData, options = {}) {
  const preparer = createPrintDataPreparer(options.debug);
  return preparer.prepareSinglePrintData(templateData, options);
}

/**
 * 快速准备多条记录打印数据的便捷函数
 * @param {Object} templateData - 模板数据对象（数据已经格式化）
 * @param {Array} selectedRecords - 选中的记录数组
 * @param {Object} options - 选项配置
 * @returns {Array} 准备好的打印数据数组
 */
export function prepareMultiplePrintData(templateData, selectedRecords, options = {}) {
  const preparer = createPrintDataPreparer(options.debug);
  return preparer.prepareMultiplePrintData(templateData, selectedRecords, options);
}
