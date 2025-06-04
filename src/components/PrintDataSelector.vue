<template>
  <div class="print-data-selector">
    <h3>打印数据选择</h3>
    
    <!-- 字段选择区域 -->
    <div class="field-selection">
      <h4>选择表格显示字段</h4>
      <div class="field-list">
        <el-checkbox-group v-model="selectedFields">
          <el-checkbox 
            v-for="field in fields" 
            :key="field.id" 
            :label="field.id"
            class="field-checkbox"
          >
            {{ field.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </div>
    
    <!-- 数据预览区域 -->
    <div class="data-preview" v-if="recordList.length > 0">
      <h4>选择打印记录</h4>
      <el-table 
        :data="recordList" 
        style="width: 100%" 
        height="300px"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column 
          v-for="field in displayFields" 
          :key="field.id" 
          :prop="field.id" 
          :label="field.name"
          :width="field.width || 120"
        >
          <template #default="scope">
            {{ formatValue(scope.row[field.id]) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 操作按钮区域 -->
    <div class="action-buttons">
      <el-button type="primary" @click="fetchData" :loading="isLoading">获取数据</el-button>
      <el-button type="success" @click="printSelected" :disabled="selectedRows.length === 0">打印选中数据</el-button>
      <el-button type="warning" @click="exportPDF" :disabled="selectedRows.length === 0">导出PDF</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { bitable } from '@lark-base-open/js-sdk';
import { ElMessage } from 'element-plus';
// @ts-ignore
import { fetchVisibleFields } from '@/utils/fieldFetcher';
// @ts-ignore
import { fetchRecordsAndValues } from '@/utils/recordFetcher';

// 定义字段类型
interface Field {
  id: string;
  name: string;
  type: string;
  width?: number;
}

// 定义记录类型
interface Record {
  recordId: string;
  field: Array<{
    field: string;
    value: any;
  }>;
  [key: string]: any;
}

// 定义打印数据类型
interface PrintData {
  title: string;
  date: string;
  printDate: string;
  operator: string;
  recordCount: number;
  table: any[];
}

const props = defineProps<{
  hiprintTemplate?: any;
}>();

const emit = defineEmits<{
  (e: 'print', data: PrintData, isPdf?: boolean): void;
}>();

const fields = ref<Field[]>([]);
const selectedFields = ref<string[]>([]);
const recordList = ref<Record[]>([]);
const selectedRows = ref<Record[]>([]);
const isLoading = ref(false);

// 默认选择前4个字段
const displayFields = computed<Field[]>(() => {
  if (selectedFields.value.length === 0) {
    return fields.value.slice(0, 4);
  }
  return fields.value.filter(field => selectedFields.value.includes(field.id));
});

onMounted(async () => {
  await fetchFieldInfo();
});

// 格式化字段值显示
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

// 获取字段信息
async function fetchFieldInfo(): Promise<void> {
  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;
    
    fields.value = await fetchVisibleFields(tableId, viewId);
    
    // 默认选择前4个字段
    selectedFields.value = fields.value.slice(0, 4).map(field => field.id);
  } catch (err: any) {
    console.error('获取字段信息失败:', err);
    ElMessage.error('获取字段信息失败: ' + (err.message || String(err)));
  }
}

// 获取记录数据
async function fetchData(): Promise<void> {
  isLoading.value = true;
  recordList.value = [];
  selectedRows.value = [];
  
  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;
    
    // 获取所有记录
    const records = await fetchRecordsAndValues(tableId, viewId, null, true);
    
    // 转换记录格式，将字段值组织成对象
    recordList.value = records.map(record => {
      const recordData: Record = { recordId: record.recordId, field: record.field };
      if (record.field) {
        record.field.forEach(item => {
          recordData[item.field] = item.value;
        });
      }
      return recordData;
    });
    
    ElMessage.success(`已获取 ${recordList.value.length} 条记录`);
  } catch (err: any) {
    console.error('获取记录数据失败:', err);
    ElMessage.error('获取记录数据失败: ' + (err.message || String(err)));
  } finally {
    isLoading.value = false;
  }
}

// 处理表格选择变化
function handleSelectionChange(rows: Record[]): void {
  selectedRows.value = rows;
}

// 打印选中数据
function printSelected(): void {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要打印的数据');
    return;
  }
  
  try {
    // 准备打印数据
    const printData = preparePrintData();
    
    // 触发打印事件
    emit('print', printData);
    
    ElMessage.success('已发送打印请求');
  } catch (err: any) {
    console.error('准备打印数据失败:', err);
    ElMessage.error('准备打印数据失败: ' + (err.message || String(err)));
  }
}

// 导出PDF
function exportPDF(): void {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的数据');
    return;
  }
  
  try {
    // 准备打印数据
    const printData = preparePrintData();
    
    // 触发打印事件，并指定为导出PDF
    emit('print', printData, true);
    
    ElMessage.success('已发送PDF导出请求');
  } catch (err: any) {
    console.error('准备导出数据失败:', err);
    ElMessage.error('准备导出数据失败: ' + (err.message || String(err)));
  }
}

// 准备打印数据
function preparePrintData(): PrintData {
  // 将选中的行数据转换为打印数据格式
  const tableData = selectedRows.value.map(row => {
    // 复制所有字段数据
    const rowData = { ...row };
    delete rowData.recordId; // 删除记录ID，不需要打印
    delete rowData.field; // 删除field数组，不需要打印
    return rowData;
  });
  
  // 构建打印数据对象，包含文本字段和表格数据
  return {
    // 文本字段数据
    title: '数据打印',
    date: new Date().toLocaleDateString(),
    printDate: new Date().toLocaleString(),
    operator: '系统用户',
    recordCount: selectedRows.value.length,
    
    // 表格数据
    table: tableData
  };
}
</script>

<style scoped>
.print-data-selector {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #606266;
}

.field-selection {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.field-checkbox {
  margin-right: 15px;
  margin-bottom: 10px;
}

.data-preview {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style> 