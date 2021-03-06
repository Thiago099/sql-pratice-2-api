module.exports = (app, sql_builder) => {
    sql_builder(app, 'table', 'entity', 
    [
            // "verb_entity",
            {
                table: "generalization",
                field: "entity_specific",
            },
            {
                table: "containing",
                field: "entity_container",
            },
            {
                read_only: true,
                table: "containing",
                field: "entity_content",
            }
        ]
    )
}