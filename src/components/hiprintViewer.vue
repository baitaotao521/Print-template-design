<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { bitable } from '@lark-base-open/js-sdk';
import { hiprint, defaultElementTypeProvider } from "vue-plugin-hiprint";
// @ts-ignore
import { fetchVisibleFields } from '@/utils/fieldFetcher';
// @ts-ignore
import { fetchRecordsAndValues } from '@/utils/recordFetcher';
// @ts-ignore
import { createCustomProvider } from '@/utils/printElementProvider';
import PrintDataSelector from './PrintDataSelector.vue';
import FieldInfoViewer from './FieldInfoViewer.vue';
import TemplateManager from './TemplateManager.vue';
import $ from 'jquery';
import { ElMessage, ElButton, ElMessageBox, ElTabs, ElTabPane, ElSelect, ElOption, ElDialog, ElForm, ElFormItem, ElInput, ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';
import { Printer, QuestionFilled, WarningFilled, Loading, Edit, DataBoard, FolderOpened, InfoFilled, Setting, Download, Upload } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { saveTemplate, getTemplate, getAllTemplates, deleteTemplate } from '@/utils/indexedDBHelper';

// 声明全局变量类型
declare global {
  interface Window {
    fieldTestData: Record<string, any>;
  }
}

const router = useRouter();
const message = ref('');
const fields = ref([]);
const recordsData = ref([]);
const activeTab = ref('design');
let hiprintTemplate: any = null;
let isLoading = ref(true);

// 添加一个新的状态变量来跟踪记录加载状态
const isLoadingRecords = ref(false);
const recordsLoadingMessage = ref('');

// 添加纸张大小选项
const paperSizeOptions = ref([
  { label: 'A4', value: 'A4', width: 210, height: 297 },
  { label: 'A5', value: 'A5', width: 148, height: 210 },
  { label: 'B5', value: 'B5', width: 176, height: 250 },
  { label: '自定义', value: 'custom', width: 100, height: 150 }
]);
const selectedPaperSize = ref('A4');

// 自定义纸张对话框
const customPaperDialogVisible = ref(false);
const customPaperForm = ref({
  width: 100,
  height: 150
});

// 在 script setup 中添加新的响应式变量
const templateList = ref([]);
const currentTemplateId = ref('');
const templateName = ref('');

// 标签页配置
const tabs = ref([
  { name: 'design', label: '设计模板', icon: 'Edit' },
  { name: 'print', label: '数据打印', icon: 'Printer' },
  { name: 'template-manager', label: '模板管理', icon: 'FolderOpened' },
  { name: 'field-info', label: '字段信息', icon: 'DataBoard' }
]);

onMounted(async () => {
  try {
    isLoading.value = true;
    message.value = '正在初始化...';
    
    // 添加消息监听器，接收从模板设计页面发送回来的数据
    window.addEventListener('message', handleMessageFromDesigner);
    
    // 先获取字段信息
    message.value = '正在加载字段信息...';
    await loadFields();
    
    // 然后一次性初始化打印组件
    message.value = '正在初始化打印组件...';
    await initHiprint();
    
    // 检查是否有从模板设计页面返回的模板数据
    const hasTemplateFromDesigner = await checkSavedTemplate();
    
    // 如果没有从设计器返回的模板，尝试加载默认模板
    if (!hasTemplateFromDesigner) {
      message.value = '正在加载默认模板...';
      await loadDefaultTemplate();
    }
    
    // 加载模板列表
    await loadTemplateList();
    
    isLoading.value = false;
    message.value = '';
    
    // 懒加载记录数据
    loadRecordsAsync();
  } catch (err) {
    console.error('初始化失败:', err);
    message.value = '初始化失败: ' + (err.message || String(err));
    isLoading.value = false;
  }
});

// 分离加载字段和记录的方法
async function loadFields() {
  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;
    
    // 获取字段信息
    fields.value = await fetchVisibleFields(tableId, viewId);
    
    return { fields: fields.value, tableId, viewId };
  } catch (err) {
    console.error('获取字段失败:', err);
    throw err;
  }
}

