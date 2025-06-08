<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  ElMessage, ElMessageBox, ElButton, ElTable, ElTableColumn, ElInput, ElForm,
  ElFormItem, ElDialog, ElAlert, ElIcon, ElTag, ElEmpty, ElButtonGroup
} from 'element-plus';
import {
  FolderOpened, Plus, Download, Upload, Refresh, Edit, Delete,
  Document, Search, SuccessFilled, WarningFilled, InfoFilled
} from '@element-plus/icons-vue';
import { saveTemplate, getTemplate, getAllTemplates, deleteTemplate } from '@/utils/indexedDBHelper';
import { hiprint } from 'vue-plugin-hiprint';

const props = defineProps({
  hiprintTemplate: Object,
});

const emit = defineEmits(['load-template']);

// 模板列表
const templateList = ref([]);
const loading = ref(false);
const searchKeyword = ref('');

// 新增/编辑模板对话框
const dialogVisible = ref(false);
const dialogTitle = ref('新增模板');
const isEdit = ref(false);
const templateForm = ref({
  id: '',
  name: '',
  description: '',
  data: null
});

// 导入对话框
const importDialogVisible = ref(false);
const importJsonText = ref('');

// 获取所有模板
async function loadTemplates() {
  try {
    loading.value = true;
    const templates = await getAllTemplates();
    templateList.value = templates;
  } catch (error) {
    console.error('加载模板列表失败:', error);
    ElMessage.error('加载模板列表失败: ' + (error.message || String(error)));
  } finally {
    loading.value = false;
  }
}

// 打开新增模板对话框
function openAddDialog() {
  isEdit.value = false;
  dialogTitle.value = '新增模板';
  templateForm.value = {
    id: '',
    name: '',
    description: '',
    data: props.hiprintTemplate ? props.hiprintTemplate.getJson() : null
  };
  dialogVisible.value = true;
}

// 打开编辑模板对话框
function openEditDialog(template) {
  isEdit.value = true;
  dialogTitle.value = '编辑模板';
  templateForm.value = {
    id: template.id,
    name: template.id, // 使用id作为名称
    description: template.description || '',
    data: template.data
  };
  dialogVisible.value = true;
}

// 保存模板
async function saveTemplateData() {
  try {
    if (!templateForm.value.name) {
      ElMessage.warning('请输入模板名称');
      return;
    }

    // 如果是编辑模式且修改了ID，需要先删除旧的
    if (isEdit.value && templateForm.value.id !== templateForm.value.name) {
      await deleteTemplate(templateForm.value.id);
    }

    // 序列化处理，确保数据可以被正确存储
    const serializedData = JSON.parse(JSON.stringify(templateForm.value.data));
    
    // 保存模板，传入描述
    await saveTemplate(
      templateForm.value.name, 
      serializedData, 
      templateForm.value.description || templateForm.value.name
    );
    
    ElMessage.success('模板保存成功');
    dialogVisible.value = false;
    
    // 重新加载模板列表
    await loadTemplates();
  } catch (error) {
    console.error('保存模板失败:', error);
    ElMessage.error('保存模板失败: ' + (error.message || String(error)));
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
    
    // 重新加载模板列表
    await loadTemplates();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模板失败:', error);
      ElMessage.error('删除模板失败: ' + (error.message || String(error)));
    }
  }
}

// 加载模板到设计器
function loadTemplateToDesigner(template) {
  try {
    // 确保模板数据格式正确
    let templateData = template.data;

    // 如果数据是字符串，尝试解析
    if (typeof templateData === 'string') {
      templateData = JSON.parse(templateData);
    }

    // 验证并补充必要的属性
    const validatedData = {
      ...templateData,
      panels: templateData.panels || [],
      width: templateData.width || 210,
      height: templateData.height || 297,
      paperType: templateData.paperType || 'A4',
      paperHeader: templateData.paperHeader || 0,
      paperFooter: templateData.paperFooter || 0,
      printElements: templateData.printElements || []
    };

    // 确保panels数组中的每个面板都有必要的属性
    if (validatedData.panels && validatedData.panels.length > 0) {
      validatedData.panels = validatedData.panels.map(panel => ({
        ...panel,
        printElements: panel.printElements || [],
        width: panel.width || validatedData.width,
        height: panel.height || validatedData.height,
        paperHeader: panel.paperHeader !== undefined ? panel.paperHeader : validatedData.paperHeader,
        paperFooter: panel.paperFooter !== undefined ? panel.paperFooter : validatedData.paperFooter
      }));
    }

    console.log('加载模板数据:', validatedData);
    emit('load-template', validatedData);
    ElMessage.success('模板已加载到设计器');
  } catch (error) {
    console.error('加载模板失败:', error);
    ElMessage.error('加载模板失败: ' + (error.message || String(error)));
  }
}

