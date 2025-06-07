<template>
  <div class="field-info-viewer">
    <div class="action-bar">
      <el-button type="primary" @click="fetchFieldInfo">获取字段信息</el-button>
      <el-button 
        type="success" 
        @click="fetchRecordValues" 
        :disabled="!selectedRecordId || fields.length === 0"
      >
        获取记录值
      </el-button>
    </div>
    
    <div v-if="message">{{ message }}</div>
    
    <div v-if="fields.length > 0" class="fields-container">
      <h3>字段数量: {{ fields.length }}</h3>
      <div class="record-selector" v-if="recordList.length > 0">
        <el-select
          v-model="selectedRecordId"
          placeholder="请选择记录"
          style="width: 300px; margin-bottom: 20px"
          filterable
          @change="fetchRecordValues"
        >
          <el-option
            v-for="record in recordList"
            :key="record.recordId"
            :label="record.field[0]?.value || record.recordId"
            :value="record.recordId"
          />
        </el-select>
      </div>
      <el-table :data="fields" style="width: 100%">
        <el-table-column prop="id" label="字段ID" width="280" />
        <el-table-column prop="name" label="字段名称" width="180" />
        <el-table-column prop="type" label="字段类型" />
        <el-table-column label="字段值" v-if="recordValues.length > 0">
          <template #default="scope">
            <pre>{{ formattedValues[scope.row.id] }}</pre>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { bitable } from '@lark-base-open/js-sdk';
import { fetchRecordsAndValues } from '@/utils/recordFetcher';
import { fetchVisibleFields } from '@/utils/fieldFetcher';

const message = ref('');
const fields = ref([]);
const recordList = ref([]);
const selectedRecordId = ref('');
const recordValues = ref([]);
const formattedValues = ref({});

onMounted(async () => {
  await fetchFieldInfo();
  await fetchAllRecords();
});

async function fetchFieldInfo() {
  message.value = '正在获取字段信息...';
  fields.value = [];
  recordValues.value = [];
  formattedValues.value = {};
  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;
    
    fields.value = await fetchVisibleFields(tableId, viewId);
    message.value = `已获取当前视图下 ${fields.value.length} 个可见字段的信息`;
  } catch (err) {
    message.value = `获取字段信息时出错: ${err.message}`;
    console.error('获取字段信息时出错:', err);
  }
}

async function fetchAllRecords() {
  message.value = '正在获取所有记录...';
  recordList.value = [];
  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;
    
    const records = await fetchRecordsAndValues(tableId, viewId, null, true);
    recordList.value = records;
    
    message.value = `已获取 ${recordList.value.length} 条记录`;
  } catch (err) {
    message.value = `获取记录列表时出错: ${err.message}`;
    console.error('获取记录列表时出错:', err);
  }
}

async function fetchRecordValues() {
  if (!selectedRecordId.value) {
    message.value = '请选择记录';
    return;
  }
  message.value = '正在获取记录值...';
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
    }
    
    message.value = `已获取记录 ${selectedRecordId.value} 的所有字段值`;
  } catch (err) {
    message.value = `获取记录值时出错: ${err.message}`;
    console.error('获取记录值时出错:', err);
  }
}
</script>

<style scoped>
.field-info-viewer {
  padding: 20px;
}

.action-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.fields-container {
  margin-top: 20px;
}

.record-selector {
  margin-bottom: 20px;
}

pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-size: 12px;
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
}
</style>
