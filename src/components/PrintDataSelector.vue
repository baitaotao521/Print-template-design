<template>
  <div class="print-data-selector">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <el-button type="primary" @click="fetchData" :loading="isLoading" :icon="Refresh" size="default">
          获取数据
        </el-button>
        <div class="data-stats" v-if="recordList.length > 0">
          <el-tag type="info" size="small">
            <el-icon><Document /></el-icon>
            总记录: {{ recordList.length }}
          </el-tag>
          <el-tag type="success" size="small" v-if="selectedRows.length > 0">
            <el-icon><Check /></el-icon>
            已选择: {{ selectedRows.length }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 字段选择区域 -->
    <div class="field-selection-card">
      <div class="card-header">
        <h4>
          <el-icon><Setting /></el-icon>
          选择显示字段
        </h4>
        <p>选择要在数据表格中显示的字段</p>
      </div>
      <el-select
        v-model="selectedFields"
        multiple
        collapse-tags
        collapse-tags-tooltip
        placeholder="请选择要显示的字段"
        class="field-select"
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
    <div class="data-preview-card" v-if="recordList.length > 0">
      <div class="card-header">
        <h4>
          <el-icon><List /></el-icon>
          选择打印记录
        </h4>
        <div class="selection-controls">
          <el-button-group size="default">
            <el-button @click="selectAllRecords" :icon="Check" size="default">全选</el-button>
            <el-button @click="selectCurrentPage" :icon="Document" size="default">当前页</el-button>
            <el-button @click="unselectAllRecords" :icon="Close" size="default">清空</el-button>
            <el-button @click="invertSelection" :icon="Switch" size="default">反选</el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="data-table-wrapper">
        <el-table
          ref="dataTable"
          :data="paginatedData"
          class="data-table"
          stripe
          border
          size="small"
          @selection-change="handleSelectionChange"
          :header-cell-style="{ background: 'transparent', color: 'white' }"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column
            v-for="field in displayFields"
            :key="field.id"
            :prop="field.id"
            :label="field.name"
            :min-width="field.width || 120"
            show-overflow-tooltip
          >
            <template #default="scope">
              <span class="field-value">{{ formatValue(scope.row[field.id]) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="recordList.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          small
        />
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-buttons-card">
      <div class="card-header">
        <h4>
          <el-icon><Operation /></el-icon>
          打印操作
        </h4>
        <p>选择操作类型并执行打印</p>
      </div>
      <div class="button-grid">
        <el-button
          type="success"
          @click="printSelected"
          :disabled="selectedRows.length === 0"
          :icon="Printer"
          class="action-btn"
          size="default"
        >
          打印选中数据
        </el-button>
        <el-button
          type="warning"
          @click="exportPDF"
          :disabled="selectedRows.length === 0"
          :icon="Download"
          class="action-btn"
          size="default"
        >
          导出PDF
        </el-button>
        <el-button
          type="info"
          @click="exportToBase"
          :disabled="selectedRows.length === 0"
          :icon="Upload"
          class="action-btn"
          size="default"
        >
          导出至多维表格
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!isLoading && recordList.length === 0" class="empty-state">
      <el-empty description="暂无数据">
        <el-button type="primary" @click="fetchData" :icon="Refresh" size="default">
          获取数据
        </el-button>
      </el-empty>
    </div>

    <!-- 导出至多维表格对话框 -->
    <el-dialog
      v-model="exportToBaseDialogVisible"
      title="导出至多维表格"
      width="520px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="export-dialog"
      align-center
    >
      <div v-if="!isExporting" class="export-dialog-content">
        <div class="field-selection-section">
          <div class="section-header">
            <el-icon class="section-icon"><Upload /></el-icon>
            <h4>选择附件字段</h4>
          </div>
          <p class="section-description">请选择要将文件导出到的附件字段:</p>
          <el-select
            v-model="selectedAttachmentField"
            placeholder="选择附件字段"
            class="field-selector"
            size="large"
          >
            <el-option
              v-for="field in attachmentFields"
              :key="field.id"
              :label="field.name"
              :value="field.id"
            />
          </el-select>
        </div>

        <div class="format-selection-section">
          <div class="section-header">
            <el-icon class="section-icon"><Document /></el-icon>
            <h4>选择导出格式</h4>
          </div>
          <p class="section-description">请选择导出格式:</p>
          <el-radio-group v-model="exportFormat" class="format-radio-group">
            <el-radio label="pdf" class="format-radio">
              <div class="radio-content">
                <strong>PDF格式</strong>
                <span class="radio-desc">推荐格式，保持原始质量</span>
              </div>
            </el-radio>
            <el-radio label="jpeg" class="format-radio">
              <div class="radio-content">
                <strong>JPEG图片格式</strong>
                <span class="radio-desc">图片格式，便于预览</span>
              </div>
            </el-radio>
          </el-radio-group>
        </div>

        <div class="tips-section">
          <div class="tip-item">
            <el-icon class="tip-icon"><InfoFilled /></el-icon>
            <span>每条记录将生成一个单独的文件，并上传到对应记录的附件字段中</span>
          </div>
          <div class="tip-item">
            <el-icon class="tip-icon"><WarningFilled /></el-icon>
            <span>JPEG格式会使用浏览器进行转换，可能影响图片质量和系统性能，建议根据实际需求选择合适的格式</span>
          </div>
        </div>
      </div>
      
      <div v-else class="export-progress-container">
        <div class="progress-header">
          <el-icon class="progress-icon"><Loading /></el-icon>
          <h4>正在导出至多维表格</h4>
        </div>
        <div class="progress-info">
          <span class="progress-text">进度: {{ exportCurrent }}/{{ exportTotal }}</span>
          <span class="progress-percentage">{{ Math.round(exportProgress) }}%</span>
        </div>
        <el-progress
          :percentage="exportProgress"
          :stroke-width="8"
          :show-text="false"
          class="custom-progress"
        />
        <p class="progress-tip">请耐心等待，正在处理您的数据...</p>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button
            @click="exportToBaseDialogVisible = false"
            :disabled="isExporting"
            class="cancel-btn"
            size="default"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            @click="executeExport"
            :loading="isExporting"
            :disabled="isExporting"
            class="export-btn"
            size="default"
          >
            <template #icon v-if="!isExporting">
              <el-icon><Upload /></el-icon>
            </template>
            {{ isExporting ? '导出中...' : '开始导出' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { bitable } from '@lark-base-open/js-sdk';
import {
  ElMessage, ElDialog, ElSelect, ElOption, ElButton, ElProgress, ElRadioGroup, ElRadio,
  ElTable, ElTableColumn, ElPagination, ElTag, ElIcon, ElButtonGroup, ElEmpty
} from 'element-plus';
import {
  Refresh, Document, Check, Setting, List, Close, Switch, Operation,
  Printer, Download, Upload, InfoFilled, WarningFilled, Loading
} from '@element-plus/icons-vue';
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
/* 基础样式 */
.print-data-selector {
  padding: 0;
  background: #fafbfc;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 工具栏样式 */
.toolbar {
  padding: 15px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

/* 统一按钮样式 */
:deep(.el-button) {
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

:deep(.el-button--primary.is-loading) {
  transform: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.el-button--success) {
  background: linear-gradient(135deg, #67c23a 0%, #529b2e 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

:deep(.el-button--success:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.4);
}

:deep(.el-button--warning) {
  background: linear-gradient(135deg, #e6a23c 0%, #d48806 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}

:deep(.el-button--warning:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(230, 162, 60, 0.4);
}

:deep(.el-button--info) {
  background: linear-gradient(135deg, #909399 0%, #73767a 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.3);
}

:deep(.el-button--info:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(144, 147, 153, 0.4);
}

:deep(.el-button:disabled) {
  transform: none !important;
  opacity: 0.6;
  cursor: not-allowed;
}

.data-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

:deep(.data-stats .el-tag) {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.data-stats .el-tag.el-tag--info) {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
  color: white;
}

:deep(.data-stats .el-tag.el-tag--success) {
  background: linear-gradient(135deg, #67c23a 0%, #529b2e 100%);
  color: white;
}

:deep(.data-stats .el-tag:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 卡片样式 */
.field-selection-card,
.data-preview-card,
.action-buttons-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 0 15px;
}

.card-header {
  padding: 20px 20px 15px 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.card-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.card-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

/* 字段选择样式 */
.field-select {
  width: 100%;
  margin: 15px 20px 20px 20px;
}

/* 选择控制样式 */
.selection-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.selection-controls .el-button-group .el-button) {
  background: white;
  border: 1px solid #dcdfe6;
  color: #606266;
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

:deep(.selection-controls .el-button-group .el-button:hover) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

:deep(.selection-controls .el-button-group .el-button:first-child) {
  border-radius: 8px 0 0 8px;
}

:deep(.selection-controls .el-button-group .el-button:last-child) {
  border-radius: 0 8px 8px 0;
}

:deep(.selection-controls .el-button-group .el-button:not(:first-child):not(:last-child)) {
  border-radius: 0;
}

/* 数据表格容器样式 */
.data-table-wrapper {
  margin: 0 20px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  background: white;
  border: 1px solid #f0f2f5;
}

.data-table {
  border-radius: 12px;
  border: none;
  background: white;
}

.field-value {
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
  font-weight: 400;
  padding: 2px 0;
}

/* 分页样式 */
.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #e9ecef;
}

/* 操作按钮样式 */
.button-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 20px;
}

.action-btn {
  justify-content: flex-start;
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

/* 空状态样式 */
.empty-state {
  margin: 40px 15px;
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 40px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.empty-state .el-empty__description) {
  color: #909399;
  font-size: 16px;
  margin-bottom: 20px;
}

:deep(.empty-state .el-button) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  height: 40px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.empty-state .el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 表格深度样式 */
:deep(.el-table) {
  border-radius: 16px;
  border: none;
  box-shadow: none;
}

:deep(.el-table__header) {
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

:deep(.el-table__header-wrapper) {
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

:deep(.el-table__header th) {
  background: transparent !important;
  color: white !important;
  border: none !important;
  padding: 18px 12px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  text-align: left;
  letter-spacing: 0.5px;
}

:deep(.el-table__header th:first-child) {
  border-radius: 16px 0 0 0;
}

:deep(.el-table__header th:last-child) {
  border-radius: 0 16px 0 0;
}

:deep(.el-table__body-wrapper) {
  border-radius: 0 0 16px 16px;
  overflow: hidden;
}

:deep(.el-table__row) {
  transition: all 0.3s ease;
  border: none;
}

:deep(.el-table__row td) {
  border: none !important;
  padding: 16px 12px !important;
  font-size: 14px;
  color: #303133;
  background: white;
  border-bottom: 1px solid #f5f7fa !important;
}

:deep(.el-table__row:nth-child(even) td) {
  background: #fafbfc;
}

:deep(.el-table__row.selected td) {
  background: rgba(102, 126, 234, 0.08) !important;
  color: #667eea !important;
  font-weight: 500;
  border-left: 3px solid #667eea !important;
}

:deep(.data-table .el-table__row:hover td) {
  background: rgba(102, 126, 234, 0.04) !important;
  transition: all 0.2s ease;
}

:deep(.data-table .el-table__row:hover) {
  transform: none;
  box-shadow: none;
}

:deep(.data-table .el-table__row.selected:hover td) {
  background: rgba(102, 126, 234, 0.12) !important;
}

:deep(.el-checkbox) {
  transform: scale(1.1);
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

:deep(.el-table__empty-block) {
  background: white;
  border-radius: 0 0 16px 16px;
}

/* 分页组件样式优化 */
:deep(.el-pagination) {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  color: #606266;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

:deep(.el-pagination .el-pager li) {
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  color: #606266;
  margin: 0 2px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-pagination .el-pager li:hover) {
  background: linear-gradient(135deg, #f0f2f5 0%, #e9ecef 100%);
  color: #303133;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

:deep(.el-pagination .el-pager li.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

:deep(.el-pagination .el-select .el-input__wrapper) {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.el-pagination .el-select .el-input__wrapper:hover) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* 导出对话框样式 */
:deep(.export-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  border: none;
}

:deep(.export-dialog .el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  border: none;
  box-shadow: none;
  margin: 0;
}

:deep(.export-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 28px;
  border-radius: 0;
  margin: 0;
  border: none;
}

:deep(.export-dialog .el-dialog__title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

:deep(.export-dialog .el-dialog__headerbtn) {
  top: 24px;
  right: 28px;
}

:deep(.export-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  transition: all 0.3s ease;
}

:deep(.export-dialog .el-dialog__headerbtn .el-dialog__close:hover) {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

:deep(.export-dialog .el-dialog__body) {
  padding: 28px;
  background: #fafbfc;
  border: none;
}

:deep(.export-dialog .el-dialog__footer) {
  padding: 0;
  border: none;
}

.export-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.field-selection-section,
.format-selection-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-icon {
  color: #667eea;
  font-size: 18px;
}

.section-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.section-description {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.field-selector {
  width: 100%;
}

:deep(.field-selector .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

:deep(.field-selector .el-input__wrapper:hover) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.format-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.format-radio {
  margin: 0;
  padding: 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: white;
}

.format-radio:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

:deep(.format-radio.is-checked) {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f4ff 0%, #e6f3ff 100%);
}

.radio-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
}

.radio-content strong {
  color: #303133;
  font-size: 14px;
}

.radio-desc {
  color: #909399;
  font-size: 12px;
}

.tips-section {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 16px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  color: #fa8c16;
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.tip-item span {
  color: #8c4a00;
  font-size: 13px;
  line-height: 1.5;
}

.export-progress-container {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.progress-icon {
  color: #667eea;
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-header h4 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 8px;
}

.progress-text {
  color: #606266;
  font-size: 14px;
}

.progress-percentage {
  color: #667eea;
  font-size: 16px;
  font-weight: 600;
}

.custom-progress {
  margin-bottom: 16px;
}

:deep(.custom-progress .el-progress-bar__outer) {
  background: #f0f2f5;
  border-radius: 8px;
}

:deep(.custom-progress .el-progress-bar__inner) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.progress-tip {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.cancel-btn {
  background: white;
  border: 1px solid #dcdfe6;
  color: #606266;
  border-radius: 8px;
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
}

.export-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-section {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .data-stats {
    justify-content: center;
  }

  .field-selection-card,
  .data-preview-card,
  .action-buttons-card {
    margin: 0 10px;
  }

  .card-header {
    padding: 15px;
  }

  .field-select {
    margin: 12px 15px 15px 15px;
  }

  .data-table-wrapper {
    margin: 0 15px;
    border-radius: 12px;
  }

  .pagination-container {
    padding: 15px;
  }

  :deep(.el-table__header th) {
    padding: 12px 8px !important;
    font-size: 13px !important;
  }

  :deep(.el-table__row td) {
    padding: 12px 8px !important;
    font-size: 13px;
  }

  .field-value {
    font-size: 13px;
  }

  .button-grid {
    padding: 15px;
    gap: 10px;
  }

  .selection-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .field-selection-card,
  .data-preview-card,
  .action-buttons-card {
    margin: 0 8px;
  }

  .card-header h4 {
    font-size: 14px;
  }

  .card-header p {
    font-size: 12px;
  }

  .action-btn {
    height: 36px;
    padding: 0 16px;
    font-size: 13px;
  }

  :deep(.el-button) {
    height: 36px;
    padding: 0 16px;
    font-size: 13px;
  }

  :deep(.selection-controls .el-button-group .el-button) {
    height: 36px;
    padding: 0 12px;
    font-size: 13px;
  }
}

/* 动画效果 */
.field-selection-card,
.data-preview-card,
.action-buttons-card {
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