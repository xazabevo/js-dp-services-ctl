const Docker = require('dockerode');

const removeContainers = require('../../../../../lib/docker/removeContainers');
const { startXazabCore, startMongoDb, createDriveAbci } = require('../../../../../lib/index');
const DriveAbciOptions = require('../../../../../lib/services/drive/abci/DriveAbciOptions');

describe('createDriveAbci', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let xazabCore;
    let mongoDb;
    let envs;
    let driveAbci;

    before(async () => {
      xazabCore = await startXazabCore();
      mongoDb = await startMongoDb();
      envs = [
        `DOCUMENT_MONGODB_URL=mongodb://${mongoDb.getIp()}:${mongoDb.options.getMongoPort()}`,
        `CORE_JSON_RPC_HOST=${xazabCore.getIp()}`,
        `CORE_JSON_RPC_PORT=${xazabCore.options.getRpcPort()}`,
        `CORE_JSON_RPC_USER=${xazabCore.options.getRpcUser()}`,
        `CORE_JSON_RPC_PASS=${xazabCore.options.getRpcPassword()}`,
      ];

      const options = {
        container: {
          envs,
        },
      };

      driveAbci = await createDriveAbci(options);
    });

    after(async () => {
      await Promise.all([
        xazabCore.remove(),
        mongoDb.remove(),
        driveAbci.remove(),
      ]);
    });

    it('should be able to start an instance with a bridge network called xazab_test_network', async () => {
      await driveAbci.start();
      const network = new Docker().getNetwork('xazab_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await driveAbci.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('xazab_test_network');
    });

    it('should be able to start an instance with custom environment variables', async () => {
      await driveAbci.start();
      const { Config: { Env } } = await driveAbci.container.inspect();

      const instanceEnv = Env.filter(variable => envs.includes(variable));

      expect(envs.length).to.equal(instanceEnv.length);
    });

    it('should be able to start an instance with the default options', async () => {
      await driveAbci.start();
      const { Args } = await driveAbci.container.inspect();

      expect(Args).to.deep.equal(['npm', 'run', 'abci']);
    });

    it('should return correct Drive ABCI port as a result of calling getAbciPort', async () => {
      await driveAbci.start();

      expect(driveAbci.getAbciPort()).to.equal(driveAbci.options.getAbciPort());
    });
  });

  describe('options', async () => {
    let xazabCore;
    let mongoDb;
    let driveAbci;
    let envs;

    beforeEach(async () => {
      xazabCore = await startXazabCore();
      mongoDb = await startMongoDb();
      envs = [
        `DOCUMENT_MONGODB_URL=mongodb://${mongoDb.getIp()}:${mongoDb.options.getMongoPort()}`,
        `CORE_JSON_RPC_HOST=${xazabCore.getIp()}`,
        `CORE_JSON_RPC_PORT=${xazabCore.options.getRpcPort()}`,
        `CORE_JSON_RPC_USER=${xazabCore.options.getRpcUser()}`,
        `CORE_JSON_RPC_PASS=${xazabCore.options.getRpcPassword()}`,
      ];
    });

    afterEach(async () => {
      await Promise.all([
        xazabCore.remove(),
        mongoDb.remove(),
        driveAbci.remove(),
      ]);
    });

    it('should be able to start an instance with options passed as a plain object', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };

      driveAbci = await createDriveAbci(options);

      await driveAbci.start();

      const { Mounts } = await driveAbci.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with DriveAbciOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new DriveAbciOptions({
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });

      driveAbci = await createDriveAbci(options);

      await driveAbci.start();

      const { Mounts } = await driveAbci.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with custom default DriveAbciOptions', async () => {
      const options = new DriveAbciOptions({
        container: {
          envs,
        },
      });

      driveAbci = await createDriveAbci(options);

      await driveAbci.start();

      const { Config: { Image: imageName } } = await driveAbci.container.inspect();

      expect(imageName).to.contain('drive');
    });
  });
});
