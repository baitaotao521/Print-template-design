// 处理数组类型的值（用于查找引用和公式类型）
const handleArrayValue = (value) => {
  if (Array.isArray(value) && value.length > 0) {
    const firstValue = value[0];
    // 如果第一个值没有特殊属性，直接返回
    if (!firstValue || (typeof firstValue !== 'object')) {
      return firstValue;
    }
    // 处理附件类型
    if (firstValue.type && firstValue.type.includes('image')) {
      return firstValue.token;
    }
    // 处理有id属性的对象
    if ('id' in firstValue) {
      return firstValue.text;
    }
    // 处理文本类型
    if (firstValue.type === 'text') {
      return firstValue.text;
    }
  }
  return value;
};

// 格式化字段值
const formatFieldValue = (value, type) => {
  // 处理undefined的情况
  if (value === null) {
    return '空';
  }

  // 处理其他类型的值
  switch (type) {
    case 1: // 多行文本,获取第一个值的text
      return handleArrayValue(value);
    case 2: // 数字
      return value;
    case 3: // 单选
      // SingleSelectTransformVal = string | IOpenSingleSelect
      return value.text;
    case 4: // 多选
      // MultiSelectTransformVal = string[] | string | IOpenMultiSelect | IOpenSingleSelect
      return value.text;
    case 5: // 日期
      // IOpenTimestamp = number (以毫秒为单位的 Unix 时间戳)
      return new Date(value).toLocaleString();
    case 7: // 复选框
      return value;
    case 11: // 人员
      return value;
    case 13: // 电话
      return value;
    case 15: // 超链接
      // UrlTransformVal = string | IOpenUrlSegment | IOpenUrlSegment[]
      return value;
    case 17: // 附件
      // AttachmentTransformVal = File | File[] | FileList | IOpenAttachment | IOpenAttachment[]
      //获取token的值
      return handleArrayValue(value);
    case 18: // 单向关联
      // IOpenLink = { recordIds: string[], text: string, tableId: string }
      return value.text;
    case 19: // 查找引用
      return handleArrayValue(value);
    case 20: // 公式
      return handleArrayValue(value);
    case 21: // 双向关联
      // IOpenLink = { recordIds: string[], text: string, tableId: string }
      return value;
    case 22: // 地理位置
      return value;
    case 23: // 群聊
      return value;
    case 1001: // 创建时间
      // IOpenTimestamp = number (以毫秒为单位的 Unix 时间戳),转为年月日时分秒
      return new Date(value).toLocaleString();
    case 1002: // 修改时间
      // IOpenTimestamp = number (以毫秒为单位的 Unix 时间戳)
      return new Date(value).toLocaleString();
    case 1003: // 创建人,获取所有数组的name,
      return value.map(item => item.name).join(',');
    case 1004: // 修改人
      return value.map(item => item.name).join(',');
    case 1005: // 自动编号
      // IOpenAutoNumber = string
      if (value && value.status === 'completed') {
        return value.value;
      }
      return value;
    case 99001: // 二维码
      return handleArrayValue(value);
    case 99002: // 进度条
      return value;
    case 99003: // 货币
      return value;
    case 99004: // 评分
      return value;
    case 99005: // 邮箱
      return value;
    default:
      return value;
  }
};

export { formatFieldValue, handleArrayValue };