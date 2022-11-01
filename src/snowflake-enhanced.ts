/**
 * 增强版雪花算法 - 分布式ID生成
 * js里会超过数字存储长度，需要借助buffer或者bigint实现，bigint需nodejs@v10.4.x以上版本支持
 */
import { MIN_INIT_EPOCH, DEFAULT_INIT_EPOCH, getMaxByBitLength, id2str, objectToString } from './utils';

const MAX_SAFE_BITS = 53; // JS数字最大安全位数，超过会丢失精度
// 最大位运算符操作的位数量，JS将数字存储为 64 位浮点数，但所有按位运算都以 32 位二进制数执行，在执行位运算之前，将数字转换为 32 位有符号整数
// const MAX_BIT_OPR = 32;
// let sfInstanceId = 0;

/**
 * 每种时间单位的毫秒数
 * 考虑到服务重启后时间冲突的概率太大，分钟及以上的暂不支持
 */
export enum TIME_UNIT_MS {
  // DAY = 24 * 60 * 60 * 1000,
  // HOUR = 60 * 60 * 1000,
  // MINUTE = 60 * 1000,
  SECOND = 1000,
  MILLISECOND = 1
}
/**
 * 时间精度：毫秒/秒/分钟/小时/天
 * 考虑到服务重启后时间冲突的概率太大，分钟及以上的暂不支持
 */
export enum TIME_MODE {
  // DAY = 'day',
  // HOUR = 'hour',
  // MINUTE = 'minute',
  SECOND = 'second',
  MILLISECOND = 'millisecond'
}

export function getTimeByPrecision(ms: number, precision: TIME_MODE) {
  switch (precision) {
    case TIME_MODE.SECOND:
      return Math.floor(ms / TIME_UNIT_MS.SECOND);
    // case TIME_MODE.MINUTE:
    //   return Math.floor(ms / TIME_UNIT_MS.MINUTE);
    // case TIME_MODE.HOUR:
    //   return Math.floor(ms / TIME_UNIT_MS.HOUR);
    // case TIME_MODE.DAY:
    //   return Math.floor(ms / TIME_UNIT_MS.DAY);
  }
  return Math.floor(ms);
}
export function getTimestampByIDTime(time: number, precision: TIME_MODE) {
  switch (precision) {
    case TIME_MODE.SECOND:
      return time * TIME_UNIT_MS.SECOND;
    // case TIME_MODE.MINUTE:
    //   return time * TIME_UNIT_MS.MINUTE;
    // case TIME_MODE.HOUR:
    //   return time * TIME_UNIT_MS.HOUR;
    // case TIME_MODE.DAY:
    //   return time * TIME_UNIT_MS.DAY;
  }
  return time;
}

export interface SnowFlakeBaseConfig {
  bitLength: number; // 雪花算法位数，默认64位
  timePrecision: TIME_MODE; // 时间精度，毫秒/秒/分钟/小时/天
  initEpoch: number; // TW纪元，初始偏移时间戳 (41bit，要求小于当前时间戳大于2000年时间戳)，可用雪花算法服务初次上线时间戳的值，设置后不可以修改，修改会导致生成的ID重复，精确到毫秒
  timeBits: number;
  dataCenterIdBits: number;
  workerIdBits: number;
  sequenceBits: number;
}
export interface SnowFlakeConfig {
  base?: SnowFlakeBaseConfig;
  dataCenterId: number; // 数据中心ID
  workerId: number; // 进程ID
}

const defaultConfig: SnowFlakeBaseConfig = {
  bitLength: 64,
  initEpoch: DEFAULT_INIT_EPOCH,
  timePrecision: TIME_MODE.MILLISECOND,
  timeBits: 41,
  dataCenterIdBits: 5,
  workerIdBits: 5,
  sequenceBits: 12,
};

