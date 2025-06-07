<template>
  <div class="help-page">
    <div class="help-header">
      <h1>打印模板设计系统使用帮助</h1>
      <el-button @click="goBack" type="primary" size="small">返回首页</el-button>
    </div>

    <el-card class="help-section">
      <template #header>
        <div class="section-title">
          <h2>系统概述</h2>
        </div>
      </template>
      <p>打印模板设计系统是一个用于创建、编辑和管理打印模板的工具，支持多种元素拖拽、参数配置和数据打印功能。</p>
      
      <div class="important-notice">
        <h3>重要提示</h3>
        <p>在使用本系统前，请确保您已选择正确的表格和视图，并且该视图中包含所需的字段。如果缺少必要的字段，可能会导致打印数据不完整或无法正确显示。</p>
        <p>建议的使用步骤：</p>
        <ol>
          <li>先在多维表格中选择合适的表格和视图</li>
          <li>确认视图中包含所有需要打印的字段</li>
          <li>然后再打开打印模板设计系统</li>
        </ol>
        <p class="warning-text">如需使用表格，请使用表格数据中的字段数据表。</p>
        <div class="repeated-warning">
          <p><strong>不要修改字段名</strong>（会导致数据无法正确填充）</p>
          <p><strong>不要修改字段名</strong>（会导致数据无法正确填充）</p>
          <p><strong>不要修改字段名</strong>（会导致数据无法正确填充）</p>
        </div>
      </div>
    </el-card>

    <el-card class="help-section">
      <template #header>
        <div class="section-title">
          <h2>功能模块</h2>
        </div>
      </template>
      <el-collapse>
        <el-collapse-item title="模板设计" name="1">
          <div class="help-content">
            <h3>基本操作</h3>
            <ul>
              <li>从左侧元素库中拖拽元素到设计区域</li>
              <li>点击元素后在右侧可以编辑元素属性</li>
              <li>支持调整元素大小、位置和样式</li>
              <li>可以选择不同的纸张大小或自定义纸张尺寸</li>
            </ul>
            <h3>模板保存</h3>
            <ul>
              <li>输入模板名称后点击"保存模板"按钮</li>
              <li>模板将保存到本地数据库中</li>
              <li>可以导出模板为JSON格式，方便备份和分享</li>
            </ul>
          </div>
        </el-collapse-item>
        
        <el-collapse-item title="数据打印" name="2">
          <div class="help-content">
            <h3>数据选择</h3>
            <ul>
              <li>选择需要显示的字段</li>
              <li>从数据源中选择要打印的记录</li>
              <li>支持分页浏览和筛选数据</li>
            </ul>
            <h3>打印输出</h3>
            <ul>
              <li>支持批量打印选中记录</li>
              <li>可以选择PDF或JPEG格式输出</li>
              <li>支持将打印结果上传到多维表格附件字段</li>
            </ul>
            <p class="export-tip">注意: JPEG格式会使用浏览器进行转换，可能影响图片质量和系统性能，建议根据实际需求选择合适的格式</p>
          </div>
        </el-collapse-item>
        
        <el-collapse-item title="模板管理" name="3">
          <div class="help-content">
            <h3>模板列表</h3>
            <ul>
              <li>查看所有保存的模板</li>
              <li>加载已保存的模板进行编辑</li>
              <li>删除不需要的模板</li>
            </ul>
            <h3>独立设计器</h3>
            <ul>
              <li>提供更大的设计空间</li>
              <li>完成设计后可以保存并返回主界面</li>
            </ul>
          </div>
        </el-collapse-item>
        
        <el-collapse-item title="字段信息" name="4">
          <div class="help-content">
            <h3>字段管理</h3>
            <ul>
              <li>查看当前可用的所有字段</li>
              <li>了解字段类型和格式</li>
              <li>帮助设计模板时正确引用数据字段</li>
            </ul>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card class="help-section">
      <template #header>
        <div class="section-title">
          <h2>常见问题</h2>
        </div>
      </template>
      <el-collapse>
        <el-collapse-item title="如何创建新模板？" name="5">
          <ol>
            <li>进入"模板设计"标签页</li>
            <li>从左侧拖拽所需元素到设计区域</li>
            <li>在右侧面板配置元素属性</li>
            <li>输入模板名称并点击"保存模板"</li>
          </ol>
        </el-collapse-item>
        
        <el-collapse-item title="如何打印数据？" name="6">
          <ol>
            <li>先设计并保存好模板</li>
            <li>切换到"数据打印"标签页</li>
            <li>选择需要显示的字段</li>
            <li>点击"获取数据"按钮加载记录</li>
            <li>选择要打印的记录</li>
            <li>点击"打印选中记录"按钮</li>
          </ol>
        </el-collapse-item>
        
        <el-collapse-item title="如何导出模板？" name="7">
          <ol>
            <li>在模板设计页面，点击"模板操作"下拉菜单</li>
            <li>选择"导出JSON"选项</li>
            <li>模板数据将被导出为JSON格式</li>
          </ol>
        </el-collapse-item>
        
        <el-collapse-item title="如何导入模板？" name="8">
          <ol>
            <li>在模板设计页面，点击"模板操作"下拉菜单</li>
            <li>选择"导入模板"选项</li>
            <li>粘贴或输入模板JSON数据</li>
            <li>点击确认导入</li>
          </ol>
        </el-collapse-item>
        
        <el-collapse-item title="为什么不能修改字段名？" name="9">
          <div class="help-content">
            <p>字段名是系统识别和关联数据的唯一标识。如果修改了字段名，系统将无法正确匹配数据源中的字段，导致以下问题：</p>
            <ul>
              <li>数据无法正确填充到模板中</li>
              <li>表格中的数据显示为空白或错误</li>
              <li>打印结果与预期不符</li>
            </ul>
            <p>正确的做法是：使用系统提供的字段数据表中的原始字段名，不要进行任何修改。</p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card class="help-section">
      <template #header>
        <div class="section-title">
          <h2>快速入门指南</h2>
        </div>
      </template>
      <div class="quick-start">
        <h3>第一步：创建模板</h3>
        <p>进入模板设计页面，从左侧元素库拖拽所需元素到设计区域，配置元素属性后保存模板(推荐使用独立设计器)。</p>
        
        <h3>第二步：准备数据</h3>
        <p>确保数据源中包含模板所需的字段，可以在"字段信息"标签页查看可用字段。</p>
        
        <h3>第三步：打印数据</h3>
        <p>切换到"数据打印"标签页，选择字段和记录，然后打印或导出到所需格式。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ElCard, ElButton, ElCollapse, ElCollapseItem } from 'element-plus';

