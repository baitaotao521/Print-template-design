<template>
  <div class="print-data-selector">
    <h3>打印数据选择</h3>
    
    <!-- 字段选择区域 - 改为下拉多选框 -->
    <div class="field-selection">
      <h4>选择表格显示字段</h4>
      <el-select
        v-model="selectedFields"
        multiple
        collapse-tags
        collapse-tags-tooltip
        placeholder="请选择要显示的字段"
        style="width: 100%"
      >
        <el-option
          v-for="field in fields"
          :key="field.id"
          :label="field.name"
          :value="field.id"
        />
      </el-select>
    </div>
    
    <!-- 数据预览区域 -->
    <div class="data-preview" v-if="recordList.length > 0">
      <div class="data-preview-header">
        <h4>选择打印记录</h4>
        <div class="record-count">
          总记录: <span class="count-number">{{ recordList.length }}</span> | 
          已选择: <span class="count-number">{{ selectedRows.length }}</span>
          <el-button type="text" size="small" @click="selectAllRecords" class="select-btn">全选</el-button>
          <el-button type="text" size="small" @click="selectCurrentPage" class="select-btn">选择当前页</el-button>
          <el-button type="text" size="small" @click="unselectAllRecords" class="select-btn">取消全选</el-button>
          <el-button type="text" size="small" @click="invertSelection" class="select-btn">反选</el-button>
        </div>
      </div>
      <el-table 
        ref="dataTable"
        :data="paginatedData" 
        style="width: 100%" 
        height="400px"
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
      
      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="recordList.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 操作按钮区域 -->
    <div class="action-buttons">
      <el-button type="primary" @click="fetchData" :loading="isLoading">获取数据</el-button>
      <el-button type="success" @click="printSelected" :disabled="selectedRows.length === 0">打印选中数据</el-button>
      <el-button type="warning" @click="exportPDF" :disabled="selectedRows.length === 0">导出PDF</el-button>
      <el-button type="info" @click="exportToBase" :disabled="selectedRows.length === 0">导出至多维表格</el-button>
    </div>
    
    <!-- 导出至多维表格对话框 -->
    <el-dialog
      v-model="exportToBaseDialogVisible"
      title="导出至多维表格"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div v-if="!isExporting">
        <p>请选择要将文件导出到的附件字段:</p>
        <el-select v-model="selectedAttachmentField" placeholder="选择附件字段" style="width: 100%">
          <el-option
            v-for="field in attachmentFields"
            :key="field.id"
            :label="field.name"
            :value="field.id"
          />
        </el-select>
        
        <div class="format-selection" style="margin-top: 15px;">
          <p>请选择导出格式:</p>
          <el-radio-group v-model="exportFormat">
            <el-radio label="pdf">PDF格式</el-radio>
            <el-radio label="jpeg">JPEG图片格式</el-radio>
          </el-radio-group>
        </div>
        
        <p class="export-tip">注意: 每条记录将生成一个单独的文件，并上传到对应记录的附件字段中</p>
        <p class="export-tip">注意: JPEG格式会使用浏览器进行转换，可能影响图片质量和系统性能，建议根据实际需求选择合适的格式</p>
      </div>
      
      <div v-else class="export-progress">
        <p>正在导出至多维表格 ({{ exportCurrent }}/{{ exportTotal }})</p>
        <el-progress :percentage="exportProgress" :format="percent => `${percent}%`" />
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportToBaseDialogVisible = false" :disabled="isExporting">取消</el-button>
          <el-button type="primary" @click="executeExport" :loading="isExporting" :disabled="isExporting">
            {{ isExporting ? '导出中...' : '开始导出' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { bitable } from '@lark-base-open/js-sdk';
import { ElMessage, ElDialog, ElSelect, ElOption, ElButton, ElProgress, ElRadioGroup, ElRadio } from 'element-plus';
// @ts-ignore
import { fetchVisibleFields } from '@/utils/fieldFetcher';
// @ts-ignore
import { fetchRecordsAndValues } from '@/utils/recordFetcher';
// @ts-ignore
import { getAttachmentFields } from '@/utils/attachmentUploader';
// @ts-ignore
import { convertPdfToJpegFile } from '@/utils/pdfToImageConverter';

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
  [key: string]: any;
  table: any[];
}

const props = defineProps<{
  hiprintTemplate?: any;
  initialFields?: Field[]; // 添加初始化字段属性
  initialRecords?: Record[]; // 添加初始化记录属性
}>();

const emit = defineEmits<{
  (e: 'print', data: any, isPdf?: boolean): void;
}>();

const fields = ref<Field[]>([]);
const selectedFields = ref<string[]>([]);
const recordList = ref<Record[]>([]);
const selectedRows = ref<Record[]>([]);
const isLoading = ref(false);
const dataTable = ref<any>(null);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(20);
const MAX_RECORDS = 200;

// 计算分页后的数据
const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  return recordList.value.slice(startIndex, startIndex + pageSize.value);
});

