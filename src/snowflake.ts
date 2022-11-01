/**
 * 标准雪花算法 - 分布式ID生成
 * js里会超过数字存储长度，需要借助buffer或者bigint实现，bigint需nodejs@v10.4.x以上版本支持
 */
import { DEFAULT_INIT_EPOCH, getMaxByBitLength, id2str, objectToString, resolved } from './utils';

// TW纪元，初始偏移时间戳 (41bit，要求小于当前时间戳大于2000年时间戳)，可用雪花算法服务初次上线时间戳的值，设置后不可以修改，修改会导致生成的ID重复，精确到毫秒
const INIT_EPOCH = DEFAULT_INIT_EPOCH;
// 数据中心ID 占用的位数
const DATA_CENTER_ID_BITS = 5;
// 数据中心ID 占用5个比特位，最大值31
const MAX_DATA_CENTER_ID = ~(-1 << DATA_CENTER_ID_BITS);
// 进程ID 占用的位数
const WORKER_ID_BITS = 5;
// 进程ID 占用5个比特位，最大值31
const MAX_WORKER_ID = ~(-1 << WORKER_ID_BITS);
// 递增序列号：最后12位，代表每毫秒内可产生最大序列号，即 2^12 - 1 = 4095
const SEQUENCE_BITS = 12;
// 递增序列号掩码（最低12位为1，高位都为0），主要用于与自增后的序列号进行位与，如果值为0，则代表自增后的序列号超过了4095
const MAX_SEQUENCE_ID = ~(-1 << SEQUENCE_BITS);
// 进程ID 需要左移的位数
const WORK_ID_SHIFT = SEQUENCE_BITS;
// 数据中心ID 需要左移的位数
const DATA_CENTER_ID_SHIFT = WORKER_ID_BITS + SEQUENCE_BITS;
const postfixLen = DATA_CENTER_ID_BITS + DATA_CENTER_ID_SHIFT; // 除时间戳之外的位数
// 时间戳 需要左移的位数
const TIMESTAMP_SHIFT = BigInt(postfixLen);
// 时间位取&，用于获取雪花算法生产的ID中的时间戳
const TIME_MASK = BigInt(getMaxByBitLength(64 - postfixLen)) << TIMESTAMP_SHIFT;
// 数据中心ID位取&，用于获取雪花算法生产的ID中的时间戳
const DATA_CENTER_ID_MASK = BigInt(getMaxByBitLength(DATA_CENTER_ID_BITS) << DATA_CENTER_ID_SHIFT);
// 进程ID位取&，用于获取雪花算法生产的ID中的时间戳
const WORKER_ID_BIT_MASK = BigInt(getMaxByBitLength(WORKER_ID_BITS) << WORK_ID_SHIFT);

export default class SnowFlake {
  // 数据中心ID或者机器ID
  private dataCenterId: number;
  // 进程ID
  private workerId: number;
  // 实例ID
  private instanceId: bigint;
  // 每毫秒递增序列号
  private seqId = 0;
  // 记录最后使用的毫秒时间戳，主要用于判断是否同一毫秒，以及用于服务器时钟回拨判断
  private __previousTime = -1;
  private __isOverFlow = false;

