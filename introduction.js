// 全局音效合成器
let synth;

// 初始化音频上下文
function initAudio() {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start().then(() => {
             synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4, attackCurve: 'exponential' }
            }).toDestination();
            window.synth = synth; // 挂载到 window 以便 archery.js 访问
        });
    }
}

// 获取目的地介绍
async function fetchIntroduction(destinationName, contentEl, loaderEl) {
    loaderEl.style.display = 'flex';
    contentEl.innerHTML = '';

    const prompt = `请为我详细介绍一下中国的旅行目的地：${destinationName}。请用热情、引人入胜的语气，重点介绍当地最值得体验的3-5个好玩的地方和3-5个特色美食。请用Markdown格式化你的回答，使用标题、列表等让内容更清晰。`;

    try {
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const apiKey = ""; // 如果需要，请在此处提供您的API密钥
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
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
           contentEl.innerHTML = `<p>抱歉，暂时无法获取关于“${destinationName}”的详细信息。可能是网络问题或这是一个非常独特的地方。</p>`;
        }
    } catch (error) {
        console.error('获取目的地详情失败:', error);
        contentEl.innerHTML = `<p>哎呀，探索“${destinationName}”的旅途中遇到了一点小波折。请检查网络连接或稍后再试。</p>`;
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
