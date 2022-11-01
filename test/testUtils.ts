
export const enum MODULE_NAME {
  SnowFlake = './src/snowflake.ts',
  EnhancedSnowFlake = './src/snowflake-enhanced.ts',
  SnowFlakeGen = 'snowflake-generator',
  NodeSnowFlake = 'nodejs-snowflake',
  FlakeIdGen = 'flake-idgen',
  SimpleFlakes = 'simpleflakes',
  AxiheSnowflake = '@axihe/snowflake',
  UUIDInt = 'uuid-int'
}

export function logModule(name: string) {
  console.log(`\n======================================= ${name} =======================================`);
}

export function logPart(module: string, partName: string) {
  console.log(`--------------------- [${module}] ${partName} ---------------------`);
}
