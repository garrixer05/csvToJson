const {Pool, client} = require('pg');

const pool = new Pool({
    user:"postgres",
    host:"localhost",
    database:"postgres",
    password:"admin",
    port:5432
});
pool.query(
    "CREATE TABLE IF NOT EXISTS public.users (name varchar NOT NULL, age int4 NOT NULL, address jsonb NULL, additional_info jsonb NULL, id serial4 NOT NULL)",
    (err, res)=>{
        if(err){
            console.log(err)
        }
        console.log(res.command);
        pool.end();
    }
);
module.exports = pool;