// 导出模板JSON
function exportTemplateJSON(template) {
  try {
    const jsonString = JSON.stringify(template.data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ElMessage.success('模板导出成功');
  } catch (error) {
    console.error('导出模板失败:', error);
    ElMessage.error('导出模板失败: ' + (error.message || String(error)));
  }
}

// 导出所有模板
function exportAllTemplates() {
  try {
    if (templateList.value.length === 0) {
      ElMessage.warning('没有可导出的模板');
      return;
    }
    
    // 创建一个包含所有模板的对象
    const allTemplates = {};
    templateList.value.forEach(template => {
      allTemplates[template.id] = template.data;
    });
    
    const jsonString = JSON.stringify(allTemplates, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `所有模板_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ElMessage.success(`已导出 ${templateList.value.length} 个模板`);
  } catch (error) {
    console.error('导出所有模板失败:', error);
    ElMessage.error('导出所有模板失败: ' + (error.message || String(error)));
  }
}

// 打开导入对话框
function openImportDialog() {
  // 创建文件输入元素
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // 监听文件选择事件
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      document.body.removeChild(fileInput);
      return;
    }
    
    try {
      // 读取文件内容
      const jsonData = await readJsonFile(file);
      
      // 导入模板
      await importTemplatesFromJson(jsonData);
      
    } catch (error) {
      console.error('导入模板失败:', error);
      ElMessage.error('导入模板失败: ' + (error.message || String(error)));
    } finally {
      // 清理DOM
      document.body.removeChild(fileInput);
    }
  });
  
  // 触发文件选择对话框
  fileInput.click();
}

// 读取JSON文件
function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        resolve(jsonData);
      } catch (error) {
        reject(new Error('无效的JSON文件'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}

// 验证模板数据格式
function validateTemplateData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // 检查是否是有效的hiprint模板格式
  // hiprint模板通常包含panels数组和其他配置
  if (Array.isArray(data.panels) ||
      (data.width !== undefined && data.height !== undefined) ||
      data.printElements !== undefined) {
    return true;
  }

  return false;
}

// 导入模板JSON
async function importTemplatesFromJson(jsonData) {
  try {
    // 判断是单个模板还是多个模板
    if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      // 检查是否是单个模板
      if (validateTemplateData(jsonData)) {
        // 单个模板
        await ElMessageBox.prompt('请输入模板名称', '导入模板', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          inputPattern: /.+/,
          inputErrorMessage: '模板名称不能为空'
        }).then(async ({ value }) => {
          // 确保模板数据完整性
          const templateData = {
            ...jsonData,
            // 确保基本属性存在
            panels: jsonData.panels || [],
            width: jsonData.width || 210,
            height: jsonData.height || 297,
            paperType: jsonData.paperType || 'A4',
            paperHeader: jsonData.paperHeader || 0,
            paperFooter: jsonData.paperFooter || 0,
            printElements: jsonData.printElements || []
          };

          // 序列化处理
          const serializedData = JSON.parse(JSON.stringify(templateData));
          await saveTemplate(value, serializedData, value);
          ElMessage.success('模板导入成功');
        });
      } else {
        // 可能是多个模板的集合
        let count = 0;
        let hasValidTemplate = false;

        for (const [name, data] of Object.entries(jsonData)) {
          if (validateTemplateData(data)) {
            hasValidTemplate = true;
            // 确保模板数据完整性
            const templateData = {
              ...data,
              panels: data.panels || [],
              width: data.width || 210,
              height: data.height || 297,
              paperType: data.paperType || 'A4',
              paperHeader: data.paperHeader || 0,
              paperFooter: data.paperFooter || 0,
              printElements: data.printElements || []
            };

            // 序列化处理
            const serializedData = JSON.parse(JSON.stringify(templateData));
            await saveTemplate(name, serializedData, name);
            count++;
          }
        }

        if (hasValidTemplate) {
          ElMessage.success(`成功导入 ${count} 个模板`);
        } else {
          ElMessage.error('未找到有效的模板数据');
          return;
        }
      }
    } else {
      ElMessage.error('无效的模板数据格式');
      return;
    }

    // 重新加载模板列表
    await loadTemplates();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('导入模板失败:', error);
      ElMessage.error('导入模板失败: ' + (error.message || String(error)));
    }
  }
}

// 过滤模板列表 - 改为计算属性
const filteredTemplates = computed(() => {
  if (!searchKeyword.value) {
    return templateList.value;
  }

  const keyword = searchKeyword.value.toLowerCase();
  return templateList.value.filter(template =>
    template.id.toLowerCase().includes(keyword) ||
    (template.description && template.description.toLowerCase().includes(keyword))
  );
});

// 组件挂载时加载模板列表
onMounted(() => {
  loadTemplates();
});
</script>

<template>
  <div class="template-manager">
    <!-- 提示信息 -->
    <el-alert
      title="模板数据保存在浏览器本地存储中，建议定期导出备份"
      type="warning"
      :closable="false"
      show-icon
      class="warning-alert"
    />

    <!-- 统计信息 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><FolderOpened /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ templateList.length }}</div>
          <div class="stat-label">模板总数</div>
        </div>
      </div>
      <div class="stat-card" v-if="filteredTemplates.length !== templateList.length">
        <div class="stat-icon">
          <el-icon><Search /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ filteredTemplates.length }}</div>
          <div class="stat-label">搜索结果</div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模板名称..."
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>
      <div class="toolbar-section">
        <el-button-group>
          <el-button type="primary" @click="openAddDialog" :icon="Plus">
            保存当前模板
          </el-button>
          <el-button type="success" @click="exportAllTemplates" :icon="Download">
            导出所有
          </el-button>
          <el-button type="info" @click="openImportDialog" :icon="Upload">
            导入模板
          </el-button>
          <el-button @click="loadTemplates" :icon="Refresh">
            刷新
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 模板列表 -->
    <div class="template-list-container">
      <div v-if="filteredTemplates.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无模板数据">
          <el-button type="primary" @click="openAddDialog" :icon="Plus">
            保存当前模板
          </el-button>
        </el-empty>
      </div>

      <div v-else class="template-cards">
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          class="template-card"
        >
          <div class="card-header">
            <div class="template-info">
              <h4 class="template-name">
                <el-icon><Document /></el-icon>
                {{ template.id }}
              </h4>
              <p class="template-description">{{ template.description || '暂无描述' }}</p>
            </div>
            <div class="template-status">
              <el-tag type="success" size="small">
                <el-icon><SuccessFilled /></el-icon>
                已保存
              </el-tag>
            </div>
          </div>

          <div class="card-meta">
            <div class="meta-item">
              <span class="meta-label">创建时间：</span>
              <span class="meta-value">
                {{ template.createdAt ? new Date(template.createdAt).toLocaleString() : '未知' }}
              </span>
            </div>
          </div>

          <div class="card-actions">
            <el-button
              type="primary"
              size="small"
              @click="loadTemplateToDesigner(template)"
              :icon="Edit"
              class="action-btn"
            >
              加载到设计器
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="exportTemplateJSON(template)"
              :icon="Download"
              class="action-btn"
            >
              导出
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="openEditDialog(template)"
              :icon="Edit"
              class="action-btn"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="removeTemplate(template.id)"
              :icon="Delete"
              class="action-btn"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑模板对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            placeholder="请输入模板描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTemplateData">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 基础样式 */
.template-manager {
  padding: 0;
  background: #fafbfc;
  min-height: 500px;
}

/* 警告提示样式 */
.warning-alert {
  margin: 15px;
  border-radius: 8px;
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 15px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  line-height: 1;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  margin: 0 15px 20px 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 250px;
}

/* 模板列表容器样式 */
.template-list-container {
  margin: 0 15px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 模板卡片网格样式 */
.template-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

/* 模板卡片样式 */
.template-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 20px 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.template-info {
  flex: 1;
}

.template-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.template-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.template-status {
  margin-left: 15px;
}

.card-meta {
  padding: 15px 20px;
  background: #f8f9fa;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.meta-label {
  color: #909399;
  margin-right: 8px;
}

.meta-value {
  color: #606266;
}

.card-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 15px 20px 20px 20px;
}

.action-btn {
  justify-content: center;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .toolbar-section {
    justify-content: center;
  }

  .search-input {
    width: 100%;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    margin: 10px;
  }

  .template-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .template-list-container {
    margin: 0 10px;
  }

  .toolbar {
    margin: 0 10px 15px 10px;
  }

  .card-actions {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .warning-alert {
    margin: 10px;
  }

  .stats-cards {
    margin: 8px;
  }

  .template-list-container {
    margin: 0 8px;
  }

  .toolbar {
    margin: 0 8px 12px 8px;
    padding: 12px;
  }

  .card-header {
    padding: 15px;
  }

  .card-meta {
    padding: 12px 15px;
  }

  .card-actions {
    padding: 12px 15px 15px 15px;
  }

  .template-name {
    font-size: 14px;
  }

  .template-description {
    font-size: 13px;
  }
}

/* 动画效果 */
.template-card {
  animation: fadeInUp 0.3s ease-out;
}

.template-card:nth-child(2) {
  animation-delay: 0.1s;
}

.template-card:nth-child(3) {
  animation-delay: 0.2s;
}

.template-card:nth-child(4) {
  animation-delay: 0.3s;
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