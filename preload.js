const cp = require('child_process');
const net = require('net');

const DNS_HISTORY_ID = 'dns_history';

/**
 * 获取上游 DNS
 * @returns
 */
async function getUpstreamDNS() {
  return new Promise((resolve, _) => {
    cp.exec(
      'ipconfig getpacket en0 | grep domain_name_server',
      (err, stdout, stderr) => {
        if (err) {
          utools.showNotification(`获取上游 DNS 错误：${err}，${stderr}`);
          resolve([]);
        }
        let data = stdout.toString();
        let start = data.indexOf('{');
        let end = data.indexOf('}');
        let target = data.slice(start + 1, end);
        resolve(
          target.split(', ').map((v, idx) => ({
            title: v,
            description: idx,
          })),
        );
      },
    );
  });
}
/**
 * 设置 DNS
 * @param {string} dns
 */
function setDNS(dns) {
  if (net.isIPv4(dns)) {
    cp.exec(
      `networksetup -setdnsservers Wi-Fi ${dns}`,
      (err, _stdout, stderr) => {
        if (!err) {
          utools.showNotification(`设置 DNS 成功：${dns}`);
        } else {
          utools.showNotification(`设置 DNS 错误：${err}，${stderr}`);
        }
      },
    );
  } else {
    utools.showNotification(`"${dns}" 不是有效的 IPV4 地址`);
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
      enter: (action) => {
        cp.exec(
          'networksetup -setdnsservers Wi-Fi empty',
          (err, stdout, stderr) => {
            if (err) {
              utools.showNotification(err.toString() + '\n' + stderr);
            } else {
              utools.showNotification('已经恢复上游 DNS');
            }
          },
        );
        window.utools.outPlugin();
      },
    },
  },
  gedns: {
    mode: 'list', // 列表模式
    args: {
      enter: async (action, callbackSetList) => {
        cp.exec('networksetup -getdnsservers Wi-Fi', (err, stdout, stderr) => {
          if (stdout.trim() === "There aren't any DNS Servers set on Wi-Fi.") {
            getUpstreamDNS().then((v) => {
              utools.setSubInput(({ text }) => {
                console.log(text);
              }, '没有自定义 DNS，展示上游 DNS');
              callbackSetList(v);
            });
          } else {
            let list = stdout
              .trim()
              .split('\n')
              .map((v, idx) => ({
                title: v,
                description: idx,
              }));
            utools.setSubInput(({ text }) => {
              console.log(text);
            }, '当前 DNS');
            callbackSetList(list);
          }
        });
      },
    },
  },
  updns: {
    mode: 'list',
    args: {
      enter: async (action, callbackSetList) => {
        callbackSetList(await getUpstreamDNS());
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
