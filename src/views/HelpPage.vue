<template>
  <div class="help-page">
    <!-- 页面头部 -->
    <div class="help-header">
      <div class="header-content">
        <div class="header-left">
          <el-icon class="header-icon"><Document /></el-icon>
          <div class="header-text">
            <h1>打印模板设计系统使用帮助</h1>
            <p class="header-subtitle">快速上手指南与常见问题解答</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button @click="scrollToTop" type="info" size="small" :icon="Top" circle />
          <el-button @click="toggleSearch" type="success" size="small" :icon="Search" circle />
          <el-button @click="goBack" type="primary" size="small" :icon="HomeFilled">返回首页</el-button>
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-container" v-show="showSearch">
      <el-input
        v-model="searchQuery"
        placeholder="搜索帮助内容..."
        :prefix-icon="Search"
        size="large"
        clearable
        @input="handleSearch"
      />
    </div>

    <!-- 快速导航 -->
    <div class="quick-nav" v-show="!searchQuery">
      <el-button-group class="nav-buttons">
        <el-button @click="scrollToSection('overview')" :type="activeSection === 'overview' ? 'primary' : 'default'" size="small">
          <el-icon><InfoFilled /></el-icon>
          <span>概述</span>
        </el-button>
        <el-button @click="scrollToSection('features')" :type="activeSection === 'features' ? 'primary' : 'default'" size="small">
          <el-icon><Grid /></el-icon>
          <span>功能</span>
        </el-button>
        <el-button @click="scrollToSection('faq')" :type="activeSection === 'faq' ? 'primary' : 'default'" size="small">
          <el-icon><QuestionFilled /></el-icon>
          <span>问题</span>
        </el-button>
        <el-button @click="scrollToSection('quickstart')" :type="activeSection === 'quickstart' ? 'primary' : 'default'" size="small">
          <el-icon><Lightning /></el-icon>
          <span>入门</span>
        </el-button>
      </el-button-group>
    </div>

    <!-- 主内容区域 -->
    <div class="help-main-content"
         :class="{ 'search-active': searchQuery }"
         ref="mainContent">
        <!-- 搜索结果 -->
        <div v-if="searchQuery && searchResults.length === 0" class="no-results">
          <el-empty description="未找到相关内容" />
        </div>

        <!-- 系统概述 -->
        <el-card class="help-section" id="overview" v-show="!searchQuery || isVisible('overview')">
          <template #header>
            <div class="section-title">
              <el-icon class="section-icon"><InfoFilled /></el-icon>
              <h2>系统概述</h2>
            </div>
          </template>
          <div class="section-content">
            <div class="overview-intro">
              <el-icon class="intro-icon"><Printer /></el-icon>
              <p>打印模板设计系统是一个用于创建、编辑和管理打印模板的专业工具，支持多种元素拖拽、参数配置和数据打印功能。</p>
            </div>

            <div class="feature-highlights">
              <div class="feature-item">
                <el-icon><Edit /></el-icon>
                <span>可视化设计</span>
              </div>
              <div class="feature-item">
                <el-icon><Connection /></el-icon>
                <span>数据绑定</span>
              </div>
              <div class="feature-item">
                <el-icon><Download /></el-icon>
                <span>多格式导出</span>
              </div>
              <div class="feature-item">
                <el-icon><Setting /></el-icon>
                <span>灵活配置</span>
              </div>
            </div>

            <el-alert
              title="重要提示"
              type="warning"
              :closable="false"
              show-icon
              class="important-notice"
            >
              <template #default>
                <div class="notice-content">
                  <p>在使用本系统前，请确保您已选择正确的表格和视图，并且该视图中包含所需的字段。如果缺少必要的字段，可能会导致打印数据不完整或无法正确显示。</p>

                  <div class="steps-container">
                    <h4>建议的使用步骤：</h4>
                    <el-steps direction="vertical" :active="3" finish-status="success">
                      <el-step title="选择表格和视图" description="在多维表格中选择合适的表格和视图" />
                      <el-step title="确认字段完整性" description="确认视图中包含所有需要打印的字段" />
                      <el-step title="打开设计系统" description="然后再打开打印模板设计系统" />
                    </el-steps>
                  </div>

                  <el-alert
                    title="字段使用提醒"
                    type="error"
                    :closable="false"
                    show-icon
                    class="field-warning"
                  >
                    <p>如需使用表格，请使用表格数据中的字段数据表。</p>
                  </el-alert>

                  <div class="critical-warning">
                    <el-tag type="danger" size="large" effect="dark">
                      <el-icon><WarningFilled /></el-icon>
                      重要警告
                    </el-tag>
                    <div class="warning-content">
                      <p><strong>不要修改字段名</strong> - 这会导致数据无法正确填充</p>
                      <p>字段名是系统识别数据的唯一标识，任何修改都可能导致功能异常</p>
                    </div>
                  </div>
                </div>
              </template>
            </el-alert>
          </div>
        </el-card>

        <!-- 功能模块 -->
        <el-card class="help-section" id="features" v-show="!searchQuery || isVisible('features')">
          <template #header>
            <div class="section-title">
              <el-icon class="section-icon"><Grid /></el-icon>
              <h2>功能模块</h2>
            </div>
          </template>
          <el-collapse v-model="activeCollapse" class="feature-collapse">
            <el-collapse-item name="template-design">
              <template #title>
                <div class="collapse-title">
                  <el-icon><Edit /></el-icon>
                  <span>模板设计</span>
                  <el-tag type="primary" size="small">核心功能</el-tag>
                </div>
              </template>
              <div class="help-content">
                <div class="content-section">
                  <h3><el-icon><Mouse /></el-icon>基本操作</h3>
                  <el-timeline>
                    <el-timeline-item
                      timestamp="步骤 1"
                      placement="top"
                      type="primary"
                      icon="Pointer"
                    >
                      从左侧元素库中拖拽元素到设计区域
                    </el-timeline-item>
                    <el-timeline-item
                      timestamp="步骤 2"
                      placement="top"
                      type="success"
                      icon="Setting"
                    >
                      点击元素后在右侧可以编辑元素属性
                    </el-timeline-item>
                    <el-timeline-item
                      timestamp="步骤 3"
                      placement="top"
                      type="warning"
                      icon="Rank"
                    >
                      支持调整元素大小、位置和样式
                    </el-timeline-item>
                    <el-timeline-item
                      timestamp="步骤 4"
                      placement="top"
                      type="info"
                      icon="Document"
                    >
                      可以选择不同的纸张大小或自定义纸张尺寸
                    </el-timeline-item>
                  </el-timeline>
                </div>

                <div class="content-section">
                  <h3><el-icon><FolderOpened /></el-icon>模板保存</h3>
                  <div class="feature-grid">
                    <div class="feature-card">
                      <el-icon><DocumentAdd /></el-icon>
                      <h4>本地保存</h4>
                      <p>输入模板名称后点击"保存模板"按钮，模板将保存到本地数据库中</p>
                    </div>
                    <div class="feature-card">
                      <el-icon><Download /></el-icon>
                      <h4>JSON导出</h4>
                      <p>可以导出模板为JSON格式，方便备份和分享</p>
                    </div>
                  </div>
                </div>
              </div>
            </el-collapse-item>

            <el-collapse-item name="data-print">
              <template #title>
                <div class="collapse-title">
                  <el-icon><Printer /></el-icon>
                  <span>数据打印</span>
                  <el-tag type="success" size="small">输出功能</el-tag>
                </div>
              </template>
              <div class="help-content">
                <div class="content-section">
                  <h3><el-icon><Select /></el-icon>数据选择</h3>
                  <div class="step-cards">
                    <div class="step-card">
                      <div class="step-number">1</div>
                      <div class="step-content">
                        <h4>选择字段</h4>
                        <p>选择需要显示的字段</p>
                      </div>
                    </div>
                    <div class="step-card">
                      <div class="step-number">2</div>
                      <div class="step-content">
                        <h4>选择记录</h4>
                        <p>从数据源中选择要打印的记录</p>
                      </div>
                    </div>
                    <div class="step-card">
                      <div class="step-number">3</div>
                      <div class="step-content">
                        <h4>数据浏览</h4>
                        <p>支持分页浏览和筛选数据</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="content-section">
                  <h3><el-icon><Download /></el-icon>打印输出</h3>
                  <div class="output-options">
                    <div class="option-card">
                      <el-icon><Files /></el-icon>
                      <h4>批量打印</h4>
                      <p>支持批量打印选中记录</p>
                    </div>
                    <div class="option-card">
                      <el-icon><Document /></el-icon>
                      <h4>PDF格式</h4>
                      <p>高质量PDF格式输出</p>
                    </div>
                    <div class="option-card">
                      <el-icon><Picture /></el-icon>
                      <h4>JPEG格式</h4>
                      <p>图片格式输出</p>
                    </div>
                    <div class="option-card">
                      <el-icon><Upload /></el-icon>
                      <h4>附件上传</h4>
                      <p>上传到多维表格附件字段</p>
                    </div>
                  </div>

                  <el-alert
                    title="格式选择提示"
                    type="info"
                    :closable="false"
                    show-icon
                    class="format-tip"
                  >
                    JPEG格式会使用浏览器进行转换，可能影响图片质量和系统性能，建议根据实际需求选择合适的格式
                  </el-alert>
                </div>
              </div>
            </el-collapse-item>

            <el-collapse-item name="template-management">
              <template #title>
                <div class="collapse-title">
                  <el-icon><FolderOpened /></el-icon>
                  <span>模板管理</span>
                  <el-tag type="warning" size="small">管理工具</el-tag>
                </div>
              </template>
              <div class="help-content">
                <div class="management-grid">
                  <div class="management-section">
                    <h3><el-icon><List /></el-icon>模板列表</h3>
                    <ul class="feature-list">
                      <li><el-icon><View /></el-icon>查看所有保存的模板</li>
                      <li><el-icon><Edit /></el-icon>加载已保存的模板进行编辑</li>
                      <li><el-icon><Delete /></el-icon>删除不需要的模板</li>
                    </ul>
                  </div>

                  <div class="management-section">
                    <h3><el-icon><Monitor /></el-icon>独立设计器</h3>
                    <ul class="feature-list">
                      <li><el-icon><FullScreen /></el-icon>提供更大的设计空间</li>
                      <li><el-icon><Check /></el-icon>完成设计后可以保存并返回主界面</li>
                    </ul>
                  </div>
                </div>
              </div>
            </el-collapse-item>

            <el-collapse-item name="field-info">
              <template #title>
                <div class="collapse-title">
                  <el-icon><DataBoard /></el-icon>
                  <span>字段信息</span>
                  <el-tag type="info" size="small">数据管理</el-tag>
                </div>
              </template>
              <div class="help-content">
                <div class="field-management">
                  <h3><el-icon><Operation /></el-icon>字段管理</h3>
                  <div class="field-features">
                    <div class="field-feature">
                      <el-icon><View /></el-icon>
                      <div>
                        <h4>字段查看</h4>
                        <p>查看当前可用的所有字段</p>
                      </div>
                    </div>
                    <div class="field-feature">
                      <el-icon><DataLine /></el-icon>
                      <div>
                        <h4>类型识别</h4>
                        <p>了解字段类型和格式</p>
                      </div>
                    </div>
                    <div class="field-feature">
                      <el-icon><Link /></el-icon>
                      <div>
                        <h4>引用帮助</h4>
                        <p>帮助设计模板时正确引用数据字段</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <!-- 常见问题 -->
        <el-card class="help-section" id="faq" v-show="!searchQuery || isVisible('faq')">
          <template #header>
            <div class="section-title">
              <el-icon class="section-icon"><QuestionFilled /></el-icon>
              <h2>常见问题</h2>
            </div>
          </template>
          <el-collapse v-model="activeFaqCollapse" class="faq-collapse">
            <el-collapse-item name="create-template">
              <template #title>
                <div class="faq-title">
                  <el-icon><CirclePlus /></el-icon>
                  <span>如何创建新模板？</span>
                  <el-tag type="primary" size="small">基础操作</el-tag>
                </div>
              </template>
              <div class="faq-content">
                <el-steps direction="vertical" :active="4" finish-status="success">
                  <el-step title="进入模板设计" description="进入模板设计标签页" icon="Edit" />
                  <el-step title="拖拽元素" description="从左侧拖拽所需元素到设计区域" icon="Pointer" />
                  <el-step title="配置属性" description="在右侧面板配置元素属性" icon="Setting" />
                  <el-step title="保存模板" description="输入模板名称并点击保存模板" icon="Check" />
                </el-steps>
              </div>
            </el-collapse-item>

            <el-collapse-item name="print-data">
              <template #title>
                <div class="faq-title">
                  <el-icon><Printer /></el-icon>
                  <span>如何打印数据？</span>
                  <el-tag type="success" size="small">核心功能</el-tag>
                </div>
              </template>
              <div class="faq-content">
                <el-steps direction="vertical" :active="6" finish-status="success">
                  <el-step title="准备模板" description="先设计并保存好模板" icon="DocumentAdd" />
                  <el-step title="切换页面" description="切换到数据打印标签页" icon="Switch" />
                  <el-step title="选择字段" description="选择需要显示的字段" icon="Select" />
                  <el-step title="加载数据" description="点击获取数据按钮加载记录" icon="Refresh" />
                  <el-step title="选择记录" description="选择要打印的记录" icon="Check" />
                  <el-step title="执行打印" description="点击打印选中记录按钮" icon="Printer" />
                </el-steps>
              </div>
            </el-collapse-item>

            <el-collapse-item name="export-template">
              <template #title>
                <div class="faq-title">
                  <el-icon><Download /></el-icon>
                  <span>如何导出模板？</span>
                  <el-tag type="warning" size="small">数据管理</el-tag>
                </div>
              </template>
              <div class="faq-content">
                <div class="export-steps">
                  <div class="export-step">
                    <div class="step-icon">
                      <el-icon><Operation /></el-icon>
                    </div>
                    <div class="step-text">
                      <h4>打开操作菜单</h4>
                      <p>在模板设计页面，点击模板操作下拉菜单</p>
                    </div>
                  </div>
                  <div class="export-step">
                    <div class="step-icon">
                      <el-icon><Download /></el-icon>
                    </div>
                    <div class="step-text">
                      <h4>选择导出选项</h4>
                      <p>选择导出JSON选项</p>
                    </div>
                  </div>
                  <div class="export-step">
                    <div class="step-icon">
                      <el-icon><DocumentCopy /></el-icon>
                    </div>
                    <div class="step-text">
                      <h4>获取模板数据</h4>
                      <p>模板数据将被导出为JSON格式</p>
                    </div>
                  </div>
                </div>
              </div>
            </el-collapse-item>

            <el-collapse-item name="import-template">
              <template #title>
                <div class="faq-title">
                  <el-icon><Upload /></el-icon>
                  <span>如何导入模板？</span>
                  <el-tag type="info" size="small">数据管理</el-tag>
                </div>
              </template>
              <div class="faq-content">
                <div class="import-guide">
                  <el-timeline>
                    <el-timeline-item timestamp="步骤 1" type="primary" icon="Operation">
                      在模板设计页面，点击模板操作下拉菜单
                    </el-timeline-item>
                    <el-timeline-item timestamp="步骤 2" type="success" icon="Upload">
                      选择导入模板选项
                    </el-timeline-item>
                    <el-timeline-item timestamp="步骤 3" type="warning" icon="EditPen">
                      粘贴或输入模板JSON数据
                    </el-timeline-item>
                    <el-timeline-item timestamp="步骤 4" type="info" icon="Check">
                      点击确认导入
                    </el-timeline-item>
                  </el-timeline>
                </div>
              </div>
            </el-collapse-item>

            <el-collapse-item name="field-name-warning">
              <template #title>
                <div class="faq-title">
                  <el-icon><WarningFilled /></el-icon>
                  <span>为什么不能修改字段名？</span>
                  <el-tag type="danger" size="small">重要警告</el-tag>
                </div>
              </template>
              <div class="faq-content">
                <el-alert
                  title="字段名修改风险"
                  type="error"
                  :closable="false"
                  show-icon
                  class="field-risk-alert"
                >
                  <p>字段名是系统识别和关联数据的唯一标识。如果修改了字段名，系统将无法正确匹配数据源中的字段。</p>
                </el-alert>

                <div class="risk-consequences">
                  <h4>可能导致的问题：</h4>
                  <div class="consequence-list">
                    <div class="consequence-item">
                      <el-icon><CloseBold /></el-icon>
                      <span>数据无法正确填充到模板中</span>
                    </div>
                    <div class="consequence-item">
                      <el-icon><CloseBold /></el-icon>
                      <span>表格中的数据显示为空白或错误</span>
                    </div>
                    <div class="consequence-item">
                      <el-icon><CloseBold /></el-icon>
                      <span>打印结果与预期不符</span>
                    </div>
                  </div>
                </div>

                <el-alert
                  title="正确做法"
                  type="success"
                  :closable="false"
                  show-icon
                  class="correct-approach"
                >
                  使用系统提供的字段数据表中的原始字段名，不要进行任何修改。
                </el-alert>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <!-- 快速入门指南 -->
        <el-card class="help-section" id="quickstart" v-show="!searchQuery || isVisible('quickstart')">
          <template #header>
            <div class="section-title">
              <el-icon class="section-icon"><Lightning /></el-icon>
              <h2>快速入门指南</h2>
            </div>
          </template>
          <div class="quick-start">
            <div class="quick-start-intro">
              <el-icon><Compass /></el-icon>
              <p>三步快速上手打印模板设计系统</p>
            </div>

            <div class="quick-start-steps">
              <div class="quick-step">
                <div class="step-header">
                  <div class="step-number">1</div>
                  <h3>创建模板</h3>
                  <el-tag type="primary">设计阶段</el-tag>
                </div>
                <div class="step-content">
                  <div class="step-description">
                    <el-icon><Edit /></el-icon>
                    <p>进入模板设计页面，从左侧元素库拖拽所需元素到设计区域，配置元素属性后保存模板</p>
                  </div>
                  <div class="step-tips">
                    <el-alert
                      title="推荐使用独立设计器"
                      type="info"
                      :closable="false"
                      show-icon
                    >
                      独立设计器提供更大的设计空间和更好的操作体验
                    </el-alert>
                  </div>
                  <div class="step-actions">
                    <el-button type="primary" size="small" :icon="Edit">
                      开始设计模板
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="quick-step">
                <div class="step-header">
                  <div class="step-number">2</div>
                  <h3>准备数据</h3>
                  <el-tag type="warning">数据阶段</el-tag>
                </div>
                <div class="step-content">
                  <div class="step-description">
                    <el-icon><DataBoard /></el-icon>
                    <p>确保数据源中包含模板所需的字段，可以在字段信息标签页查看可用字段</p>
                  </div>
                  <div class="step-checklist">
                    <h4>检查清单：</h4>
                    <ul>
                      <li><el-icon><Check /></el-icon>确认表格和视图选择正确</li>
                      <li><el-icon><Check /></el-icon>验证所需字段都已包含</li>
                      <li><el-icon><Check /></el-icon>检查字段数据格式</li>
                    </ul>
                  </div>
                  <div class="step-actions">
                    <el-button type="warning" size="small" :icon="View">
                      查看字段信息
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="quick-step">
                <div class="step-header">
                  <div class="step-number">3</div>
                  <h3>打印数据</h3>
                  <el-tag type="success">输出阶段</el-tag>
                </div>
                <div class="step-content">
                  <div class="step-description">
                    <el-icon><Printer /></el-icon>
                    <p>切换到数据打印标签页，选择字段和记录，然后打印或导出到所需格式</p>
                  </div>
                  <div class="output-formats">
                    <h4>支持的输出格式：</h4>
                    <div class="format-options">
                      <div class="format-option">
                        <el-icon><Document /></el-icon>
                        <span>PDF</span>
                      </div>
                      <div class="format-option">
                        <el-icon><Picture /></el-icon>
                        <span>JPEG</span>
                      </div>
                      <div class="format-option">
                        <el-icon><Upload /></el-icon>
                        <span>附件上传</span>
                      </div>
                    </div>
                  </div>
                  <div class="step-actions">
                    <el-button type="success" size="small" :icon="Printer">
                      开始打印
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="quick-start-footer">
              <el-alert
                title="需要帮助？"
                type="info"
                :closable="false"
                show-icon
              >
                <template #default>
                  <p>如果在使用过程中遇到问题，请查看上方的常见问题解答，或参考详细的功能模块说明。</p>
                </template>
              </el-alert>
            </div>
          </div>
        </el-card>
    </div>

    <!-- 返回顶部按钮 -->
    <el-backtop :right="20" :bottom="20" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  ElCard, ElButton, ElCollapse, ElCollapseItem, ElInput, ElMenu, ElMenuItem,
  ElIcon, ElAlert, ElSteps, ElStep, ElTimeline, ElTimelineItem, ElTag,
  ElEmpty, ElBacktop, ElButtonGroup
} from 'element-plus';
import {
  Document, HomeFilled, Top, Search, Menu, InfoFilled, Grid, QuestionFilled,
  Lightning, Edit, Mouse, Setting, Rank, FolderOpened, DocumentAdd, Download,
  Printer, Select, Files, Picture, Upload, View, Delete, Monitor, FullScreen,
  Check, DataBoard, Operation, DataLine, Link, CirclePlus, Pointer, Switch,
  Refresh, DocumentCopy, EditPen, WarningFilled, CloseBold, Compass, Connection,
  List
} from '@element-plus/icons-vue';

