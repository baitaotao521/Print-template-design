<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElButton, ElTable, ElTableColumn, ElInput, ElForm, ElFormItem, ElDialog, ElAlert } from 'element-plus';
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
  emit('load-template', template.data);
  ElMessage.success('模板已加载到设计器');
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
  importJsonText.value = '';
  importDialogVisible.value = true;
}

// 导入模板JSON
async function importTemplatesFromJson() {
  try {
    if (!importJsonText.value) {
      ElMessage.warning('请输入JSON数据');
      return;
    }
    
    const jsonData = JSON.parse(importJsonText.value);
    
    // 判断是单个模板还是多个模板
    if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      // 如果是对象，可能是多个模板或单个模板
      if (jsonData.panels !== undefined || jsonData.width !== undefined) {
        // 单个模板
        await ElMessageBox.prompt('请输入模板名称', '导入模板', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          inputPattern: /.+/,
          inputErrorMessage: '模板名称不能为空'
        }).then(async ({ value }) => {
          await saveTemplate(value, jsonData);
          ElMessage.success('模板导入成功');
        });
      } else {
        // 多个模板
        let count = 0;
        for (const [name, data] of Object.entries(jsonData)) {
          await saveTemplate(name, data);
          count++;
        }
        ElMessage.success(`成功导入 ${count} 个模板`);
      }
    } else {
      ElMessage.error('无效的模板数据格式');
      return;
    }
    
    importDialogVisible.value = false;
    await loadTemplates();
  } catch (error) {
    console.error('导入模板失败:', error);
    ElMessage.error('导入模板失败: ' + (error.message || String(error)));
  }
}

// 过滤模板列表
function filterTemplateList() {
  if (!searchKeyword.value) {
    return templateList.value;
  }
  
  const keyword = searchKeyword.value.toLowerCase();
  return templateList.value.filter(template => 
    template.id.toLowerCase().includes(keyword)
  );
}

// 组件挂载时加载模板列表
onMounted(() => {
  loadTemplates();
});
</script>

<template>
  <div class="template-manager">
    <el-alert
      title="提示：模板保存在浏览器缓存中，请及时导出备份，避免数据丢失"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    />
    
    <div class="template-manager-header">
      <h2>模板管理</h2>
      <div class="template-manager-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模板"
          clearable
          style="width: 200px; margin-right: 10px;"
        />
        <el-button type="primary" @click="openAddDialog">保存当前模板</el-button>
        <el-button type="success" @click="exportAllTemplates">导出所有模板</el-button>
        <el-button type="info" @click="openImportDialog">导入模板</el-button>
        <el-button @click="loadTemplates">刷新列表</el-button>
      </div>
    </div>

    <el-table
      :data="filterTemplateList()"
      style="width: 100%"
      v-loading="loading"
      border
    >
      <el-table-column prop="id" label="模板名称" min-width="150" />
      <el-table-column prop="description" label="模板描述" min-width="150" />
      <el-table-column label="创建/修改时间" min-width="180">
        <template #default="scope">
          {{ scope.row.createdAt ? new Date(scope.row.createdAt).toLocaleString() : new Date().toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="loadTemplateToDesigner(row)">
            加载到设计器
          </el-button>
          <el-button type="success" size="small" @click="exportTemplateJSON(row)">
            导出
          </el-button>
          <el-button type="warning" size="small" @click="openEditDialog(row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="removeTemplate(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

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

    <!-- 导入模板对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入模板"
      width="600px"
    >
      <el-input
        v-model="importJsonText"
        type="textarea"
        :rows="10"
        placeholder="请粘贴模板JSON数据"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="importTemplatesFromJson">导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.template-manager {
  padding: 20px;
}

.template-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.template-manager-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.template-manager-actions {
  display: flex;
  gap: 10px;
}
</style> 