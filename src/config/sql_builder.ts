const { route } = require('express/lib/application');


module.exports = (app, type ,name, sub_tables: string[] | {field:string, table:string}[] | null = null, order_by = null) => {
    const connection = require('./mysql');
    const parameters: {field:string, table:string}[] = [];
    if(sub_tables != null)
    {
        for(let i = 0; i < sub_tables.length; i++)
        {
            let field = ''
            let table = ''
            if(typeof sub_tables[i] === 'string')
            {
                field = name
                table = sub_tables[i] as string
            }
            else
            {
                field = (sub_tables[i] as {field:string, table:string}).field
                table = (sub_tables[i] as {field:string, table:string}).table
            }
            parameters.push({field, table})
    }
    }
    switch(type)
    {
        case 'table':
            {
                async function sub_query_get(id){
                   let result = {}
                   if(sub_tables == null) 
                   {
                       return result
                   }
                   for(let i = 0; i < parameters.length; i++)
                   {
                       result[parameters[i].table] = await new Promise((resolve, reject) =>{
                           connection.query(`SELECT * FROM \`${parameters[i].table}\` WHERE \`${parameters[i].table}\`.id_${parameters[i].field} = ?`,
                           [id],
                           (err, rows) => {
                               if(err) reject(err);
                               if(rows === undefined) 
                               {
                                   resolve(null);
                                   return
                               }
                               rows.forEach(element => {
                                   delete element[`id_${parameters[i].field}`];
                               });
                               resolve(rows);
                               }
                           );
                       });
                   }
                   return result;
               }
               app.get(`/${name}/:id`,(req, res) => {
                   connection.query(
                       `SELECT * FROM \`${name}\` WHERE id = ?`,
                       [req.params.id],
                       async (err, results) => {
                           if (err) {
                               res.send(err)
                               return;
                           }
                           // return message if results is empety
                           if (results.length === 0) {
                               res.status(404).send({
                                   message: `No ${name} with id ${req.params.id}`
                               })
                               return;
                           }
                           const sub_query = await sub_query_get(req.params.id)
                           res.json({...results[0], ...sub_query});
                       }
                   );
               });
               app.get(`/${name}`,  (req, res) => {
                   connection.query(`SELECT * FROM \`${name}\`${order_by != null ?(" ORDER BY "+order_by) : ''}`, async (err, results) => {
                       if (err) {
                           res.send(err)
                           return;
                       }
                       // loop trough all result using for loop
                       for(let i = 0; i < results.length; i++)
                       {
                           const sub_query = await sub_query_get(results[i].id)
                           results[i] = {...results[i], ...sub_query};
                       }
                       res.json(results);
                   });
               });
               app.post(`/${name}/`,async (req, res) => {
                   let id = 0
                   const data = JSON.parse(JSON.stringify(req.body))
                   
                   if(parameters != null)
                   {
                       for(let i = 0; i < parameters.length; i++)
                       {
                           delete data[parameters[i].table];
                       }
                   }
                   
                   delete data.delete
                   if(req.body.id == 0 || req.body.id == undefined){
                       delete data.id
                       id = await new Promise((resolve, reject) =>{
                       connection.query(
                           `INSERT INTO \`${name}\` SET ?`,
                           data,
                           (err, result) => {
                               if (err) {
                                   res.send(err)
                                   reject(err);
                                   return;
                               }
                               resolve(result.insertId);
                               res.send(result)
                           }
                       );
                   })
                   }else{
                       id = req.body.id
                       connection.query(
                           `UPDATE \`${name}\` SET ? WHERE id = ?`,
                           [data, req.body.id],
                           (err, result) => {
                               if (err) {
                                   res.send(err)
                                   return;
                               }
                               res.send(result)
                           }
                       );
                   }
                   if(sub_tables == null)
                   {
                       return;
                   }
                   // loop trough all sub_tables
                   for(let i = 0; i < parameters.length; i++)
                   {
                       for(let j = 0; j < req.body[parameters[i].table].length; j++)
                       {
                           
                           let row = req.body[parameters[i].table][j];
                           
                           if(row.id == 0 || row.id == undefined )
                           {
                               if(!row.delete)
                               {
                                   delete row.id
                                   delete row.delete
                                   console.log(row)
                                   row[`id_${parameters[i].field}`] = id;
                                   connection.query(`INSERT INTO \`${parameters[i].table}\` SET ?`, row, (err, rows) => {
                                       if(err) throw err;
                                   });
                               }
                           }
                           else
                           {
                               if(row.delete == true)
                               {
                                   connection.query(`DELETE FROM \`${parameters[i].table}\` WHERE id = ?`, row.id, (err, rows) => {
                                       if(err) throw err;
                                   });
                               
                                }else
                               {
                                    row[`id_${parameters[i].field}`] = id;
                                    delete row.delete
                                    connection.query(`UPDATE \`${parameters[i].table}\` SET ? WHERE id = ?`, [row, row.id], (err, rows) => {
                                   if(err) throw err;
                               })
                               }
                           }
                       }
                   }
               });
               //delete
               app.delete(`/${name}/:id`, (req, res) => {
                parameters.forEach(element => {
                       connection.query(
                           `DELETE FROM \`${element.table}\` WHERE \`id_${element.field}\` = ?`,
                           [req.params.id],
                           (err, result) => {
                               if (err) {
                                   res.send(err)
                                   return;
                               }
                           }
                       );
                   });
                   connection.query(
                       `DELETE FROM \`${name}\` WHERE id = ?`,
                       [req.params.id],
                       (err, result) => {
                           if (err) {
                               res.send(err)
                               return;
                           }
                           res.send(result)
                       }
                   );
               });
            }
        break
        case 'query':{
            app.get(`/${name}`, (req, res) => {
                connection.query(sub_tables, (err, results) => {
                    if (err) {
                        res.send(err)
                        return;
                    }
                    res.json(results);
                });
            });
        }
        break;
    }
    
}