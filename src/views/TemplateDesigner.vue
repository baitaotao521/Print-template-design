<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { createChildMessenger } from '@/utils/windowMessenger';
import { createPrintDataPreparer } from '@/utils/printDataPreparer';
import { hiprint, defaultElementTypeProvider } from "vue-plugin-hiprint";
// @ts-ignore
import { createCustomProvider } from '@/utils/printElementProvider';
import { useRouter } from 'vue-router';
import $ from 'jquery';
import {
  ElMessage,
  ElButton,
  ElSelect,
  ElOption,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElIcon,
  ElTag,
  ElButtonGroup,
  ElMessageBox
} from 'element-plus';
import {
  Edit, Setting, Printer, Download, Back, FullScreen,
  Document, Refresh, Check, Close, Monitor, WarningFilled
} from '@element-plus/icons-vue';

const router = useRouter();
const message = ref('');
const isLoading = ref(true);
let hiprintTemplate: any = null;
let templateData = ref(null);

// 子窗口通信管理器
let childMessenger = null;

// 跟踪是否有未保存的更改
const hasUnsavedChanges = ref(false);
const isExitingProperly = ref(false); // 标记是否通过正确方式退出

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

// 浏览器关闭前的警告处理
function handleBeforeUnload(event: BeforeUnloadEvent) {
  // 如果正在通过正确方式退出，不显示警告
  if (isExitingProperly.value) {
    return;
  }

  // 如果有未保存的更改，显示警告
  if (hasUnsavedChanges.value) {
    const message = '您有未保存的模板更改！请使用左侧的"保存并返回"或"返回"按钮，否则数据将丢失。';
    event.preventDefault();
    event.returnValue = message;
    return message;
  }
}

onMounted(async () => {
  try {
    isLoading.value = true;
    message.value = '等待接收数据...';

    // 添加浏览器关闭前的警告监听器
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 创建子窗口通信管理器
    childMessenger = createChildMessenger();

    // 初始化通信，接收来自父页面的数据
    try {
      childMessenger.initialize(handleDataReceived, {
        timeout: 12000
      });
    } catch (error) {
      console.error('初始化通信失败:', error);
      message.value = error.message || '请从主页面打开设计器';
      isLoading.value = false;
      return;
    }

  } catch (err) {
    console.error('初始化失败:', err);
    message.value = '初始化失败: ' + (err.message || String(err));
    isLoading.value = false;
  }
});

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  if (childMessenger) {
    childMessenger.destroy();
  }
});

// 处理接收到的数据
function handleDataReceived(data) {
  try {
    console.log('接收到初始化模板数据');

    // 设置模板数据
    templateData.value = data;

    // 确保所有必要的字段都存在
    if (!templateData.value.fields) {
      console.warn('模板数据中缺少字段信息，使用空数组');
      templateData.value.fields = [];
    }

    if (!templateData.value.testData) {
      console.warn('模板数据中缺少测试数据，使用空对象');
      templateData.value.testData = {};
    }

    if (!templateData.value.recordsData) {
      console.warn('模板数据中缺少记录数据，使用空数组');
      templateData.value.recordsData = [];
    }

    console.log('完整模板数据已接收:', {
      fieldsCount: templateData.value.fields.length,
      hasTestData: Object.keys(templateData.value.testData).length > 0,
      recordsCount: templateData.value.recordsData.length,
      hasTemplate: !!templateData.value.template
    });

    // 更新加载状态
    message.value = '正在初始化设计器...';

    // 初始化打印组件
    initHiprint().then(() => {
      isLoading.value = false;
      message.value = '';
      ElMessage.success('设计器已准备就绪，完整数据加载成功');
    }).catch((error) => {
      console.error('初始化打印组件失败:', error);
      message.value = '初始化打印组件失败: ' + (error.message || String(error));
      isLoading.value = false;
    });
  } catch (error) {
    console.error('处理数据失败:', error);
    ElMessage.error('处理数据失败: ' + (error.message || String(error)));
    isLoading.value = false;
  }
}



