export interface EnvVars {
    db_database:string,
    db_host:string,
    db_password:string,
    db_user:string,
    dynamo_accessKeyId:string,
    dynamo_endpoint:string,
    dynamo_region:string,
    dynamo_secretAccessKey:string
    [key: string]: string
    
}
export interface ProcessEnv {
    [key: string]: EnvVars
    
}