export default class SnowFlakeEnhanced {
  // private id: number;
  // 雪花算法位数，默认64位，JS里也可指定<=53位
  private SNOWFLAKE_BITS: number;
  // 时间的精度
  private TIME_PRECISION: TIME_MODE;
  // 初始时间戳(纪年)，可用雪花算法服务初次上线时间戳的值，设置后不可以修改，修改会导致生成的ID重复
  private INIT_EPOCH: number;
  // 时间 占用的位数
  private TIME_BITS: number;
  // 数据中心ID 占用的位数
  private DATA_CENTER_ID_BITS: number;
  // 数据中心ID最大值
  private MAX_DATA_CENTER_ID: number;
  // 进程ID 占用的位数
  private WORKER_ID_BITS: number;
  // 进程ID最大值
  private MAX_WORKER_ID: number;
  // 递增序列号
  private SEQUENCE_BITS: number;
  // 最大递增序列号
  private MAX_SEQUENCE_ID: number;
  // 进程ID 需要左移的位数
  private WORK_ID_SHIFT: number;
  // 数据中心ID 需要左移的位数
  private DATA_CENTER_ID_SHIFT: number;
  // 时间戳 需要左移的位数
  private TIMESTAMP_SHIFT: bigint; // 为了提高性能，提前转换成bigint类型
  // 时间位取&，用于获取雪花算法生产的ID中的时间戳
  private TIME_MASK: bigint;
  // 数据中心ID位取&，用于获取雪花算法生产的ID中的时间戳
  private DATA_CENTER_ID_MASK: bigint;
  // 进程ID位取&，用于获取雪花算法生产的ID中的时间戳
  private WORKER_ID_BIT_MASK: bigint;

  // 数据中心ID或者机器ID
  private dataCenterId: number;
  // 进程ID
  private workerId: number;
  // 实例ID
  private instanceId: bigint;
  // 单位时间内的递增序列号
  private seqId = 0;
  // 记录最后使用的时间，主要用于判断是否同一时间，以及用于服务器时钟回拨判断
  private __previousTime = -1;
  // private __isOverFlow = false;

