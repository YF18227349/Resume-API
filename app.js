const express = require('express');
const path = require('path');
const bodyParser = require('body-parser'); // 中间件(接收以post方式提交的参数))
const app = express();
const cookieSession = require('cookie-session'); //中间件(操作session)
//使用中间件[接收post方式提交过来的参数]
// 表单编码格式
app.use(bodyParser.urlencoded({ extended: false }));
// 解析成json格式
app.use(bodyParser.json());
//中间件(操作session)
app.use(cookieSession({
    name: 'cursessions',
    keys: ['123!@#', 'ab#@!cd12']
}));
//设置模板引擎
app.set('view engine', 'ejs');
//设置模板存放路径
app.set('views', [path.resolve(__dirname, './views')]);
//告诉express html以ejs模板引擎去渲染
app.engine('html', require('ejs').__express);
//开放静态资源
app.use(express.static(path.resolve(__dirname, './static')));
app.use('/upload', express.static(path.resolve(__dirname, './upload')));
//使用路由
const apiRouter = require('./router/api');
app.use('/api',apiRouter);
//定义端口
app.listen(3000,function(){
    console.log('服务器已经启动,通过http://127.0.0.1:3000来访问')
});