const router = useRouter();

// 响应式数据
const showSearch = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const activeSection = ref('overview');
const activeCollapse = ref(['template-design']);
const activeFaqCollapse = ref(['create-template']);
const mainContent = ref(null);

// 搜索相关功能
function toggleSearch() {
  showSearch.value = !showSearch.value;
  if (showSearch.value) {
    nextTick(() => {
      const searchInput = document.querySelector('.search-container input');
      if (searchInput) {
        searchInput.focus();
      }
    });
  } else {
    searchQuery.value = '';
    searchResults.value = [];
  }
}

function handleSearch(query) {
  if (!query) {
    searchResults.value = [];
    return;
  }

  // 简单的搜索实现
  const sections = ['overview', 'features', 'faq', 'quickstart'];
  searchResults.value = sections.filter(section => {
    const element = document.getElementById(section);
    if (element) {
      const text = element.textContent.toLowerCase();
      return text.includes(query.toLowerCase());
    }
    return false;
  });
}

function isVisible(sectionId) {
  if (!searchQuery.value) return true;
  return searchResults.value.includes(sectionId);
}

// 导航相关功能
function scrollToSection(sectionId) {
  activeSection.value = sectionId;
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function goBack() {
  router.push('/');
}

// 监听滚动事件，更新当前激活的导航项
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: '-20% 0px -70% 0px'
    }
  );

  // 观察所有section
  const sections = ['overview', 'features', 'faq', 'quickstart'];
  sections.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      observer.observe(element);
    }
  });
});
</script>