  constructor(config: SnowFlakeConfig) {
    // console.log(JSON.stringify(config));
    const baseConfig = { ...defaultConfig, ...(config.base || {}) };
    this.SNOWFLAKE_BITS = Math.floor(baseConfig.bitLength);
    this.TIME_PRECISION = baseConfig.timePrecision;
    this.INIT_EPOCH = getTimeByPrecision(baseConfig.initEpoch, this.TIME_PRECISION);
    this.TIME_BITS = Math.floor(baseConfig.timeBits);
    this.DATA_CENTER_ID_BITS = Math.floor(baseConfig.dataCenterIdBits);
    this.WORKER_ID_BITS = Math.floor(baseConfig.workerIdBits);
    this.SEQUENCE_BITS = Math.floor(baseConfig.sequenceBits);

    if (baseConfig.initEpoch < MIN_INIT_EPOCH || baseConfig.initEpoch > Date.now()) {
      throw new Error(`[config] initEpoch=${baseConfig.initEpoch} 配置项取值应该在 2000-01-01 00:00:00时间戳 和 当前时间戳 之间，请检查配置是否正确！`);
    }
    if (this.TIME_BITS < 0 || this.TIME_BITS > MAX_SAFE_BITS) {
      throw new Error(`[config] timeBits=${baseConfig.timeBits} 配置项取值应该在[0, ${MAX_SAFE_BITS}]之间，请检查配置是否正确！`);
    }
    if (this.DATA_CENTER_ID_BITS < 0 || this.DATA_CENTER_ID_BITS > MAX_SAFE_BITS) {
      throw new Error(`[config] dataCenterIdBits=${baseConfig.dataCenterIdBits} 配置项取值必须在[0, ${MAX_SAFE_BITS}]之间，请检查配置是否正确！`);
    }
    if (this.WORKER_ID_BITS < 0 || this.WORKER_ID_BITS > MAX_SAFE_BITS) {
      throw new Error(`[config] workerIdBits=${baseConfig.workerIdBits} 配置项取值必须在[0, ${MAX_SAFE_BITS}]之间，请检查配置是否正确！`);
    }
    if (this.SEQUENCE_BITS < 10 || this.SEQUENCE_BITS > MAX_SAFE_BITS) {
      throw new Error(`[config] sequenceBits=${baseConfig.sequenceBits} 配置项取值必须在[10, ${MAX_SAFE_BITS}]之间，请检查配置是否正确！`);
    }
    if (this.SNOWFLAKE_BITS < 10 || this.SNOWFLAKE_BITS > 213) {
      throw new Error(`[config] bitLength=${baseConfig.bitLength} 配置项取值必须在[10, 213]之间，请检查配置是否正确！`);
    }
    if (this.TIME_BITS + this.DATA_CENTER_ID_BITS + this.WORKER_ID_BITS + this.SEQUENCE_BITS !== this.SNOWFLAKE_BITS - 1) {
      throw new Error(`[config] (timeBits+dataCenterIdBits+workerIdBits+sequenceBits) !== ${this.SNOWFLAKE_BITS - 1}!`);
    }

    // 数据中心ID最大值
    this.MAX_DATA_CENTER_ID = getMaxByBitLength(this.DATA_CENTER_ID_BITS);
    // 进程ID最大值
    this.MAX_WORKER_ID = getMaxByBitLength(this.WORKER_ID_BITS);
    // 最大递增序列号
    this.MAX_SEQUENCE_ID = getMaxByBitLength(this.SEQUENCE_BITS);
    // 进程ID 需要左移的位数
    this.WORK_ID_SHIFT = this.SEQUENCE_BITS;
    // 数据中心ID 需要左移的位数
    this.DATA_CENTER_ID_SHIFT = this.WORKER_ID_BITS + this.SEQUENCE_BITS;
    // 时间戳 需要左移的位数
    this.TIMESTAMP_SHIFT = BigInt(this.DATA_CENTER_ID_BITS + this.DATA_CENTER_ID_SHIFT); // 除时间戳之外的位数
    // 时间位取&，用于获取雪花算法生产的ID中的时间戳
    this.TIME_MASK = BigInt(getMaxByBitLength(this.TIME_BITS)) << this.TIMESTAMP_SHIFT;
    // 数据中心ID位取&，用于获取雪花算法生产的ID中的时间戳
    this.DATA_CENTER_ID_MASK = BigInt(getMaxByBitLength(this.DATA_CENTER_ID_BITS)) << BigInt(this.DATA_CENTER_ID_SHIFT);
    // 进程ID位取&，用于获取雪花算法生产的ID中的时间戳
    this.WORKER_ID_BIT_MASK = BigInt(getMaxByBitLength(this.WORKER_ID_BITS)) << BigInt(this.WORK_ID_SHIFT);

    const { dataCenterId, workerId } = config;
    if (dataCenterId < 0 || dataCenterId > this.MAX_DATA_CENTER_ID) {
      throw new Error(`[config] dataCenterId=${dataCenterId} 配置项取值必须在[0, ${this.MAX_DATA_CENTER_ID}]之间，请检查配置是否正确！`);
    }
    if (workerId < 0 || workerId > this.MAX_WORKER_ID) {
      throw new Error(`[config] workerId=${workerId} 配置项取值必须在[0, ${this.MAX_WORKER_ID}]之间，请检查配置是否正确！`);
    }

    this.dataCenterId = dataCenterId;
    this.workerId = workerId;
    this.instanceId = (BigInt(this.dataCenterId) << BigInt(this.DATA_CENTER_ID_SHIFT)) |
      (BigInt(this.workerId) << BigInt(this.WORK_ID_SHIFT));
    this.seqId = 0;
    this.__previousTime = this.__getTime();
    // this.__isOverFlow = false;
    // this.id = ++sfInstanceId;
    // console.log(this.id, this);
  }

  static id2str(id: bigint, radix = 36) {
    return id2str(id, radix);
  }

  id2str(id: bigint, radix = 36) {
    return id2str(id, radix);
  }

  syncNextSeqStr(radix = 36) {
    return this.id2str(this.syncNextSeqId(), radix);
  }

  async nextSeqStr(radix = 36) {
    const id = await this.nextSeqId();
    return this.id2str(id, radix);
  }