// 异步加载记录数据
async function loadRecordsAsync() {
  try {
    isLoadingRecords.value = true;
    recordsLoadingMessage.value = '正在加载记录数据，这可能需要一些时间...';
    
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;
    
    // 使用回调函数，在每批数据加载完成时更新界面
    await fetchRecordsAndValues(
      tableId, 
      viewId, 
      null, 
      true, 
      (loadedRecords, batchCount, isComplete) => {
        // 更新记录数据
        recordsData.value = loadedRecords.map(record => {
      const recordData = { recordId: record.recordId, field: record.field };
      if (record.field) {
        record.field.forEach(item => {
          recordData[item.field] = item.value;
        });
      }
      return recordData;
    });
    
        // 更新测试数据（使用第一条记录）
        if (loadedRecords.length > 0) {
          const testData = loadedRecords[0];
    window.fieldTestData = {};
    if (testData && testData.field) {
      testData.field.forEach(item => {
        window.fieldTestData[item.field] = item.value;
      });
    }
        }
        
        // 更新加载提示
        if (isComplete) {
          recordsLoadingMessage.value = `已成功加载 ${loadedRecords.length} 条记录`;
          setTimeout(() => {
            recordsLoadingMessage.value = '';
          }, 3000);
        } else {
          recordsLoadingMessage.value = `已加载 ${loadedRecords.length} 条记录，正在继续加载...（批次 ${batchCount}）`;
        }
      }
    );
  } catch (err) {
    console.error('获取记录失败:', err);
    recordsLoadingMessage.value = '获取记录失败: ' + (err.message || String(err));
    setTimeout(() => {
      recordsLoadingMessage.value = '';
    }, 5000);
  } finally {
    isLoadingRecords.value = false;
  }
}

// 修改原来的 loadFieldsAndData 方法
async function loadFieldsAndData() {
  try {
    // 先加载字段
    const { fields: loadedFields } = await loadFields();
    
    // 如果记录数据还没有加载，显示加载中的提示
    if (recordsData.value.length === 0) {
      recordsLoadingMessage.value = '记录数据正在加载中，请稍候...';
    }
    
    return { fields: loadedFields, testData: window.fieldTestData || {}, records: recordsData.value };
  } catch (err) {
    console.error('获取数据失败:', err);
    throw err;
  }
}

// 一次性初始化打印组件
async function initHiprint() {
  try {
    // 先清空, 避免重复构建渲染
    $("#provider-container").empty();
    $("#hiprint-printTemplate").empty();
    
    // 初始化默认的可拖拽元素 provider 和自定义 provider
    hiprint.init({
      providers: [
        defaultElementTypeProvider(), // 使用默认的 provider 提供常规和辅助元素
        createCustomProvider(fields.value, window.fieldTestData)() // 使用抽离出的自定义 provider
      ]
    });
    
    // 渲染可拖拽元素
    hiprint.PrintElementTypeManager.build($("#provider-container"), "defaultModule"); // 常规和辅助元素
    hiprint.PrintElementTypeManager.build($("#provider-container"), "customModule"); // 自定义元素
    
    // 创建模板对象
    hiprintTemplate = new hiprint.PrintTemplate({
      template: {}, // 默认空白画布
      settingContainer: "#PrintElementOptionSetting",
      paginationContainer: '.hiprint-printPagination',
      fontList: [
        { title: "微软雅黑", value: "Microsoft YaHei" },
        { title: "黑体", value: "STHeitiSC-Light" },
        { title: "思源黑体", value: "SourceHanSansCN-Normal" },
        { title: "宋体", value: "SimSun" },
        { title: "华为楷体", value: "STKaiti" },
      ],
      dataMode: 1,
      history: true,
      onDataChanged: (type, json) => {
        console.log('模板变更类型:', type);
        console.log('模板数据:', json);
      },
      onUpdateError: (e) => {
        console.error('更新失败:', e);
      },
    });
    
    // 渲染到画布容器
    hiprintTemplate.design("#hiprint-printTemplate", { grid: true });
    
    // 添加监听器为每个组添加列表容器类
    setTimeout(() => {
      $('.ep-draggable-item-group').each(function() {
        const $items = $(this).children('.ep-draggable-item');
        if ($items.length > 0) {
          $items.wrapAll('<div class="ep-draggable-item-list"></div>');
        }
      });
    }, 500);
  } catch (err) {
    console.error('初始化打印组件失败:', err);
    message.value = '初始化打印组件失败: ' + (err.message || String(err));
    throw err;
  }
}

// 导出模板JSON
function exportTemplate() {
  const json = hiprintTemplate.getJson();
  console.log('模板JSON:', json);
  return json;
}

// 导入模板JSON
function importTemplate(jsonData) {
  try {
    // 清空现有模板
    $("#hiprint-printTemplate").empty();
    
    // 使用update方法导入模板
    hiprintTemplate.update(jsonData);
    
    // 重新渲染设计器
    hiprintTemplate.design("#hiprint-printTemplate", { grid: true });
    
    ElMessage.success('模板导入成功');
  } catch (error) {
    console.error('导入模板失败:', error);
    ElMessage.error('导入模板失败: ' + (error.message || String(error)));
  }
}