// 初始化打印组件
async function initHiprint() {
  try {
    if (!templateData.value) {
      throw new Error('模板数据不存在');
    }
    
    // 先清空, 避免重复构建渲染
    $("#provider-container").empty();
    $("#hiprint-printTemplate").empty();
    
    // 初始化默认的可拖拽元素 provider 和自定义 provider
    hiprint.init({
      providers: [
        defaultElementTypeProvider(), // 使用默认的 provider 提供常规和辅助元素
        createCustomProvider(templateData.value.fields, templateData.value.testData)() // 使用抽离出的自定义 provider
      ]
    });
    
    // 渲染可拖拽元素
    hiprint.PrintElementTypeManager.build($("#provider-container"), "defaultModule"); // 常规和辅助元素
    hiprint.PrintElementTypeManager.build($("#provider-container"), "customModule"); // 自定义元素
    
    // 创建模板对象
    hiprintTemplate = new hiprint.PrintTemplate({
      template: templateData.value.template || {}, // 使用传递过来的模板或默认空白画布
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
        // 标记有未保存的更改
        hasUnsavedChanges.value = true;
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

// 保存模板并返回
async function saveTemplateAndReturn() {
  try {
    // 标记正在正确退出
    isExitingProperly.value = true;
    hasUnsavedChanges.value = false;

    // 获取当前模板数据并确保可以序列化
    const json = exportTemplate();
    const serializedTemplate = JSON.parse(JSON.stringify(json));

    // 使用通信管理器发送数据到父窗口
    try {
      const result = await childMessenger.sendDataToParent({
        template: serializedTemplate
      });

      console.log('模板数据发送结果:', result);
      ElMessage.success('模板已保存');

      // 关闭当前窗口
      setTimeout(() => {
        window.close();
      }, 500);

    } catch (sendError) {
      console.error('发送数据到父窗口失败:', sendError);

      // 备用方案：提示用户手动复制模板数据
      const templateJson = JSON.stringify(serializedTemplate);

      // 创建一个临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = templateJson;
      document.body.appendChild(textArea);
      textArea.select();

      try {
        // 尝试复制到剪贴板
        document.execCommand('copy');
        ElMessage({
          message: '无法自动发送数据，模板JSON已复制到剪贴板，请在原窗口中粘贴并导入',
          duration: 0,
          showClose: true,
          type: 'warning'
        });
      } catch (copyError) {
        console.error('复制到剪贴板失败:', copyError);
        ElMessage({
          message: '无法自动发送数据，请手动保存模板JSON：' + templateJson.substring(0, 100) + '...',
          duration: 0,
          showClose: true,
          type: 'error'
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  } catch (error) {
    console.error('保存模板失败:', error);
    ElMessage.error('保存模板失败: ' + (error.message || String(error)));
  }
}

// 返回上一页
function goBack() {
  const confirmMessage = hasUnsavedChanges.value
    ? '确定要返回吗？您有未保存的更改将丢失！'
    : '确定要返回吗？';

  ElMessageBox.confirm(confirmMessage, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 标记正在正确退出
    isExitingProperly.value = true;
    hasUnsavedChanges.value = false;
    window.close();
  }).catch(() => {});
}

// 打印预览
function printPreview() {
  try {
    // 创建打印数据准备器
    const preparer = createPrintDataPreparer(true); // 启用调试模式

    // 使用工具类准备打印数据
    const printData = preparer.prepareSinglePrintData(templateData.value, {
      includeTableData: true,
      preferTestData: true
    });

    // 验证打印数据
    const validation = preparer.validatePrintData(printData);
    if (!validation.isValid) {
      console.error('打印数据验证失败:', validation.errors);
      ElMessage.error('打印数据无效: ' + validation.errors.join(', '));
      return;
    }

    // 如果有警告，显示警告信息
    if (validation.warnings.length > 0) {
      console.warn('打印数据警告:', validation.warnings);
    }

    console.log('准备的打印数据:', printData);
    console.log('数据验证结果:', validation);

    // 执行打印预览（数据已经在获取时格式化过了）
    hiprintTemplate.print(printData);
    ElMessage.success('打印预览已生成，使用了真实的表格数据');
  } catch (error) {
    console.error('打印预览失败:', error);
    ElMessage.error('打印预览失败: ' + (error.message || String(error)));
  }
}

// 导出PDF
function exportToPDF() {
  try {
    // 创建打印数据准备器
    const preparer = createPrintDataPreparer(true); // 启用调试模式

    // 使用工具类准备打印数据
    const printData = preparer.prepareSinglePrintData(templateData.value, {
      includeTableData: true,
      preferTestData: true
    });

    // 验证打印数据
    const validation = preparer.validatePrintData(printData);
    if (!validation.isValid) {
      console.error('打印数据验证失败:', validation.errors);
      ElMessage.error('打印数据无效: ' + validation.errors.join(', '));
      return;
    }

    console.log('准备的PDF导出数据:', printData);

    // 生成文件名
    const filename = `模板预览_${new Date().toISOString().split('T')[0]}.pdf`;

    // 执行PDF导出（数据已经在获取时格式化过了）
    hiprintTemplate.toPdf(printData, filename);
    ElMessage.success('PDF导出成功，使用了真实的表格数据');
  } catch (error) {
    console.error('导出PDF失败:', error);
    ElMessage.error('导出PDF失败: ' + (error.message || String(error)));
  }
}
</script>

<template>
  <div class="template-designer">
    <!-- 重要提示横幅 -->
    <div class="warning-banner">
      <div class="banner-content">
        <div class="banner-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="banner-text">
          <strong>⚠️ 重要提示：</strong>
          请勿直接关闭浏览器！使用左侧的"保存并返回"或"返回"按钮，否则数据将丢失。
        </div>
        <div class="banner-status" v-if="hasUnsavedChanges">
          <el-tag type="warning" size="small">
            <el-icon><Edit /></el-icon>
            有未保存更改
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 页面头部 -->
    <div class="designer-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="header-text">
            <h1>独立模板设计器</h1>
            <p class="header-subtitle">专业的打印模板设计环境</p>
          </div>
        </div>
        <div class="header-actions">
          <el-tag type="success" size="large" effect="dark">
            <el-icon><FullScreen /></el-icon>
            全屏设计模式
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 状态消息 -->
    <div v-if="message" class="status-message error">
      <el-icon><Close /></el-icon>
      <span>{{ message }}</span>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">设计器初始化中...</div>
        <div class="loading-subtitle">正在加载模板数据和设计组件</div>
      </div>
    </div>

    <div class="designer-container" v-show="!isLoading">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-section">
          <el-button-group>
            <el-button type="primary" @click="saveTemplateAndReturn" :icon="Check">
              保存并返回
            </el-button>
            <el-button @click="goBack" :icon="Back">
              返回
            </el-button>
          </el-button-group>
        </div>

        <div class="toolbar-section">
          <div class="paper-controls">
            <label>纸张设置：</label>
            <el-select
              v-model="selectedPaperSize"
              placeholder="选择纸张大小"
              size="small"
              @change="handlePaperSizeChange"
              style="width: 120px;"
            >
              <el-option
                v-for="item in paperSizeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <el-button type="success" size="small" @click="printPreview" :icon="Printer">
            打印预览
          </el-button>
          <el-button type="primary" size="small" @click="exportToPDF" :icon="Download">
            导出PDF
          </el-button>
        </div>
      </div>

      <!-- 设计工作区 -->
      <div class="designer-workspace">
        <!-- 元素库面板 -->
        <div class="elements-panel">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon><Setting /></el-icon>
              <span>元素库</span>
            </div>
            <div class="panel-subtitle">拖拽元素到画布进行设计</div>
          </div>
          <div class="panel-content">
            <div id="provider-container" class="provider-container"></div>
          </div>
        </div>

        <!-- 画布区域 -->
        <div class="canvas-area">
          <div class="canvas-header">
            <div class="canvas-title">
              <el-icon><Edit /></el-icon>
              <span>设计画布</span>
            </div>
            <div class="canvas-info">
              <el-tag size="small" type="info">
                当前纸张: {{ paperSizeOptions.find(p => p.value === selectedPaperSize)?.label || 'A4' }}
              </el-tag>
            </div>
          </div>
          <div class="canvas-content">
            <div id="hiprint-printTemplate" class="template-container"></div>
          </div>

          <!-- 分页容器 -->
          <div class="pagination-area">
            <div class="hiprint-printPagination"></div>
          </div>
        </div>

        <!-- 属性面板 -->
        <div class="properties-panel">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon><Setting /></el-icon>
              <span>属性设置</span>
            </div>
            <div class="panel-subtitle">选择元素后在此设置属性</div>
          </div>
          <div class="panel-content">
            <div id="PrintElementOptionSetting" class="setting-container"></div>
          </div>
        </div>
      </div>
    </div>
    
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
.template-designer {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 警告横幅样式 */
.warning-banner {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  padding: 12px 30px;
  box-shadow: 0 2px 10px rgba(255, 152, 0, 0.3);
  position: relative;
  z-index: 100;
  animation: slideInFromTop 0.5s ease-out;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 15px;
  max-width: 1400px;
  margin: 0 auto;
  justify-content: center;
}

.banner-icon {
  font-size: 20px;
  color: #fff3e0;
  animation: pulse 2s infinite;
}

.banner-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.banner-text strong {
  font-weight: 700;
}

.banner-status {
  flex-shrink: 0;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 页面头部样式 */
.designer-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.header-text h1 {
  margin: 0 0 5px 0;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  margin: 0;
  font-size: 14px;
  color: #606266;
  font-weight: 400;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

/* 状态消息样式 */
.status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 30px;
  font-size: 14px;
  max-width: 1400px;
  margin: 0 auto;
}

.status-message.error {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.2);
  border-radius: 8px;
}

/* 加载遮罩样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.loading-subtitle {
  font-size: 14px;
  opacity: 0.8;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 主容器样式 */
.designer-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.paper-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.paper-controls label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 设计工作区样式 */
.designer-workspace {
  display: flex;
  flex: 1;
  gap: 15px;
  padding: 15px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 面板通用样式 */
.elements-panel,
.properties-panel {
  width: 280px;
  min-width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.panel-subtitle {
  font-size: 13px;
  color: #606266;
  margin: 0;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.provider-container {
  padding: 15px;
  background-color: #fafbfc;
  overflow-y: auto;
  flex: 1;
  height: 100%;
}

/* 画布区域样式 */
.canvas-area {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0; /* 允许flex收缩 */
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.canvas-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.canvas-info {
  display: flex;
  gap: 10px;
}

.canvas-content {
  flex: 1;
  padding: 15px;
  background: #f8f9fa;
  overflow: auto;
  position: relative;
  height: 100%;
}

.template-container {
  min-height: calc(100vh - 250px);
  width: 100%;
  background: white;
  border: 2px dashed #d9ecff;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 拖拽元素组样式 */
:deep(.ep-draggable-item-group) {
  margin-bottom: 25px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

:deep(.ep-draggable-item-group-title) {
  font-size: 14px;
  font-weight: 600;
  color: white;
  padding: 12px 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-bottom: 0;
  border-radius: 0;
}

/* 拖拽元素样式 */
:deep(.ep-draggable-item) {
  margin: 0;
  padding: 12px 15px;
  background-color: #fff;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 0;
  cursor: move;
  transition: all 0.3s ease;
  min-height: 44px;
  display: flex;
  align-items: center;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}

:deep(.ep-draggable-item:last-child) {
  border-bottom: none;
}

:deep(.ep-draggable-item:hover) {
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
  transform: translateX(3px);
  box-shadow: 3px 0 0 #667eea;
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

.setting-container {
  padding: 15px;
  background-color: #fafbfc;
  overflow-y: auto;
  flex: 1;
  height: 100%;
}

/* 分页区域样式 */
.pagination-area {
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  text-align: center;
}

.hiprint-printPagination {
  display: inline-block;
  padding: 10px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 元素内容样式优化 */
:deep(.ep-draggable-item-title) {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

:deep(.ep-draggable-item-content) {
  display: none; /* 隐藏内容预览，保持简洁 */
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .designer-workspace {
    flex-direction: column;
    gap: 15px;
    padding: 15px 20px;
  }

  .elements-panel,
  .properties-panel {
    width: 100%;
    max-height: 300px;
  }

  .canvas-area {
    order: -1;
  }
}

@media (max-width: 768px) {
  .warning-banner {
    padding: 10px 20px;
  }

  .banner-content {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .banner-text {
    font-size: 13px;
  }

  .designer-header {
    padding: 15px 20px;
  }

  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-text h1 {
    font-size: 24px;
  }

  .toolbar {
    flex-direction: column;
    gap: 15px;
    padding: 15px 20px;
  }

  .toolbar-section {
    justify-content: center;
  }

  .designer-workspace {
    padding: 10px 15px;
  }

  .panel-header,
  .canvas-header {
    padding: 15px;
  }

  .canvas-content {
    padding: 15px;
  }

  .template-container {
    min-height: 400px;
  }
}

/* 滚动条样式 */
.provider-container::-webkit-scrollbar,
.setting-container::-webkit-scrollbar,
.canvas-content::-webkit-scrollbar {
  width: 8px;
}

.provider-container::-webkit-scrollbar-track,
.setting-container::-webkit-scrollbar-track,
.canvas-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.provider-container::-webkit-scrollbar-thumb,
.setting-container::-webkit-scrollbar-thumb,
.canvas-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.provider-container::-webkit-scrollbar-thumb:hover,
.setting-container::-webkit-scrollbar-thumb:hover,
.canvas-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}
</style> 