const net = require('net');

const utils = require('./utils');

/**
 * 获取上游 DNS
 * @returns {string[]}
 */
async function getUpstreamDNS(enName) {
  const { stdout } = await utils.execAsync(
    `ipconfig getpacket ${enName} | grep domain_name_server`
  );

  let data = stdout.toString();
  let start = data.indexOf('{');
  let end = data.indexOf('}');
  let target = data.slice(start + 1, end);

  return target.split(', ');
}

async function getAllUpstreamDNS() {
  const ifaces = await utils.getUsedNetworkInterfaces();
  const result = [];
  await Promise.all(
    ifaces.map(async (v) => {
      const li = await getUpstreamDNS(v.name);
      console.log(`🚀 ~ file: dns.js:43 ~ getUpstreamDNS ~ li:`, li);
      result.push(
        li.map((str, idx) => desc(undefined, str, idx, v.name, v.hardwarePort))
      );
    })
  );
  return result.flat();
}

async function getAllDNSInfos() {
  const ifaces = await utils.getUsedNetworkInterfaces();
  const result = {};
  ifaces.forEach((v) => {
    result[v.name] = {
      type: 'upstream',
      port: '',
      data: [],
    };
  });
  await Promise.all(
    ifaces.map(async (v) => {
      result[v.name]['port'] = v.hardwarePort;
      const { stdout } = await utils.execAsync(
        `networksetup -getdnsservers "${v.hardwarePort}"`
      );
      if (stdout.trim().includes("There aren't any DNS Servers set")) {
        result[v.name]['type'] = 'upstream';

        const li = await getUpstreamDNS(v.name);
        console.log(`🚀 ~ file: dns.js:43 ~ getUpstreamDNS ~ li:`, li);

        result[v.name]['data'] = li.map((str, idx) =>
          desc('upstream', str, idx, v.name, v.hardwarePort)
        );
      } else {
        result[v.name]['type'] = 'custom';

        let list = stdout
          .trim()
          .split('\n')
          .map((str, idx) => desc('custom', str, idx, v.name, v.hardwarePort));

        result[v.name]['data'] = list;
      }
    })
  );
  const list = Object.values(result).flat();
  return list;
}
function desc(prefix, str, idx, name, hardwarePort) {
  return {
    title: str,
    description: `${
      prefix ? `[${prefix}] ` : ''
    }[${name}: ${hardwarePort}] DNS ${idx}`,
  };
}
async function setDNSInfo(dns) {
  if (net.isIPv4(dns)) {
    const result = await utils.getUsedNetworkInterfaces();
    return Promise.all(
      result.map((v) => {
        return utils.execAsync(
          `networksetup -setdnsservers "${v.hardwarePort}" ${dns}`
        );
      })
    );
  }
  return;
}

async function clearDNS() {
  const result = await utils.getUsedNetworkInterfaces();
  return Promise.all(
    result.map(async (v) => {
      return await utils.execAsync(
        `networksetup -setdnsservers "${v.hardwarePort}" empty`
      );
    })
  );
}

module.exports = {
  getUpstreamDNS,
  getAllDNSInfos,
  setDNSInfo,
  clearDNS,
  getAllUpstreamDNS,
};
