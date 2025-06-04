<script setup>
import FieldInfoViewer from './components/FieldInfoViewer.vue'
</script>

<template>
  <main>
    <el-tabs>
      <el-tab-pane label="字段信息">
        <FieldInfoViewer />
      </el-tab-pane>
      <el-tab-pane label="打印模板">
        <hiprintViewer />
      </el-tab-pane>
    </el-tabs>
  </main>
</template>

<style scoped>
  main {
    padding: 1rem;
  }
  h4 {
    font-size: calc(1.275rem + 0.3vw);
    margin-bottom: 1rem;
  }
  code {
    font-size: 0.875em;
    color: #d63384;
    word-wrap: break-word;
  }
</style>
