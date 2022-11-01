// import { expect } from 'chai';
import { expect } from 'chai';
import SnowFlake from '../src/snowflake';
import EnhancedSnowFlake, { SnowFlakeBaseConfig, TIME_MODE, getTimeByPrecision } from '../src/snowflake-enhanced';
import { DEFAULT_INIT_EPOCH, objectToString } from '../src/utils';

const baseConfig7: SnowFlakeBaseConfig = {
  bitLength: 53,
  initEpoch: DEFAULT_INIT_EPOCH,
  timePrecision: TIME_MODE.SECOND,
  timeBits: 32,
  dataCenterIdBits: 0,
  workerIdBits: 8,
  sequenceBits: 12,
}

const ans_os1 = `Object {
  base: Object {
    bitLength: 53,
    initEpoch: ${DEFAULT_INIT_EPOCH},
    timePrecision: second,
    timeBits: 32,
    dataCenterIdBits: 0,
    workerIdBits: 8,
    sequenceBits: 12
  },
  dataCenterId: 0,
  workerId: 123
}`;
const ans_os2 = `SnowFlake {
  seqId: 0,
  __previousTime: -1,
  __isOverFlow: false,
  dataCenterId: 1,
  workerId: 2,
  instanceId: 139264
}`;
const ans_os3 = `SnowFlakeEnhanced {
  seqId: 0,
  __previousTime: ${getTimeByPrecision(Date.now(), baseConfig7.timePrecision)},
  SNOWFLAKE_BITS: 53,
  TIME_PRECISION: second,
  INIT_EPOCH: ${Math.floor(DEFAULT_INIT_EPOCH/1000)},
  TIME_BITS: 32,
  DATA_CENTER_ID_BITS: 0,
  WORKER_ID_BITS: 8,
  SEQUENCE_BITS: 12,
  MAX_DATA_CENTER_ID: 0,
  MAX_WORKER_ID: 255,
  MAX_SEQUENCE_ID: 4095,
  WORK_ID_SHIFT: 12,
  DATA_CENTER_ID_SHIFT: 20,
  TIMESTAMP_SHIFT: 20,
  TIME_MASK: 4503599626321920,
  DATA_CENTER_ID_MASK: 0,
  WORKER_ID_BIT_MASK: 1044480,
  dataCenterId: 0,
  workerId: 123,
  instanceId: 503808
}`;

describe(`${__filename}`, function() {
  it('objectToString', function() {
    const os1 = objectToString({
      base: baseConfig7,
      dataCenterId: 0,
      workerId: 123,
    });
    const os2 = objectToString(new SnowFlake(1, 2));
    const os3 = objectToString(new EnhancedSnowFlake({
      base: baseConfig7,
      dataCenterId: 0,
      workerId: 123,
    }));
    expect(os1).equal(ans_os1);
    expect(os2).equal(ans_os2);
    expect(os3).equal(ans_os3);
  });
});
