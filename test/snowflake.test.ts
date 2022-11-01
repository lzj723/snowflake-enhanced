import { expect } from 'chai';
import SnowFlake from '../src/snowflake';

function logId(id: bigint) {
  const { time, dataCenterId, workerId, seq } = SnowFlake.deconstructed(id);
  console.log(`id=${id}, seqStr=${SnowFlake.id2str(id)}, dataCenterId=${dataCenterId}, workerId=${workerId}, seq=${seq}, timestamp=${time}, time=${new Date(time)}`);
}

function logContinuousId(sf: SnowFlake) {
  console.log(sf);
  const total = 5;
  let c = 0;
  while (c++ < total) {
    logId(sf.syncNextSeqId());
  }
}

function testSF(sf: SnowFlake, dataCenterId: number, workerId: number) {
  const curTime = Date.now();
  let c = 0;
  let lastId: bigint | undefined;
  let lastTime: number | undefined;
  while(c++ < 10) {
    const id = sf.syncNextSeqId();
    const time = SnowFlake.getTimestampById(id);
    const dcId = SnowFlake.getDatacenteridById(id);
    const wkId = SnowFlake.getWorkeridById(id);
    expect(Math.abs(time - curTime) <= 1, `${sf}, time(${time}) - curTime(${curTime}) <= 1`).true;
    expect(!lastId || time !== lastTime || id === (lastId as bigint + 1n), `${sf},  id是否递增(time(${time}) === lastTime(${lastTime}) && id(${id}) === lastId(${lastId}))`).true;
    expect(dcId, `${sf}, dcId(${dcId}) === dataCenterId(${dataCenterId})`).equal(dataCenterId);
    expect(wkId, `${sf}, dcId(${wkId}) === dataCenterId(${workerId})`).equal(workerId);
    lastId = id;
    lastTime = time;
  }
}

describe(`${__filename}`, function() {
  const sf1 = new SnowFlake(1, 1);
  const sf2 = new SnowFlake(2, 3);
  const sf3 = new SnowFlake(4, 5);
  const sf4 = new SnowFlake(31, 31);
  it('测试连续产生ID是否自增', function() {
    testSF(sf1, 1, 1);
    testSF(sf2, 2, 3);
    testSF(sf3, 4, 5);
    testSF(sf4, 31, 31);
  });
  it('测试连续输出ID', function() {
    logContinuousId(sf1);
    logContinuousId(sf2);
    logContinuousId(sf3);
    logContinuousId(sf4);
  });
});
