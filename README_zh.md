
# 雪花算法增强版 - 分布式ID生成

## Features
1、支持设置雪花算法位数 √
2、支持设置各个字段的位数 √
3、支持设置时间字段的精确度 √
4、支持时间回拨 ×
5、支持计数溢出处理 ×
6、支持调整字段的位置 ×
7、错误事件监听 ×

## 版本支持
NodeJS@v10.4.x+
> 由于雪花算法默认使用64位长度，并且超过53位长度数字在js无法精确存储，所以需要借助bigint实现，bigint需nodejs@v10.4以上版本支持

## 参考文章
https://blog.csdn.net/jiaomubai/article/details/124385324
https://www.jianshu.com/p/7680f88b990b

## 参考NPM包
https://www.npmjs.com/package/nodejs-snowflake
https://www.npmjs.com/package/flake-idgen
https://www.npmjs.com/package/simpleflakes
https://www.npmjs.com/package/snowflake-generator
https://www.npmjs.com/package/@axihe/snowflake
https://www.npmjs.com/package/uuid-int (不具有对比下，可以参考借鉴，每个进程每秒只能产生4096个ID)

## 其他ID生成方式

### uuid
https://www.npmjs.com/package/uuid

### nanoid
https://github.com/ai/nanoid/blob/main/index.js