  /**
   * 同步的方式
   */
  syncNextSeqId() {
    let curTimestamp = this.__getTime();
    if (curTimestamp < this.__previousTime) {
      curTimestamp = this.__previousTime; // 高可用: 如果出现时钟回拨，则使用上次的时间，不报错
      // throw new Error(`出现服务器时钟回拨，请检查服务器时间。当前服务器时间：${curTimestamp}，上一次使用时间：${this.__previousTime}。`);
    }
    if (curTimestamp === this.__previousTime) {
      // 还是在同一时间内，则将序列号递增1，如果超过了最大值，则等待下一次时间
      if (this.seqId >= this.MAX_SEQUENCE_ID) {
        // curTimestamp = this.__getNextTime(this.__previousTime);
        curTimestamp = this.__previousTime + 1; // 高可用: 序列号溢出则向时间位进一位
        this.seqId = 0;
      } else {
        this.seqId++;
      }
    } else { // 不在同一时间内，则序列号重新从0开始
      this.seqId = 0;
    }
    this.__previousTime = curTimestamp;
    return (BigInt(curTimestamp - this.INIT_EPOCH) << this.TIMESTAMP_SHIFT) | this.instanceId | BigInt(this.seqId);
  }

  /**
   * 异步的方式
   */
  async nextSeqId() {
    let curTimestamp = this.__getTime();
    if (curTimestamp < this.__previousTime) {
      curTimestamp = this.__previousTime; // 高可用: 如果出现时钟回拨，则使用上次的时间，不报错
      // throw new Error(`出现服务器时钟回拨，请检查服务器时间。当前服务器时间：${curTimestamp}，上一次使用时间：${this.__previousTime}。`);
    }
    if (curTimestamp === this.__previousTime) {
      // 还是在同一时间内，则将序列号递增1，如果超过了最大值，则等待下一次时间
      if (this.seqId >= this.MAX_SEQUENCE_ID) {
        curTimestamp = this.__previousTime + 1; // 高可用: 序列号溢出则向时间位进一位
        this.seqId = 0;
      } else {
        this.seqId++;
      }
      // if (this.__isOverFlow) {
      //   while(curTimestamp <= this.__previousTime) {
      //     // await sleep(0);
      //     await resolved;
      //     curTimestamp = this.__getTime();
      //   }
      //   this.__isOverFlow = false;
      //   this.seqId = 0;
      // } else {
      //   if (this.seqId >= this.MAX_SEQUENCE_ID) {
      //     this.__isOverFlow = true;
      //     while(curTimestamp <= this.__previousTime) {
      //       // await sleep(0);
      //       await resolved;
      //       curTimestamp = this.__getTime();
      //     }
      //     this.__isOverFlow = false;
      //     this.seqId = 0;
      //   } else {
      //     this.seqId++;
      //   }
      // }
    } else { // 不在同一时间内，则序列号重新从0开始
      this.seqId = 0;
      // this.__isOverFlow = false;
    }
    this.__previousTime = curTimestamp;
    return (BigInt(curTimestamp - this.INIT_EPOCH) << this.TIMESTAMP_SHIFT) | this.instanceId | BigInt(this.seqId);
  }

  private __getTime() {
    return getTimeByPrecision(Date.now(), this.TIME_PRECISION);
  }

  /**
   * 获取指定时间的接下来的时间
   * @param previousTime 指定的时间
   * @return 时间
   */
  // private __getNextTime(previousTime: number) {
  //   let curTime = this.__getTime();
  //   while (curTime <= previousTime) {
  //     curTime = this.__getTime();
  //   }
  //   return curTime;
  // }

  public getTimeById(id: bigint) {
    return getTimestampByIDTime(Number((id & this.TIME_MASK) >> this.TIMESTAMP_SHIFT) + this.INIT_EPOCH, this.TIME_PRECISION);
  }
  public getDatacenteridById(id: bigint) {
    const bi = ((id & this.DATA_CENTER_ID_MASK) >> BigInt(this.DATA_CENTER_ID_SHIFT));
    return Number(bi);
  }
  public getWorkeridById(id: bigint) {
    const bi = ((id & this.WORKER_ID_BIT_MASK) >> BigInt(this.WORK_ID_SHIFT));
    return Number(bi);
  }
  public getSeqById(id: bigint) {
    const bi = id & BigInt(this.MAX_SEQUENCE_ID);
    return Number(bi);
  }
  public deconstructed(id: bigint) {
    const time = this.getTimeById(id);
    const dataCenterId = this.getDatacenteridById(id);
    const workerId = this.getWorkeridById(id);
    const seq = this.getSeqById(id);
    return { time, dataCenterId, workerId, seq };
  }

  get timePrecision() {
    return this.TIME_PRECISION;
  }

  toString() {
    return objectToString(this);
  }

}
