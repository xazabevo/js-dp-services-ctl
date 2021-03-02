const startDapi = require('../../../lib/mocha/startDapi');

describe('startDapi', () => {
  describe('One node', () => {
    let dapiNode;

    startDapi().then((instance) => {
      dapiNode = instance;
    });

    it('should have all Dapi containers running', async () => {
      const { State: stateDapiCore } = await dapiNode.dapiCore.container.inspect();
      expect(stateDapiCore.Status).to.equal('running');

      const {
        State: stateDapiTxFilterStream,
      } = await dapiNode.dapiTxFilterStream.container.inspect();
      expect(stateDapiTxFilterStream.Status).to.equal('running');

      const { State: stateXazabCore } = await dapiNode.xazabCore.container.inspect();
      expect(stateXazabCore.Status).to.equal('running');

      const { State: stateMongoDb } = await dapiNode.mongoDb.container.inspect();
      expect(stateMongoDb.Status).to.equal('running');

      const { State: stateDriveAbci } = await dapiNode.driveAbci.container.inspect();
      expect(stateDriveAbci.Status).to.equal('running');

      const { State: stateInsight } = await dapiNode.insightApi.container.inspect();
      expect(stateInsight.Status).to.equal('running');
    });
  });

  describe.skip('Many nodes', () => {
    const nodesCount = 2;

    let dapiNodes;

    startDapi.many(nodesCount).then((instances) => {
      dapiNodes = instances;
    });

    it('should have all containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].xazabCore.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].mongoDb.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have Drive ABCI containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].mongoDb.container.inspect();

        expect(State.Status).to.equal('running');
      }
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].driveAbci.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have Insight containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].insightApi.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have DAPI Core containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].dapiCore.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have DAPI TxFilterStream containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].dapiTxFilterStream.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });
  });
});