// 设置纸张大小
function setPaperSize(paperType) {
  try {
    const selectedOption = paperSizeOptions.value.find(option => option.value === paperType);
    if (!selectedOption) return;
    
    // 根据文档，直接使用纸张类型名称
    hiprintTemplate.setPaper(paperType);
    ElMessage.success(`已设置纸张大小: ${selectedOption.label}`);
  } catch (error) {
    console.error('设置纸张大小失败:', error);
    ElMessage.error('设置纸张大小失败: ' + (error.message || String(error)));
  }
}

// 确认自定义纸张设置
function confirmCustomPaper() {
  try {
    const width = parseFloat(customPaperForm.value.width.toString());
    const height = parseFloat(customPaperForm.value.height.toString());
    
    if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
      ElMessage.error('请输入有效的纸张尺寸');
      return;
    }
    
    // 修改调用方式，直接传递宽度和高度参数
    hiprintTemplate.setPaper(width, height);
    
    ElMessage.success(`已设置自定义纸张大小: ${width}mm x ${height}mm`);
    customPaperDialogVisible.value = false;
  } catch (err) {
    console.error('设置自定义纸张失败:', err);
    ElMessage.error('设置自定义纸张失败: ' + (err.message || String(err)));
  }
}

// 处理纸张大小变更
function handlePaperSizeChange(value) {
  selectedPaperSize.value = value;
  
  // 如果是自定义纸张，直接显示对话框
  if (value === 'custom') {
    // 重置表单默认值
    customPaperForm.value = {
      width: 100,
      height: 150
    };
    // 显示对话框
    customPaperDialogVisible.value = true;
  } else {
    // 对于标准纸张类型，直接调用setPaperSize
    setPaperSize(value);
  }
}

// 处理下拉菜单命令的方法
function handleTemplateCommand(command) {
  switch (command) {
    case 'export':
      exportTemplateJSON();
      break;
    case 'import':
      handleImportTemplate();
      break;
    case 'paste':
      importTemplateFromJson();
      break;
    default:
      break;
  }
}

// 用户点击导入模板按钮
function handleImportTemplate() {
  // 创建文件输入元素
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // 监听文件选择事件
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      document.body.removeChild(fileInput);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        importTemplate(jsonData);
        ElMessage.success('模板导入成功');
      } catch (error) {
        console.error('解析JSON失败:', error);
        ElMessage.error('无效的模板文件');
      }
    };
    reader.onerror = () => {
      ElMessage.error('读取文件失败');
    };
    reader.readAsText(file);
    
    // 清理DOM
    document.body.removeChild(fileInput);
  });
  
  // 触发文件选择对话框
  fileInput.click();
}

// 手动导入模板JSON
function importTemplateFromJson() {
  ElMessageBox.prompt('请粘贴模板JSON数据', '导入模板', {
    confirmButtonText: '导入',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '粘贴JSON数据...'
  }).then(({ value }) => {
    try {
      if (!value) {
        ElMessage.warning('未提供JSON数据');
        return;
      }
      
      const jsonData = JSON.parse(value);
      importTemplate(jsonData);
      ElMessage.success('模板导入成功');
    } catch (error) {
      console.error('导入JSON失败:', error);
      ElMessage.error('无效的JSON数据: ' + (error.message || String(error)));
    }
  }).catch(() => {
    // 用户取消
  });
}

// 打印预览
function preview(data) {
  const jHtml = hiprintTemplate.getHtml(data);
  return jHtml.html();
}

// 打印
function print(data) {
  hiprintTemplate.print(data);
}

// 导出PDF
function exportPdf(data, filename) {
  hiprintTemplate.toPdf(data, filename);
}

