
export class GenericController{

    public static extractQueryFilterParams(sql: string, params:Object, acceptedParameters:string[], values:any[] =[]) {
        params = GenericController.validateParams(params, acceptedParameters);
        if(Object.keys(params).length >0) {
            sql += " WHERE ";
        }
        let sqlObj = GenericController.appendParamsAndValues(params, sql, values);
        return {sql: sqlObj.sql, values: sqlObj.values}
    }

    public static extractQueryFilterHavingParams(sql: string, params:Object, acceptedParameters:string[], values:any[] =[]) {
        params = GenericController.validateParams(params, acceptedParameters);
        if(Object.keys(params).length >0) {
            sql += " HAVING ";
        }
        let sqlObj = GenericController.appendParamsAndValues(params, sql, values);
        return {sql: sqlObj.sql, values: sqlObj.values}
    }

    private static appendParamsAndValues(params:Object, sql:string, values:any[]){
        for (let x = 0; x < Object.keys(params).length; x++) {
            if (x > 0) {
                sql += " and ";
            }
            sql += Object.keys(params)[x] + " = ? ";
            values.push(Object.values(params)[x])
        }
        return {sql: sql, values: values};
    }

    public static setOffset(sql:string, skip: number = 0, limit: number = 0, values:any[] =[] ) {
        sql += "LIMIT ?,?;";
        values.push(skip);
        values.push(limit);
        return {sql: sql, values: values};
    }

    public static extractBodyUpdateParameters(sql:string, body:Object, validUpdateParams:string[], values:any[] =[]) {
        body = GenericController.validateParams(body, validUpdateParams);
        if(Object.keys(body).length >0) {
            sql += " SET ";
        }
        for (let x = 0; x < Object.keys(body).length; x++) {
            if (x > 0) {
                sql += ", ";
            }
            sql += Object.keys(body)[x] + " = ? ";
            values.push(Object.values(body)[x])
        }
        return {sql: sql, values: values}
    }

    /**
     * Returns missing required param in request body
     * @return  {string} string with missing param
     */
    public static verifyBodyParams(body: any, required_fields: any[]): string{
        if(body == null)
            return required_fields[0];
        for(let field of required_fields){
            if(!(field in body)) return field;
        }
    }

    public static validateParams(params:any, allowed:string[]){
        let result: any;
        result = {};
        for(let x = 0; x < Object.keys(params).length; x++){
            if(allowed.includes(Object.keys(params)[x])){
                result[Object.keys(params)[x]] = Object.values(params)[x];
            }
        }
        return result;
    }

    public static extractPaginationParams(params: any){
        let skip: number = (params.skip != null || params.skip != undefined) ? Number(params.skip) : 0;
        let limit: number = (params.limit != null || params.limit != undefined) ? Number(params.limit) : 100;
        return {skip: skip, limit: limit}
    }

    public static generateExpressionParams(params: Object, validParams: string[], update: boolean = false) {
        let validatedParams = GenericController.validateParams(params, validParams);
        let filterExp: string = update ? 'SET ' : '';
        let expAttrNames: {[k:string]: any} = {};
        let expAttrValues: {[k:string]: any} = {};

        for (let x=0; x < Object.keys(validatedParams).length; x++) {
            let name = Object.keys(validatedParams)[x];
            let value:any; 
            value = Object.values(validatedParams)[x];
            let expName = '#' + name.toUpperCase();
            let expValue = ':' + name.toLowerCase();

            expAttrNames[expName] = name;
            if (!isNaN(+value)) {
                expAttrValues[expValue] = +value;
            } else if (value in ['true', 'false']) {
                expAttrValues[expValue] = value === 'true';
            } else {
                expAttrValues[expValue] = value;
            }

            if (x < Object.keys(validatedParams).length - 1) {
                filterExp += expName + '=' + expValue + ' AND ';
            } else {
                filterExp += expName + '=' + expValue;
            }
        }

        return [filterExp, expAttrNames, expAttrValues];

    }
}
