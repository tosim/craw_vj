var request = require('request');
var cheerio = require('cheerio');
var url = require('url');
var queryString  = require("querystring");
var iconv = require('iconv-lite');

//获取所有已经结束的比赛id和比赛名
function getContestList(){
    return new Promise(function(resolve,reject){
        request.post({
            url:'https://vjudge.net/contest/data',
            rejectUnauthorized: false,
            gzip: true,
            headers:{
                "Accept":"application/json, text/javascript, */*; q=0.01",
                "Accept-Encoding":"gzip, deflate, br",
                "Accept-Language":"zh-CN,zh;q=0.8",
                "Connection":"keep-alive",
                "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
                "Host":"vjudge.net",
                "Referer":"https://vjudge.net/contest/",
                "User-Agent":"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
            },
            form: queryString.parse("draw=1&columns%5B0%5D%5Bdata%5D=function&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=function&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=function&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=function&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=function&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=function&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=false&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=function&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=false&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=0&order%5B0%5D%5Bdir%5D=desc&start=0&length=20&search%5Bvalue%5D=&search%5Bregex%5D=false&category=mine&running=0&title=2017&owner=hrbustacm")
        }, 
        function(err,res,body){
            // console.log(err);
            // console.log(res.statusCode);
            // console.log(JSON.parse(body).data);
            if(err){
                reject(err);
            }
            var contestList =  JSON.parse(body).data;
            resolve(contestList);
        });
    });
}

//获取单个比赛的rank数据，参与者和提交记录
function getRankDate(id){
    return new Promise(function(resolve,reject){
        request.post({
            url:'https://vjudge.net/contest/rank/single/' + id,
            rejectUnauthorized: false,
            gzip:true,
            headers:{
                "Accept":"application/json, text/javascript, */*; q=0.01",
                "Accept-Encoding":"gzip, deflate, br",
                "Accept-Language":"zh-CN,zh;q=0.8",
                "Connection":"keep-alive",
                "Host":"vjudge.net",
                "Referer":"https://vjudge.net/contest/" + id,
                "User-Agent":"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
            }
        }, 
        function(err,res,body){
            if(err){
                reject(err);
            }
            // console.log(JSON.parse(body));
            resolve(JSON.parse(body));

        });
    });
}

//根据参与者和提交记录计算排名
function calculateRank(parts,submit,length){
    // var parts = {
    //     327:['a','aaa'],
    //     515:['b','bbb'],
    //     155:['c','ccc']
    // }
    // var submit = [
    //     [327,0,0,12],
    //     [515,0,1,12],
    //     [327,0,1,20],
    //     [327,0,1,33],
    //     [327,1,1,33],
    //     [155,0,1,66],
    //     [155,1,1,81981],
    //     [155,2,1,198190]
    // ];
    var map = {};

    for(let i = 0;i < submit.length;i++){
        var id = submit[i][0];
        // console.log(id);
        var que = submit[i][1];
        var is_AC = submit[i][2];
        var time = submit[i][3];
        if(time > length){
            continue;
        }
        try{
        if(map[id] == null){
            map[id] = {};
            map[id].isSolve = {};
            map[id].totalTime = {};
            map[id].time = 0;
            if(is_AC == 1){
                map[id].solveCnt = 1;
                map[id].totalTime[que] = time;
                map[id].isSolve[que] = 1;
                map[id].time += map[id].totalTime[que];
                // console.log(map[id].time);
            }else{
                map[id].solveCnt = 0;
                map[id].isSolve[que] = 0;
                map[id].totalTime[que] = 1200;
            }
        }else{
            if(is_AC == 1){
                if(map[id].isSolve[que] == null){
                    map[id].totalTime[que] = time;
                }else if(map[id].isSolve[que] == 0){
                    map[id].totalTime[que] += time;
                }
                map[id].solveCnt++;
                map[id].isSolve[que] = 1;
                map[id].time += map[id].totalTime[que];
            }else{
                if(map[id].isSolve[que] == null){
                    map[id].totalTime[que] = 1200;
                }else if(map[id].isSolve[que] == 0){
                    map[id].totalTime[que] += 1200;
                }
                map[id].isSolve[que] = 0;
            }
        }}catch(e){
            console.log(e);
            throw(e);
        }
    }

    // console.log(map);
    var arr = [];
    for(let i in map){
        map[i].id = i;
        // console.log(map[i]);
        arr.push(map[i]);
    }
    // console.log(arr);

    arr.sort(function(a,b){
        if(a.solveCnt > b.solveCnt){
            return -1;
        }else if(a.solveCnt == b.solveCnt){
            if(a.time < b.time){
                return -1
            }else{
                return 1;
            }
        }else{
            return 1;
        }
    });

    // console.log(arr);
    for(let i = 0;i < arr.length;i++){
        // console.log(parts[arr[i].id]);
        arr[i].nickName = parts[arr[i].id][0];
        arr[i].name = parts[arr[i].id][1]
        // console.log(nickName+'('+name+')');
        // console.log(arr[i].solveCnt);
    }
    return arr;
    // [
    //     {
    //         id:115651,
    //         solveCnt:6,
    //         time:15118,
    //         nickname:'a',
    //         name:'aaa'
    //     }
    // ]
}

