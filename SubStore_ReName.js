// ==================== SubStore_ReName.js ====================
// Raw 链接: https://raw.githubusercontent.com/sssuzimin/personal_plugins/refs/heads/main/SubStore_ReName.js
// 默认链接: https://raw.githubusercontent.com/sssuzimin/personal_plugins/refs/heads/main/SubStore_ReName.js#prefix=deafult&bl
// 功能说明:
//   1. 完整保留 rename.js 的所有节点处理能力（国家地区识别、国旗、倍率保留、关键词替换、序号、过滤等）
//   2. 在此之上，自动为每个节点添加“订阅名称”前缀（默认样式为【订阅名称】）
//   3. 执行顺序：先执行 rename.js 全部逻辑，最后添加前缀，确保前缀始终在最前面。
//   4. 如果不传任何参数，默认行为 = rename.js 原始逻辑 + 【订阅名称】前缀。
//
// ==================== 智能前缀参数 ====================
// 参数名: prefix
// 作用:  控制添加到节点名最前面的前缀格式。
// 取值及效果（假设订阅名称 = "我的机场"）:
//   - 不传或留空 → 【我的机场】
//   - []        → [我的机场]
//   - 【】       → 【我的机场】
//   - ()        → (我的机场)
//   - {}        → {我的机场}
//   - 「」       → 「我的机场」
//   - 『』       → 『我的机场』
//   - %s：      → 我的机场：
//   - 【%s】⭐️  → 【我的机场】⭐️
//   - ★         → ★我的机场
//   - =固定文字  → 固定文字（完全忽略订阅名称），例如 =A  → A
//   - 其他任意字符串 → 该字符串直接拼接订阅名称，例如 "前缀" → 前缀我的机场
//
// 参数名: disable_prefix
// 作用:  完全禁用智能前缀功能，只执行 rename.js 的处理。
// 取值:  true 或 false（默认 false）
// 示例:  #disable_prefix=true
//
// ==================== rename.js 全部原生参数 ====================
// 以下参数保持 rename.js 原有的完整功能，参数名及含义与原脚本完全一致：
//
//  in      : 输入地区名称类型，可选值: zh/cn（中文）, en/us（英文缩写）, quan（英文全称）, gq/flag（国旗）
//  out     : 输出地区名称类型，同上。默认输出中文。
//  ign     : 忽略大小写，设为 1 开启
//  reg     : 启用正则替换，设为 1 开启
//  rep     : 替换次数，如 rep=1 只替换第一个匹配项
//  url     : 仅处理名称中包含该关键词的节点
//  nf      : 将 name= 指定的前缀放在节点名最前面（默认智能前缀已强制最前，此参数保留兼容）
//  name    : 给节点添加固定的机场名称前缀（rename.js 原生功能）
//  flag    : 为节点添加国旗（不加任何参数值）
//  bl      : 保留倍率标识（如 2×、3×）
//  blgd    : 保留家宽、IPLC、ˣ² 等固定标识
//  blpx    : 对保留的标识进行排序分组
//  blnx    : 只保留高倍率节点
//  one     : 清理只有一个节点的地区的序号（如 01）
//  clear   : 清理乱名（套餐、过期等关键词）
//  nm      : 保留没有匹配到地区的节点
//  key     : 特殊关键词过滤
//  blkey   : 保留或替换自定义关键词，格式: 关键词1+关键词2>新名字+关键词3
//  blockquic: 设置 QUIC 阻止，值 on 或 off
//  fgf     : 节点名前缀或国旗后的分隔符，默认为空格
//  sn      : 国家与序号之间的分隔符，默认为空格
//
// ==================== 使用示例 ====================
// 1. 仅使用默认行为（rename 原样处理 + 【订阅名称】前缀）:
//    https://raw.githubusercontent.com/sssuzimin/personal_plugins/refs/heads/main/SubStore_ReName.js
//
// 2. 自定义前缀为方括号 + 添加国旗 + 保留倍率:
//    https://.../SubStore_ReName.js#prefix=[]&flag&bl
//
// 3. 自定义前缀为固定文字 "⭐ " + 将香港替换为 HK:
//    https://.../SubStore_ReName.js#prefix=⭐ &in=香港&out=HK
//
// 4. 只执行 rename，不加任何前缀:
//    https://.../SubStore_ReName.js#disable_prefix=true&in=香港&out=HK
//
// 5. 使用 rename.js 原生 name 参数添加前缀（与智能前缀叠加）:
//    https://.../SubStore_ReName.js#name=MyNode&flag
//    (最终节点名 = 【订阅名称】 + MyNode + 原节点名)
//
// ==================== 注意事项 ====================
// - 订阅名称取自 Sub-Store 中为该订阅设置的“显示名称”，若未设置则不会添加前缀。
// - 智能前缀总是添加在最终节点名的最前面，无论 rename.js 的 nf 参数如何设置。
// - 所有参数以 # 开头，多个参数用 & 连接，如 #prefix=[]&flag&bl
// =================================================

