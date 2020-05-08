const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

//定义类(通过mongoose操作mongodb数据库)
class Db {
    //这里放属性及方法

    //构造器
    constructor(hosts, ports, dbname) {
        mongoose.connect(`mongodb://${hosts}:${ports}/${dbname}`, { useNewUrlParser: true ,useUnifiedTopology: true });
        this.curModelObj = '';
        this.models = {};
        this.tablConf = JSON.parse(fs.readFileSync(path.resolve(__dirname, './tables.json')));
    }

    //定义Schema及创建model对象
    schemas(tablename) {

        let modelObj = this.models[tablename];
        if (!modelObj) { // 如果当前model模型没创建
            //定义Schema的作用：设计表结构、约束表中数据
            let schemas = new mongoose.Schema(this.tablConf[tablename]);

            //根据Schema创建model模型
            modelObj = mongoose.model(tablename, schemas);
            this.models[tablename] = modelObj;
        }
        return modelObj;
    }

    //查询数据
    //tname:表名
    //cond:查询条件
    //fields:要显示的字段
    //sortlimit: limit/skip/sort
    //callback:回调函数
    find(tname, cond, fields, sortlimit, callback) {
        this.curModelObj = this.schemas(tname);
        // curModelObj.find("查询条件",{要显示的字段},{limit/sort/skip},(err,data)=>{});
        this.curModelObj.find(cond, fields, sortlimit, (err, data) => {
            callback(data);
        });
    }
    //连表查询数据
    findJoin(tname1,tname2,lfield,ffield,callback){
        this.curModelObj = this.schemas(tname1);
        this.curModelObj.aggregate([{$lookup:{from:tname2,localField:lfield,foreignField:ffield,as:"children"}}],(err,data)=>{
            callback(data)
        })
    }
    //查询记录个数
    findcount(tname, cond, callback) {
        this.curModelObj = this.schemas(tname);
        this.curModelObj.countDocuments(cond, (err, num) => {
            callback(num);
        });
    }

    //修改数据
    //tname:表名
    //cond:条件
    //fields:要修改的值
    //callback:回调函数
    update(tname, cond, fields, callback) {
        this.curModelObj = this.schemas(tname);
        this.curModelObj.updateOne(cond, fields, { multi: true }, (err) => {
            callback(err);
        });
    }

    //根据Schema创建model模型
    //添加数据
    //tname:表名
    //fields:要写入集合中的数据
    //callback:回调函数
    insert(tname, fields, callback) {
        this.curModelObj = this.schemas(tname);
        this.curModelObj.create(fields, (err) => {
            callback(err);
        });
    }

    insertOne(tname, fields, callback) {
        this.curModelObj = this.schemas(tname);
        this.curModelObj.create(fields, (err) => {
            callback(err);
        });
    }
    //删除数据
    delete(tname,cond,callback) {
        this.curModelObj = this.schemas(tname);
        this.curModelObj.deleteOne(cond, (err) => {
            callback(err);
        });
    }
}
module.exports = new Db('localhost', '27017', 'MS');