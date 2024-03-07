const dotenv = require('dotenv');
const fs = require('fs');
const pool = require('./databasePg.js')
dotenv.config();


// Using readstream to handle large csv files
const stream = fs.createReadStream(process.env.PATH_TO_CSV);
const PARSED_DATA = [];

function setThis(prop){
    this[prop] = {};
}

// To create model of the document according to csv
function createModel(data){
    const doc = {};
    let properLine = data.trim().split(', ');
    
    for(let property of properLine){
        let formattedProperty = property.split('.');
        if (formattedProperty.length === 1){
            doc[formattedProperty[0]] = null;
            continue;
        }
        if(!doc[formattedProperty[0]]){
            doc[formattedProperty[0]] = {};
        }
        let bag='doc[formattedProperty[0]]';
        let currObj=()=>eval(bag);
        // To assign the nth sub property, we need to bind the reference of this keyword to that object
        for (let i=1;i<formattedProperty.length;i++){
            setThis.call(currObj(), formattedProperty[i]);
            bag+=`[formattedProperty[${i}]]`;
        }
    }
    return doc;
}
// fill data inside the document 
function fillData(doc, data){
    let properLine = data[0].trim().split(', ');
    for(let i=1;i<data.length;i++){
        let dataLine = data[i].trim().split(', ');
        for (let j=0;j<dataLine.length;j++){
            eval(`doc.${properLine[j]} = dataLine[j]`);
        }
        PARSED_DATA.push(doc)
    }
}
function insertToDb (){
    let count = {
        in:0,
        out:0,
        errors:0
    }
    if(!PARSED_DATA.length){
        console.log('NO docs to insert');
        return count
    }
    for (let doc of PARSED_DATA){
        let {name, age, address, gender} = doc;
        let fullname = name.firstName + " " + name.lastName;
        let additional_info = {
            "gender" : gender
        }
        count.in++;
        pool.query(`INSERT INTO public.users(name,age,address,additional_info) values('${fullname}', ${age}, '${JSON.stringify(address)}', '${JSON.stringify(additional_info)}')`, (err, res)=>{
            if(err){
                count.errors++
                console.log(err.message);
            }else{
                count.out++;
            }
            console.log(res.rows);
        });

    }
    
    console.log(count);
}
function displayDataByAge(){
    let query = "SELECT CASE WHEN age BETWEEN 0 AND 20 THEN '<20' WHEN age BETWEEN 20 AND 40 THEN '20-40' WHEN age BETWEEN 40 AND 60 THEN '40-60' WHEN age > 60 THEN '>60' END AS age_group, round(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.users)) AS percentage_of_people FROM public.users GROUP BY age_group ORDER BY age_group;"
    pool.query(query, (err,res)=>{
        if(err){
            console.log(err);
        }
        console.log(res.rows);
    })
}


stream.on('data',async (chunks)=>{
    let data = chunks.toString().split('\n');
    let docModel = createModel(data[0]);
    fillData(docModel, data);
    insertToDb()
    displayDataByAge();
    stream.close();
});


