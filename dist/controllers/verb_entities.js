"use strict";
module.exports = (app, sql_builder) => {
    sql_builder(app, 'query', 'verb_entity', `
        WITH verb_entity AS
        (
            WITH generalization AS (
                WITH RECURSIVE gen AS 
                (
                    SELECT 		generalization.id_parent, 
                                generalization.id_child 
                    FROM 		generalization
                    UNION ALL
                    SELECT 		generalization.id_parent, 
                                gen.id_child 
                    FROM 		gen
                    INNER JOIN 	generalization ON gen.id_parent = generalization.id_child 
                )
                SELECT      * 
                FROM        gen
                ORDER BY    id_child
            )
            SELECT      id_verb, 
                        id_child id_entity 
            FROM        verb_entity
            INNER JOIN  generalization ON generalization.id_parent = verb_entity.id_entity
            UNION ALL 
            SELECT      id_verb, 
                        id_entity
            FROM        verb_entity
        )
        SELECT      verb_entity.*,
                    verb.id_group
        FROM        verb_entity 
        INNER JOIN   verb ON verb.id = verb_entity.id_verb
        ORDER BY    id_entity,
                    id_verb;`);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyYl9lbnRpdGllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb250cm9sbGVycy92ZXJiX2VudGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxFQUFFO0lBQ2xDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQWlDZixDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFBIn0=