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
    const read_only = [];
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
                if (sub_tables[i].read_only != null) {
                    read_only.push({ field, table });
                    continue;
                }
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
                        for (let i = 0; i < read_only.length; i++) {
                            result[read_only[i].table + '_read_only'] = yield new Promise((resolve, reject) => {
                                connection.query(`SELECT * FROM \`${read_only[i].table}\` WHERE \`${read_only[i].table}\`.id_${read_only[i].field} = ?`, [id], (err, rows) => {
                                    if (err)
                                        reject(err);
                                    if (rows === undefined) {
                                        resolve(null);
                                        return;
                                    }
                                    rows.forEach(element => {
                                        delete element[`id_${read_only[i].field}`];
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
                    if (read_only != null) {
                        for (let i = 0; i < read_only.length; i++) {
                            delete data[read_only[i].table + '_read_only'];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FsX2J1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29uZmlnL3NxbF9idWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFHckQsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGFBQWlGLElBQUksRUFBRSxRQUFRLEdBQUcsSUFBSSxFQUFFLEVBQUU7SUFDekksTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sVUFBVSxHQUFtQyxFQUFFLENBQUM7SUFDdEQsTUFBTSxTQUFTLEdBQW1DLEVBQUUsQ0FBQztJQUNyRCxJQUFHLFVBQVUsSUFBSSxJQUFJLEVBQ3JCO1FBQ0ksS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQ3pDO1lBQ0ksSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFBO1lBQ2QsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFBO1lBQ2QsSUFBRyxPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQ3BDO2dCQUNJLEtBQUssR0FBRyxJQUFJLENBQUE7Z0JBQ1osS0FBSyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQVcsQ0FBQTthQUNsQztpQkFFRDtnQkFDSSxLQUFLLEdBQUksVUFBVSxDQUFDLENBQUMsQ0FBa0MsQ0FBQyxLQUFLLENBQUE7Z0JBQzdELEtBQUssR0FBSSxVQUFVLENBQUMsQ0FBQyxDQUFrQyxDQUFDLEtBQUssQ0FBQTtnQkFDN0QsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUF3QixDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQzFEO29CQUNJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBQyxL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