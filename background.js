// background.js
function invokeAnkiConnect(action, params = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('error', () => reject('failed to issue request'));
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (Object.getOwnPropertyNames(response).length != 2) {
            throw 'response has an unexpected number of fields';
          }
          if (!response.hasOwnProperty('error')) {
            throw 'response is missing required error field';
          }
          if (!response.hasOwnProperty('result')) {
            throw 'response is missing required result field';
          }
          if (response.error) {
            throw response.error;
          }
          resolve(response.result);
        } catch (e) {
          reject(e);
        }
      });
  
      xhr.open('POST', 'http://localhost:8765');
      xhr.send(JSON.stringify({action, version: 6, params}));
    });
  }
  
  // 获取可用的牌组列表
  function getDeckNames() {
    return invokeAnkiConnect('deckNames');
  }
  
  // 获取可用的卡片类型列表
  function getModelNames() {
    return invokeAnkiConnect('modelNames');
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getDeckNames") {
      getDeckNames().then(decks => {
        sendResponse({success: true, decks: decks});
      }).catch(error => {
        sendResponse({success: false, error: error.toString()});
      });
      return true;  // 保持消息通道开放以进行异步响应
    } else if (request.action === "getModelNames") {
      getModelNames().then(models => {
        sendResponse({success: true, models: models});
      }).catch(error => {
        sendResponse({success: false, error: error.toString()});
      });
      return true;  // 保持消息通道开放以进行异步响应
    } else if (request.action === "addNote") {
      invokeAnkiConnect('addNote', {
        note: {
          deckName: request.deckName,
          modelName: request.modelName,
          fields: request.fields,
          tags: ["browser_extension"]
        }
      }).then(() => {
        sendResponse({success: true});
      }).catch(error => {
        sendResponse({success: false, error: error.toString()});
      });
      return true;  // 保持消息通道开放以进行异步响应
    }
  });