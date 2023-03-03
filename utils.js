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

module.exports = {
  getUsedNetworkInterfaces,
  execAsync,
};
