const cp = require('child_process');
const net = require('net');
const { promisify } = require('util');

const utils = require('./utils');
const dns = require('./dns');

const DNS_HISTORY_ID = 'dns_history';

/**
 * 设置 DNS
 * @param {string} dnsStr
 */
async function setDNS(dnsStr) {
  if (net.isIPv4(dnsStr)) {
    await dns.setDNSInfo(dnsStr);
    const result = await utils.getUsedNetworkInterfaces();
    result.forEach((v) => {
      utools.showNotification(
        `[${v.name} ${v.hardwarePort}] 设置 DNS 成功：${dnsStr}`
      );
    });
  } else {
    utools.showNotification(`"${dnsStr}" 不是有效的 IPV4 地址`);
  }
}

async function getHistoryDNS() {
  const db = utools.db.get(DNS_HISTORY_ID);
  let list = [];
  if (db) {
    list = JSON.parse(db.data);
    return list.map((v, idx) => ({
      title: v,
      description: idx,
    }));
  } else {
    return [
      {
        title: '无',
        description: '!!没有历史记录，请输入你要设置的 DNS',
      },
    ];
  }
}

/**
 * 保存历史
 * @param {string}} dns
 */
function addHistoryDNS(dns) {
  let _put = {
    _id: DNS_HISTORY_ID,
  };
  const history = utools.db.get(DNS_HISTORY_ID);
  if (history) {
    const { data, _rev } = history;
    _result = JSON.parse(data);
    for (let i = 0; i < _result.length; i++) {
      const element = _result[i];
      if (dns === element) {
        _result.splice(i, 1);
      }
    }
    _result.unshift(dns);
    _put.data = JSON.stringify(_result);
    _put._rev = _rev;
  } else {
    _put.data = JSON.stringify([dns]);
  }
  utools.db.put(_put);
}

window.exports = {
  redns: {
    mode: 'none',
    args: {
      enter: async (action) => {
        await dns.clearDNS();
        utools.showNotification('已经恢复上游 DNS');
        window.utools.outPlugin();
      },
    },
  },
  gedns: {
    mode: 'list', // 列表模式
    args: {
      enter: async (action, callbackSetList) => {
        const list = await dns.getAllDNSInfos();
        const result = [];
        list.forEach((v) => {
          result.push(v.data);
        });
        callbackSetList(result.flat());
      },
    },
  },
  updns: {
    mode: 'list',
    args: {
      enter: async (action, callbackSetList) => {
        const data = await dns.getAllUpstreamDNS();
        callbackSetList(data);
      },
      placeholder: '路由器分配的 DNS',
    },
  },
  sedns: {
    mode: 'list',
    args: {
      enter: async (action, callbackSetList) => {
        if (action.type === 'text') {
          const list = await getHistoryDNS();
          callbackSetList(list);
          return;
        }
        if (action.type === 'regex') {
          // 解析 Regex
          let result = net.isIPv4(action.payload);
          if (result[1] !== undefined) {
            setDNS(result[1]);
            addHistoryDNS(result[1]);
            window.utools.outPlugin();
          }
        }
      },
      select: (action, itemData, callbackSetList) => {
        // 获取用户选中的条目 title，也就是我们要设置的 DNS
        setDNS(itemData.title);
        addHistoryDNS(itemData.title);
        window.utools.outPlugin();
      },
      search: async (action, searchWord, callbackSetList) => {
        if (!searchWord) {
          const list = await getHistoryDNS();
          callbackSetList(list);
          return;
        }
        let description = '回车确认设置当前 DNS';
        if (!net.isIPv4(searchWord)) {
          description = '!! DNS 格式错误 !!';
        }
        callbackSetList([
          {
            title: searchWord,
            description,
          },
        ]);
      },
      placeholder: '选择历史记录，或者直接输入 DNS',
    },
  },
};