// 默认选择前4个字段
const displayFields = computed<Field[]>(() => {
  if (selectedFields.value.length === 0) {
    return fields.value.slice(0, 4);
  }
  return fields.value.filter(field => selectedFields.value.includes(field.id));
});

// 监听初始化字段和记录
watch(() => props.initialFields, (newFields) => {
  if (newFields && newFields.length > 0) {
    fields.value = newFields;
    // 默认选择前4个字段
    selectedFields.value = newFields.slice(0, 4).map(field => field.id);
  }
}, { immediate: true });

watch(() => props.initialRecords, (newRecords) => {
  if (newRecords && newRecords.length > 0) {
    recordList.value = newRecords;
  }
}, { immediate: true });

onMounted(async () => {
  // 如果没有初始化字段，则获取字段信息
  if (!props.initialFields || props.initialFields.length === 0) {
    await fetchFieldInfo();
  }
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
  currentPage.value = 1; // 重置页码
  
  try {
    const table = await bitable.base.getActiveTable();
    const view = await table.getActiveView();
    const tableId = table.id;
    const viewId = view.id;
    
    // 获取所有记录，最多MAX_RECORDS条
    const records = await fetchRecordsAndValues(tableId, viewId, MAX_RECORDS, true);
    
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
    
    if (records.length >= MAX_RECORDS) {
      ElMessage.warning(`已获取 ${records.length} 条记录，达到最大限制 ${MAX_RECORDS} 条`);
    } else {
      ElMessage.success(`已获取 ${records.length} 条记录`);
    }
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

// 处理页面大小变化
function handleSizeChange(size: number): void {
  pageSize.value = size;
  currentPage.value = 1; // 重置页码
  
  // 清除选择
  if (dataTable.value) {
    dataTable.value.clearSelection();
  }
}

// 处理页码变化
function handleCurrentChange(page: number): void {
  currentPage.value = page;
  
  // 清除选择并重新选中已选择的行
  if (dataTable.value) {
    // 延迟执行，确保表格数据已更新
    setTimeout(() => {
      // 先清除所有选择
      dataTable.value.clearSelection();
      
      // 然后重新选中当前页中的已选行
      paginatedData.value.forEach(row => {
        if (selectedRows.value.some(selected => selected.recordId === row.recordId)) {
          dataTable.value.toggleRowSelection(row, true);
        }
      });
    }, 0);
  }
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
function preparePrintData(): any[] {
  // 将选中的行数据转换为打印数据格式
  return selectedRows.value.map(row => {
    // 复制所有字段数据，排除recordId和field
    const rowData = { ...row };
    delete rowData.recordId;
    delete rowData.field;
    
    // 构造每条记录的打印数据对象，包含普通文本字段和表格数据
    const printItem: any = {};
    
    // 添加所有字段作为普通文本字段
    Object.keys(rowData).forEach(key => {
      printItem[key] = rowData[key];
    });
    
    // 添加表格数据 - 将同一条记录作为表格数据
    printItem.table = [rowData];
    
    return printItem;
  });
}

// 全选所有记录
function selectAllRecords(): void {
  if (dataTable.value) {
    // 先清除所有选择
    dataTable.value.clearSelection();
    
    // 选中所有记录（包括所有页）
    recordList.value.forEach(row => {
      dataTable.value.toggleRowSelection(row, true);
    });
    
    // 更新选中行
    selectedRows.value = [...recordList.value];
  }
}

// 选择当前页
function selectCurrentPage(): void {
  if (dataTable.value) {
    // 先清除当前页的选择
    paginatedData.value.forEach(row => {
      dataTable.value.toggleRowSelection(row, false);
    });
    
    // 选中当前页的所有行
    paginatedData.value.forEach(row => {
      dataTable.value.toggleRowSelection(row, true);
    });
    
    // 更新选中行（保留其他页的选择）
    const otherPagesSelected = selectedRows.value.filter(row => 
      !paginatedData.value.some(pageRow => pageRow.recordId === row.recordId)
    );
    
    selectedRows.value = [...otherPagesSelected, ...paginatedData.value];
  }
}

// 取消全选所有记录
function unselectAllRecords(): void {
  if (dataTable.value) {
    dataTable.value.clearSelection();
    selectedRows.value = [];
  }
}

// 反选所有记录
function invertSelection(): void {
  if (dataTable.value) {
    // 先清除当前页的选择
    dataTable.value.clearSelection();
    
    // 反选当前页的记录
    paginatedData.value.forEach(row => {
      const isSelected = selectedRows.value.some(selected => selected.recordId === row.recordId);
      dataTable.value.toggleRowSelection(row, !isSelected);
    });
    
    // 更新选中行
    const currentPageRows = paginatedData.value;
    const otherPagesSelected = selectedRows.value.filter(row => 
      !currentPageRows.some(pageRow => pageRow.recordId === row.recordId)
    );
    
    const newlySelected = currentPageRows.filter(row => 
      !selectedRows.value.some(selected => selected.recordId === row.recordId)
    );
    
    selectedRows.value = [...otherPagesSelected, ...newlySelected];
  }
}

// 添加附件上传相关的状态
const attachmentFields = ref([]);
const selectedAttachmentField = ref('');
const exportToBaseDialogVisible = ref(false);
const exportProgress = ref(0);
const exportTotal = ref(0);
const exportCurrent = ref(0);
const isExporting = ref(false);
const exportFormat = ref('pdf');

// 添加获取附件字段的方法
async function fetchAttachmentFields() {
  try {
    const table = await bitable.base.getActiveTable();
    const tableId = table.id;
    
    // 获取附件类型的字段
    const fields = await getAttachmentFields(tableId);
    attachmentFields.value = fields;
    
    // 如果有附件字段，默认选择第一个
    if (fields.length > 0) {
      selectedAttachmentField.value = fields[0].id;
    }
  } catch (error) {
    console.error('获取附件字段失败:', error);
    ElMessage.error('获取附件字段失败: ' + (error.message || String(error)));
  }
}

// 添加导出至多维表格的方法
async function exportToBase() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的数据');
    return;
  }
  
  // 打开选择附件字段的对话框
  await fetchAttachmentFields();
  
  if (attachmentFields.value.length === 0) {
    ElMessage.warning('当前表格中没有附件类型字段，请先添加附件字段');
    return;
  }
  
  exportToBaseDialogVisible.value = true;
}

// 添加执行导出的方法
async function executeExport() {
  if (!selectedAttachmentField.value) {
    ElMessage.warning('请选择一个附件字段');
    return;
  }
  
  try {
    isExporting.value = true;
    exportProgress.value = 0;
    exportTotal.value = selectedRows.value.length;
    exportCurrent.value = 0;
    
    const table = await bitable.base.getActiveTable();
    
    // 获取附件字段
    const attachmentField = await table.getFieldById(selectedAttachmentField.value);
    
    // 逐个处理选中的记录
    for (const row of selectedRows.value) {
      exportCurrent.value++;
      
      try {
        // 准备单条记录的打印数据
        const printItem = prepareSinglePrintData(row);
        
        // 生成PDF
        const pdfBlob = await generatePDF(printItem);
        
        if (!pdfBlob) {
          throw new Error('生成PDF失败');
        }
        
        // 构造基础文件名（不含扩展名）
        const baseFileName = `记录_${row.recordId}_${new Date().toISOString().split('T')[0]}`;
        
        let file;
        
        // 根据选择的格式处理文件
        if (exportFormat.value === 'pdf') {
          // PDF格式，直接使用生成的PDF Blob
          file = new File([pdfBlob], `${baseFileName}.pdf`, { type: 'application/pdf' });
        } else {
          // JPEG格式，需要转换
          // 使用转换工具将PDF转为JPEG
          file = await convertPdfToJpegFile(pdfBlob, baseFileName);
        }
        
        // 上传文件到附件字段
        await attachmentField.setValue(row.recordId, file);
        
        // 更新进度
        exportProgress.value = (exportCurrent.value / exportTotal.value) * 100;
        
        // 添加短暂延迟，避免API调用过于频繁
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (recordError) {
        console.error(`处理记录 ${row.recordId} 失败:`, recordError);
        ElMessage.warning(`处理记录 ${row.recordId} 失败: ${recordError.message || String(recordError)}`);
      }
    }
    
    ElMessage.success(`已成功导出 ${exportCurrent.value} 条记录的${exportFormat.value === 'pdf' ? 'PDF' : 'JPEG图片'}到多维表格`);
    exportToBaseDialogVisible.value = false;
  } catch (error) {
    console.error('导出至多维表格失败:', error);
    ElMessage.error('导出至多维表格失败: ' + (error.message || String(error)));
  } finally {
    isExporting.value = false;
  }
}

// 准备单条记录的打印数据
function prepareSinglePrintData(row) {
  // 复制所有字段数据，排除recordId和field
  const rowData = { ...row };
  delete rowData.recordId;
  delete rowData.field;
  
  // 构造打印数据对象，包含普通文本字段和表格数据
  const printItem = {};
  
  // 添加所有字段作为普通文本字段
  Object.keys(rowData).forEach(key => {
    printItem[key] = rowData[key];
  });
  
  // 添加表格数据 - 将同一条记录作为表格数据
  printItem.table = [rowData];
  
  return printItem;
}

// 生成PDF
async function generatePDF(printItem) {
  return new Promise((resolve, reject) => {
    try {
      if (!props.hiprintTemplate) {
        reject(new Error('打印模板未初始化'));
        return;
      }
      
      // 使用hiprint内置的toPdf方法获取PDF Blob
      const fileName = `记录_${new Date().toISOString().split('T')[0]}`;
      props.hiprintTemplate.toPdf(
        [printItem], 
        fileName,
        {
          isDownload: false, // 不自动下载
          type: 'blob', // 直接获取Blob对象
        }
      ).then((pdfBlob) => {
        if (pdfBlob instanceof Blob) {
          resolve(pdfBlob);
        } else {
          console.error('PDF生成结果不是Blob对象:', pdfBlob);
          reject(new Error('生成PDF失败，未返回Blob对象'));
        }
      }).catch((error) => {
        console.error('生成PDF失败:', error);
        reject(error || new Error('生成PDF失败'));
      });
    } catch (error) {
      console.error('生成PDF过程出错:', error);
      reject(error);
    }
  });
}
</script>

<style scoped>
.print-data-selector {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

h4 {
  margin-top: 0;
  margin-bottom: 0;
  color: #606266;
}

.field-selection {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.data-preview {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.data-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.record-count {
  font-size: 14px;
  color: #606266;
  background-color: #ecf5ff;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #d9ecff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-number {
  font-weight: bold;
  color: #409eff;
}

.select-btn {
  margin-left: 5px;
  padding: 0 5px;
}

.select-btn:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-table) {
  flex: 1;
  overflow: auto;
}

:deep(.el-table__header) {
  font-weight: bold;
  background-color: #f0f7ff;
}

:deep(.el-table__row.selected) {
  background-color: #ecf5ff;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.export-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

.export-progress {
  text-align: center;
  padding: 20px 0;
}

.format-selection {
  margin-top: 15px;
}

.quality-slider {
  margin-top: 10px;
}

.scale-slider {
  margin-top: 10px;
}
</style> 