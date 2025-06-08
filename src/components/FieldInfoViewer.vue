<template>
  <div class="field-info-viewer">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <el-button type="primary" @click="fetchFieldInfo" :icon="Refresh" :loading="isLoading">
          获取字段信息
        </el-button>
        <el-button
          type="success"
          @click="fetchRecordValues"
          :disabled="!selectedRecordId || fields.length === 0"
          :icon="Search"
        >
          获取记录值
        </el-button>
      </div>
    </div>

    <!-- 状态消息 -->
    <div v-if="message" class="status-message" :class="messageType">
      <el-icon>
        <component :is="messageIcon" />
      </el-icon>
      <span>{{ message }}</span>
    </div>

    <!-- 统计信息 -->
    <div v-if="fields.length > 0" class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><DataBoard /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ fields.length }}</div>
          <div class="stat-label">字段总数</div>
        </div>
      </div>
      <div class="stat-card" v-if="recordList.length > 0">
        <div class="stat-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ recordList.length }}</div>
          <div class="stat-label">记录总数</div>
        </div>
      </div>
    </div>

    <!-- 记录选择器 -->
    <div v-if="recordList.length > 0" class="record-selector">
      <div class="selector-header">
        <h4>
          <el-icon><Select /></el-icon>
          选择记录查看详细值
        </h4>
      </div>
      <el-select
        v-model="selectedRecordId"
        placeholder="请选择记录"
        filterable
        clearable
        @change="fetchRecordValues"
        class="record-select"
      >
        <el-option
          v-for="record in recordList"
          :key="record.recordId"
          :label="record.field[0]?.value || record.recordId"
          :value="record.recordId"
        />
      </el-select>
    </div>

    <!-- 字段信息表格 -->
    <div v-if="fields.length > 0" class="fields-container">
      <div class="table-header">
        <h4>
          <el-icon><List /></el-icon>
          字段详细信息
        </h4>
      </div>
      <el-table
        :data="fields"
        class="fields-table"
        stripe
        border
        size="small"
        :header-cell-style="{ background: '#f8f9fa', color: '#303133' }"
      >
        <el-table-column prop="id" label="字段ID" min-width="200" show-overflow-tooltip />
        <el-table-column prop="name" label="字段名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="type" label="字段类型" min-width="100">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)" size="small">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="字段值" min-width="200" v-if="recordValues.length > 0">
          <template #default="scope">
            <div class="field-value">
              <pre v-if="formattedValues[scope.row.id]">{{ formattedValues[scope.row.id] }}</pre>
              <span v-else class="empty-value">暂无数据</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 空状态 -->
    <div v-if="!isLoading && fields.length === 0" class="empty-state">
      <el-empty description="暂无字段信息">
        <el-button type="primary" @click="fetchFieldInfo" :icon="Refresh">
          获取字段信息
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { bitable } from '@lark-base-open/js-sdk';
import { fetchRecordsAndValues } from '@/utils/recordFetcher';
import { fetchVisibleFields } from '@/utils/fieldFetcher';
import { ElIcon, ElButton, ElSelect, ElOption, ElTable, ElTableColumn, ElTag, ElEmpty } from 'element-plus';
import {
  Refresh, Search, DataBoard, Document, Select, List,
  Loading, SuccessFilled, WarningFilled
} from '@element-plus/icons-vue';

const message = ref('');
const messageType = ref('info');
const isLoading = ref(false);
const fields = ref([]);
const recordList = ref([]);
const selectedRecordId = ref('');
const recordValues = ref([]);
const formattedValues = ref({});

// 计算属性
const messageIcon = computed(() => {
  switch (messageType.value) {
    case 'success': return SuccessFilled;
    case 'error': return WarningFilled;
    default: return Loading;
  }
});

// 获取字段类型标签颜色
function getTypeTagType(type) {
  const typeMap = {
    'Text': 'primary',
    'Number': 'success',
    'SingleSelect': 'warning',
    'MultiSelect': 'info',
    'DateTime': 'danger',
    'Checkbox': 'success',
    'User': 'primary',
    'Phone': 'warning',
    'Email': 'info',
    'Url': 'primary',
    'Attachment': 'danger',
    'SingleLink': 'warning',
    'Formula': 'info',
    'CreatedTime': 'danger',
    'ModifiedTime': 'danger',
    'CreatedUser': 'primary',
    'ModifiedUser': 'primary'
  };
  return typeMap[type] || 'default';
}