function operator(proxies) {
    // ---------- 读取参数 ----------
    const args = $arguments;
    const enablePrefix = args.disable_prefix !== 'true';   // 默认启用前缀
    const customPrefix = args.prefix;                      // 用户自定义前缀格式

    // ========== 第一步：执行 rename.js 的全部逻辑（原样） ==========
    // 注意：rename.js 内部会直接修改 proxies 并返回新的数组
    proxies = renameProcess(proxies);

    // ========== 第二步：添加智能前缀（如果启用） ==========
    if (enablePrefix) {
        const DEFAULT_PREFIX = '[${subName}]';
        for (let i = 0; i < proxies.length; i++) {
            const proxy = proxies[i];
            const subName = proxy._subDisplayName || proxy._subName;
            if (!subName) continue;

            let rawPrefix = customPrefix;
            let finalPrefix;

            // 情况1：没有 prefix 参数 或 参数为default
            if (rawPrefix === undefined || (rawPrefix && rawPrefix.trim() === 'default')) {
                finalPrefix = DEFAULT_PREFIX.replace(/\${subName}/g, subName);
            }
            // 情况2：覆盖模式 - 以 = 开头
            else if (rawPrefix.startsWith('=')) {
                finalPrefix = rawPrefix.slice(1);
            }
            // 情况3：括号对模式 或 其他
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
                else if (rawPrefix.includes('%s')) {
                    finalPrefix = rawPrefix.replace(/%s/g, subName);
                }
                else {
                    finalPrefix = rawPrefix + subName;
                }
            }

            // 添加前缀（始终放在最前面）
            proxy.name = finalPrefix + proxy.name;
        }
    }

    return proxies;

    // ==================== 以下为 rename.js 完整代码（原样） ====================
    function renameProcess(pro) {
        // 原 rename.js 完整内容（用户提供，一字不改）
        const inArg = $arguments; // console.log(inArg)
        const nx = inArg.nx || false,
          bl = inArg.bl || false,
          nf = inArg.nf || false,
          key = inArg.key || false,
          blgd = inArg.blgd || false,
          blpx = inArg.blpx || false,
          blnx = inArg.blnx || false,
          numone = inArg.one || false,
          debug = inArg.debug || false,
          clear = inArg.clear || false,
          addflag = inArg.flag || false,
          nm = inArg.nm || false;

        const FGF = inArg.fgf == undefined ? " " : decodeURI(inArg.fgf),
          XHFGF = inArg.sn == undefined ? " " : decodeURI(inArg.sn),
          FNAME = inArg.name == undefined ? "" : decodeURI(inArg.name),
          BLKEY = inArg.blkey == undefined ? "" : decodeURI(inArg.blkey),
          blockquic = inArg.blockquic == undefined ? "" : decodeURI(inArg.blockquic),
          nameMap = {
            cn: "cn",
            zh: "cn",
            us: "us",
            en: "us",
            quan: "quan",
            gq: "gq",
            flag: "gq",
          },
          inname = nameMap[inArg.in] || "",
          outputName = nameMap[inArg.out] || "";
        // prettier-ignore
        const FG = ['🇭🇰','🇲🇴','🇹🇼','🇯🇵','🇰🇷','🇸🇬','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇦🇺','🇦🇪','🇦🇫','🇦🇱','🇩🇿','🇦🇴','🇦🇷','🇦🇲','🇦🇹','🇦🇿','🇧🇭','🇧🇩','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇻🇬','🇧🇳','🇧🇬','🇧🇫','🇧🇮','🇰🇭','🇨🇲','🇨🇦','🇨🇻','🇰🇾','🇨🇫','🇹🇩','🇨🇱','🇨🇴','🇰🇲','🇨🇬','🇨🇩','🇨🇷','🇭🇷','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇬🇶','🇪🇷','🇪🇪','🇪🇹','🇫🇯','🇫🇮','🇬🇦','🇬🇲','🇬🇪','🇬🇭','🇬🇷','🇬🇱','🇬🇹','🇬🇳','🇬🇾','🇭🇹','🇭🇳','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇲','🇮🇱','🇮🇹','🇨🇮','🇯🇲','🇯🇴','🇰🇿','🇰🇪','🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇸','🇱🇷','🇱🇾','🇱🇹','🇱🇺','🇲🇰','🇲🇬','🇲🇼','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇷','🇲🇺','🇲🇽','🇲🇩','🇲🇨','🇲🇳','🇲🇪','🇲🇦','🇲🇿','🇲🇲','🇳🇦','🇳🇵','🇳🇱','🇳🇿','🇳🇮','🇳🇪','🇳🇬','🇰🇵','🇳🇴','🇴🇲','🇵🇰','🇵🇦','🇵🇾','🇵🇪','🇵🇭','🇵🇹','🇵🇷','🇶🇦','🇷🇴','🇷🇺','🇷🇼','🇸🇲','🇸🇦','🇸🇳','🇷🇸','🇸🇱','🇸🇰','🇸🇮','🇸🇴','🇿🇦','🇪🇸','🇱🇰','🇸🇩','🇸🇷','🇸🇿','🇸🇪','🇨🇭','🇸🇾','🇹🇯','🇹🇿','🇹🇭','🇹🇬','🇹🇴','🇹🇹','🇹🇳','🇹🇷','🇹🇲','🇻🇮','🇺🇬','🇺🇦','🇺🇾','🇺🇿','🇻🇪','🇻🇳','🇾🇪','🇿🇲','🇿🇼','🇦🇩','🇷🇪','🇵🇱','🇬🇺','🇻🇦','🇱🇮','🇨🇼','🇸🇨','🇦🇶','🇬🇮','🇨🇺','🇫🇴','🇦🇽','🇧🇲','🇹🇱'];
        // prettier-ignore
        const EN = ['HK','MO','TW','JP','KR','SG','US','GB','FR','DE','AU','AE','AF','AL','DZ','AO','AR','AM','AT','AZ','BH','BD','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','VG','BN','BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CO','KM','CG','CD','CR','HR','CY','CZ','DK','DJ','DO','EC','EG','SV','GQ','ER','EE','ET','FJ','FI','GA','GM','GE','GH','GR','GL','GT','GN','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','CI','JM','JO','KZ','KE','KW','KG','LA','LV','LB','LS','LR','LY','LT','LU','MK','MG','MW','MY','MV','ML','MT','MR','MU','MX','MD','MC','MN','ME','MA','MZ','MM','NA','NP','NL','NZ','NI','NE','NG','KP','NO','OM','PK','PA','PY','PE','PH','PT','PR','QA','RO','RU','RW','SM','SA','SN','RS','SL','SK','SI','SO','ZA','ES','LK','SD','SR','SZ','SE','CH','SY','TJ','TZ','TH','TG','TO','TT','TN','TR','TM','VI','UG','UA','UY','UZ','VE','VN','YE','ZM','ZW','AD','RE','PL','GU','VA','LI','CW','SC','AQ','GI','CU','FO','AX','BM','TL'];
        // prettier-ignore
        const ZH = ['香港','澳门','台湾','日本','韩国','新加坡','美国','英国','法国','德国','澳大利亚','阿联酋','阿富汗','阿尔巴尼亚','阿尔及利亚','安哥拉','阿根廷','亚美尼亚','奥地利','阿塞拜疆','巴林','孟加拉国','白俄罗斯','比利时','伯利兹','贝宁','不丹','玻利维亚','波斯尼亚和黑塞哥维那','博茨瓦纳','巴西','英属维京群岛','文莱','保加利亚','布基纳法索','布隆迪','柬埔寨','喀麦隆','加拿大','佛得角','开曼群岛','中非共和国','乍得','智利','哥伦比亚','科摩罗','刚果(布)','刚果(金)','哥斯达黎加','克罗地亚','塞浦路斯','捷克','丹麦','吉布提','多米尼加共和国','厄瓜多尔','埃及','萨尔瓦多','赤道几内亚','厄立特里亚','爱沙尼亚','埃塞俄比亚','斐济','芬兰','加蓬','冈比亚','格鲁吉亚','加纳','希腊','格陵兰','危地马拉','几内亚','圭亚那','海地','洪都拉斯','匈牙利','冰岛','印度','印尼','伊朗','伊拉克','爱尔兰','马恩岛','以色列','意大利','科特迪瓦','牙买加','约旦','哈萨克斯坦','肯尼亚','科威特','吉尔吉斯斯坦','老挝','拉脱维亚','黎巴嫩','莱索托','利比里亚','利比亚','立陶宛','卢森堡','马其顿','马达加斯加','马拉维','马来','马尔代夫','马里','马耳他','毛利塔尼亚','毛里求斯','墨西哥','摩尔多瓦','摩纳哥','蒙古','黑山共和国','摩洛哥','莫桑比克','缅甸','纳米比亚','尼泊尔','荷兰','新西兰','尼加拉瓜','尼日尔','尼日利亚','朝鲜','挪威','阿曼','巴基斯坦','巴拿马','巴拉圭','秘鲁','菲律宾','葡萄牙','波多黎各','卡塔尔','罗马尼亚','俄罗斯','卢旺达','圣马力诺','沙特阿拉伯','塞内加尔','塞尔维亚','塞拉利昂','斯洛伐克','斯洛文尼亚','索马里','南非','西班牙','斯里兰卡','苏丹','苏里南','斯威士兰','瑞典','瑞士','叙利亚','塔吉克斯坦','坦桑尼亚','泰国','多哥','汤加','特立尼达和多巴哥','突尼斯','土耳其','土库曼斯坦','美属维尔京群岛','乌干达','乌克兰','乌拉圭','乌兹别克斯坦','委内瑞拉','越南','也门','赞比亚','津巴布韦','安道尔','留尼汪','波兰','关岛','梵蒂冈','列支敦士登','库拉索','塞舌尔','南极','直布罗陀','古巴','法罗群岛','奥兰群岛','百慕达','东帝汶'];
        // prettier-ignore
        const QC = ['Hong Kong','Macao','Taiwan','Japan','Korea','Singapore','United States','United Kingdom','France','Germany','Australia','Dubai','Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Austria','Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','British Virgin Islands','Brunei','Bulgaria','Burkina-faso','Burundi','Cambodia','Cameroon','Canada','CapeVerde','CaymanIslands','Central African Republic','Chad','Chile','Colombia','Comoros','Congo-Brazzaville','Congo-Kinshasa','CostaRica','Croatia','Cyprus','Czech Republic','Denmark','Djibouti','Dominican Republic','Ecuador','Egypt','EISalvador','Equatorial Guinea','Eritrea','Estonia','Ethiopia','Fiji','Finland','Gabon','Gambia','Georgia','Ghana','Greece','Greenland','Guatemala','Guinea','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Isle of Man','Israel','Italy','Ivory Coast','Jamaica','Jordan','Kazakstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Lithuania','Luxembourg','Macedonia','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar(Burma)','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','NorthKorea','Norway','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Portugal','PuertoRico','Qatar','Romania','Russia','Rwanda','SanMarino','SaudiArabia','Senegal','Serbia','SierraLeone','Slovakia','Slovenia','Somalia','SouthAfrica','Spain','SriLanka','Sudan','Suriname','Swaziland','Sweden','Switzerland','Syria','Tajikstan','Tanzania','Thailand','Togo','Tonga','TrinidadandTobago','Tunisia','Turkey','Turkmenistan','U.S.Virgin Islands','Uganda','Ukraine','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe','Andorra','Reunion','Poland','Guam','Vatican','Liechtensteins','Curacao','Seychelles','Antarctica','Gibraltar','Cuba','Faroe Islands','Ahvenanmaa','Bermuda','Timor-Leste'];
        const specialRegex = [
          /(\d\.)?\d+×/,
          /IPLC|IEPL|Kern|Edge|Pro|Std|Exp|Biz|Fam|Game|Buy|Zx|LB|Game/,
        ];
        const nameclear =
          /(套餐|到期|有效|剩余|版本|已用|过期|失联|测试|官方|网址|备用|群|TEST|客服|网站|获取|订阅|流量|机场|下次|官址|联系|邮箱|工单|学术|USE|USED|TOTAL|EXPIRE|EMAIL)/i;
        // prettier-ignore
        const regexArray=[/ˣ²/, /ˣ³/, /ˣ⁴/, /ˣ⁵/, /ˣ⁶/, /ˣ⁷/, /ˣ⁸/, /ˣ⁹/, /ˣ¹⁰/, /ˣ²⁰/, /ˣ³⁰/, /ˣ⁴⁰/, /ˣ⁵⁰/, /IPLC/i, /IEPL/i, /核心/, /边缘/, /高级/, /标准/, /实验/, /商宽/, /家宽/, /游戏|game/i, /购物/, /专线/, /LB/, /cloudflare/i, /\budp\b/i, /\bgpt\b/i,/udpn\b/];
        // prettier-ignore
        const valueArray= [ "2×","3×","4×","5×","6×","7×","8×","9×","10×","20×","30×","40×","50×","IPLC","IEPL","Kern","Edge","Pro","Std","Exp","Biz","Fam","Game","Buy","Zx","LB","CF","UDP","GPT","UDPN"];
        const nameblnx = /(高倍|(?!1)2+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
        const namenx = /(高倍|(?!1)(0\.|\d)+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
        const keya =
          /港|Hong|HK|新加坡|SG|Singapore|日本|Japan|JP|美国|United States|US|韩|土耳其|TR|Turkey|Korea|KR|🇸🇬|🇭🇰|🇯🇵|🇺🇸|🇰🇷|🇹🇷/i;
        const keyb =
          /(((1|2|3|4)\d)|(香港|Hong|HK) 0[5-9]|((新加坡|SG|Singapore|日本|Japan|JP|美国|United States|US|韩|土耳其|TR|Turkey|Korea|KR) 0[3-9]))/i;
        const rurekey = {
          GB: /UK/g,
          "B-G-P": /BGP/g,
          "Russia Moscow": /Moscow/g,
          "Korea Chuncheon": /Chuncheon|Seoul/g,
          "Hong Kong": /Hongkong|HONG KONG/gi,
          "United Kingdom London": /London|Great Britain/g,
          "Dubai United Arab Emirates": /United Arab Emirates/g,
          "Taiwan TW 台湾 🇹🇼": /(台|Tai\s?wan|TW).*?🇨🇳|🇨🇳.*?(台|Tai\s?wan|TW)/g,
          "United States": /USA|Los Angeles|San Jose|Silicon Valley|Michigan/g,
          澳大利亚: /澳洲|墨尔本|悉尼|土澳|(深|沪|呼|京|广|杭)澳/g,
          德国: /(深|沪|呼|京|广|杭)德(?!.*(I|线))|法兰克福|滬德/g,
          香港: /(深|沪|呼|京|广|杭)港(?!.*(I|线))/g,
          日本: /(深|沪|呼|京|广|杭|中|辽)日(?!.*(I|线))|东京|大坂/g,
          新加坡: /狮城|(深|沪|呼|京|广|杭)新/g,
          美国: /(深|沪|呼|京|广|杭)美|波特兰|芝加哥|哥伦布|纽约|硅谷|俄勒冈|西雅图|芝加哥/g,
          波斯尼亚和黑塞哥维那: /波黑共和国/g,
          印尼: /印度尼西亚|雅加达/g,
          印度: /孟买/g,
          阿联酋: /迪拜|阿拉伯联合酋长国/g,
          孟加拉国: /孟加拉/g,
          捷克: /捷克共和国/g,
          台湾: /新台|新北|台(?!.*线)/g,
          Taiwan: /Taipei/g,
          韩国: /春川|韩|首尔/g,
          Japan: /Tokyo|Osaka/g,
          英国: /伦敦/g,
          India: /Mumbai/g,
          Germany: /Frankfurt/g,
          Switzerland: /Zurich/g,
          俄罗斯: /莫斯科/g,
          土耳其: /伊斯坦布尔/g,
          泰国: /泰國|曼谷/g,
          法国: /巴黎/g,
          G: /\d\s?GB/gi,
          Esnc: /esnc/gi,
        };

        let GetK = false, AMK = []
        function ObjKA(i) {
          GetK = true
          AMK = Object.entries(i)
        }

        const Allmap = {};
        const outList = getList(outputName);
        let inputList,
          retainKey = "";
        if (inname !== "") {
          inputList = [getList(inname)];
        } else {
          inputList = [ZH, FG, QC, EN];
        }

        inputList.forEach((arr) => {
          arr.forEach((value, valueIndex) => {
            Allmap[value] = outList[valueIndex];
          });
        });

        if (clear || nx || blnx || key) {
          pro = pro.filter((res) => {
            const resname = res.name;
            const shouldKeep =
              !(clear && nameclear.test(resname)) &&
              !(nx && namenx.test(resname)) &&
              !(blnx && !nameblnx.test(resname)) &&
              !(key && !(keya.test(resname) && /2|4|6|7/i.test(resname)));
            return shouldKeep;
          });
        }

        const BLKEYS = BLKEY ? BLKEY.split("+") : "";

        pro.forEach((e) => {
          let bktf = false, ens = e.name
          Object.keys(rurekey).forEach((ikey) => {
            if (rurekey[ikey].test(e.name)) {
              e.name = e.name.replace(rurekey[ikey], ikey);
              if (BLKEY) {
                bktf = true
                let BLKEY_REPLACE = "",
                re = false;
                BLKEYS.forEach((i) => {
                  if (i.includes(">") && ens.includes(i.split(">")[0])) {
                    if (rurekey[ikey].test(i.split(">")[0])) {
                      e.name += " " + i.split(">")[0]
                    }
                    if (i.split(">")[1]) {
                      BLKEY_REPLACE = i.split(">")[1];
                      re = true;
                    }
                  } else {
                    if (ens.includes(i)) {
                      e.name += " " + i
                    }
                  }
                  retainKey = re
                    ? BLKEY_REPLACE
                    : BLKEYS.filter((items) => e.name.includes(items));
                });
              }
            }
          });
          if (blockquic == "on") {
            e["block-quic"] = "on";
          } else if (blockquic == "off") {
            e["block-quic"] = "off";
          } else {
            delete e["block-quic"];
          }

          if (!bktf && BLKEY) {
            let BLKEY_REPLACE = "",
              re = false;
            BLKEYS.forEach((i) => {
              if (i.includes(">") && e.name.includes(i.split(">")[0])) {
                if (i.split(">")[1]) {
                  BLKEY_REPLACE = i.split(">")[1];
                  re = true;
                }
              }
            });
            retainKey = re
              ? BLKEY_REPLACE
              : BLKEYS.filter((items) => e.name.includes(items));
          }

          let ikey = "",
            ikeys = "";
          if (blgd) {
            regexArray.forEach((regex, index) => {
              if (regex.test(e.name)) {
                ikeys = valueArray[index];
              }
            });
          }

          if (bl) {
            const match = e.name.match(
              /((倍率|X|x|×)\D?((\d{1,3}\.)?\d+)\D?)|((\d{1,3}\.)?\d+)(倍|X|x|×)/
            );
            if (match) {
              const rev = match[0].match(/(\d[\d.]*)/)[0];
              if (rev !== "1") {
                const newValue = rev + "×";
                ikey = newValue;
              }
            }
          }

          !GetK && ObjKA(Allmap)
          const findKey = AMK.find(([key]) =>
            e.name.includes(key)
          )
          
          let firstName = "",
            nNames = "";

          if (nf) {
            firstName = FNAME;
          } else {
            nNames = FNAME;
          }
          if (findKey?.[1]) {
            const findKeyValue = findKey[1];
            let keyover = [],
              usflag = "";
            if (addflag) {
              const index = outList.indexOf(findKeyValue);
              if (index !== -1) {
                usflag = FG[index];
                usflag = usflag === "🇹🇼" ? "🇨🇳" : usflag;
              }
            }
            keyover = keyover
              .concat(firstName, usflag, nNames, findKeyValue, retainKey, ikey, ikeys)
              .filter((k) => k !== "");
            e.name = keyover.join(FGF);
          } else {
            if (nm) {
              e.name = FNAME + FGF + e.name;
            } else {
              e.name = null;
            }
          }
        });
        pro = pro.filter((e) => e.name !== null);
        jxh(pro);
        numone && oneP(pro);
        blpx && (pro = fampx(pro));
        key && (pro = pro.filter((e) => !keyb.test(e.name)));
        return pro;

        // 辅助函数
        // prettier-ignore
        function getList(arg) { switch (arg) { case 'us': return EN; case 'gq': return FG; case 'quan': return QC; default: return ZH; } }
        // prettier-ignore
        function jxh(e) { const n = e.reduce((e, n) => { const t = e.find((e) => e.name === n.name); if (t) { t.count++; t.items.push({ ...n, name: `${n.name}${XHFGF}${t.count.toString().padStart(2, "0")}`, }); } else { e.push({ name: n.name, count: 1, items: [{ ...n, name: `${n.name}${XHFGF}01` }], }); } return e; }, []);const t=(typeof Array.prototype.flatMap==='function'?n.flatMap((e) => e.items):n.reduce((acc, e) => acc.concat(e.items),[])); e.splice(0, e.length, ...t); return e;}
        // prettier-ignore
        function oneP(e) { const t = e.reduce((e, t) => { const n = t.name.replace(/[^A-Za-z0-9\u00C0-\u017F\u4E00-\u9FFF]+\d+$/, ""); if (!e[n]) { e[n] = []; } e[n].push(t); return e; }, {}); for (const e in t) { if (t[e].length === 1 && t[e][0].name.endsWith("01")) { t[e][0].name= t[e][0].name.replace(/[^.]01/, "") } } return e; }
        // prettier-ignore
        function fampx(pro) { const wis = []; const wnout = []; for (const proxy of pro) { const fan = specialRegex.some((regex) => regex.test(proxy.name)); if (fan) { wis.push(proxy); } else { wnout.push(proxy); } } const sps = wis.map((proxy) => specialRegex.findIndex((regex) => regex.test(proxy.name)) ); wis.sort( (a, b) => sps[wis.indexOf(a)] - sps[wis.indexOf(b)] || a.name.localeCompare(b.name) ); wnout.sort((a, b) => pro.indexOf(a) - pro.indexOf(b)); return wnout.concat(wis);}
    }
}
