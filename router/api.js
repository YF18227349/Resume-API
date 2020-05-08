const express = require('express');
const router = express.Router();
const db = require('../db/mongoose-class.js');
const crypto = require('crypto'); //内置加密模块
const formidable = require('formidable'); //处理含有文件上传的表单
const multiparty = require("multiparty")
const uuidv1 = require('uuid/v1'); //产生唯一字符串
var time = require("time-stamp")
const path = require('path');
const fs = require('fs');
const table_user = 'adminusers'//管理员数据集合
const table_data = 'formdatas'//表格数据集合
const essays_data = 'essays'//文章数据集合

/*******************管理员相关接口-开始***********************/
//管理员登录
router.post("/login", (req, res) => {
    let post = req.query;
    let { password, username } = post;
    // 密码加密处理
    const secret = '123!@#$abcd'; //密钥
    password = crypto
        .createHmac("sha256", secret)
        .update(password)
        .digest("hex");
    db.find(table_user, { username }, (err, result) => {
        if (!result.length) {
            return res.json({ status: -1, info: '用户名不存在' })
        }
        if (password != result[0].password) {
            return res.json({ status: 0, info: '密码错误' })
        }
        req.session.username = username;
        req.session.id = result[0].id;
        return res.json({ status: 1, info: '登录成功', data: result[0] })
    });
});
//管理员列表
router.get("/userlist", (req, res) => {
    db.find(table_user, {}, {}, { limit: 10 }, result => {
        return res.json({ status: 1, info: '获取成功', data: result })
    });
});
//添加管理员
router.post("/useradd", (req, res) => {
    let username = req.query.username;
    let password = req.query.password;
    console.log(username,2)
    // 密码加密处理
    const secret = '123!@#$abcd'; //密钥
    password = crypto
        .createHmac("sha256", secret)
        .update(password)
        .digest("hex");

    db.find(table_user, { username }, {}, {}, result => {
        if (result.length) {
            return res.json({ status: -1, info: '用户已存在' })
        } else {
            db.insert(table_user, { username, password }, err => {
                if (!err) {
                    return res.json({ status: 1, info: '添加成功' })
                } else {
                    return res.json({ status: -1, info: '添加失败' })
                }
            });
        }
    });
});
//管理员信息获取-一条
router.get('/userinfo', (req, res) => {
    let id = req.query.id;
    if (id == undefined) {
        return res.json({ status: -1, info: '缺少参数' })
    }
    db.find(table_user, { '_id': id }, {}, { limit: 1 }, result => {
        return res.json({ status: 1, info: '获取成功', data: result[0] })
    });
});
//管理员修改
router.post("/useredit", (req, res) => {
    let _id = req.query.id;
    if (_id == undefined) {
        return res.json({ status: -1, info: '缺少参数' })
    }
    let userinfo = {
        username: req.query.username,
        password: req.query.password
    }
    if (userinfo.password) {
        // 密码加密处理
        const secret = '123!@#$abcd'; //密钥
        userinfo.password = crypto
            .createHmac("sha256", secret)
            .update(userinfo.password)
            .digest("hex");
    } else {
        delete userinfo.password;
    }
    db.update(table_user, { _id }, userinfo, err => {
        if (!err) {
            return res.json({ status: 1, info: '修改成功' })
        } else {
            return res.json({ status: -1, info: '修改失败' })
        }
    });
});
//管理员删除
router.post("/userdel", (req, res) => {
    let _id = req.query.id;
    if (_id == undefined) {
        return res.json({ status: -1, info: '缺少参数' })
    }
    db.delete(table_user, { _id }, err => {
        if (!err) {
            return res.json({ status: 1, info: '删除成功' })
        } else {
            return res.json({ status: -1, info: '删除失败' })
        }
    });
});
/*******************管理员相关接口-结束***********************/
/*******************表格相关接口-开始***********************/
//表格列表
router.get("/tableslist", (req, res) => {
    db.find(table_data, {}, {}, {}, result => {
        return res.json({ status: 1, info: '获取成功', data: result })
    });
});
//表格添加
router.post("/tablesadd", (req, res) => {
    //处理含有文件上传的表单
    var formMultiparty = new multiparty.Form();
    //更改上传成功的临时文件的存放位置
    let fullpath = path.resolve(__dirname, '../upload');
    formMultiparty.uploadDir = fullpath;

    formMultiparty.parse(req, function (err, fields, files) {

        if (!err) {
            if (files.picurl[0]) {
                var updateTime = time("YYYYMMDDHHmmss");
                //获取文件扩展名
                let extname = path.extname(files.picurl[0].originalFilename);
                //完整文件名
                // let fullname = uuidv1() + extname;
                let fullname = updateTime + extname;
                //将上传成功后的临时文件名改成正式文件名
                fs.renameSync(files.picurl[0].path, fullpath + '/' + fullname);
                //向fields对象中添加属性img
                fields.picurl = "/upload/" + fullname;

                var objFields = {
                    numbering:updateTime,
                    title:fields.title[0],
                    picurl:fields.picurl,
                    amount:fields.amount[0],
                    condition:fields.condition[0],
                }
            }
            db.insertOne(table_data, objFields, err => {
                if (!err) {
                    return res.json({ status: 1, info: '添加成功' })
                } else {
                    return res.json({ status: -1, info: '添加失败' })
                }
            });
        }
    });
});
//获取表格信息-一条
router.get('/tablesinfo', (req, res) => {
    let _id = req.query.id;
    if (_id == undefined) {
        return res.json({ status: -1, info: '参数错误' })
    }
    db.find(table_data, { _id }, {}, { limit: 1 }, result => {
        return res.json({ status: 1, info: '获取成功', data: result[0] })
    });
});

