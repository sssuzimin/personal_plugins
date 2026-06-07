// 智能前缀脚本 - 支持覆盖模式
// 导入url:https://raw.githubusercontent.com/sssuzimin/personal_plugins/refs/heads/main/SubStore_addSubName.js#prefix=
// 参数名：prefix
// 规则示例（假设订阅名称为“我的机场”）：
// 1. 不填或留空 → 默认 【我的机场】
// 2. 填括号对（如 []、【】、()、{}、「」、『』） → 括号包裹订阅名称，例如：填 [] → [我的机场]
// 3. 填包含 %s 的字符串 → %s 会被替换为订阅名称，例如：填 %s： → 我的机场：
// 4. 填以 = 开头的字符串（如 =suzimin） → 等号后面的内容直接作为固定前缀（忽略订阅名称），例如：填 =suzimin → suzimin
// 5. 其他任意字符串 → 直接拼接在订阅名称前面，例如：填 ★ → ★我的机场

function operator(proxies) {
    const DEFAULT_PREFIX = '【${subName}】';
    
    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        const subName = proxy._subDisplayName || proxy._subName;
        if (!subName) continue;

        let rawPrefix = $arguments.prefix;
        let finalPrefix;

        // 情况1：没有 prefix 参数 或 参数为空
        if (rawPrefix === undefined || rawPrefix === '') {
            finalPrefix = DEFAULT_PREFIX.replace(/\${subName}/g, subName);
        } 
        // 情况2：覆盖模式 - 以 = 开头
        else if (rawPrefix.startsWith('=')) {
            finalPrefix = rawPrefix.slice(1);  // 去掉开头的 =，后面全部作为固定前缀
        }
        // 情况3：括号对模式
        else {
            const bracketPairs = {
                '[]': '[]', '【】': '【】', '()': '()', '{}': '{}', 
                '「」': '「」', '『』': '『』'
            };
            let isBracketPair = false;
            let leftBracket = '', rightBracket = '';
            for (const pair of Object.values(bracketPairs)) {
                if (rawPrefix === pair) {
                    leftBracket = pair[0];
                    rightBracket = pair[1];
                    isBracketPair = true;
                    break;
                }
            }
            
            if (isBracketPair) {
                finalPrefix = leftBracket + subName + rightBracket;
            }
            // 情况4：包含 %s 的替换模式
            else if (rawPrefix.includes('%s')) {
                finalPrefix = rawPrefix.replace(/%s/g, subName);
            }
            // 情况5：其他字符串 → 直接拼接
            else {
                finalPrefix = rawPrefix + subName;
            }
        }
        
        proxy.name = finalPrefix + proxy.name;
    }
    return proxies;
}
