const cp = require('child_process');

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
            icon: '', // 图标(可选)
          })),
        );
      },
    );
  });
}
/**
 * 设置 DNS
 * @param {string}} dns
 */
function setDNS(dns) {
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
                icon: '', // 图标(可选)
              }));
            utools.setSubInput(({ text }) => {
              console.log(text);
            }, '当前 DNS');
            callbackSetList(list);
          }
        });
      },
      // 用户选择列表中某个条目时被调用
      select: (action, itemData, callbackSetList) => {
        window.utools.outPlugin();
      },
    },
  },
  updns: {
    mode: 'list',
    args: {
      enter: async (action, callbackSetList) => {
        const list = await getUpstreamDNS();
        callbackSetList(list);
      },
      // 用户选择列表中某个条目时被调用
      select: (action, itemData, callbackSetList) => {
        window.utools.outPlugin();
      },
      // 子输入框为空时的占位符，默认为字符串"搜索"
      placeholder: '上游 DNS',
    },
  },
  sedns: {
    mode: 'list',
    args: {
      enter: (action, callbackSetList) => {
        if (action.type === 'text') {
          utools.setSubInput(({ text }) => {
            console.log(text);
          }, '历史记录');
          const { data } = utools.db.get('dns_history');
          let list = [];
          if (data) {
            list = JSON.parse(data);
          }
          callbackSetList(
            list.map((v, idx) => ({
              title: v,
              description: idx,
              icon: '', // 图标(可选)
            })),
          );
        } else if (action.type === 'regex') {
          // 解析 Regex
          let reg = /sedns\s?(\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3})?/;
          let result = action.payload.match(reg);
          if (result[1] !== undefined) {
            // 保存历史
            setDNS(result[1]);
            let _put = {
              _id: 'dns_history',
            };
            const history = utools.db.get('dns_history');
            if (history) {
              const { data, _rev } = history;
              _result = JSON.parse(data);
              _result.push(result[1]);
              _put.data = JSON.stringify(_result);
              _put._rev = _rev;
            } else {
              _put.data = JSON.stringify([result[1]]);
            }

            utools.db.put(_put);
            window.utools.outPlugin();
          }
        }
      },
      // 用户选择列表中某个条目时被调用
      select: (action, itemData, callbackSetList) => {
        // 获取用户选中的条目 title，也就是我们要设置的 DNS
        let dns = itemData.title;
        setDNS(dns);
        window.utools.outPlugin();
      },
      // 子输入框为空时的占位符，默认为字符串"搜索"
      placeholder: '历史记录',
    },
  },
};