onMounted(async () => {
  await fetchFieldInfo();
  await fetchAllRecords();
});

async function fetchFieldInfo() {
  isLoading.value = true;
  message.value = '正在获取字段信息...';
  messageType.value = 'info';
  fields.value = [];
  recordValues.value = [];
  formattedValues.value = {};

  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;

    fields.value = await fetchVisibleFields(tableId, viewId);
    message.value = `成功获取 ${fields.value.length} 个字段信息`;
    messageType.value = 'success';
  } catch (err) {
    message.value = `获取字段信息失败: ${err.message}`;
    messageType.value = 'error';
    console.error('获取字段信息时出错:', err);
  } finally {
    isLoading.value = false;
  }
}

async function fetchAllRecords() {
  message.value = '正在获取记录列表...';
  messageType.value = 'info';
  recordList.value = [];

  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;

    const records = await fetchRecordsAndValues(tableId, viewId, null, true);
    recordList.value = records;

    message.value = `成功获取 ${recordList.value.length} 条记录`;
    messageType.value = 'success';
  } catch (err) {
    message.value = `获取记录列表失败: ${err.message}`;
    messageType.value = 'error';
    console.error('获取记录列表时出错:', err);
  }
}

async function fetchRecordValues() {
  if (!selectedRecordId.value) {
    message.value = '请先选择一条记录';
    messageType.value = 'error';
    return;
  }

  message.value = '正在获取记录值...';
  messageType.value = 'info';
  recordValues.value = [];
  formattedValues.value = {};

  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;

    const records = await fetchRecordsAndValues(tableId, viewId, selectedRecordId.value, true);
    if (records.length > 0) {
      const record = records[0];
      recordValues.value = record.field.map(field => ({
        fieldId: field.field,
        value: field.value
      }));

      // 使用格式化后的值
      formattedValues.value = record.field.reduce((acc, field) => {
        acc[field.field] = field.value;
        return acc;
      }, {});

      message.value = `成功获取记录的 ${recordValues.value.length} 个字段值`;
      messageType.value = 'success';
    } else {
      message.value = '未找到指定记录';
      messageType.value = 'error';
    }
  } catch (err) {
    message.value = `获取记录值失败: ${err.message}`;
    messageType.value = 'error';
    console.error('获取记录值时出错:', err);
  }
}
</script>

<style scoped>
/* 基础样式 */
.field-info-viewer {
  padding: 0;
  background: #fafbfc;
  min-height: 500px;
}

/* 工具栏样式 */
.toolbar {
  padding: 15px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 20px;
}

.toolbar-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 状态消息样式 */
.status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  border-radius: 8px;
  margin: 0 15px 20px 15px;
  font-size: 14px;
}

.status-message.info {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #c2e7b0;
}

.status-message.success {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #c2e7b0;
}

.status-message.error {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 0 15px 20px 15px;
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

/* 记录选择器样式 */
.record-selector {
  margin: 0 15px 20px 15px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selector-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.record-select {
  width: 100%;
}

/* 字段容器样式 */
.fields-container {
  margin: 0 15px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  padding: 20px 20px 0 20px;
}

.table-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

/* 表格样式 */
.fields-table {
  margin: 0 20px 20px 20px;
  border-radius: 8px;
  overflow: hidden;
}

.field-value pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-size: 12px;
  background-color: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  max-height: 100px;
  overflow-y: auto;
  line-height: 1.4;
}

.empty-value {
  color: #c0c4cc;
  font-style: italic;
  font-size: 12px;
}

/* 空状态样式 */
.empty-state {
  margin: 40px 15px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-section {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    margin: 0 10px 15px 10px;
  }

  .record-selector,
  .fields-container {
    margin: 0 10px 15px 10px;
  }

  .stat-card {
    padding: 15px;
  }

  .stat-number {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .field-info-viewer {
    padding: 0;
  }

  .toolbar {
    padding: 12px;
  }

  .record-selector,
  .fields-container {
    margin: 0 8px 12px 8px;
    padding: 15px;
  }

  .table-header {
    padding: 15px 15px 0 15px;
  }

  .fields-table {
    margin: 0 15px 15px 15px;
  }
}

/* 动画效果 */
.stat-card,
.record-selector,
.fields-container {
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
