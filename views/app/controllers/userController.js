const modelUser = require("../models/user");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
const { statusF, statusS, localhost, extensionAudio, extensionImage } = require("../validator/variableCommon");
const { encode_jwt, decode_jwt } = require("../validator/methodCommon");
let formidable = require("formidable")
class user {
    async index(req, res, next) {
        const { _limit, _page } = req.query;
        let condition = {}
        let { _id, name, role } = req.query;
        let getUsers = await modelUser.find(condition);

        try {

            if (_id) {
                condition = { ...condition, _id: mongoose.Types.ObjectId(_id) }
                if (role) {
                    condition = { ...condition, role }
                }
            } else if (role) {
                condition = { ...condition, role }
                if (_id) {
                    condition = { ...condition, _id: mongoose.Types.ObjectId(_id) }
                }
            }
            let getUser = await modelUser.find(condition).limit(_limit * 1).skip((_page - 1) * _limit);

            if (typeof name == "string") {
                // console.log(name)
                let filterUser = getUsers.filter(currenValue => {
                    let { first_name, last_name } = currenValue
                    let getName = `${first_name} ${last_name}`.replace(/\s/img, "");
                    let transformName = name.replace(/\s/img, "");

                    return role ? (getName.indexOf(transformName) != -1 && currenValue.role == role) :
                        getName.indexOf(transformName) != -1;
                })
                // console.log(filterUser)
                let transform_limit = parseInt(_limit);
                let getFirst = transform_limit * (_page - 1);//0
                let getLast = transform_limit + getFirst;

                if (_limit && _page) {
                    return res.json({
                        status: statusS,
                        data: filterUser.slice(getFirst, getLast)
                    })
                } else {
                    return res.json({
                        status: statusS,
                        data: filterUser
                    })
                }
            }
            return res.json({
                status: statusS,
                data: getUser
            })
        } catch (error) {
            res.json({
                status: statusF,
                data: []
            })
        }
    }
    getOne(req, res) {
        let { idUser } = req.params;
        let condition = {
            _id: mongoose.Types.ObjectId(idUser)
        }
        modelUser.findById(condition).exec((error, response) => {
            if (error || !response) {
                return res.json({
                    status: statusF,
                    data: [],
                    message: `We have some error: ${error}`
                })
            } else {
                res.json({
                    status: statusS,
                    data: [response],
                    message: ``
                })
            }
        })
    }
    signUp(req, res) {
        let form1 = res.locals.image_user;
        let { first_name, last_name, email, userName, passWord, confirmPassWord } = req.body;

        if (first_name && last_name && email && userName && passWord && confirmPassWord
            && form1) {
            let find_index_path = form1.path.indexOf("imageUser");
            let cut_path = form1.path.slice(find_index_path);

            let getExtension = cut_path.split(".")[1];
            if (!getExtension) {
                return res.json({
                    status: statusF,
                    data: [],
                    message: `We don't allow file is blank !`
                })
            }
            if (!extensionImage.includes(getExtension)) {
                return res.json({
                    status: statusF,
                    data: [],
                    message: `We just allow audio extension jpg, jpeg, bmp,gif, png`
                })
            }
            req.body.avatar = `${localhost}/${cut_path}`;
            delete req.body.confirmPassWord;
            let create_user = new modelUser({ ...req.body })

            create_user.save((err, user_Data) => {
                console.log(user_Data);
                if (err) {
                    res.json({
                        status: statusF,
                        message: err
                    })
                } else {
                    res.json({
                        status: statusS,
                        data: user_Data,
                        message: "sign up successfully"
                    })

                }
            })

        } else {
            return res.json({
                status: statusF,
                data: [],
                message: "We don't allow input is blank !"
            })
        }
    }
    signIn(req, res) {
        let { user } = res.locals
        if (user) {
            let getId_user = encode_jwt(user._id);
            res.json({
                status: statusS,
                token: getId_user,
                user: user
            })
        }
    }
    deleteOne(req, res) {
        const id = {
            _id: mongoose.Types.ObjectId(req.params.idUser)
        }
        modelUser.findOneAndRemove(id)
            .exec((err) => {
                if (err) {
                    res.json({
                        status: statusF,
                        message: err
                    })
                } else {
                    res.json({
                        status: statusS,
                        message: "Delete User successfully",
                    })
                }
            })
    }
    editUser(req, res) {
        let form = formidable.IncomingForm();
        form.uploadDir = path.join(__dirname, "../../public/imageUser");
        form.keepExtensions = true;
        form.maxFieldsSize = 1 * 1024 * 1024;
        form.multiples = true;

        form.parse(req, (err, fields, files) => {
            let { first_name, last_name, email, userName, passWord } = fields;

            if (first_name && last_name && email && userName && passWord) {
                let get_id = req.params.idUser;
                const condition = {
                    _id: mongoose.Types.ObjectId(get_id)
                }
                const upload_files = files["image"];

                let find_index_path = upload_files.path.indexOf("imageUser");
                let cut_path = upload_files.path.slice(find_index_path);
                let getExtension = cut_path.split(".")[1];

                let format_form = { ...fields }
                if (getExtension) {
                    if (extensionImage.includes(getExtension)) {
                        format_form = {
                            ...format_form, avatar: localhost + cut_path
                        }
                    } else {
                        return res.json({
                            status: statusF,
                            data: [],
                            message: `We just allow image extension jpg, jpeg, bmp,gif, png`
                        })
                    }
                }

                modelUser.findOneAndUpdate(condition, { $set: format_form }, { new: true })
                    .exec((err, new_user) => {
                        if (err) {
                            res.json({
                                status: statusF,
                                data: [],
                                message: `We have few error: ${err}`
                            })
                        } else {
                            res.json({
                                status: statusS,
                                data: [new_user],
                                message: `You was update successfully`
                            })
                        }
                    })
            } else {
                res.json({
                    status: statusF,
                    data: [],
                    message: "We don't allow input is blank !"
                })
            }
        })
    }
}
module.exports = new user;