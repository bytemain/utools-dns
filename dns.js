const net = require('net');

const { networkInterfaces } = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const _execAsync = promisify(exec);

async function execAsync(cmd) {
  console.log('[command]', cmd);
  return await _execAsync(cmd);
}

function getValidateNetworkInterfaces() {
  const interfaces = networkInterfaces();
  return Object.keys(interfaces)
    .map((name) => ({
      name,
      addresses: interfaces[name]
        .filter((v) => v.family === 'IPv4' && !v.internal)
        .map((iface) => ({
          address: iface.address,
          netmask: iface.netmask,
          family: iface.family,
          mac: iface.mac,
          internal: iface.internal,
        })),
    }))
    .filter((v) => v.addresses.length > 0);
}

async function getAllNetworkInterfaces() {
  const output = (await execAsync('networksetup -listallhardwareports')).stdout;

  const interfaceLines = output.trim().split('\n').filter(Boolean);

  return interfaceLines
    .map((line, index) => {
      if (line.includes('Device:')) {
        const name = line.split('Device:')[1].trim();
        const nextLine = interfaceLines[index + 1];
        const mac = nextLine.includes('Ethernet Address:')
          ? nextLine.split('Ethernet Address:')[1].trim()
          : null;
        const preLine = interfaceLines[index - 1];
        const hardwarePort = preLine.includes('Hardware Port:')
          ? preLine.split('Hardware Port:')[1].trim()
          : null;
        return { name, mac, hardwarePort };
      }

      return null;
    })
    .filter((iface) => iface !== null);
}

async function getUsedNetworkInterfaces() {
  const all = await getAllNetworkInterfaces();
  const valid = getValidateNetworkInterfaces().map((v) => v.name);
  return all.filter((iface) => valid.includes(iface.name));
}

/**
 * 获取上游 DNS
 * @returns {string[]}
 */
async function getUpstreamDNS(enName) {
  const { stdout } = await execAsync(
    `ipconfig getpacket ${enName} | grep domain_name_server`
  );

  let data = stdout.toString();
  let start = data.indexOf('{');
  let end = data.indexOf('}');
  let target = data.slice(start + 1, end);

  return target.split(', ');
}

async function getAllUpstreamDNS() {
  const ifaces = await getUsedNetworkInterfaces();
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
  const ifaces = await getUsedNetworkInterfaces();
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
      const { stdout } = await execAsync(
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
    const result = await getUsedNetworkInterfaces();
    return Promise.all(
      result.map((v) => {
        return execAsync(
          `networksetup -setdnsservers "${v.hardwarePort}" ${dns}`
        );
      })
    );
  }
  return;
}

async function clearDNS() {
  const result = await getUsedNetworkInterfaces();
  return Promise.all(
    result.map(async (v) => {
      return await execAsync(
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
