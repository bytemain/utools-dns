const dns = require('../dns');
const utils = require('../utils');

describe('dns related', () => {
  it('can get upstream dns', async () => {
    const result = await dns.getUpstreamDNS('en0');
    console.log(`🚀 ~ file: dns.test.js:6 ~ it ~ result:`, result);
    expect(result.length).toBeGreaterThan(0);
  });
  it('can get all upstream dns', async () => {
    const result = await dns.getAllUpstreamDNS();
    console.log(`🚀 ~ file: dns.test.js:6 ~ it ~ result:`, result);
    expect(result.length).toBeGreaterThan(0);
  });
  it('can get network interfaces', async () => {
    const result = await utils.getUsedNetworkInterfaces();
    console.log(`🚀 ~ file: dns.test.js:12 ~ it ~ result:`, result);
    expect(result.length).toBeGreaterThan(0);
  });
  it('can get all dns infos', async () => {
    await dns.setDNSInfo('127.0.0.1');
    const result = await dns.getAllDNSInfos();
    console.log(`🚀 ~ file: dns.test.js:17 ~ it ~ result:`, result);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('type', 'custom');
    await dns.clearDNS();
    const result1 = await dns.getAllDNSInfos();
    console.log(`🚀 ~ file: dns.test.js:23 ~ it ~ result1:`, result1);
    expect(result1.length).toBeGreaterThan(0);
    expect(result1[0]).toHaveProperty('type', 'upstream');
  });
});
