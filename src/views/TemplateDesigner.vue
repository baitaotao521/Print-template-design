<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { hiprint, defaultElementTypeProvider } from "vue-plugin-hiprint";
// @ts-ignore
import { createCustomProvider } from '@/utils/printElementProvider';
import { useRouter } from 'vue-router';
import $ from 'jquery';
import { ElMessage, ElButton, ElSelect, ElOption, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';

const router = useRouter();
const message = ref('');
const isLoading = ref(true);
let hiprintTemplate: any = null;
let templateData = ref(null);

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

onMounted(async () => {
  try {
    isLoading.value = true;
    message.value = '正在加载数据...';
    
    // 从sessionStorage加载数据
    await loadTemplateDataFromDB();
    
    // 初始化打印组件
    await initHiprint();
    
    isLoading.value = false;
    message.value = '';
  } catch (err) {
    console.error('初始化失败:', err);
    message.value = '初始化失败: ' + (err.message || String(err));
    isLoading.value = false;
  }
});

// 从URL加载模板数据
async function loadTemplateDataFromDB() {
  return new Promise((resolve, reject) => {
    try {
      // 从URL获取编码的数据
      const urlHash = window.location.hash; // 例如：#/template-designer?data=xxx
      const queryString = urlHash.split('?')[1] || '';
      const urlParams = new URLSearchParams(queryString);
      const encodedData = urlParams.get('data');
      
      if (!encodedData) {
        console.error('URL中未找到模板数据');
        reject(new Error('URL中未找到模板数据，请返回上一页重试'));
        return;
      }
      
      try {
        // 解码数据
        const jsonString = decodeURIComponent(atob(encodedData));
        templateData.value = JSON.parse(jsonString);
        console.log('成功从URL解码模板数据');
        
        // 确保所有必要的字段都存在
        if (!templateData.value.fields) {
          console.warn('模板数据中缺少字段信息，使用空数组');
          templateData.value.fields = [];
        }
        
        if (!templateData.value.testData) {
          console.warn('模板数据中缺少测试数据，使用空对象');
          templateData.value.testData = {};
        }
        
        resolve(templateData.value);
      } catch (decodeError) {
        console.error('解码模板数据失败:', decodeError);
        reject(new Error('解码模板数据失败: ' + (decodeError.message || String(decodeError))));
      }
    } catch (error) {
      console.error('加载模板数据失败:', error);
      reject(new Error('加载模板数据失败: ' + (error.message || String(error))));
    }
  });
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
function saveTemplateAndReturn() {
  try {
    // 获取当前模板数据并确保可以序列化
    const json = exportTemplate();
    const serializedTemplate = JSON.parse(JSON.stringify(json));
    
    // 使用postMessage将数据发送回父窗口
    const savedData = {
      type: 'TEMPLATE_SAVED',
      template: serializedTemplate,
      timestamp: new Date().getTime()
    };
    
    // 检查是否有父窗口
    if (window.opener && !window.opener.closed) {
      try {
        // 尝试发送数据到父窗口
        // 使用'*'作为targetOrigin，允许跨域通信
        window.opener.postMessage(savedData, '*');
        console.log('模板数据已发送到父窗口');
        
        // 关闭当前窗口
        setTimeout(() => {
          window.close();
        }, 500);
        
        ElMessage.success('模板已保存');
      } catch (postMessageError) {
        console.error('发送数据到父窗口失败:', postMessageError);
        
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
    } else {
      // 如果没有父窗口，提示用户手动保存数据
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
          message: '未检测到父窗口，模板JSON已复制到剪贴板，请在原窗口中粘贴并导入',
          duration: 0,
          showClose: true,
          type: 'warning'
        });
      } catch (copyError) {
        console.error('复制到剪贴板失败:', copyError);
        ElMessage({
          message: '未检测到父窗口，请手动保存模板JSON：' + templateJson.substring(0, 100) + '...',
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
  ElMessageBox.confirm('确定要返回吗？未保存的更改将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    window.close();
  }).catch(() => {});
}

// 打印预览
function printPreview() {
  try {
    // 获取测试数据
    const testData = templateData.value.testData || {};
    hiprintTemplate.print(testData);
    ElMessage.success('打印预览已生成');
  } catch (error) {
    console.error('打印预览失败:', error);
    ElMessage.error('打印预览失败');
  }
}
</script>

<template>
  <div class="template-designer">
    <div v-if="message" class="message">{{ message }}</div>
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <div class="designer-container" v-show="!isLoading">
      <div class="designer-header">
        <div class="designer-title">独立模板设计器</div>
        <div class="designer-actions">
          <el-button type="primary" @click="saveTemplateAndReturn">保存模板并返回</el-button>
          <el-button @click="goBack">返回</el-button>
          <el-select v-model="selectedPaperSize" placeholder="选择纸张大小" size="small" @change="handlePaperSizeChange" style="width: 120px; margin-right: 10px;">
            <el-option
              v-for="item in paperSizeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button type="success" size="small" @click="printPreview">打印预览</el-button>
        </div>
      </div>
      
      <div class="designer-content">
        <!-- 左侧：存放可拖拽元素的容器 -->
        <div id="provider-container" class="provider-container"></div>
        
        <!-- 中间：存放元素面板的容器 -->
        <div class="template-wrapper">
          <div id="hiprint-printTemplate" class="template-container"></div>
        </div>
        
        <!-- 右侧：点击元素/面板时，渲染参数的容器 -->
        <div id="PrintElementOptionSetting" class="setting-container"></div>
      </div>
      
      <!-- 底部：多面板模板容器 -->
      <div class="hiprint-printPagination"></div>
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
.template-designer {
  display: flex;
  flex-direction: column;
  height: 100vh;
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

.designer-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: calc(100vh - 80px);
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #dcdfe6;
}

.designer-title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.designer-actions {
  display: flex;
  gap: 10px;
}

.designer-content {
  display: flex;
  gap: 20px;
  height: calc(100% - 60px);
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

.template-container {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
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