// 全局类型声明

// 扩展Window接口，添加fieldTestData属性
interface Window {
  fieldTestData: Record<string, any>;
}

// 声明模块，解决导入错误
declare module '@/utils/fieldFetcher';
declare module '@/utils/recordFetcher';
declare module '@/utils/printElementProvider'; 