// 不再从npm包导入，而是使用全局变量pdfjsLib
// 需要在index.html中添加CDN链接

/**
 * 将PDF Blob转换为JPEG图片
 * @param {Blob} pdfBlob - PDF的Blob对象
 * @param {number} pageNumber - 要转换的页码，默认为1（第一页）
 * @returns {Promise<Blob>} - 返回JPEG图片的Blob对象
 */
export async function convertPdfToJpeg(pdfBlob, pageNumber = 1) {
  try {
    // 确保pdfjsLib已加载
    if (!window.pdfjsLib) {
      throw new Error('PDF.js 库未加载');
    }
    
    // 将Blob转换为ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    
    // 加载PDF文档
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    // 检查页码是否有效
    if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(`无效的页码: ${pageNumber}，文档共有 ${pdfDocument.numPages} 页`);
    }
    
    // 获取指定页面
    const page = await pdfDocument.getPage(pageNumber);
    
    // 获取设备像素比，用于高清显示
    const ratio = window.devicePixelRatio || 2;
    
    // 获取页面的视口，使用设备像素比作为缩放比例
    const viewport = page.getViewport({ scale: ratio });
    
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // 设置canvas大小
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // 渲染PDF页面到canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // 将canvas转换为Blob，使用最高质量
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('转换为Blob失败'));
            }
          },
          'image/jpeg',
          1.0  // 使用最高质量
        );
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('PDF转图片失败:', error);
    throw error;
  }
}

/**
 * 将PDF的所有页面转换为JPEG图片
 * @param {Blob} pdfBlob - PDF的Blob对象
 * @returns {Promise<Blob[]>} - 返回JPEG图片Blob对象数组
 */
export async function convertPdfToJpegAll(pdfBlob) {
  try {
    // 确保pdfjsLib已加载
    if (!window.pdfjsLib) {
      throw new Error('PDF.js 库未加载，请确保在HTML中引入了CDN链接');
    }
    
    // 将Blob转换为ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    
    // 加载PDF文档
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    const totalPages = pdfDocument.numPages;
    const imageBlobs = [];
    
    // 获取设备像素比，用于高清显示
    const ratio = window.devicePixelRatio || 2;
    
    // 创建一个可重用的canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // 转换每一页
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      // 获取指定页面
      const page = await pdfDocument.getPage(pageNumber);
      
      // 获取页面的视口，使用设备像素比作为缩放比例
      const viewport = page.getViewport({ scale: ratio });
      
      // 设置canvas大小
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // 渲染PDF页面到canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // 将canvas转换为Blob并添加到数组
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('转换为Blob失败'));
            }
          },
          'image/jpeg',
          1.0  // 使用最高质量
        );
      });
      
      imageBlobs.push(blob);
    }
    
    return imageBlobs;
  } catch (error) {
    console.error('PDF转图片失败:', error);
    throw error;
  }
}

/**
 * 将PDF Blob转换为JPEG图片并返回File对象
 * @param {Blob} pdfBlob - PDF的Blob对象
 * @param {string} fileName - 文件名（不含扩展名）
 * @param {number} pageNumber - 要转换的页码，默认为1（第一页）
 * @returns {Promise<File>} - 返回JPEG图片的File对象
 */
export async function convertPdfToJpegFile(pdfBlob, fileName, pageNumber = 1) {
  try {
    const jpegBlob = await convertPdfToJpeg(pdfBlob, pageNumber);
    return new File([jpegBlob], `${fileName}.jpg`, { type: 'image/jpeg' });
  } catch (error) {
    console.error('PDF转图片文件失败:', error);
    throw error;
  }
}

/**
 * 将PDF Blob转换为PNG图片
 * @param {Blob} pdfBlob - PDF的Blob对象
 * @param {number} pageNumber - 要转换的页码，默认为1（第一页）
 * @returns {Promise<Blob>} - 返回PNG图片的Blob对象
 */
export async function convertPdfToPng(pdfBlob, pageNumber = 1) {
  try {
    // 确保pdfjsLib已加载
    if (!window.pdfjsLib) {
      throw new Error('PDF.js 库未加载');
    }

    // 将Blob转换为ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();

    // 加载PDF文档
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    // 检查页码是否有效
    if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(`无效的页码: ${pageNumber}，文档共有 ${pdfDocument.numPages} 页`);
    }

    // 获取指定页面
    const page = await pdfDocument.getPage(pageNumber);

    // 使用更高的像素比以获得更清晰的PNG图像
    const ratio = window.devicePixelRatio || 8; // 使用较高的比例以获得更清晰的图像

    // 获取页面的视口，使用高分辨率缩放比例
    const viewport = page.getViewport({ scale: ratio * 2 }); // 进一步提高缩放比例

    // 创建canvas元素
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // 设置canvas大小
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // 渲染PDF页面到canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // 将canvas转换为PNG格式的Blob（无损压缩）
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('转换为PNG Blob失败'));
            }
          },
          'image/png' // PNG格式，无损压缩
        );
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('PDF转PNG图片失败:', error);
    throw error;
  }
}

/**
 * 将PDF Blob转换为PNG图片并返回File对象
 * @param {Blob} pdfBlob - PDF的Blob对象
 * @param {string} fileName - 文件名（不含扩展名）
 * @param {number} pageNumber - 要转换的页码，默认为1（第一页）
 * @returns {Promise<File>} - 返回PNG图片的File对象
 */
export async function convertPdfToPngFile(pdfBlob, fileName, pageNumber = 1) {
  try {
    const pngBlob = await convertPdfToPng(pdfBlob, pageNumber);
    return new File([pngBlob], `${fileName}.png`, { type: 'image/png' });
  } catch (error) {
    console.error('PDF转PNG图片文件失败:', error);
    throw error;
  }
}