//表格修改
router.post("/tablesedit", (req, res) => {
    //处理含有文件上传的表单
    var form = new formidable.IncomingForm();
    //更改上传成功的临时文件的存放位置
    // let fullpath = path.resolve(__dirname, '../upload');
    // form.uploadDir = fullpath;
    form.uploadDir = 'upload';
    form.parse(req, function (err, fields, files) {
        let _id = fields.id;
        if (_id == undefined) {
            return res.json({ status: -1, info: '参数错误' })
        }
        if (!err) {
            if (files.img) {
                //获取文件扩展名
                let extname = path.extname(files.img.name);
                //完整文件名
                let fullname = uuidv1() + extname;
                //将上传成功后的临时文件名改成正式文件名
                fs.renameSync(files.img.path, fullpath + '/' + fullname);
                //向fields对象中添加属性img
                fields.imgurl = "/upload/" + fullname;
            }
            db.update(table_data,{_id}, fields, err => {
                if (!err) {
                    return res.json({ status: 1, info: '修改成功' })
                } else {
                    return res.json({ status: -1, info: '修改失败' })
                }
            });
        }
    });
});
//表格删除
router.post("/tablesdel", (req, res) => {
    let _id = req.query.id;
    if (_id == undefined) {
        return res.json({ status: -1, info: '参数错误' })
    }
    //删除本地upload图片
    db.find(table_data, { _id }, (err, result) => {
        var image = (result[0].picurl).slice(1);
        if (image) {
            fs.unlinkSync(image,function(err){
                console.log(err)
            })
        }
    });
    //删除数据库
    db.delete(table_data, { _id }, err => {
        if (!err) {
            return res.json({ status: 1, info: '删除成功' })
        } else {
            return res.json({ status: -1, info: '删除失败' })
        }
    });
});
/*******************表格相关接口-结束***********************/
/*******************文章相关接口-开始***********************/
//文章列表
router.get("/articleslist", (req, res) => {
    db.find(essays_data, {}, {}, {}, result => {
        return res.json({ status: 1, info: '获取成功', data: result })
    });
});
//文章添加
router.post("/addArticle", (req, res) => {
    var objFields = req.body.data
    var timeStamp = time("YYYYMMDDHHmmss");
    var updateTime = time("YYYY"+"-"+"MM"+"-"+"DD"+" "+"HH"+":"+"mm"+":"+"ss");
    objFields.updateTime = updateTime;
    objFields.timeStamp = timeStamp;
    db.insertOne(essays_data, objFields, err => {
        if (!err) {
            return res.json({ status: 1, info: '添加成功' })
        } else {
            return res.json({ status: -1, info: '添加失败' })
        }
    });
});
//获取文章信息-一条
router.get('/articleinfo', (req, res) => {
    let _id = req.query.id;
    // console.log(_id)
    if (_id == undefined) {
        return res.json({ status: -1, info: '参数错误' })
    }
    db.find(essays_data, { _id }, {}, { limit: 1 }, result => {
        return res.json({ status: 1, info: '获取成功', data: result[0] })
    });
});
//文章删除
router.post("/articledel", (req, res) => {
    let _id = req.query.id;
    if (_id == undefined) {
        return res.json({ status: -1, info: '缺少参数' })
    }
    db.delete(essays_data, { _id }, err => {
        if (!err) {
            return res.json({ status: 1, info: '删除成功' })
        } else {
            return res.json({ status: -1, info: '删除失败' })
        }
    });
});
/*******************文章相关接口-结束***********************/
//暴露路由
module.exports = router;