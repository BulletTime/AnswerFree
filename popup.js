var handler = {};
filename = '';
ext_status = {};
ext_status['filename'] = '';
ext_status['enable'] = '';
ext_status['mode'] = '';


//获取插件popup元素
var enableSwitch = document.getElementById('enableSwitch');
var enableLabel = document.querySelector('label[for="enableSwitch"]');
var startButton = document.getElementById('start');
var modeSwitch = document.getElementById('modeSwitch');
var modeLabel = document.querySelector('label[for="modeSwitch"]');

var fileName = document.getElementById("filename");

//从background获得状态数据
chrome.runtime.sendMessage({ message: 'getStatus' }, function(response) {
  // console.log(response.data);
  // 在回调函数中处理从 background.js 接收到的数据
  if (response && response.data) {
    // 将background的状态数据保存到content中的全局变量status
    ext_status = response.data;


    //设置插件开关复选框初始状态
    enableSwitch.checked = ext_status['enable'];
    enableLabel.textContent = enableSwitch.checked ? '插件开启' : '插件关闭';

    //设置插件模式复选框初始状态
    modeSwitch.checked = ext_status['mode'];
    modeLabel.textContent = modeSwitch.checked ? '自动' : '步进';

    //设置开始按钮初始状态，跟随开关启用或禁用
    startButton.disabled = enableSwitch.checked ? false : true;

    //设置题库名初始状态
    setfilename();
  }
});

//设置题库名
function setfilename() {
    fileNametext = '当前题库：';
    fileNametext += (ext_status['filename']=="") ? "无" : ext_status['filename'];
    fileName.textContent = fileNametext; 
}


//监听选择题库文件按钮点击事件
//fileInput控件在popup.html页面被隐藏，由chooseFileButton按钮间接触发
document.getElementById("chooseFileButton").onclick=function() {
  document.getElementById("fileInput").click();
};

//获取fileInput文件数据
document.getElementById("fileInput").addEventListener("change", function (e) {
  var files = e.target.files;
  if (files.length == 0) return;
  var f = files[0];
  if (!/\.xlsx$/g.test(f.name)) {
    alert("仅支持读取xlsx格式！");
    return;
  }

  //把题库文件名保存到popup全局变量上
  ext_status['filename'] = f.name;
  //更新popup题库名
  setfilename();

  //向content发送题库文件名
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { message: 'fileChanged', filename: ext_status['filename'] });
  });

  //给handler处理文件数据
  handler.readWorkbookFromLocalFile(f, function (workbook) {
    handler.readWorkbook(workbook);
  });
});

handler = {
  //读取文件
  readWorkbookFromLocalFile(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var data = e.target.result;
      var workbook = XLSX.read(data, { type: "binary" });
      if (callback) callback(workbook);
    };
    reader.readAsBinaryString(file);
  },

  //获取Excel数据表
  readWorkbook(workbook) {
    var sheetNames = workbook.SheetNames; // 工作表名称集合
    var worksheet = workbook.Sheets[sheetNames[0]]; // 这里我们只读取第一张sheet
    const jsonData = XLSX.utils.sheet_to_json(worksheet);//将表转换为json

    //将题库文件名和json化的数据表一起打包
    var fileData =  new Array();
    fileData.push(ext_status['filename']);
    fileData.push(jsonData);


    //把数据包传给background
    chrome.runtime.sendMessage({ action: "pass_json_to_background", data: fileData });
  }
};

//为“开始按钮”添加点击事件监听
document.getElementById('start').addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'srat_answer' });
  });
});




// 监听插件开关复选框状态的变化
enableSwitch.addEventListener('change', function() {
  var isChecked = enableSwitch.checked;
  //开始按钮跟随开关启用或禁用
  startButton.disabled = isChecked ? false : true;
  // 根据复选框状态更新标签文字
  enableLabel.textContent = isChecked ? '插件开启' : '插件关闭';
  //向background发送改变消息
  chrome.runtime.sendMessage({ message: 'enableSwitchChanged', enable: isChecked });
  //向content发送改变消息
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { message: 'enableSwitchChanged', enable: isChecked });
  });
});


// 监听插件模式复选框状态的变化
modeSwitch.addEventListener('change', function() {
  var isChecked = modeSwitch.checked;
  // 根据复选框状态更新标签文字
  modeLabel.textContent = isChecked ? '自动' : '步进';
  //向background发送改变消息
  chrome.runtime.sendMessage({ message: 'modeSwitchChanged', mode: isChecked });
  //向content发送改变消息
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { message: 'modeSwitchChanged', mode: isChecked });
  });
});