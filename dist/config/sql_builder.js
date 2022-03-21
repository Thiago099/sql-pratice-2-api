"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { route } = require('express/lib/application');
module.exports = (app, type, name, sub_tables = null, order_by = null) => {
    const connection = require('./mysql');
    const parameters = [];
    if (sub_tables != null) {
        for (let i = 0; i < sub_tables.length; i++) {
            let field = '';
            let table = '';
            if (typeof sub_tables[i] === 'string') {
                field = name;
                table = sub_tables[i];
            }
            else {
                field = sub_tables[i].field;
                table = sub_tables[i].table;
            }
            parameters.push({ field, table });
        }
    }
    switch (type) {
        case 'table':
            {
                function sub_query_get(id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let result = {};
                        if (sub_tables == null) {
                            return result;
                        }
                        for (let i = 0; i < parameters.length; i++) {
                            result[parameters[i].table] = yield new Promise((resolve, reject) => {
                                connection.query(`SELECT * FROM \`${parameters[i].table}\` WHERE \`${parameters[i].table}\`.id_${parameters[i].field} = ?`, [id], (err, rows) => {
                                    if (err)
                                        reject(err);
                                    if (rows === undefined) {
                                        resolve(null);
                                        return;
                                    }
                                    rows.forEach(element => {
                                        delete element[`id_${parameters[i].field}`];
                                    });
                                    resolve(rows);
                                });
                            });
                        }
                        return result;
                    });
                }
                app.get(`/${name}/:id`, (req, res) => {
                    connection.query(`SELECT * FROM \`${name}\` WHERE id = ?`, [req.params.id], (err, results) => __awaiter(void 0, void 0, void 0, function* () {
                        if (err) {
                            res.send(err);
                            return;
                        }
                        // return message if results is empety
                        if (results.length === 0) {
                            res.status(404).send({
                                message: `No ${name} with id ${req.params.id}`
                            });
                            return;
                        }
                        const sub_query = yield sub_query_get(req.params.id);
                        res.json(Object.assign(Object.assign({}, results[0]), sub_query));
                    }));
                });
                app.get(`/${name}`, (req, res) => {
                    connection.query(`SELECT * FROM \`${name}\`${order_by != null ? (" ORDER BY " + order_by) : ''}`, (err, results) => __awaiter(void 0, void 0, void 0, function* () {
                        if (err) {
                            res.send(err);
                            return;
                        }
                        // loop trough all result using for loop
                        for (let i = 0; i < results.length; i++) {
                            const sub_query = yield sub_query_get(results[i].id);
                            results[i] = Object.assign(Object.assign({}, results[i]), sub_query);
                        }
                        res.json(results);
                    }));
                });
                app.post(`/${name}/`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                    let id = 0;
                    const data = JSON.parse(JSON.stringify(req.body));
                    if (parameters != null) {
                        for (let i = 0; i < parameters.length; i++) {
                            delete data[parameters[i].table];
                        }
                    }
                    delete data.delete;
                    if (req.body.id == 0 || req.body.id == undefined) {
                        delete data.id;
                        id = yield new Promise((resolve, reject) => {
                            connection.query(`INSERT INTO \`${name}\` SET ?`, data, (err, result) => {
                                if (err) {
                                    res.send(err);
                                    reject(err);
                                    return;
                                }
                                resolve(result.insertId);
                                res.send(result);
                            });
                        });
                    }
                    else {
                        id = req.body.id;
                        connection.query(`UPDATE \`${name}\` SET ? WHERE id = ?`, [data, req.body.id], (err, result) => {
                            if (err) {
                                res.send(err);
                                return;
                            }
                            res.send(result);
                        });
                    }
                    if (sub_tables == null) {
                        return;
                    }
                    // loop trough all sub_tables
                    for (let i = 0; i < parameters.length; i++) {
                        for (let j = 0; j < req.body[parameters[i].table].length; j++) {
                            let row = req.body[parameters[i].table][j];
                            if (row.id == 0 || row.id == undefined) {
                                if (!row.delete) {
                                    delete row.id;
                                    delete row.delete;
                                    console.log(row);
                                    row[`id_${parameters[i].field}`] = id;
                                    connection.query(`INSERT INTO \`${parameters[i].table}\` SET ?`, row, (err, rows) => {
                                        if (err)
                                            throw err;
                                    });
                                }
                            }
                            else {
                                if (row.delete == true) {
                                    connection.query(`DELETE FROM \`${parameters[i].table}\` WHERE id = ?`, row.id, (err, rows) => {
                                        if (err)
                                            throw err;
                                    });
                                }
                                else {
                                    row[`id_${parameters[i].field}`] = id;
                                    delete row.delete;
                                    connection.query(`UPDATE \`${parameters[i].table}\` SET ? WHERE id = ?`, [row, row.id], (err, rows) => {
                                        if (err)
                                            throw err;
                                    });
                                }
                            }
                        }
                    }
                }));
                //delete
                app.delete(`/${name}/:id`, (req, res) => {
                    parameters.forEach(element => {
                        connection.query(`DELETE FROM \`${element.table}\` WHERE \`id_${element.field}\` = ?`, [req.params.id], (err, result) => {
                            if (err) {
                                res.send(err);
                                return;
                            }
                        });
                    });
                    connection.query(`DELETE FROM \`${name}\` WHERE id = ?`, [req.params.id], (err, result) => {
                        if (err) {
                            res.send(err);
                            return;
                        }
                        res.send(result);
                    });
                });
            }
            break;
        case 'query':
            {
                app.get(`/${name}`, (req, res) => {
                    connection.query(sub_tables, (err, results) => {
                        if (err) {
                            res.send(err);
                            return;
                        }
                        res.json(results);
                    });
                });
            }
            break;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FsX2J1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29uZmlnL3NxbF9idWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFHckQsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGFBQStELElBQUksRUFBRSxRQUFRLEdBQUcsSUFBSSxFQUFFLEVBQUU7SUFDdkgsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sVUFBVSxHQUFtQyxFQUFFLENBQUM7SUFDdEQsSUFBRyxVQUFVLElBQUksSUFBSSxFQUNyQjtRQUNJLEtBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUN6QztZQUNJLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQTtZQUNkLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQTtZQUNkLElBQUcsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUNwQztnQkFDSSxLQUFLLEdBQUcsSUFBSSxDQUFBO2dCQUNaLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFXLENBQUE7YUFDbEM7aUJBRUQ7Z0JBQ0ksS0FBSyxHQUFJLFVBQVUsQ0FBQyxDQUFDLENBQWtDLENBQUMsS0FBSyxDQUFBO2dCQUM3RCxLQUFLLEdBQUksVUFBVSxDQUFDLENBQUMsQ0FBa0MsQ0FBQyxLQUFLLENBQUE7YUFDaEU7WUFDRCxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUE7U0FDdEM7S0FDQTtJQUNELFFBQU8sSUFBSSxFQUNYO1FBQ0ksS0FBSyxPQUFPO1lBQ1I7Z0JBQ0ks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