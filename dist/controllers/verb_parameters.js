"use strict";
module.exports = (app, sql_builder) => {
    sql_builder(app, 'query', 'verb_parameter', `
    WITH verb_parameter AS 
    (
        WITH RECURSIVE gen AS 
        (
            SELECT 			generalization.id_parent, 
                            generalization.id_child 
            FROM 			generalization
            UNION ALL
            SELECT 			generalization.id_parent, 
                            gen.id_child 
            FROM 		    gen
            INNER JOIN 	generalization ON gen.id_parent = generalization.id_child 
        )
        SELECT 		    verb_parameter.id, 
                        verb_parameter.id_verb, 
                        verb_parameter.name, 
                        gen.id_child id_entity
        FROM 			verb_parameter
        INNER JOIN 	    gen ON verb_parameter.id_entity = gen.id_parent
        UNION ALL
        SELECT 		    verb_parameter.id, 
                        verb_parameter.id_verb, 
                        verb_parameter.name, 
                        verb_parameter.id_entity
        FROM 			verb_parameter
    )
    SELECT      verb_parameter.*,
                entity.id_group
    FROM        verb_parameter 
    INNER JOIN  entity ON verb_parameter.id_entity = entity.id
    ORDER BY    id_verb,
                id_entity`);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyYl9wYXJhbWV0ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbnRyb2xsZXJzL3ZlcmJfcGFyYW1ldGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsRUFBRTtJQUNsQyxXQUFXLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7MEJBZ0NyQixDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFBIn0=