const router = useRouter();

function goBack() {
  router.push('/');
}
</script>

<style scoped>
.help-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.help-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
  font-weight: 500;
}

.help-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
}

.section-title h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  font-weight: 500;
}

.important-notice {
  background-color: #fef0f0;
  padding: 15px;
  border-left: 4px solid #f56c6c;
  margin: 15px 0;
  border-radius: 4px;
}

.important-notice h3 {
  color: #f56c6c;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
}

.important-notice p {
  margin-bottom: 10px;
  line-height: 1.6;
}

.important-notice ol {
  padding-left: 20px;
  margin-bottom: 0;
}

.important-notice li {
  margin-bottom: 5px;
  line-height: 1.6;
}

.warning-text {
  background-color: #fef0f0;
  padding: 15px;
  border-left: 4px solid #f56c6c;
  margin: 15px 0;
  border-radius: 4px;
}

.warning-text p {
  margin-bottom: 10px;
  line-height: 1.6;
}

.warning-text strong {
  font-weight: 500;
}

.help-content {
  padding: 10px 0;
}

.help-content h3 {
  font-size: 16px;
  margin-top: 15px;
  margin-bottom: 10px;
  color: #606266;
  font-weight: 500;
}

.help-content ul, .help-content ol {
  padding-left: 20px;
  margin-bottom: 15px;
}

.help-content li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.export-tip {
  background-color: #f8f8f8;
  padding: 10px;
  border-left: 4px solid #e6a23c;
  margin: 10px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.quick-start h3 {
  font-size: 16px;
  margin-top: 15px;
  margin-bottom: 10px;
  color: #606266;
  font-weight: 500;
}

.quick-start p {
  margin-bottom: 15px;
  line-height: 1.6;
}

.repeated-warning {
  background-color: #fef0f0;
  padding: 15px;
  border-left: 4px solid #f56c6c;
  margin: 15px 0;
  border-radius: 4px;
  text-align: center;
}

.repeated-warning p {
  margin-bottom: 10px;
  line-height: 1.6;
  font-size: 16px;
  color: #f56c6c;
}

.repeated-warning strong {
  font-weight: 700;
  color: #f56c6c;
}
</style> 