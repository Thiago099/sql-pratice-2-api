"use strict";
module.exports = (app, sql_builder) => {
    sql_builder(app, 'table', 'entity', [
        // "verb_entity",
        {
            table: "generalization",
            field: "entity_specific",
        },
        {
            table: "containing",
            field: "entity_container",
        }
    ]);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50aXR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbnRyb2xsZXJzL2VudGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsRUFBRTtJQUNsQyxXQUFXLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQ2xDO1FBQ1EsaUJBQWlCO1FBQ2pCO1lBQ0ksS0FBSyxFQUFFLGdCQUFnQjtZQUN2QixLQUFLLEVBQUUsaUJBQWlCO1NBQzNCO1FBQ0Q7WUFDSSxLQUFLLEVBQUUsWUFBWTtZQUNuQixLQUFLLEVBQUUsa0JBQWtCO1NBQzVCO0tBQ0osQ0FDSixDQUFBO0FBQ0wsQ0FBQyxDQUFBIn0=