<style scoped>
/* 基础样式 */
.help-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  padding: 15px;
  max-width: 100%;
  overflow-x: hidden;
}

/* 页面头部样式 - 竖向优化 */
.help-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 15px;
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
  text-align: center;
}

.header-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 36px;
  color: rgba(255, 255, 255, 0.9);
}

.header-text h1 {
  margin: 0 0 5px 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  line-height: 1.2;
}

.header-subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
}

.header-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 搜索栏样式 */
.search-container {
  margin: 0 0 20px 0;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 快速导航样式 */
.quick-nav {
  margin-bottom: 20px;
  text-align: center;
}

.nav-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.nav-buttons .el-button {
  flex: 1;
  min-width: 80px;
  max-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  height: auto;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-buttons .el-button .el-icon {
  font-size: 16px;
}

.nav-buttons .el-button span {
  font-size: 12px;
  line-height: 1;
}

.nav-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 主内容区域样式 */
.help-main-content {
  transition: all 0.3s ease;
}

.help-main-content.search-active {
  filter: brightness(0.95);
}

/* 卡片样式 - 竖向优化 */
.help-section {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: white;
  transition: all 0.3s ease;
}

.help-section:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.section-icon {
  font-size: 20px;
  color: #667eea;
}

.section-title h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
  line-height: 1.3;
}

.section-content {
  padding: 20px 15px;
}

/* 系统概述特殊样式 */
.overview-intro {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  color: white;
}

.intro-icon {
  font-size: 32px;
  margin-top: 5px;
}

.overview-intro p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
}

