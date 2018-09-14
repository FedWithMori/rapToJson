/*
 * @description 将rap导出的html接口转化为json格式
 * @author mori
 * @createTime 20180824
 */

const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const directory = path.resolve(__dirname, './api-html');
const htmlList = [];

/*
 * @description 获取所有的接口html路径
 * @params [directory] 接口html页面目录
 */
(
    getHtmlList = (dir) => {
        const htmlArr = fs.readdirSync(dir);
        let filePath = '';

        htmlArr.forEach( fileName => {
            filePath = `${dir}/${fileName}`;
            if (fs.statSync(filePath).isDirectory()) {
                getHtmlList(filePath);
            } else {
                htmlList.push(filePath);
            }
        })
    }
)(directory)

/*
 * @description 遍历接口html页面
 */
htmlList.forEach(filePath => {
    fs.readFile(filePath, 'utf-8', function(err, data) {
        if (err) {
            console.log(err)
        } else {
            const $ = cheerio.load(data);
            const $modules = $('.module');

            for (let i=0; i < $modules.length; i++) {
                const $module = $modules.eq(i);
                let fileName = $module.find('h1').text();
                let moduleData = compileModule($module);
                
                fs.writeFile(`./api-json/${fileName}.json`, JSON.stringify(moduleData), function(err) {
                    console.log(err)
                })
            }
        }
    })
})

/* 
 * @description 解析模块
 * @params [module] 功能模块dom集合
 */
const compileModule = (module) => {
    const $pages = module.find('.page');
    let pageData = [];
    
    for (let i=0; i<$pages.length; i++) {
        const $page = $pages.eq(i);
        pageData.push({
            name: $page.find('h2').text(),
            list: compileAction($page)
        })
    }

    return pageData;
}

/* 
 * @description 解析接口
 * @params [page] 页面接口dom集合
 */
const compileAction = (page) => {
    const $actions = page.find('.action');
    let actionData = [];

    for (let i=0; i<$actions.length; i++) {
        const $action = $actions.eq(i);
        const $div = $action.find('div');
        const $h3 = $action.find('h3');
        const $table = $action.find('.param-table');
        const $req = $table.eq(0);
        const $res = $table.eq(1);
        console.log($h3.eq(0).text())
        actionData.push({
            "title": $h3.eq(0).text(),
            "path": $div.eq(0).text(),
            "method": $div.eq(1).text(),
            "req_body_type": "json",
            "res_body_type": "json",
            "res_body_is_json_schema": true,
            "req_body_is_json_schema": true,
            "req_params": [],
            "req_headers": [],
            "status": 'done',
            "req_query": compileRequsetParams($req),
            "res_body": compileResponseParams($res)
        })
    }

    return actionData;
}

/* 
 * @description 解析接口请求参数
 * @params [res] 请求参数的dom集合
 */
const compileRequsetParams =  (req) => {
    const $tbody = req.find('tbody');
    const $tr = $tbody.find('tr');
    let reqData = [];

    for (let i=0; i<$tr.length; i++) {
        reqData.push({
            name: $tr.eq(i).find('.td-identifier').text(),
            desc: $tr.eq(i).find('.td-name').text()
        })
    }

    return reqData;
}

/* 
 * @description 解析接口响应参数
 * @params [res] 响应参数的dom集合
 */
const compileResponseParams = (res) => {
    const $tbody = res.find('tbody');
    const $tr = $tbody.find('tr');
    let resData = {};
    resData.properties = deepEachParamsWithJson($tr);

    resData = JSON.stringify(resData);

    return resData;
}

/* 
 * @description 深度遍历参数结构（json-schema模式)
 * @params [data] 遍历目标
 * @params [index] tr dom层级索引值
 */
const deepEachParamsWithJson = (data, index = 1) => {
    const obj = {};
    const target = data.filter(`.tr-level-${index}`);

    for (let i=0; i<target.length; i++) {
        const ele = target.eq(i);
        const name = ele.find('.td-identifier').text();
        const type = ele.find('.td-type').text();
        const description = ele.find('.td-name').text().replace(/\-*/, '');

        if (type === 'object') {
            obj[name] = {
                properties: deepEachParamsWithJson(data, index + 1)
            }
        } else if (type === 'array<object>') {
            obj[name] = {
                type: "array",
                items: {
                    type: "object",
                    properties: deepEachParamsWithJson(data, index + 1)
                }
            }
        } else {
            obj[name] = {
                type,
                description
            }
        }
    }
    return obj;
};

/* 
 * @description 深度遍历参数结构（mock模式）
 * @params [data] 遍历目标
 * @params [deep] 结构层级深度
 */
const deepEachParamsWithMock = (data, index = 1) => {

}











