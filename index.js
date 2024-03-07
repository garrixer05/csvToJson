const dotenv = require('dotenv');
const fs = require('fs')
dotenv.config();

const stream = fs.createReadStream(process.env.PATH_TO_CSV);

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
    return doc
}
// fill data inside the document 
function fillData(doc, data){
    let properLine = data[0].trim().split(', ');
    for(let i=1;i<data.length;i++){
        let dataLine = data[i].trim().split(', ');
        for (let j=0;j<dataLine.length;j++){
            eval(`doc.${properLine[j]} = dataLine[j]`);
        }
    }
    return doc;
}


stream.on('data', (chunks)=>{
    let data = chunks.toString().split('\n');
    let doc = createModel(data[0]);
    fillData(doc, data);
})
