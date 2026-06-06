function operator(proxies) {
    // 遍历每个节点
    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        const subName = proxy._subDisplayName || proxy._subName;
        
        // 如果成功获取到了订阅名称，就把它追加到节点名前
        if (subName) {
            proxy.name = `【${subName}】${proxy.name}`;
        }
    }
    return proxies;
}
