const removeContainers = require('../../../lib/docker/removeContainers');
const { startDrive } = require('../../../lib');

describe('startDrive', function main() {
  this.timeout(180000);

  before(removeContainers);

  describe('One node', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let driveNode;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = {
        xazabCore: { container },
        drive: { container },
      };

      driveNode = await startDrive(options);
    });

    after(async () => driveNode.remove());

    it('should have XazabCore container running', async () => {
      const { State } = await driveNode.xazabCore.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have MongoDb container running', async () => {
      const { State } = await driveNode.mongoDb.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have Drive ABCI container running', async () => {
      const { State, Mounts } = await driveNode.driveAbci.container.inspect();

      expect(State.Status).to.equal('running');
      expect(Mounts.map(mount => mount.Destination)).to.include(CONTAINER_VOLUME);
    });

    it('should have proper env variables set for Drive container', async () => {
      const { Config: { Env: ApiEnvs } } = await driveNode.driveAbci.container.inspect();

      const expectedEnv = [
        `CORE_JSON_RPC_HOST=${driveNode.xazabCore.getIp()}`,
        `CORE_JSON_RPC_PORT=${driveNode.xazabCore.options.getRpcPort()}`,
        `CORE_JSON_RPC_USERNAME=${driveNode.xazabCore.options.getRpcUser()}`,
        `CORE_JSON_RPC_PASSWORD=${driveNode.xazabCore.options.getRpcPassword()}`,
        `DOCUMENT_MONGODB_URL=mongodb://${driveNode.mongoDb.getIp()}:${driveNode.mongoDb.options.getMongoPort()}`,
      ];

      const apiEnvs = ApiEnvs.filter(variable => expectedEnv.indexOf(variable) !== -1);

      expect(apiEnvs.length).to.equal(expectedEnv.length);
    });

    it('should have all of the containers on the same network', async () => {
      const {
        NetworkSettings: xazabCoreNetworkSettings,
      } = await driveNode.xazabCore.container.inspect();

      const {
        NetworkSettings: driveAbciNetworkSettings,
      } = await driveNode.driveAbci.container.inspect();

      const {
        NetworkSettings: mongoDbNetworkSettings,
      } = await driveNode.mongoDb.container.inspect();

      expect(Object.keys(xazabCoreNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
      expect(Object.keys(driveAbciNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
      expect(Object.keys(mongoDbNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;
    const CONTAINER_VOLUME = '/usr/src/app/README.md';

    let driveNodes;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = {
        xazabCore: { container },
        drive: { container },
      };

      driveNodes = await startDrive.many(nodesCount, options);
    });

    after(async () => {
      await Promise.all(driveNodes.map(instance => instance.remove()));
    });

    it('should have XazabCore containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].xazabCore.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].mongoDb.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have Drive ABCI containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await driveNodes[i].driveAbci.container.inspect();

        expect(State.Status).to.equal('running');
        expect(Mounts.map(mount => mount.Destination)).to.include(CONTAINER_VOLUME);
      }
    });
  });
});