  constructor(dataCenterId: number, workerId: number) {
    if (dataCenterId < 0 || dataCenterId > MAX_DATA_CENTER_ID) {
      throw new Error(`[config] dataCenterId=${dataCenterId} 配置项取值必须在[0, ${MAX_DATA_CENTER_ID}]之间，请检查配置是否正确！`);
    }
    if (workerId < 0 || workerId > MAX_WORKER_ID) {
      throw new Error(`[config] workerId=${workerId} 配置项取值必须在[0, ${MAX_WORKER_ID}]之间，请检查配置是否正确！`);
    }
    this.dataCenterId = dataCenterId;
    this.workerId = workerId;
    this.instanceId = (BigInt(this.dataCenterId) << BigInt(DATA_CENTER_ID_SHIFT)) |
      (BigInt(this.workerId) << BigInt(WORK_ID_SHIFT));
    this.seqId = 0;
    this.__previousTime = -1;
    this.__isOverFlow = false;
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
      throw new Error(`出现服务器时钟回拨，请检查服务器时间。当前服务器时间：${curTimestamp}，上一次使用时间：${this.__previousTime}。`);
    }
    if (curTimestamp === this.__previousTime) {
      // 还是在同一时间内，则将序列号递增1，如果超过了最大值，则等待下一次时间
      if (this.seqId >= MAX_SEQUENCE_ID) {
        curTimestamp = this.__getNextTime(this.__previousTime);
        this.seqId = 0;
      } else {
        this.seqId++;
      }
    } else { // 不在同一时间内，则序列号重新从0开始
      this.seqId = 0;
    }
    this.__previousTime = curTimestamp;
    return (BigInt(curTimestamp - INIT_EPOCH) << TIMESTAMP_SHIFT) | this.instanceId | BigInt(this.seqId);
  }

  /**
   * 异步的方式
   */
  async nextSeqId() {
    let curTimestamp = this.__getTime();
    if (curTimestamp < this.__previousTime) {
      throw new Error(`出现服务器时钟回拨，请检查服务器时间。当前服务器时间：${curTimestamp}，上一次使用时间：${this.__previousTime}。`);
    }
    if (curTimestamp === this.__previousTime) {
      // 还是在同一时间内，则将序列号递增1，如果超过了最大值，则等待下一次时间
      if (this.__isOverFlow) {
        while(curTimestamp <= this.__previousTime) {
          // await sleep(0);
          await resolved;
          curTimestamp = this.__getTime();
        }
        this.__isOverFlow = false;
        this.seqId = 0;
      } else {
        if (this.seqId >= MAX_SEQUENCE_ID) {
          this.__isOverFlow = true;
          while(curTimestamp <= this.__previousTime) {
            // await sleep(0);
            await resolved;
            curTimestamp = this.__getTime();
          }
          this.__isOverFlow = false;
          this.seqId = 0;
        } else {
          this.seqId++;
        }
      }
    } else { // 不在同一时间内，则序列号重新从0开始
      this.seqId = 0;
      this.__isOverFlow = false;
    }
    this.__previousTime = curTimestamp;
    return (BigInt(curTimestamp - INIT_EPOCH) << TIMESTAMP_SHIFT) | this.instanceId | BigInt(this.seqId);
  }

  private __getTime() {
    return Date.now();
  }

  /**
   * 获取指定时间的接下来的时间
   * @param previousTime 指定的时间
   * @return 时间
   */
  private __getNextTime(previousTime: number) {
    let curTime = this.__getTime();
    while (curTime <= previousTime) {
      curTime = this.__getTime();
    }
    return curTime;
  }

  toString() {
    return objectToString(this);
    // return `SnowFlake { dataCenterId=${this.dataCenterId}, workerId=${this.workerId}, instanceId=${this.instanceId}, seqId=${this.seqId}, __previousTime=${this.__previousTime}, __isOverFlow=${this.__isOverFlow} }`;
  }

  public static getTimestampById(id: bigint) {
    const bi = ((id & TIME_MASK) >> TIMESTAMP_SHIFT) + BigInt(INIT_EPOCH);
    return Number(bi);
  }
  public static getDatacenteridById(id: bigint) {
    const bi = ((id & DATA_CENTER_ID_MASK) >> BigInt(DATA_CENTER_ID_SHIFT));
    return Number(bi);
  }
  public static getWorkeridById(id: bigint) {
    const bi = ((id & WORKER_ID_BIT_MASK) >> BigInt(WORK_ID_SHIFT));
    return Number(bi);
  }
  public static getSeqById(id: bigint) {
    const bi = id & BigInt(MAX_SEQUENCE_ID);
    return Number(bi);
  }
  public static deconstructed(id: bigint) {
    const time = this.getTimestampById(id);
    const dataCenterId = this.getDatacenteridById(id);
    const workerId = this.getWorkeridById(id);
    const seq = this.getSeqById(id);
    return { time, dataCenterId, workerId, seq };
  }

}