.feature-highlights {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border-radius: 8px;
  font-weight: 500;
  color: #333;
  transition: all 0.3s ease;
  font-size: 14px;
}

.feature-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.feature-item .el-icon {
  font-size: 16px;
}

.important-notice {
  margin: 20px 0;
}

.notice-content {
  padding: 10px 0;
}

.notice-content p {
  margin-bottom: 15px;
  line-height: 1.6;
}

.steps-container {
  margin: 20px 0;
}

.steps-container h4 {
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
  font-size: 14px;
}

.field-warning {
  margin: 12px 0;
}

.critical-warning {
  margin-top: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  border-radius: 10px;
  text-align: center;
}

.critical-warning .el-tag {
  margin-bottom: 10px;
}

.warning-content p {
  margin: 6px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.warning-content strong {
  font-weight: 700;
}

/* 功能模块样式 */
.feature-collapse {
  border: none;
}

.feature-collapse .el-collapse-item {
  margin-bottom: 15px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 16px;
}

.collapse-title .el-icon {
  font-size: 20px;
  color: #667eea;
}

.help-content {
  padding: 25px;
  background: #fafbfc;
}

.content-section {
  margin-bottom: 30px;
}

.content-section h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  margin-bottom: 20px;
  color: #303133;
  font-weight: 600;
}

