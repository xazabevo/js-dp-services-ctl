const DapiClient = require('@xazabevo/dapi-client');

/**
 * @param {number} rpcPort
 * @param {number} nativeGrpcPort
 * @return {DAPIClient}
 */
function createDapiClient(rpcPort, nativeGrpcPort) {
  return new DapiClient({
    addresses: [{
      host: '127.0.0.1',
      httpPort: rpcPort,
      grpcPort: nativeGrpcPort,
    }],
  });
}

module.exports = createDapiClient;
