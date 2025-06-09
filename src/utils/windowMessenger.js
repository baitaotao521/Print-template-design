/**
 * 窗口间通信工具类
 * 用于处理父窗口和子窗口之间的postMessage通信
 */

// 消息类型常量
export const MESSAGE_TYPES = {
  DESIGNER_READY: 'DESIGNER_READY',
  INIT_TEMPLATE_DATA: 'INIT_TEMPLATE_DATA',
  TEMPLATE_SAVED: 'TEMPLATE_SAVED'
};

// 通信状态
export const COMMUNICATION_STATUS = {
  WAITING: 'waiting',
  CONNECTED: 'connected',
  TIMEOUT: 'timeout',
  ERROR: 'error'
};

/**
 * 父窗口通信管理器
 * 用于管理父窗口向子窗口发送数据的逻辑
 */
export class ParentWindowMessenger {
  constructor() {
    this.childWindow = null;
    this.messageListener = null;
    this.timeoutId = null;
    this.dataSent = false;
    this.status = COMMUNICATION_STATUS.WAITING;
    this.onStatusChange = null;
  }

  /**
   * 打开子窗口并建立通信
   * @param {string} url - 子窗口URL
   * @param {Object} data - 要发送的数据
   * @param {Object} options - 配置选项
   * @returns {Promise} - 返回Promise，resolve时表示数据发送成功
   */
  openWindowAndSendData(url, data, options = {}) {
    const {
      windowFeatures = 'width=1200,height=800',
      timeout = 8000,
      onStatusChange = null
    } = options;

    this.onStatusChange = onStatusChange;
    this.dataSent = false;
    this.status = COMMUNICATION_STATUS.WAITING;

    return new Promise((resolve, reject) => {
      try {
        // 打开新窗口
        this.childWindow = window.open(url, '_blank', windowFeatures);

        // 检查窗口是否被阻止
        if (!this.childWindow || this.childWindow.closed || typeof this.childWindow.closed === 'undefined') {
          this.status = COMMUNICATION_STATUS.ERROR;
          this._notifyStatusChange();
          reject(new Error('弹窗被浏览器阻止，请允许弹窗后重试'));
          return;
        }

        // 发送数据的函数
        const sendData = () => {
          if (this.dataSent) {
            console.log('数据已发送，跳过重复发送');
            return;
          }

          try {
            // 检查窗口是否仍然有效
            if (this.childWindow.closed) {
              console.log('目标窗口已关闭，取消发送数据');
              this.status = COMMUNICATION_STATUS.ERROR;
              this._notifyStatusChange();
              reject(new Error('目标窗口已关闭'));
              return;
            }

            // 发送数据到子窗口
            this.childWindow.postMessage({
              type: MESSAGE_TYPES.INIT_TEMPLATE_DATA,
              data: data,
              timestamp: new Date().getTime()
            }, '*');

            this.dataSent = true;
            this.status = COMMUNICATION_STATUS.CONNECTED;
            this._notifyStatusChange();
            console.log('数据已发送到子窗口');
            resolve({ success: true, message: '数据发送成功' });
          } catch (postError) {
            this.status = COMMUNICATION_STATUS.ERROR;
            this._notifyStatusChange();
            console.error('发送数据到子窗口失败:', postError);
            reject(new Error('发送数据失败: ' + (postError.message || String(postError))));
          }
        };

        // 监听子窗口的准备就绪消息
        this.messageListener = (event) => {
          // 验证消息来源和类型
          if (event.source === this.childWindow && 
              event.data && 
              event.data.type === MESSAGE_TYPES.DESIGNER_READY && 
              !this.dataSent) {
            console.log('收到子窗口准备就绪消息');
            sendData();
            this._cleanup();
          }
        };

        window.addEventListener('message', this.messageListener);

        // 设置超时
        this.timeoutId = setTimeout(() => {
          if (!this.dataSent) {
            console.log('超时发送数据到子窗口');
            sendData();
          }
          this._cleanup();
        }, timeout);

      } catch (error) {
        this.status = COMMUNICATION_STATUS.ERROR;
        this._notifyStatusChange();
        console.error('打开子窗口失败:', error);
        reject(new Error('打开子窗口失败: ' + (error.message || String(error))));
      }
    });
  }

  /**
   * 监听来自子窗口的消息
   * @param {Function} callback - 消息处理回调函数
   */
  listenForMessages(callback) {
    const messageHandler = (event) => {
      try {
        // 检查消息类型
        if (event.data && event.data.type === MESSAGE_TYPES.TEMPLATE_SAVED) {
          console.log('收到子窗口发送的模板数据');
          callback(event.data);
        }
      } catch (error) {
        console.error('处理子窗口消息失败:', error);
      }
    };

    window.addEventListener('message', messageHandler);
    
    // 返回清理函数
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }

