<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { bitable } from '@lark-base-open/js-sdk';
import { hiprint, defaultElementTypeProvider } from "vue-plugin-hiprint";
// @ts-ignore
import { fetchVisibleFields } from '@/utils/fieldFetcher';
// @ts-ignore
import { fetchRecordsAndValues } from '@/utils/recordFetcher';
// @ts-ignore
import { createCustomProvider } from '@/utils/printElementProvider';
import PrintDataSelector from './PrintDataSelector.vue';
import $ from 'jquery';
import { ElMessage, ElButton, ElMessageBox, ElTabs, ElTabPane } from 'element-plus';

// 声明全局变量类型
declare global {
  interface Window {
    fieldTestData: Record<string, any>;
  }
}

const message = ref('');
const fields = ref([]);
const activeTab = ref('design');
let hiprintTemplate: any = null;
let isLoading = ref(true);

onMounted(async () => {
  try {
    isLoading.value = true;
    message.value = '正在加载字段和数据...';
    
    // 先获取字段和数据
    await loadFieldsAndData();
    
    // 然后一次性初始化打印组件
    await initHiprint();
    
    isLoading.value = false;
    message.value = '';
  } catch (err) {
    console.error('初始化失败:', err);
    message.value = '初始化失败: ' + (err.message || String(err));
    isLoading.value = false;
  }
});

// 加载字段和记录数据
async function loadFieldsAndData() {
  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;
    
    // 获取字段信息
    fields.value = await fetchVisibleFields(tableId, viewId);
    
    // 获取第一条记录作为测试数据
    const records = await fetchRecordsAndValues(tableId, viewId, null, true);
    const testData = records.length > 0 ? records[0] : null;
    
    // 生成测试数据对象，将从第一条记录获取的字段值组织成对象
    window.fieldTestData = {};
    if (testData && testData.field) {
      testData.field.forEach(item => {
        window.fieldTestData[item.field] = item.value;
      });
    }
    
    return { fields: fields.value, testData };
  } catch (err) {
    console.error('获取字段失败:', err);
    message.value = '获取字段失败: ' + (err.message || String(err));
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
    if (isPdf) {
      const filename = `打印数据_${new Date().toISOString().split('T')[0]}.pdf`;
      exportPdf(printData, filename);
      ElMessage.success('PDF导出成功');
    } else {
      print(printData);
      ElMessage.success('打印预览已生成');
    }
  } catch (error) {
    console.error('打印处理失败:', error);
    ElMessage.error('打印处理失败: ' + (error.message || String(error)));
  }
}
</script>

<template>
  <div class="hiprint-viewer">
    <div v-if="message" class="message">{{ message }}</div>
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <div class="hiprint-container" v-show="!isLoading">
      <el-tabs v-model="activeTab" class="hiprint-tabs">
        <el-tab-pane label="设计模板" name="design">
          <div class="design-container">
            <!-- 左侧：存放可拖拽元素的容器 -->
            <div id="provider-container" class="provider-container"></div>
            
            <!-- 中间：存放元素面板的容器 -->
            <div class="template-wrapper">
              <div class="template-actions">
                <el-button type="primary" size="small" @click="exportTemplateJSON">导出JSON</el-button>
                <el-button type="success" size="small" @click="printPreview">打印预览</el-button>
                <el-button type="warning" size="small" @click="exportToPDF">导出PDF</el-button>
              </div>
              <div id="hiprint-printTemplate" class="template-container"></div>
            </div>
            
            <!-- 右侧：点击元素/面板时，渲染参数的容器 -->
            <div id="PrintElementOptionSetting" class="setting-container"></div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="数据打印" name="print">
          <PrintDataSelector 
            :hiprintTemplate="hiprintTemplate" 
            @print="handlePrint"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 底部：多面板模板容器 -->
    <div class="hiprint-printPagination" v-show="!isLoading && activeTab === 'design'"></div>
  </div>
</template>

<style scoped>
.hiprint-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  position: relative;
}

.message {
  color: #f56c6c;
  margin-bottom: 10px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  color: #606266;
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hiprint-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: calc(100% - 40px);
}

.hiprint-tabs {
  height: 100%;
}

:deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow: auto;
}

.design-container {
  display: flex;
  gap: 20px;
  height: 100%;
}

.provider-container {
  width: 260px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.template-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.template-actions {
  padding: 10px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px 4px 0 0;
  display: flex;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.template-container {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-top: none;
  border-radius: 0 0 4px 4px;
  background-color: #fff;
  overflow: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
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
</style>