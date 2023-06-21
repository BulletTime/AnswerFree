ext_status = {};
ext_status['filename'] = '';
ext_status['enable'] = '';
ext_status['mode'] = '';



//从background获得状态数据
chrome.runtime.sendMessage({ message: 'getStatus' }, function(response) {
  // 在回调函数中处理从 background.js 接收到的数据
  if (response && response.data) {
    // 将background的状态数据保存到content中的全局变量status
    ext_status = response.data;
    console.log(ext_status);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //popup将excel文件数据传到background
  if (request.action === "pass_json_to_background") {
    // 获取传递的变量
      ext_status['filename'] = request.data[0];
      // console.log(request.data);
  }
});



//监听下一题按钮，因为答题页面异步加载，页面第一次刷新后后延时3秒生效，等待页面渲染完成
setTimeout(function (){
  // 获取所有带有 data-v-597f8c40 属性的按钮
  var buttons = document.querySelectorAll('button[data-v-597f8c40]');

  // 检查是否存在第二个按钮
  if (buttons.length >= 2) {
    var secondButton = buttons[1];

    // 添加下一题按钮点击事件监听器
    secondButton.addEventListener('click', function() {
      //如果插件开关打卡，ext_status['enable']=true，则开始获取题目
      if (ext_status['enable']) {
        //添加延时，监听到按钮点击事件后，延时2秒等待新题目加载完成
        setTimeout(function (){
          //获取新题目文本
          getquestion();
        }, 2000);
      }
    });
  } else {
    console.log("未找到第二个按钮");
  }
}, 3000);




//监听popup的开始答题按钮，开始自动答题
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  //监听popup的开始答题按钮，开始自动答题
  if (request.action === 'srat_answer') {
    //如果插件开关打开，则自行答题
    if (ext_status['enable']) {
      setTimeout(function (){
        if (ext_status['filename']!="") {
          //调用getquestion函数，获取页面上的问题，并在getquestion中传给background
          console.log(ext_status);
          getquestion();
        }else{
          console.log(ext_status);
          alert('请先添加题库');
        }
      }, 1000);
    }
  }
});



// 监听background.js传来的查询结果
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  //接受从background.js传来的查询结果，以div展示答案，选择答案，并点击下一题按钮
  if (request.action === "pass_result_to_content") {
    var processedResult = request.data;

    //先尝试获取页面中有无答案div
    var answer = document.getElementById("answer");
    
    if (answer) {
      //如果有，就以新的答案进行替换
      answer.textContent=processedResult;
    }else{
      //如果没有，就新建答案div，并添加到页面body顶部
      var newanswer = document.createElement("div");
      newanswer.id = 'answer';
      newanswer.textContent = processedResult;
      newanswer.style.cssText = 'font-size: 30px;text-align: center;';
      document.body.prepend(newanswer);
    }

    //如果搜索到答案
    if (processedResult!= "未找到") {
      //调用答案选择函数
      selectAnswer(processedResult);
      console.log(ext_status);
      //如果插件模式为自动，ext_status['mode']=true，自动点击下一题
      if (ext_status['mode']) {
        //延时1秒后点击下一题，给点反应时间
        setTimeout(function (){
          //点击下一题按钮
          next();
        }, 1000);
      }
    }
  }
});

//获取问题文本函数，并传递给background
function getquestion(){
    // 获取页面上包含问题字段的p元素
    var element =  document.querySelector('p[data-v-597f8c40]');
    if (element) {
      //如果获取成功，取元素的子节点
      var childNodes = element.childNodes;
      var keyword = '';

      //因为p元素里有序号等其他内容
      // 迭代子节点，只取p元素中的文本内容
      for (var i = 0; i < childNodes.length; i++) {
        var node = childNodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
          keyword = node.textContent;
        }
      }
    }
    if (keyword=="") {
      console.log("未找到题目");
    }else{
      console.log(keyword);
    }
    

    // 将获得的问题文本发送消息给 background.js进行搜索处理
    chrome.runtime.sendMessage({ action: "pass_page_keyword", data: keyword });
}

function selectAnswer(answers){
  answers = answers.split('');
  var element =  document.querySelectorAll('li[data-v-597f8c40]');
  for (var i = 0; i < answers.length; i++) {
    switch (answers[i]){
      case 'A':
        answer = 0;
        break;
      case 'B':
        answer = 1;
        break;
      case 'C':
        answer = 2;
        break;
      case 'D':
        answer = 3;
        break;
      case 'E':
        answer = 4;
        break;
      case 'F':
        answer = 5;
        break;
      case 'G':
        answer = 6;
        break;
      case '对':
        answer = 0;
        break;
      case '错':
        answer = 1;
        break;
      default:
        break;
    }
    element[answer].click();
  }
}

//点击下一题按钮
function next() {
  //获取下一题按钮
  nextbutton = document.querySelectorAll('button[data-v-597f8c40]')[1];
  //如果按钮文字为“下一题”,或者最后一题的“提交”，则可点击答题
  if (nextbutton.textContent == "下一题" || "提交") {   
    nextbutton.click();
  }
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
  //接收popup传来的题库名变更信息
  if (request.message === 'fileChanged') {
    ext_status['filename'] = request.filename;
    console.log(ext_status['filename']);
  }
});