// 用户点击导出JSON按钮
function exportTemplateJSON() {
  try {
    const jsonData = exportTemplate();
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `打印模板_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ElMessage.success('模板导出成功');
  } catch (error) {
    console.error('导出模板失败:', error);
    ElMessage.error('导出模板失败');
  }
}

// 用户点击打印预览按钮
function printPreview() {
  try {
    // 获取第一条记录数据作为测试数据
    const testData = fields.value.length > 0 ? { fields: fields.value } : {};
    print(testData);
    ElMessage.success('打印预览已生成');
  } catch (error) {
    console.error('打印预览失败:', error);
    ElMessage.error('打印预览失败');
  }
}

// 用户点击导出PDF按钮
function exportToPDF() {
  try {
    const filename = `打印模板_${new Date().toISOString().split('T')[0]}.pdf`;
    // 获取第一条记录数据作为测试数据
    const testData = fields.value.length > 0 ? { fields: fields.value } : {};
    exportPdf(testData, filename);
    ElMessage.success('PDF导出成功');
  } catch (error) {
    console.error('导出PDF失败:', error);
    ElMessage.error('导出PDF失败');
  }
}

// 处理来自PrintDataSelector的打印请求
function handlePrint(printData, isPdf = false) {
  try {
    if (!printData || (Array.isArray(printData) && printData.length === 0)) {
      ElMessage.warning('没有可打印的数据');
      return;
    }
    
    if (isPdf) {
      const filename = `打印数据_${new Date().toISOString().split('T')[0]}.pdf`;
      // 按照指定格式打印数据
      exportPdf(printData, filename);
      ElMessage.success('PDF导出成功');
    } else {
      // 按照指定格式打印数据
      print(printData);
      ElMessage.success('打印预览已生成');
    }
    
    // 打印完成后，输出打印数据结构，方便调试
    console.log('打印数据结构:', JSON.stringify(printData));
  } catch (error) {
    console.error('打印处理失败:', error);
    ElMessage.error('打印处理失败: ' + (error.message || String(error)));
  }
}

// 跳转到模板设计页面
function goToTemplateDesigner() {
  try {
    // 获取当前模板数据
    const currentTemplate = hiprintTemplate ? hiprintTemplate.getJson() : {};
    
    // 准备要存储的数据，确保数据可以被序列化
    // 为了减小数据量，只传递必要的字段信息
    const fieldsData = JSON.parse(JSON.stringify(fields.value || [])).map(field => ({
      id: field.id,
      name: field.name,
      type: field.type,
      displayName: field.displayName || field.name
    }));
    
    // 准备测试数据
    const testDataClone = JSON.parse(JSON.stringify(window.fieldTestData || {}));
    
    // 准备要传递的数据
    const templateData = {
      template: currentTemplate,
      fields: fieldsData,
      testData: testDataClone
    };
    
    // 将数据转换为JSON字符串，然后使用Base64编码
    const jsonString = JSON.stringify(templateData);
    
    try {
      // 尝试直接将完整数据编码到URL
      const encodedData = btoa(encodeURIComponent(jsonString));
      
      // 检查URL长度，大多数浏览器限制URL长度在2000-8000字符之间
      const baseUrl = window.location.origin + window.location.pathname + '#/template-designer?data=';
      const fullUrl = baseUrl + encodedData;
      
      if (fullUrl.length > 2000) {
        throw new Error('URL too long');
      }
      
      // 打开新窗口
      const newWindow = window.open(fullUrl, '_blank', 'width=1200,height=800');
      
      // 如果新窗口被阻止，提示用户
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        ElMessage.error('弹窗被浏览器阻止，请允许弹窗后重试');
        return;
      }
      
      ElMessage.success('正在打开模板设计器');
      
    } catch (urlError) {
      console.warn('URL数据过大，尝试简化数据:', urlError);
      
      // 如果URL太长，简化数据
      const simplifiedData = {
        template: currentTemplate,
        fields: fieldsData.map(f => ({ 
          id: f.id, 
          name: f.name,
          type: f.type 
        }))
      };
      
      // 重新编码
      const simplifiedJsonString = JSON.stringify(simplifiedData);
      const encodedSimplifiedData = btoa(encodeURIComponent(simplifiedJsonString));
      
      // 打开新窗口
      const designerUrl = window.location.origin + window.location.pathname + '#/template-designer?data=' + encodedSimplifiedData;
      const newWindow = window.open(designerUrl, '_blank', 'width=1200,height=800');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        ElMessage.error('弹窗被浏览器阻止，请允许弹窗后重试');
        return;
      }
      
      ElMessage.success('正在打开模板设计器（数据已简化）');
    }
  } catch (error) {
    console.error('打开模板设计器失败:', error);
    ElMessage.error('打开模板设计器失败: ' + (error.message || String(error)));
  }
}

// 检查是否有保存的模板
async function checkSavedTemplate() {
  return new Promise((resolve) => {
    try {
      // 从localStorage获取数据
      const storedData = localStorage.getItem('templateDesignerData');
      
      if (!storedData) {
        console.log('没有找到保存的模板数据');
        resolve(false);
        return;
      }
      
      try {
        // 解析数据
        const templateData = JSON.parse(storedData);
        console.log('发现保存的模板数据');
        
        // 检查是否有模板数据
        if (templateData && templateData.template) {
          console.log('正在导入模板...');
          importTemplate(templateData.template);
          
          // 导入后删除保存的模板数据
          localStorage.removeItem('templateDesignerData');
          console.log('已删除保存的模板数据');
          
          ElMessage.success('已成功导入模板设计器中保存的模板');
          resolve(true);
        } else {
          console.warn('保存的模板数据不完整');
          resolve(false);
        }
      } catch (parseError) {
        console.error('解析保存的模板数据失败:', parseError);
        ElMessage.error('解析保存的模板数据失败: ' + (parseError.message || String(parseError)));
        resolve(false);
      }
    } catch (error) {
      console.error('检查保存的模板失败:', error);
      resolve(false);
    }
  });
}

// 处理从模板设计页面发送回来的消息
function handleMessageFromDesigner(event) {
  try {
    // 检查消息类型
    if (event.data && event.data.type === 'TEMPLATE_SAVED') {
      console.log('收到模板设计页面发送的模板数据');
      
      // 导入模板
      if (event.data.template) {
        importTemplate(event.data.template);
        ElMessage.success('已成功导入模板设计器中保存的模板');
      } else {
        console.warn('收到的模板数据不完整');
        ElMessage.warning('收到的模板数据不完整');
      }
    }
  } catch (error) {
    console.error('处理模板设计页面消息失败:', error);
    ElMessage.error('处理模板设计页面消息失败: ' + (error.message || String(error)));
  }
}

// 保存当前模板到 IndexedDB
async function saveCurrentTemplate() {
  try {
    if (!templateName.value) {
      ElMessage.warning('请输入模板名称');
      return;
    }
    
    // 获取模板JSON数据
    const json = hiprintTemplate.getJson();
    
    // 序列化处理，确保数据可以被正确存储
    const serializedJson = JSON.parse(JSON.stringify(json));
    
    // 保存模板，传入模板名称作为描述
    await saveTemplate(templateName.value, serializedJson, templateName.value);
    
    ElMessage.success('模板已保存到本地数据库');
    await loadTemplateList(); // 重新加载模板列表
  } catch (error) {
    console.error('保存模板失败:', error);
    ElMessage.error('保存模板失败: ' + (error.message || String(error)));
  }
}

// 加载模板列表
async function loadTemplateList() {
  try {
    const templates = await getAllTemplates();
    templateList.value = templates;
  } catch (error) {
    console.error('加载模板列表失败:', error);
    ElMessage.error('加载模板列表失败: ' + (error.message || String(error)));
  }
}

// 加载指定模板
async function loadTemplate(id) {
  try {
    const template = await getTemplate(id);
    if (template && template.data) {
      importTemplate(template.data);
      currentTemplateId.value = id;
      templateName.value = template.description || id; // 使用描述作为模板名称
      ElMessage.success('模板已从本地数据库加载');
    } else {
      ElMessage.warning('未找到指定模板');
    }
  } catch (error) {
    console.error('加载模板失败:', error);
    ElMessage.error('加载模板失败: ' + (error.message || String(error)));
  }
}

// 删除模板
async function removeTemplate(id) {
  try {
    await ElMessageBox.confirm('确定要删除这个模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await deleteTemplate(id);
    ElMessage.success('模板已删除');
    await loadTemplateList(); // 重新加载模板列表
    
    // 如果删除的是当前模板，清空当前模板
    if (currentTemplateId.value === id) {
      currentTemplateId.value = '';
      templateName.value = '';
      // 清空设计器
      $("#hiprint-printTemplate").empty();
      hiprintTemplate.design("#hiprint-printTemplate", { grid: true });
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模板失败:', error);
      ElMessage.error('删除模板失败: ' + (error.message || String(error)));
    }
  }
}

// 恢复处理从模板管理器加载模板的方法
function handleLoadTemplateFromManager(templateData) {
  try {
    if (!templateData) {
      ElMessage.warning('模板数据为空');
      return;
    }

    console.log('从模板管理器加载模板数据:', templateData);

    // 切换到设计标签页
    activeTab.value = 'design';

    // 等待DOM更新后再导入模板
    nextTick(() => {
      try {
        // 确保容器存在
        const container = document.getElementById('hiprint-printTemplate');
        if (!container) {
          console.error('找不到模板容器元素');
          ElMessage.error('模板容器未准备好，请稍后重试');
          return;
        }

        // 直接使用原始数据，不进行修改
        // 这样可以保持与文件导入相同的数据格式
        let rawData = templateData;

        // 如果数据是字符串，尝试解析
        if (typeof templateData === 'string') {
          rawData = JSON.parse(templateData);
        }

        console.log('准备导入的原始模板数据:', rawData);

        // 导入模板
        importTemplate(rawData);

        ElMessage.success('模板已成功加载到设计器');
      } catch (innerError) {
        console.error('导入模板时发生错误:', innerError);
        ElMessage.error('导入模板失败: ' + (innerError.message || String(innerError)));
      }
    });

  } catch (error) {
    console.error('加载模板失败:', error);
    ElMessage.error('加载模板失败: ' + (error.message || String(error)));
  }
}

// 添加加载默认模板的方法
async function loadDefaultTemplate() {
  try {
    // 检查当前模板是否已有数据
    const currentTemplateData = hiprintTemplate.getJson();
    const hasExistingTemplate = currentTemplateData && 
                               Object.keys(currentTemplateData).length > 0 && 
                               (currentTemplateData.printElements || []).length > 0;
    
    if (hasExistingTemplate) {
      console.log('已有模板数据，不需要加载默认模板');
      return;
    }
    
    // 尝试从数据库加载第一个模板
    const templates = await getAllTemplates();
    
    if (templates && templates.length > 0) {
      // 使用第一个模板
      const firstTemplate = templates[0];
      console.log(`从数据库加载模板: ${firstTemplate.id}`);
      importTemplate(firstTemplate.data);
      currentTemplateId.value = firstTemplate.id;
      templateName.value = firstTemplate.description || firstTemplate.id;
      ElMessage.success(`已自动加载模板: ${firstTemplate.id}`);
      return;
    }
    
    // 如果没有保存的模板，使用默认模板
    console.log('数据库中没有模板，使用默认空白模板');
    // 这里可以添加默认模板的配置
    const defaultTemplate = {
      width: 210,
      height: 297,
      paperHeader: 0,
      paperFooter: 0,
      printElements: []
    };
    
    // 导入默认模板
    hiprintTemplate.clear();
    hiprintTemplate.setPaper("A4");
    hiprintTemplate.design("#hiprint-printTemplate", { grid: true });
    
  } catch (error) {
    console.error('加载默认模板失败:', error);
    // 失败时不显示错误消息，静默失败
  }
}

// 添加一个新的方法来处理跳转到帮助页面
function goToHelpPage() {
  router.push('/help');
}
</script>

<template>
  <div class="hiprint-viewer">
    <!-- 页面头部 -->
    <div class="viewer-header">
      <div class="header-content">
        <div class="header-left">
          <el-icon class="header-icon"><Printer /></el-icon>
          <div class="header-text">
            <h1>打印模板设计系统</h1>
            <p class="header-subtitle">专业的模板设计与数据打印工具</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button @click="goToHelpPage" type="primary" size="small" :icon="QuestionFilled">
            使用帮助
          </el-button>
        </div>
      </div>
    </div>

    <!-- 状态消息 -->
    <div v-if="message" class="status-message error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ message }}</span>
    </div>
    <div v-if="recordsLoadingMessage" class="status-message info">
      <el-icon><Loading /></el-icon>
      <span>{{ recordsLoadingMessage }}</span>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">系统初始化中...</div>
        <div class="loading-subtitle">请稍候，正在加载组件和数据</div>
      </div>
    </div>

    <div class="hiprint-container" v-show="!isLoading">
      <!-- 导航标签 -->
      <div class="nav-tabs">
        <div class="tab-buttons">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            :class="['tab-button', { active: activeTab === tab.name }]"
            @click="activeTab = tab.name"
          >
            <el-icon>
              <component :is="tab.icon" />
            </el-icon>
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- 标签内容 -->
      <div class="tab-content">
        <!-- 设计模板 -->
        <div v-if="activeTab === 'design'" class="tab-panel">
          <div class="panel-header">
            <h3>
              <el-icon><Edit /></el-icon>
              模板设计
            </h3>
            <p>拖拽元素到画布，设计您的打印模板</p>
          </div>

          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-section">
              <label>模板名称：</label>
              <el-input
                v-model="templateName"
                placeholder="输入模板名称"
                size="small"
                style="width: 200px;"
              />
              <el-button type="primary" size="small" @click="saveCurrentTemplate" :icon="Download">
                保存模板
              </el-button>
            </div>

            <div class="toolbar-section">
              <el-dropdown @command="handleTemplateCommand" trigger="click">
                <el-button type="info" size="small" :icon="Setting">
                  模板操作
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="export" :icon="Download">导出JSON</el-dropdown-item>
                    <el-dropdown-item command="import" :icon="Upload">导入模板</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <el-select
                v-model="selectedPaperSize"
                placeholder="纸张大小"
                size="small"
                @change="handlePaperSizeChange"
                style="width: 100px;"
              >
                <el-option
                  v-for="item in paperSizeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>

            <div class="toolbar-section">
              <el-button type="success" size="small" @click="goToTemplateDesigner">
                独立设计器
              </el-button>
              <el-button type="warning" size="small" @click="printPreview">
                打印预览
              </el-button>
            </div>
          </div>

          <!-- 设计区域 -->
          <div class="design-workspace">
            <!-- 元素库 -->
            <div class="elements-panel">
              <div class="panel-title">
                <el-icon><Setting /></el-icon>
                <span>元素库</span>
              </div>
              <div id="provider-container" class="provider-container"></div>
            </div>

            <!-- 画布区域 -->
            <div class="canvas-panel">
              <div class="canvas-header">
                <span>设计画布</span>
              </div>
              <div id="hiprint-printTemplate" class="template-container"></div>
            </div>

            <!-- 属性面板 -->
            <div class="properties-panel">
              <div class="panel-title">
                <el-icon><Setting /></el-icon>
                <span>属性设置</span>
              </div>
              <div id="PrintElementOptionSetting" class="setting-container"></div>
            </div>
          </div>
        </div>

        <!-- 数据打印 -->
        <div v-else-if="activeTab === 'print'" class="tab-panel">
          <div class="panel-header">
            <h3>
              <el-icon><Printer /></el-icon>
              数据打印
            </h3>
            <p>选择数据并执行打印操作</p>
          </div>
          <PrintDataSelector
            :hiprintTemplate="hiprintTemplate"
            :initialFields="fields"
            :initialRecords="recordsData"
            @print="handlePrint"
          />
        </div>

        <!-- 模板管理 -->
        <div v-else-if="activeTab === 'template-manager'" class="tab-panel">
          <div class="panel-header">
            <h3>
              <el-icon><FolderOpened /></el-icon>
              模板管理
            </h3>
            <p>管理您的打印模板</p>
          </div>
          <TemplateManager
            :hiprintTemplate="hiprintTemplate"
            @load-template="handleLoadTemplateFromManager"
          />
        </div>

        <!-- 字段信息 -->
        <div v-else-if="activeTab === 'field-info'" class="tab-panel">
          <div class="panel-header">
            <h3>
              <el-icon><DataBoard /></el-icon>
              字段信息
            </h3>
            <p>查看当前表格的字段信息</p>
          </div>
          <FieldInfoViewer />
        </div>
      </div>
    </div>
    
    <!-- 底部：多面板模板容器 -->
    <div class="hiprint-printPagination" v-show="!isLoading && activeTab === 'design'"></div>
    
    <!-- 自定义纸张大小对话框 -->
    <el-dialog
      v-model="customPaperDialogVisible"
      title="自定义纸张大小"
      width="400px"
      :close-on-click-modal="false"
      :show-close="true"
    >
      <el-form :model="customPaperForm" label-width="100px">
        <el-form-item label="宽度 (mm)">
          <el-input v-model="customPaperForm.width" type="number" min="1" placeholder="请输入纸张宽度"></el-input>
        </el-form-item>
        <el-form-item label="高度 (mm)">
          <el-input v-model="customPaperForm.height" type="number" min="1" placeholder="请输入纸张高度"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="customPaperDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmCustomPaper">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 基础样式 */
.hiprint-viewer {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  padding: 15px;
  position: relative;
}

/* 页面头部样式 */
.viewer-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 15px;
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.9);
}

.header-text h1 {
  margin: 0 0 5px 0;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 状态消息样式 */
.status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 14px;
}

.status-message.error {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.status-message.info {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #c2e7b0;
}

/* 加载遮罩样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.loading-text {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
}

.loading-subtitle {
  color: #606266;
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 主容器样式 */
.hiprint-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 导航标签样式 */
.nav-tabs {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.tab-buttons {
  display: flex;
  overflow-x: auto;
  padding: 0;
}

.tab-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 15px 20px;
  border: none;
  background: transparent;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  border-bottom: 3px solid transparent;
}

.tab-button:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.tab-button.active {
  background: white;
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.tab-button .el-icon {
  font-size: 18px;
}

.tab-button span {
  font-size: 12px;
  line-height: 1;
}

/* 标签内容样式 */
.tab-content {
  min-height: 500px;
}

.tab-panel {
  padding: 20px;
}

.panel-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.panel-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
}

.panel-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-section label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  min-width: 80px;
}

/* 设计工作区样式 */
.design-workspace {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 600px;
}

/* 面板样式 */
.elements-panel,
.canvas-panel,
.properties-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-title,
.canvas-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.provider-container {
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
  background-color: #fafbfc;
}

.template-container {
  min-height: 400px;
  background-color: #fff;
  border: 2px dashed #e9ecef;
  margin: 15px;
  border-radius: 8px;
  position: relative;
}

.setting-container {
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
  background-color: #fafbfc;
}

/* 拖拽元素组样式 */
:deep(.ep-draggable-item-group) {
  margin-bottom: 20px;
}

:deep(.ep-draggable-item-group-title) {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  padding: 6px 10px;
  background-color: #ebeef5;
  border-radius: 4px;
  margin-bottom: 12px;
}


/* 拖拽元素样式 - 减小大小 */
:deep(.ep-draggable-item) {
  margin: 8px 0;
  padding: 12px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: move;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  min-height: 24px;
  display: flex;
  align-items: center;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}

:deep(.ep-draggable-item:hover) {
  border-color: #409eff;
  box-shadow: 0 6px 24px rgba(64,158,255,0.12);
  background: #f0f7ff;
}

/* 更多元素样式优化 */
:deep(.ep-draggable-item-title) {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  font-weight: 500;
  padding: 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

:deep(.ep-draggable-item-content) {
  padding: 6px;
  background-color: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 3px;
  font-size: 11px;
  margin: 0 2px;
}

:deep(.ep-draggable-item-content-text) {
  color: #409eff;
  word-break: break-all;
}

/* 表格元素特殊样式 */
:deep(.ep-draggable-item[data-type="table"]) {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
  width: 100%;
  margin-top: 8px;
}

:deep(.ep-draggable-item[data-type="table"]:hover) {
  border-color: #67c23a;
  box-shadow: 0 2px 12px rgba(103, 194, 58, 0.1);
}

.setting-container {
  width: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background-color: #f5f7fa;
  overflow-y: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.hiprint-printPagination {
  margin-top: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background-color: #f5f7fa;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 滚动条样式 */
.provider-container::-webkit-scrollbar,
.template-container::-webkit-scrollbar,
.setting-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.provider-container::-webkit-scrollbar-thumb,
.template-container::-webkit-scrollbar-thumb,
.setting-container::-webkit-scrollbar-thumb {
  background-color: #c0c4cc;
  border-radius: 3px;
}

.provider-container::-webkit-scrollbar-track,
.template-container::-webkit-scrollbar-track,
.setting-container::-webkit-scrollbar-track {
  background-color: #f5f7fa;
  border-radius: 3px;
}

:deep(.ep-draggable-item-group > div:not(.ep-draggable-item-group-title):not(.ep-draggable-item-list)) {
  display: block;
}

/* 针对字段元素的特殊样式 */
:deep(.ep-draggable-item-group:nth-child(3) .ep-draggable-item) {
  width: 100%;
}

/* 针对拖拽元素的美化 */
:deep(.ep-draggable-item-list) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

:deep(.ep-draggable-item) {
  margin: 0;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 添加模板列表样式 */
.template-list {
  margin: 10px 0;
  padding: 10px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.template-list h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}

.records-loading-message {
  background-color: #f0f9eb;
  color: #67c23a;
  padding: 8px 16px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hiprint-viewer {
    padding: 10px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-text h1 {
    font-size: 18px;
  }

  .tab-buttons {
    justify-content: center;
  }

  .tab-button {
    min-width: 70px;
    padding: 12px 15px;
  }

  .toolbar {
    padding: 12px;
  }

  .toolbar-section {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .toolbar-section label {
    min-width: auto;
    text-align: left;
  }

  .design-workspace {
    gap: 12px;
  }

  .template-container {
    min-height: 300px;
    margin: 10px;
  }
}

@media (max-width: 480px) {
  .header-text h1 {
    font-size: 16px;
  }

  .header-subtitle {
    font-size: 12px;
  }

  .tab-button {
    min-width: 60px;
    padding: 10px 8px;
  }

  .tab-button span {
    font-size: 11px;
  }

  .panel-header h3 {
    font-size: 16px;
  }

  .toolbar-section {
    gap: 6px;
  }
}

/* 动画效果 */
.tab-panel {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>