.content-section h3 .el-icon {
  font-size: 22px;
  color: #667eea;
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.feature-card {
  padding: 15px;
  background: white;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
}

.feature-card .el-icon {
  font-size: 28px;
  color: #667eea;
  margin-bottom: 10px;
}

.feature-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.feature-card p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
  font-size: 13px;
}

.step-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.step-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.step-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
}

.step-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.step-content p {
  margin: 0;
  color: #606266;
  font-size: 12px;
  line-height: 1.4;
}

.output-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.option-card {
  padding: 12px;
  background: white;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.option-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
}

.option-card .el-icon {
  font-size: 20px;
  color: #67c23a;
  margin-bottom: 6px;
}

.option-card h4 {
  margin: 0 0 4px 0;
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.option-card p {
  margin: 0;
  color: #606266;
  font-size: 11px;
  line-height: 1.3;
}

.format-tip {
  margin-top: 20px;
}

/* 模板管理样式 */
.management-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.management-section h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.management-section h3 .el-icon {
  font-size: 22px;
  color: #e6a23c;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #606266;
}

.feature-list li:last-child {
  border-bottom: none;
}

.feature-list li .el-icon {
  color: #67c23a;
  font-size: 16px;
}

/* 字段信息样式 */
.field-management h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.field-management h3 .el-icon {
  font-size: 22px;
  color: #409eff;
}

.field-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.field-feature {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.field-feature .el-icon {
  font-size: 24px;
  color: #409eff;
  margin-top: 2px;
}

.field-feature h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.field-feature p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

/* FAQ样式 */
.faq-collapse {
  border: none;
}

.faq-collapse .el-collapse-item {
  margin-bottom: 15px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.faq-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 16px;
}

.faq-title .el-icon {
  font-size: 20px;
  color: #f56c6c;
}

.faq-content {
  padding: 25px;
  background: #fafbfc;
}

.export-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.export-step {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.export-step .step-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.export-step .step-text h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.export-step .step-text p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.import-guide {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.field-risk-alert {
  margin-bottom: 20px;
}

.risk-consequences h4 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.consequence-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.consequence-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #f56c6c;
  font-weight: 500;
}

.consequence-item .el-icon {
  font-size: 16px;
}

.correct-approach {
  margin-top: 15px;
}

/* 快速入门指南样式 */
.quick-start {
  padding: 25px;
}

.quick-start-intro {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  text-align: center;
}

.quick-start-intro .el-icon {
  font-size: 32px;
}

.quick-start-intro p {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.quick-start-steps {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 30px;
}

.quick-step {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.quick-step:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.step-header .step-number {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}

.step-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  flex: 1;
}

.step-content {
  padding: 25px;
}

.step-description {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
}

.step-description .el-icon {
  font-size: 24px;
  color: #667eea;
  margin-top: 2px;
}

.step-description p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #606266;
}

.step-tips {
  margin-bottom: 20px;
}

.step-checklist h4 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.step-checklist ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.step-checklist li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  color: #606266;
}

.step-checklist li .el-icon {
  color: #67c23a;
  font-size: 16px;
}

.output-formats h4 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.format-options {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #f0f9ff;
  border-radius: 8px;
  color: #0369a1;
  font-weight: 500;
}

.format-option .el-icon {
  font-size: 18px;
}

.step-actions {
  text-align: center;
}

.quick-start-footer {
  margin-top: 30px;
}

/* 搜索结果样式 */
.no-results {
  text-align: center;
  padding: 60px 20px;
}

/* 响应式设计 - 竖向布局优化 */
@media (max-width: 480px) {
  .help-page {
    padding: 10px;
  }

  .header-text h1 {
    font-size: 20px;
  }

  .header-subtitle {
    font-size: 12px;
  }

  .nav-buttons .el-button {
    min-width: 60px;
    padding: 8px 4px;
  }

  .nav-buttons .el-button span {
    font-size: 11px;
  }

  .feature-highlights {
    grid-template-columns: 1fr;
  }

  .output-options {
    grid-template-columns: 1fr;
  }

  .format-options {
    flex-direction: column;
    gap: 8px;
  }

  .step-header {
    flex-direction: column;
    text-align: center;
    gap: 10px;
    padding: 15px;
  }

  .export-step {
    flex-direction: column;
    text-align: center;
    gap: 10px;
    padding: 12px;
  }

  .section-content {
    padding: 15px 10px;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.help-section {
  animation: fadeInUp 0.6s ease-out;
}

.help-section:nth-child(2) {
  animation-delay: 0.1s;
}

.help-section:nth-child(3) {
  animation-delay: 0.2s;
}

.help-section:nth-child(4) {
  animation-delay: 0.3s;
}

.help-section:nth-child(5) {
  animation-delay: 0.4s;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}
</style>