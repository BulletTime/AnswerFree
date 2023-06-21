ext_status = {};
ext_status['filename'] = '';
ext_status['enable'] = true;
ext_status['mode'] = true;


// 监听来自 popup.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //popup将excel文件数据传到background
  if (request.action === "pass_json_to_background") {
    // 获取传递的变量
      excel_json = request.data[1];
      ext_status['filename'] = request.data[0];
      // console.log(request.data);
      console.log(excel_json);
  }
});



//监听来自content的关键词，发起题库搜索
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //content从页面获得的关键词传到background，进行搜索
  if (request.action === "pass_page_keyword") {
    var searchTerm = request.data;
    var searchTerm = searchTerm.replace(/\s/g, "");//去掉关键词里的空格
    var searchTerm = replacePunctuationWithChinese(searchTerm);//替换关键词里的英文标点为中文标点
    console.log(searchTerm);
    

    //遍历题库搜索
    for (var i = 0; i < excel_json.length; i++) {
      var row = excel_json[i];

      // 检查第一列是否包含搜索关键词
      var question = row['题目'].toString();
      question = question.replace(/\s/g, "");//去题库条目里的空格
      question = replacePunctuationWithChinese(question);//替换题库条目里的英文标点为中文标点

      if (question.includes(searchTerm)) {
        // 如果匹配，将第二列的内容添加到结果中
        result = row['答案']; // 
        console.log(question);
        break; // 找到匹配项后，跳出循环
      } else {
        result = '未找到';
      }
    }

    // 将搜索结果发送回content.js
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "pass_result_to_content", data: result });
    });
  }
});


//英文标点转中文标点函数
function replacePunctuationWithChinese(text) {
  // 定义英文标点和对应的中文标点的映射关系
  var punctuationMap = {
    '.': '。',
    ',': '，',
    '?': '？',
    '!': '！',
    ';': '；',
    ':': '：',
    '(': '（',
    ')': '）',
    '[': '【',
    ']': '】',
    '{': '｛',
    '}': '｝',
    '<': '《',
    '>': '》',
    '"': '“',
    "'": '’',
    '`': '‘',
    '-': '—',
    '/': '／',
    '\\': '＼',
    '@': '＠',
    '#': '＃',
    '$': '＄',
    '%': '％',
    '&': '＆',
    '|': '｜',
    '~': '～',
    '^': '＾',
    '_': '＿',
    '+': '＋',
    '=': '＝',
    '*': '＊',
    '<': '＜',
    '>': '＞'
  };

  // 使用正则表达式替换字符串中的英文标点
  var result = text.replace(/[.,?!;:()\[\]{}<>"'`\-\/\\@#$%&|~^_+=*<>]/g, function(match) {
    return punctuationMap[match];
  });

  return result;
}




//与其他组件通信
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  //接收popup传来的插件开关变更信息
  if (request.message === 'enableSwitchChanged') {
    ext_status['enable'] = request.enable;
    console.log(ext_status['enable']);
  }
  //接收popup传来的插件模式变更信息
  if (request.message === 'modeSwitchChanged') {
    ext_status['mode'] = request.mode;
    console.log(ext_status['mode']);
  }
  // 将数据通过回调函数返回给 content.js，用于content获取保存在background的状态信息
  if (request.message === 'getStatus') {
    sendResponse({ data: ext_status });
  }
});