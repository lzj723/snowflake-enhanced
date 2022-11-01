/**
 * [性能测试]
 * 经过测试，snowflake.ts、snowflake-enhanced.ts 的性能，大概是以下NPM库的三倍
 */
import { DEFAULT_INIT_EPOCH } from '../src/utils';
import SnowFlake from '../src/snowflake';
import EnhancedSnowFlake, {
  TIME_MODE,
} from '../src/snowflake-enhanced';
import { MODULE_NAME, logPart } from './testUtils';
import { Generator as SnowFlakeGen } from 'snowflake-generator';
import { Snowflake as NodeSnowFlake } from 'nodejs-snowflake';
import FlakeIdGen from 'flake-idgen';
import { simpleflake } from 'simpleflakes';
// import AxiheSnowflake from '@axihe/snowflake';
// import UUID from 'uuid-int';

const GEN_ID_COUNT = 100 * 10000;

describe(`${__filename}`, function() {
  // logModule(MODULE_NAME.SnowFlake);
  logPart(MODULE_NAME.SnowFlake, '性能测试');
  (function() {
    function logPerf(sf: SnowFlake, max: number) {
      const startTime = Date.now();
      for (let i = 0; i < max; i++) {
        sf.syncNextSeqId();
      }
      const endTime = Date.now();
      const avg = Math.round(max / ((endTime - startTime) / 1000));
      console.log(`[性能] 总共生成${max}个ID, 耗时: ${endTime - startTime}ms, 平均${Math.round(avg/10000)}w/s (${avg}个/秒)`);
    }

    const pfsf = new SnowFlake(1, 2);
    logPerf(pfsf, GEN_ID_COUNT);
  })();

  logPart(MODULE_NAME.EnhancedSnowFlake, '性能测试');
  (function() {
    function logPerf(sf: EnhancedSnowFlake, max: number) {
      // const map = new Map<bigint, boolean>();
      const startTime = Date.now();
      // let id: bigint;
      for (let i = 0; i < max; i++) {
        sf.syncNextSeqId();
        // if (map.has(id)) {
        //   console.error(id);
        // } else {
        //   map.set(id, true);
        // }
      }
      const endTime = Date.now();
      const avg = Math.round(max / ((endTime - startTime) / 1000));
      console.log(`[性能] 总共生成${max}个ID, 耗时: ${endTime - startTime}ms, 平均${Math.round(avg/10000)}w/s (${avg}个/秒)`);
    }
    
    const pfsf = new EnhancedSnowFlake({
      base: {
        bitLength: 64,
        initEpoch: DEFAULT_INIT_EPOCH, // 2022-01-01 00:00:00;
        timePrecision: TIME_MODE.MILLISECOND,
        timeBits: 41,
        dataCenterIdBits: 5,
        workerIdBits: 5,
        sequenceBits: 12,
      },
      dataCenterId: 1, // 数据中心ID
      workerId: 1, // 进程ID
    });
    logPerf(pfsf, GEN_ID_COUNT);
  })();

  logPart(MODULE_NAME.SnowFlakeGen, '性能测试');
  function logFlakeGenPerf(sf: SnowFlakeGen, max: number) {
    const startTime = Date.now();
    for (let i = 0; i < max; i++) {
      sf.generate();
    }
    const endTime = Date.now();
    const avg = Math.round(max / ((endTime - startTime) / 1000));
    console.log(`[性能] 总共生成${max}个ID, 耗时: ${endTime - startTime}ms, 平均${Math.round(avg/10000)}w/s (${avg}个/秒)`);
  }
  const flakeGen = new SnowFlakeGen(DEFAULT_INIT_EPOCH, 1);
  logFlakeGenPerf(flakeGen, 100 * 10000);

  logPart(MODULE_NAME.NodeSnowFlake, '性能测试');
  function logNodeFlakePerf(sf: NodeSnowFlake, max: number) {
    const startTime = Date.now();
    for (let i = 0; i < max; i++) {
      sf.getUniqueID();
    }
    const endTime = Date.now();
    const avg = Math.round(max / ((endTime - startTime) / 1000));
    console.log(`[性能] 总共生成${max}个ID, 耗时: ${endTime - startTime}ms, 平均${Math.round(avg/10000)}w/s (${avg}个/秒)`);
  }
  const nodeFlake = new NodeSnowFlake({
    custom_epoch: DEFAULT_INIT_EPOCH,
    instance_id: 1,
  });
  logNodeFlakePerf(nodeFlake, GEN_ID_COUNT);

  logPart(MODULE_NAME.FlakeIdGen, '性能测试');
  function logIdGenPerf(sf: FlakeIdGen, max: number) {
    const startTime = Date.now();
    for (let i = 0; i < max; i++) {
      sf.next(errorHandler);
    }
    const endTime = Date.now();
    const avg = Math.round(max / ((endTime - startTime) / 1000));
    console.log(`[性能] 总共生成${max}个ID, 耗时: ${endTime - startTime}ms, 平均${Math.round(avg/10000)}w/s (${avg}个/秒)`);
  }
  function errorHandler(err?: Error) {
    err && console.error(err);
  }
  const flakeIdGen = new FlakeIdGen();
  logIdGenPerf(flakeIdGen, GEN_ID_COUNT);

  logPart(MODULE_NAME.SimpleFlakes, '性能测试');
  function logIdSimpleFlake(sf: typeof simpleflake, max: number) {
    const startTime = Date.now();
    for (let i = 0; i < max; i++) {
      sf();
    }
    const endTime = Date.now();
    const avg = Math.round(max / ((endTime - startTime) / 1000));
    console.log(`[性能] 总共生成${max}个ID, 耗时: ${endTime - startTime}ms, 平均${Math.round(avg/10000)}w/s (${avg}个/秒)`);
  }
  logIdSimpleFlake(simpleflake, GEN_ID_COUNT);

  // logPart(MODULE_NAME.AxiheSnowflake, '性能测试');
  // function logAxiheFlake(sf: AxiheSnowflake, max: number) {
  //   const startTime = Date.now();
  //   for (let i = 0; i < max; i++) {
  //     sf.nextId();
  //   }
  //   const endTime = Date.now();
  //   const avg = Math.round(max / ((endTime - startTime) / 1000));
  //   console.log(`[性能] 总共生成${max}个ID, 耗时: ${endTime - startTime}ms, 平均${Math.round(avg/10000)}w/s (${avg}个/秒)`);
  // }
  // const idWorker = new AxiheSnowflake(1, 0);
  // logAxiheFlake(idWorker, GEN_ID_COUNT);

  // // 不具有对比下，可以参考借鉴，每个进程每秒只能产生4096个ID
  // logPart(MODULE_NAME.UUIDInt, '性能测试');
  // function logUUID(sf: UUID.Generator, max: number) {
  //   const startTime = Date.now();
  //   for (let i = 0; i < max; i++) {
  //     sf.uuid();
  //   }
  //   const endTime = Date.now();
  //   const avg = Math.round(max / ((endTime - startTime) / 1000));
  //   console.log(`[性能] 总共生成${max}个ID, 耗时: ${endTime - startTime}ms, 平均${Math.round(avg/10000)}w/s (${avg}个/秒)`);
  // }
  // const generator = UUID(0);
  // logUUID(generator, GEN_ID_COUNT);
});