  /**
   * 清理资源
   */
  _cleanup() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * 通知状态变化
   */
  _notifyStatusChange() {
    if (this.onStatusChange) {
      this.onStatusChange(this.status);
    }
  }

  /**
   * 销毁实例
   */
  destroy() {
    this._cleanup();
    this.childWindow = null;
    this.onStatusChange = null;
  }
}

/**
 * 子窗口通信管理器
 * 用于管理子窗口与父窗口的通信逻辑
 */
export class ChildWindowMessenger {
  constructor() {
    this.messageListener = null;
    this.dataReceived = false;
    this.onDataReceived = null;
    this.timeout = 12000;
    this.timeoutId = null;
  }

  /**
   * 初始化子窗口通信
   * @param {Function} onDataReceived - 接收到数据时的回调函数
   * @param {Object} options - 配置选项
   */
  initialize(onDataReceived, options = {}) {
    const { timeout = 12000 } = options;
    
    this.onDataReceived = onDataReceived;
    this.timeout = timeout;
    this.dataReceived = false;

    // 检查是否有父窗口
    if (!window.opener || window.opener.closed) {
      console.warn('没有父窗口，可能是直接访问的子窗口');
      throw new Error('请从主页面打开此窗口');
    }

    // 添加消息监听器
    this.messageListener = this._handleMessageFromParent.bind(this);
    window.addEventListener('message', this.messageListener);

    // 向父窗口发送准备就绪消息
    this._sendReadyMessage();

    // 设置超时
    this.timeoutId = setTimeout(() => {
      if (!this.dataReceived) {
        console.error('接收数据超时');
        throw new Error('未能接收到数据，请返回上一页重试');
      }
    }, this.timeout);
  }

  /**
   * 向父窗口发送准备就绪消息
   */
  _sendReadyMessage() {
    try {
      window.opener.postMessage({
        type: MESSAGE_TYPES.DESIGNER_READY,
        timestamp: new Date().getTime()
      }, '*');
      console.log('已向父窗口发送准备就绪消息');
    } catch (error) {
      console.error('发送准备就绪消息失败:', error);
    }
  }

  /**
   * 处理来自父窗口的消息
   */
  _handleMessageFromParent(event) {
    try {
      console.log('收到来自父窗口的消息:', event.data);

      // 验证消息类型和数据完整性
      if (event.data && 
          event.data.type === MESSAGE_TYPES.INIT_TEMPLATE_DATA && 
          event.data.data && 
          !this.dataReceived) {
        
        console.log('接收到初始化数据');
        this.dataReceived = true;

        // 清除超时定时器
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }

        // 调用数据接收回调
        if (this.onDataReceived) {
          this.onDataReceived(event.data.data);
        }
      } else if (event.data && event.data.type === MESSAGE_TYPES.INIT_TEMPLATE_DATA && this.dataReceived) {
        console.log('数据已接收，跳过重复处理');
      }
    } catch (error) {
      console.error('处理父窗口消息失败:', error);
      throw new Error('处理数据失败: ' + (error.message || String(error)));
    }
  }

  /**
   * 向父窗口发送数据
   * @param {Object} data - 要发送的数据
   * @param {string} type - 消息类型，默认为TEMPLATE_SAVED
   */
  sendDataToParent(data, type = MESSAGE_TYPES.TEMPLATE_SAVED) {
    return new Promise((resolve, reject) => {
      try {
        // 检查是否有父窗口
        if (!window.opener || window.opener.closed) {
          reject(new Error('没有父窗口可以发送数据'));
          return;
        }

        // 发送数据到父窗口
        const messageData = {
          type: type,
          ...data,
          timestamp: new Date().getTime()
        };

        window.opener.postMessage(messageData, '*');
        console.log('数据已发送到父窗口');
        resolve({ success: true, message: '数据发送成功' });
      } catch (error) {
        console.error('发送数据到父窗口失败:', error);
        reject(new Error('发送数据失败: ' + (error.message || String(error))));
      }
    });
  }

  /**
   * 销毁实例
   */
  destroy() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.onDataReceived = null;
  }
}

/**
 * 创建父窗口通信实例的工厂函数
 */
export function createParentMessenger() {
  return new ParentWindowMessenger();
}

/**
 * 创建子窗口通信实例的工厂函数
 */
export function createChildMessenger() {
  return new ChildWindowMessenger();
}
