module.exports = () => {
    const express = require('express');
    const app = express();
    
    const bodyparser = require('body-parser');
    app.use(bodyparser.urlencoded({ extended: true }));
    app.use(bodyparser.json());

    var cors = require('cors')
    app.use(cors())
    
    const connection = require('../config/mysql');
    connection.connect(
        err => {
            if (err) {
                console.log(err);
                return;
            }
        }
    );

    const sql_builder = require('../config/sql_builder');
    console.log(sql_builder)
    const consign = require('consign');
    consign()
        .include('src/controllers')
        .into(app, sql_builder);

    return app
}