// getRankDate(168972)
//     .then(function(data){
//         return new Promise(function(resolve,reject){
//             resolve([data.participants,data.submissions]); 
//         });
//     })
//     .then(function(data){
//         console.log(data);
//     })

getContestList()//获取比赛id
    .then(function(contestList){
        // console.log(contestList);
        var validateList = [];
        var now = new Date().getTime();
        contestList.forEach(function(item){
            // console.log(item);
            // console.log("end");
            if(/^训练赛20170[78]\d\d$/.test(item[1])){
                if(now < item[3]){//比赛还没结束或还没开始
                    return;
                }
                validateList.push({
                    id:item[0],
                    name:item[1]
                });    
            }
        });
        // console.log(validateList);
        return new Promise(function(resolve,reject){
            var promiseList = [];
            for(let i = 0;i < validateList.length;i++){
                promiseList.push(getRankDate(validateList[i].id));
            }
            Promise.all(promiseList)
                .then(function(results){
                    var contestRanks = {};//比赛名称:比赛rank
                    for(let i = 0;i < results.length;i++){
                        // console.log(parseInt(results[i].length/1000));
                        contestRanks[validateList[i].name] = calculateRank(results[i].participants,results[i].submissions,parseInt(results[i].length/1000));
                    }
                    resolve(contestRanks);
                })
                .catch(function(err){
                    reject(err);
                });
                
        });
    })
    .then(function(contestRanks){
        for(let i in contestRanks){
            console.log(i);
        }
        // console.log(contestRanks['训练赛20170720']);
        exportToExcel(contestRanks);
        console.log("done");
    })


function exportToExcel(contestRanks){
    var Excel = require('exceljs');
    // construct a streaming XLSX workbook writer with styles and shared strings
    var options = {
        filename: './vj训练记录.xlsx',
        useStyles: true,
        useSharedStrings: true
    };
    var workbook = new Excel.stream.xlsx.WorkbookWriter(options);

    workbook.creator = '姚一城';
    workbook.lastModifiedBy = '姚一城';
    workbook.created = new Date(2017, 7, 20);
    workbook.modified = new Date();

    for(let i in contestRanks){
        var worksheet = workbook.addWorksheet(i);
        worksheet.columns = [
            { header: 'Rank', key: 'rank', width: 10 },
            { header: 'Team', key: 'team', width: 50 },
            { header: 'Score', key: 'score', width: 10, outlineLevel: 1 },
            { header: 'Penalty', key: 'penalty', width: 10, outlineLevel: 1 }
        ];
        for(let j = 0;j < contestRanks[i].length;j++){
            var team = contestRanks[i][j].nickName+'('+contestRanks[i][j].name+')';
            if(/(zust)|(浙科院)|(科院)/.test(team)){
                // console.log(team);
                // console.log(contestRanks[i][j].time/60);
                worksheet.addRow({rank: j+1, team: team, score:contestRanks[i][j].solveCnt,penalty:parseInt(contestRanks[i][j].time/60)});
            }
        }
        // worksheet.addRow({rank: 1, team: '营业员', score:5,penalty:123});
        worksheet.commit();
    }

    workbook.commit();
}