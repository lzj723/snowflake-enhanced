import { expect } from 'chai';
import { DEFAULT_INIT_EPOCH } from '../src/utils';
import EnhancedSnowFlake, {
  TIME_MODE,
  SnowFlakeBaseConfig,
  getTimeByPrecision
} from '../src/snowflake-enhanced';
// import { MODULE_NAME, logModule, logPart } from './testUtils';

function logId(sf: EnhancedSnowFlake) {
  const id = sf.syncNextSeqId();
  const { time, dataCenterId, workerId, seq } = sf.deconstructed(id);
  console.log(`id=${id}, seqStr=${sf.id2str(id)}, dataCenterId=${dataCenterId}, workerId=${workerId}, seq=${seq}, timestamp=${time}, time=${new Date(time)}`);
  // console.log(sf);
}

function logContinuousId(sf: EnhancedSnowFlake) {
  console.log(sf);
  const total = 5;
  let c = 0;
  while (c++ < total) {
    logId(sf);
  }
}

function testSF(sf: EnhancedSnowFlake, dataCenterId: number, workerId: number) {
  const curTime = getTimeByPrecision(Date.now(), sf.timePrecision);
  let c = 0;
  let lastId: bigint | undefined;
  let lastTime: number | undefined;
  while(c++ < 40) {
    const id = sf.syncNextSeqId();
    const time = getTimeByPrecision(sf.getTimeById(id), sf.timePrecision);
    const dcId = sf.getDatacenteridById(id);
    const wkId = sf.getWorkeridById(id);
    if (sf.timePrecision === TIME_MODE.MILLISECOND) {
      expect(Math.abs(time - curTime) <= 4, `${sf}, time(${time}) - curTime(${curTime}) <= 4`).true;
      expect(!lastId || time !== lastTime || id === (lastId as bigint + 1n), `${sf},  id是否递增(time(${time}) === lastTime(${lastTime}) && id(${id}) === lastId(${lastId}))`).true;
    } else {
      expect(Math.abs(time - curTime) === 0, `${sf}, time(${time}) - curTime(${curTime}) === 0`).true;
      expect(!lastId || id === (lastId as bigint + 1n), `${sf},  id是否递增(time(${time}) === lastTime(${lastTime}) && id(${id}) === lastId(${lastId}))`).true;
    }
    expect(dcId, `${sf}, dcId(${dcId}) === dataCenterId(${dataCenterId})`).equal(dataCenterId);
    expect(wkId, `${sf}, dcId(${wkId}) === dataCenterId(${workerId})`).equal(workerId);
    lastId = id;
    lastTime = time;
  }
}

const baseConfig1: SnowFlakeBaseConfig = {
  bitLength: 64,
  initEpoch: DEFAULT_INIT_EPOCH,
  timePrecision: TIME_MODE.MILLISECOND,
  timeBits: 41,
  dataCenterIdBits: 5,
  workerIdBits: 5,
  sequenceBits: 12,
};
const baseConfig2: SnowFlakeBaseConfig = {
  bitLength: 64,
  initEpoch: DEFAULT_INIT_EPOCH,
  timePrecision: TIME_MODE.MILLISECOND,
  timeBits: 41,
  dataCenterIdBits: 3,
  workerIdBits: 7,
  sequenceBits: 12,
};
const baseConfig3: SnowFlakeBaseConfig = {
  bitLength: 64,
  initEpoch: DEFAULT_INIT_EPOCH,
  timePrecision: TIME_MODE.MILLISECOND,
  timeBits: 41,
  dataCenterIdBits: 0,
  workerIdBits: 10,
  sequenceBits: 12,
};
const baseConfig4: SnowFlakeBaseConfig = {
  bitLength: 64,
  initEpoch: DEFAULT_INIT_EPOCH,
  timePrecision: TIME_MODE.SECOND,
  timeBits: 41,
  dataCenterIdBits: 10,
  workerIdBits: 0,
  sequenceBits: 12,
};
// const baseConfig5: SnowFlakeBaseConfig = {
//   bitLength: 64,
//   initEpoch: DEFAULT_INIT_EPOCH,
//   timePrecision: TIME_MODE.HOUR,
//   timeBits: 30,
//   dataCenterIdBits: 10,
//   workerIdBits: 0,
//   sequenceBits: 23,
// };
const baseConfig6: SnowFlakeBaseConfig = {
  bitLength: 53,
  initEpoch: DEFAULT_INIT_EPOCH,
  timePrecision: TIME_MODE.SECOND,
  timeBits: 32,
  dataCenterIdBits: 0,
  workerIdBits: 8,
  sequenceBits: 12,
};
const baseConfig7: SnowFlakeBaseConfig = {
  bitLength: 100,
  initEpoch: DEFAULT_INIT_EPOCH,
  timePrecision: TIME_MODE.MILLISECOND,
  timeBits: 53,
  dataCenterIdBits: 10,
  workerIdBits: 10,
  sequenceBits: 26,
};
const baseConfig8: SnowFlakeBaseConfig = {
  bitLength: 213,
  initEpoch: DEFAULT_INIT_EPOCH,
  timePrecision: TIME_MODE.MILLISECOND,
  timeBits: 53,
  dataCenterIdBits: 53,
  workerIdBits: 53,
  sequenceBits: 53,
};

describe(`${__filename}`, function() {
  const sf1_1 = new EnhancedSnowFlake({
    base: baseConfig1,
    dataCenterId: 1,
    workerId: 1,
  });
  const sf1_2 = new EnhancedSnowFlake({
    base: baseConfig1,
    dataCenterId: 2,
    workerId: 3,
  });
  const sf2_1 = new EnhancedSnowFlake({
    base: baseConfig2,
    dataCenterId: 4,
    workerId: 5,
  });
  const sf3_1 = new EnhancedSnowFlake({
    base: baseConfig3,
    dataCenterId: 0,
    workerId: 1023,
  });
  const sf4_1 = new EnhancedSnowFlake({
    base: baseConfig4,
    dataCenterId: 1023,
    workerId: 0,
  });
  // const sf5_1 = new EnhancedSnowFlake({
  //   base: baseConfig5,
  //   dataCenterId: 999,
  //   workerId: 0,
  // });
  const sf6_1 = new EnhancedSnowFlake({
    base: baseConfig6,
    dataCenterId: 0,
    workerId: 123,
  });
  const sf7_1 = new EnhancedSnowFlake({
    base: baseConfig7,
    dataCenterId: 22,
    workerId: 123,
  });
  const sf8_1 = new EnhancedSnowFlake({
    base: baseConfig8,
    dataCenterId: 2222222222222222,
    workerId: 1111111111111111,
  });
  it('测试连续产生ID是否自增', function() {
    testSF(sf1_1, 1, 1);
    testSF(sf1_2, 2, 3);
    testSF(sf2_1, 4, 5);
    testSF(sf3_1, 0, 1023);
    testSF(sf4_1, 1023, 0);
    // testSF(sf5_1, 999, 0);
    testSF(sf6_1, 0, 123);
    testSF(sf7_1, 22, 123);
    testSF(sf8_1, 2222222222222222, 1111111111111111);
  });
  it('测试连续输出ID', function() {
    logContinuousId(sf1_2);
    logContinuousId(sf3_1);
    logContinuousId(sf4_1);
    // logContinuousId(sf5_1);
    logContinuousId(sf6_1);
    logContinuousId(sf7_1);
    logContinuousId(sf8_1);
  });
});
