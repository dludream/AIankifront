// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const deckSelect = document.getElementById('deckSelect');
    const frontTextarea = document.getElementById('front');
    const backTextarea = document.getElementById('back');
    const addNoteButton = document.getElementById('addNote');
    const getFrontButton = document.getElementById('getFront');
  
    // 获取牌组列表并设置默认选中项
    chrome.runtime.sendMessage({action: "getDeckNames"}, (response) => {
      if (response.success) {
        // 先从存储中获取上次选择的牌组
        chrome.storage.sync.get(['lastSelectedDeck'], (result) => {
          const lastSelectedDeck = result.lastSelectedDeck;
          
          response.decks.forEach(deck => {
            const option = document.createElement('option');
            option.value = option.textContent = deck;
            deckSelect.appendChild(option);
            
            // 如果这个牌组是上次选择的，就设置为选中状态
            if (deck === lastSelectedDeck) {
              option.selected = true;
            }
          });
          
          // 如果没有找到上次选择的牌组，默认选中第一个
          if (!lastSelectedDeck && deckSelect.options.length > 0) {
            deckSelect.options[0].selected = true;
          }
        });
      } else {
        showMessage('获取牌组列表失败: ' + response.error, 'error');
      }
    });
  
    // 当选择改变时，保存当前选择
    deckSelect.addEventListener('change', (event) => {
      chrome.storage.sync.set({lastSelectedDeck: event.target.value});
    });
  
    // 获取选中的文本
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getSelectedText"}, (response) => {
        if (response && response.text) {
          // 在非空行末尾添加一个<br>标签
          const formattedText = response.text.split('\n').map(line => line.trim() ? line + '<br>' : line).join('\n');
          backTextarea.value = formattedText;
        
          // 调用大模型生成正面内容
          generateFrontContent(response.text).then(frontContent => {
            frontTextarea.value = frontContent;
          }).catch(error => {
            console.error('生成正面内容失败:', error);
            alert('生成正面内容失败: ' + error.message);
          });
        }
      });
    });
  
    addNoteButton.addEventListener('click', async () => {
      const deck = deckSelect.value;
      const front = frontTextarea.value.trim();
      let back = backTextarea.value.trim();
  
      // 如果deck名称包含'python'（不区分大小写），添加代码格式化标签
      if (deck.toLowerCase().includes('python')) {
          back = `<pre><code class="language-python">\n${back}\n</code></pre>`;
      }
  
      try {
        const response = await fetch('http://localhost:8765', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: "addNote",
            version: 6,
            params: {
              note: {
                deckName: deck,
                modelName: "Basic",
                fields: {
                  Front: front,
                  Back: back
                },
                options: {
                  allowDuplicate: false
                },
                tags: []
              }
            }
          })
        });
  
        const result = await response.json();
        if (result.error) {
          console.error('Error adding note:', result.error);
          showMessage('添加笔记失败: ' + result.error, 'error');
        } else {
          console.log('Note added successfully');
          showMessage('笔记添加成功！');
          setTimeout(() => window.close(), 1000); // 1秒后关闭窗口
        }
      } catch (error) {
        console.error('Error:', error);
        showMessage('发生错误: ' + error.message, 'error');
      }
    });
  
    getFrontButton.addEventListener('click', async () => {
      const backContent = backTextarea.value.trim();

      try {
        // 在非空行末尾添加<br>标签
        const formattedBackContent = backContent.split('\n')
          .map(line => line.trim() ? line + '<br>' : line)
          .join('\n');
        
        // 更新背面内容
        backTextarea.value = formattedBackContent;

        // 调用AI服务生成正面内容
        const frontContent = await generateFrontContent(backContent);
        frontTextarea.value = frontContent;
      } catch (error) {
        console.error('生成正面内容失败:', error);
        alert('生成正面内容失败: ' + error.message);
      }
    });
  
    function showMessage(text, type = 'success') {
      const messageElement = document.getElementById('message');
      messageElement.textContent = text;
      messageElement.style.display = 'block';
      messageElement.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
      
      // 1秒后隐藏消息
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, 1000);
    }
  });