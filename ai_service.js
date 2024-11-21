// ai_service.js
// 检查配置是否存在
if (typeof CONFIG === 'undefined') {
    throw new Error('配置未加载！请确保在 HTML 中先引入 config.js');
}

async function generateFrontContent(backContent) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.model,
                messages: [
                    {role: "system", content: "你是一个语言专家，有很强的逻辑思维。"},
                    {role: "user", content: `请从下面的答案，找到关键点，生成与之对应的一个问题，问题要简短且贴近关键点:\n\n${backContent}`}
                ]
            })
        });

        if (!response.ok) {
            console.error('API响应不成功:', response.status, response.statusText);
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        console.log('API返回数据:', data);
        console.log('Trace-ID:', data.id);

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return data.choices[0].message.content.trim();
        } else {
            console.error('API返回数据格式不正确:', data);
            throw new Error("API返回数据格式不正确");
        }
    } catch (error) {
        console.error('生成正面内容时发生错误:', error);
        throw error;
    }
}

// 如果在 Node.js 环境中使用，则导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateFrontContent };
}