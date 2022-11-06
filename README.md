
# snowflake enhanced - an excellent distributed id generator

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/utkarsh-pro/nodejs-snowflake/graphs/commit-activity)
[![GitHub issues](https://img.shields.io/github/issues/utkarsh-pro/nodejs-snowflake.svg)](https://github.com/utkarsh-pro/nodejs-snowflake/issues/)
![License](https://img.shields.io/npm/l/nodejs-snowflake)
![Top Language](https://img.shields.io/github/languages/top/utkarsh-pro/nodejs-snowflake)
![Version](https://img.shields.io/npm/v/nodejs-snowflake)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/utkarsh-pro/nodejs-snowflake/Releases)

snowflake-enhanced is a fastest and reliable library to generate time sortable 64 bit(actually supports 10~213 bits) ids written for distributed systems.
it's written in TypeScript and being tested sufficiently.

## Features
1. snowflake bit length setting(supports 10~213 bits)  √
2. field bit length setting √
3. time precision setting(supports millisecond & second) √
4. clock moving backward handle √
5. counter overflow handle √
6. adjust field position ×
7. error event listen ×

## Getting Started

```bash
npm install snowflake-enhanced
yarn add snowflake-enhanced
```

## Usage

### Basic Usage

```javascript
import SnowFlake, { SnowFlakeConfig } from 'snowflake-enhanced';
const config: SnowFlakeConfig = {
  dataCenterId: 0,
  workerId: 1
};
const snowflake = new SnowFlake(config);

const id = snowflake.syncNextSeqId(); // sync get numeric ID, return a bigint
// or
const id = await snowflake.nextSeqId(); // async get numeric ID with promise, return a bigint
```

Twitter Snowflake

A-|----------------------B------------------------|---C---|---D---|------E------|

0 - 0000000000 0000000000 0000000000 0000000000 0 - 00000 - 00000 - 000000000000

### APIs

#### Generate Numeric ID
```javascript
const id = snowflake.syncNextSeqId(); // sync get numeric ID, return a bigint
const id = await snowflake.nextSeqId(); // async get numeric ID with promise, return a bigint
```

#### Generate String ID
```javascript
// 36 radix, ranging in [2, 36]
const id = snowflake.syncNextSeqStr(); // sync get string ID, return a string
const id = await snowflake.nextSeqStr(); // async get string ID with promise, return a string
// 16 radix
const id = snowflake.syncNextSeqStr(16); // sync get string ID, return a string
const id = await snowflake.nextSeqStr(16); // async get string ID with promise, return a string
```

#### Parse timestamp from ID
```javascript
const id = snowflake.syncNextSeqId();
const time = snowflake.getTimeById(id); // return generated timestamp of the ID
```

#### Parse dataCenterId from ID
```javascript
const id = snowflake.syncNextSeqId();
const dataCenterId = snowflake.getDatacenteridById(id);
```

#### Parse workerId from ID
```javascript
const id = snowflake.syncNextSeqId();
const workerId = snowflake.getWorkeridById(id);
```

#### Parse sequence from ID
```javascript
const id = snowflake.syncNextSeqId();
const sequence = snowflake.getSeqById(id);
```

#### Parse all fields from ID
```javascript
const id = snowflake.syncNextSeqId();
const { time, dataCenterId, workerId, seq } = snowflake.deconstructed(id);
```

#### get time precision
```javascript
snowflake.timePrecision; // readonly
```

### All Configurations
```javascript
// time precision enum
export enum TIME_MODE {
  SECOND = 'second',
  MILLISECOND = 'millisecond'
}

// all configurations
export interface SnowFlakeBaseConfig {
  bitLength: number; // snowflake bit length, 64 bit by default
  timePrecision: TIME_MODE; // time precision
  initEpoch: number; // init epoch
  timeBits: number; // time bits, 41 bit default, which can store 69 years long time
  dataCenterIdBits: number; // dataCenterId bits, 5 bit default, max value is 2^5-1 = 31
  workerIdBits: number; // workerId bits, 5 bit default, max value is 2^5-1 = 31
  sequenceBits: number; // sequence bits, 12 bit default, 最大值 2^12-1 = 4095
}
export interface SnowFlakeConfig {
  base?: SnowFlakeBaseConfig; // basic config
  dataCenterId: number;
  workerId: number;
}

// default basic config
const defaultConfig: SnowFlakeBaseConfig = {
  bitLength: 64,
  initEpoch: 1640966400000,
  timePrecision: TIME_MODE.MILLISECOND,
  timeBits: 41,
  dataCenterIdBits: 5,
  workerIdBits: 5,
  sequenceBits: 12,
};
```

### Advanced Usage
```javascript
import SnowFlake, { SnowFlakeConfig, TIME_MODE } from 'snowflake-enhanced';

// no need dataCenterId
const config: SnowFlakeConfig = {
  base: {
    bitLength: 64,
    initEpoch: 1640966400000,
    timePrecision: TIME_MODE.MILLISECOND,
    timeBits: 41,
    dataCenterIdBits: 0, // set to 0, which means do not use dataCenterId
    workerIdBits: 10, // 10 bit workerId
    sequenceBits: 12,
  },
  dataCenterId: 0,
  workerId: 1
};
const snowflake = new SnowFlake(config);

// use 53 bit snowflake, and change time precision to SECOND. it's suitable for low-concurrency systems, and it's safe to convert to JS Number.
const config: SnowFlakeConfig = {
  base: {
    bitLength: 53,
    initEpoch: 1640966400000,
    timePrecision: TIME_MODE.SECOND, // change to SECOND, with 32 bit can store 136 years long time.
    timeBits: 32,
    dataCenterIdBits: 0, // no need dataCenterId
    workerIdBits: 8, // only workerId, max value is 255.
    sequenceBits: 12,
  },
  dataCenterId: 0,
  workerId: 1
};
const snowflake = new SnowFlake(config);

// use 100 bit snowflake, it's only suitable for very verfy high-concurrency systems.
const config: SnowFlakeConfig = {
  base: {
    bitLength: 100, // support max 213 bit, ranging in [10, 213]
    initEpoch: 1640966400000,
    timePrecision: TIME_MODE.MILLISECOND,
    timeBits: 53, // max value is 53, throw an error when bigger then 53.
    dataCenterIdBits: 10,
    workerIdBits: 10,
    sequenceBits: 26,
  },
  dataCenterId: 0,
  workerId: 1
};
const snowflake = new SnowFlake(config);
```

### Feature Comparison
```
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
|           \           | snowflake-enhanced |  nodejs-snowflake  |     flake-idgen    |    simpleflakes    | snowflake-generator |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
| performance           |       380w/s       |        110w/s      |       150w/s       |       380w/s       |       210w/s        |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
| bit length config     |         √          |                    |                    |                    |                     |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
| field length config   |         √          |                    |                    |                    |                     |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
| time precision config |         √          |                    |                    |                    |                     |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
| init epoch config     |         √          |         √          |         √          |         √          |         √           |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
| counter overflow      |         √          |                    |                    |                    |                     |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
| clock moving backward |         √          |                    |                    |                    |                     |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
| deconstruct           |         √          |         √          |         √          |         √          |         √           |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
| async api             |         √          |                    |                    |                    |                     |
+-----------------------+--------------------+--------------------+--------------------+--------------------+---------------------+
```

### Examples
```
+---------------+------------+--------+----------+---------------------+---------------------+
|   Timestamp   | DataCenter | Worker | Sequence |    SnowFlake ID     | SnowFlake ID String |
+---------------+------------+--------+----------+---------------------+---------------------+
| 1662472229481 |     2      |   3    |     0    |  90201986615750656  |    OO5XOL8QMF4      |
+---------------+------------+--------+----------+---------------------+---------------------+
| 1662472229481 |     2      |   3    |     1    |  90201986615750657  |    OO5XOL8QMF5      |
+---------------+------------+--------+----------+---------------------+---------------------+
| 1662472229481 |     2      |   3    |     2    |  90201986615750658  |    OO5XOL8QMF6      |
+---------------+------------+--------+----------+---------------------+---------------------+
| 1662472229481 |     2      |   3    |     3    |  90201986615750659  |    OO5XOL8QMF7      |
+---------------+------------+--------+----------+---------------------+---------------------+
| 1662472229481 |     2      |   3    |     4    |  90201986615750660  |    OO5XOL8QMF8      |
+---------------+------------+--------+----------+---------------------+---------------------+
```

### Supported Version
NodeJS@v10.4.x+
