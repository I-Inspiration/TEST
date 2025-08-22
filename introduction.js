// 全局音效合成器
let synth;

// 初始化音频上下文
function initAudio() {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start().then(() => {
             synth = new Tone.PolySynth(Tone.Synth).toDestination();
             window.synth = synth; // 挂载到 window 以便其他脚本可以访问
        });
    }
}

// 新功能：调用免费AI API生成目的地介绍
async function fetchIntroduction(destinationName, contentEl, loaderEl) {
    loaderEl.style.display = 'flex';
    contentEl.innerHTML = '';

    // 清理地名，只保留核心词汇用于API请求
    const cleanDestination = destinationName.replace(/.*<br>/, '').trim();
    const prompt = `请为我详细介绍一下中国的旅行目的地：${cleanDestination}。请用热情、引人入胜的语气，重点介绍当地最值得体验的3-5个好玩的地方和3-5个特色美食。请用Markdown格式化你的回答，使用标题、列表等让内容更清晰。`;

    try {
        // 使用免费的 Gemini API，apiKey 留空
        const apiKey = "AIzaSyA2L7yI3uB6aRZQMYFFfzekQeZyeS-0Pgc"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const payload = { 
            contents: [{ 
                role: "user", 
                parts: [{ text: prompt }] 
            }] 
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API 请求失败，状态码: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates[0]?.content?.parts?.[0]) {
            contentEl.innerHTML = simpleMarkdownToHtml(result.candidates[0].content.parts[0].text);
        } else {
           // 如果AI没有返回有效内容，显示提示
           const errorText = result.promptFeedback?.blockReason?.reason || '未知原因';
           contentEl.innerHTML = `<p>抱歉，AI暂时无法生成关于“${cleanDestination}”的介绍。原因：${errorText}</p>`;
        }
    } catch (error) {
        console.error('获取目的地详情失败:', error);
        contentEl.innerHTML = `<p>哎呀，探索“${cleanDestination}”的旅途中遇到了一点小波折。请检查网络连接或稍后再试。</p>`;
    } finally {
        loaderEl.style.display = 'none';
    }
}

// Markdown 转 HTML 的辅助函数
function simpleMarkdownToHtml(md) {
    return md
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/<\/li>\n<li>/gim, '</li><li>')
        .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}
