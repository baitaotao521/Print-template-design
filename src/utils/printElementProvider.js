import { hiprint } from 'vue-plugin-hiprint';

// 创建字段元素组
export function createFieldElements(fields, fieldTestData = {}) {
  return fields.map(field => ({
    tid: `customModule.text.${field.id}`,
    type: "text",
    title: field.name,
    options: {
      title: field.name,
      field: field.id,
      testData: fieldTestData ? fieldTestData[field.id] || '' : '',
      height: 16,
      fontSize: 9,
      fontWeight: "400",
      textAlign: "left",
      textContentVerticalAlign: "middle"
    }
  }));
}

// 创建单据表头元素组
export function createHeaderElements() {
  return [
    {
      tid: 'customModule.header',
      title: '单据表头',
      type: 'text',
      options: {
        testData: '打印模板',
        height: 17,
        fontSize: 16.5,
        fontWeight: "700",
        textAlign: "center",
        hideTitle: true
      }
    },
    {
      tid: 'customModule.type',
      title: '单据类型',
      type: 'text',
      options: {
        testData: '数据模板',
        height: 16,
        fontSize: 15,
        fontWeight: "700",
        textAlign: "center",
        hideTitle: true
      }
    },
    {
      tid: 'customModule.date',
      title: '业务日期',
      type: 'text',
      options: {
        field: 'date',
        testData: new Date().toLocaleDateString(),
        height: 16,
        fontSize: 9,
        fontWeight: "400",
        textAlign: "left",
        textContentVerticalAlign: "middle"
      }
    }
  ];
}

// 创建表格元素组
export function createTableElements(fields, fieldTestData = {}) {
  return [
    {
      tid: 'customModule.fieldTable',
      title: '字段数据表',
      type: 'table',
      options: {
        field: 'table',
        tableHeaderRepeat: 'first',
        tableFooterRepeat: 'last',
        fields: fields.map(field => ({text: field.name, field: field.id})),
      },
      editable: true,
      columnDisplayEditable: true, // 列显示是否能编辑
      columnDisplayIndexEditable: true, // 列顺序显示是否能编辑
      columnTitleEditable: true, // 列标题是否能编辑
      columnResizable: true, // 列宽是否能调整
      columnAlignEditable: true, // 列对齐是否调整
      isEnableEditField: true, // 编辑字段
      isEnableContextMenu: true, // 开启右键菜单
      isEnableInsertRow: true, // 插入行
      isEnableDeleteRow: true, // 删除行
      isEnableInsertColumn: true, // 插入列
      isEnableDeleteColumn: true, // 删除列
      isEnableMergeCell: true, // 合并单元格
      //硬编码示例数据表头	表格列 二维数组 -> [[{},{}],[{},{}]]
      columns: [
        [{title: '字段演示', field: 'demo', align: 'center', width: 100},
        {title: '字段名称', field: 'name', align: 'center', width: 100},
        {title: '字段类型', field: 'type', align: 'center', width: 100},
        {title: '字段值', field: 'value', align: 'center', width: 100},
        {title: '字段值', field: '632313', align: 'center', width: 100}]
      ],
    },
  ];
}

// 创建其他元素组
export function createMiscElements() {
  return [
    {
      tid: 'customModule.customText',
      title: '自定义文本',
      type: 'text',
      options: {
        testData: '自定义文本内容',
        height: 16,
        fontSize: 9,
        fontWeight: "400",
        textAlign: "left"
      }
    },
    {
      tid: 'customModule.longText',
      title: '长文本',
      type: 'longText',
      options: {
        field: 'longText',
        width: 200,
        testData: '这是一段可以自动换行的长文本，支持分页显示或不分页显示，适合打印较长的文字说明或条款等内容。'
      },
    },
    {
      tid: 'customModule.printDate',
      title: '打印时间',
      type: 'text',
      options: {
        field: 'printDate',
        testData: new Date().toLocaleString(),
        height: 16,
        fontSize: 9,
        fontWeight: "400",
        textAlign: "left",
        textContentVerticalAlign: "middle"
      }
    },
    {
      tid: 'customModule.operator',
      title: '操作人员',
      type: 'text',
      options: {
        field: 'operator',
        testData: '管理员',
        height: 16,
        fontSize: 9,
        fontWeight: "400",
        textAlign: "left",
        textContentVerticalAlign: "middle"
      }
    },
  ];
}

// 自定义打印元素 provider
export function createCustomProvider(fields, fieldTestData = {}) {
  return function(options) {
    var addElementTypes = function(context) {
      // 移除已有模块，避免重复
      context.removePrintElementTypes("customModule");
      
      // 添加自定义元素类型
      context.addPrintElementTypes(
        "customModule",
        [
          // 基础字段元素组
          new hiprint.PrintElementTypeGroup("字段元素", createFieldElements(fields, fieldTestData)),
          
          // 单据表头元素组
          new hiprint.PrintElementTypeGroup("单据表头", createHeaderElements()),
          
          // 表格元素组
          new hiprint.PrintElementTypeGroup("表格数据", createTableElements(fields, fieldTestData)),
          
          // 其他元素组
          new hiprint.PrintElementTypeGroup("其他元素", createMiscElements()),
        ]
      );
    };
    
    return {
      addElementTypes: addElementTypes
    };
  };
} 