import { expect } from 'chai';
import * as sinon from 'sinon';
import { RobotWithClient } from '../hackbot';
import { SlackBotClient } from 'hubot-slack';
import { MemoryDataStore, User } from '@slack/client';
import * as Helper from 'hubot-test-helper';

describe('@hubot tell me about @username', () => {

  let helper: Helper.Helper;
  let room: Helper.Room;
  let robot: RobotWithClient;
  let dataStore: MemoryDataStore;

  before(() => helper = new Helper('../index.js'));

  function setUp() {
    room = helper.createRoom();
    robot = <RobotWithClient> room.robot;
    dataStore = new MemoryDataStore();
    robot.adapter.client = <SlackBotClient> { rtm: { dataStore: dataStore } };
  }

  function tearDown() {
    room.destroy();
  }

  describe('when user exists with team and a motto', () => {

    before(setUp);
    after(tearDown);

    let myUsername: string;
    let userId: string;
    let username: string;
    let teamName: string;
    let motto: string;
    let getUserStub: sinon.SinonStub;

    before(() => {
      myUsername = 'benny';
      userId = 'pig';
      username = 'PigBodine';
      teamName = 'Whole Sick Crew';
      motto = 'A-and...';

      sinon
        .stub(dataStore, 'getUserByName')
        .withArgs(username)
        .returns({ id: userId, name: username } as User);

      getUserStub = sinon.stub(robot.client, 'getUser').returns(Promise.resolve({
        ok: true,
        user: {
          id: userId,
          team: {
            id: 'some random id',
            name: teamName,
            motto: motto,
            members: [],
          },
        },
      }));

      return room.user.say(myUsername, `@hubot tell me about @${username}`);
    });

    it('should fetch the user', () => {
      expect(getUserStub).to.have.been.calledWith(userId);
    });

    it('should tell the user the user information', () => {
      expect(room.messages).to.eql([
        [myUsername, `@hubot tell me about @${username}`],
        ['hubot',
         `@${myUsername} "${username}" is a member of team: ${teamName},\r\n` +
         `They say: ${motto}`,
        ],
      ]);
    });
  });

  describe('when user exists with team but no motto', () => {

    before(setUp);
    after(tearDown);

    let myUsername: string;
    let userId: string;
    let username: string;
    let teamName: string;
    let getUserStub: sinon.SinonStub;

    before(() => {
      myUsername = 'benny';
      userId = 'pig';
      username = 'PigBodine';
      teamName = 'Whole Sick Crew';

      sinon
        .stub(dataStore, 'getUserByName')
        .withArgs(username)
        .returns({ id: userId, name: username } as User);

      getUserStub = sinon.stub(robot.client, 'getUser').returns(Promise.resolve({
        ok: true,
        user: {
          id: userId,
          team: {
            id: 'some random id',
            name: teamName,
            motto: null,
            members: [],
          },
        },
      }));

      return room.user.say(myUsername, `@hubot tell me about @${username}`);
    });

    it('should fetch the user', () => {
      expect(getUserStub).to.have.been.calledWith(userId);
    });

    it('should tell the user the user information', () => {
      expect(room.messages).to.eql([
        [myUsername, `@hubot tell me about @${username}`],
        ['hubot',
         `@${myUsername} "${username}" is a member of team: ${teamName},\r\n` +
         `They don't yet have a motto!`,
        ],
      ]);
    });
  });

  describe('when user exists with no team', () => {

    before(setUp);
    after(tearDown);

    let myUsername: string;
    let userId: string;
    let username: string;
    let getUserStub: sinon.SinonStub;

    before(() => {
      myUsername = 'benny';
      userId = 'pig';
      username = 'PigBodine';

      sinon
        .stub(dataStore, 'getUserByName')
        .withArgs(username)
        .returns({ id: userId, name: username } as User);

      getUserStub = sinon.stub(robot.client, 'getUser').returns(Promise.resolve({
        ok: true,
        user: {
          id: userId,
          team: {},
        },
      }));

      return room.user.say(myUsername, `@hubot tell me about @${username}`);
    });

    it('should fetch the user', () => {
      expect(getUserStub).to.have.been.calledWith(userId);
    });

    it('should tell the user the user information', () => {
      expect(room.messages).to.eql([
        [myUsername, `@hubot tell me about @${username}`],
        ['hubot',
         `@${myUsername} "${username}" is not yet a member of a team!`,
        ],
      ]);
    });
  });

  describe('when user is unknown by the API', () => {

    before(setUp);
    after(tearDown);

    let myUsername: string;
    let userId: string;
    let username: string;
    let getUserStub: sinon.SinonStub;

    before(() => {
      myUsername = 'benny';
      userId = 'pig';
      username = 'PigBodine';

      sinon
        .stub(dataStore, 'getUserByName')
        .withArgs(username)
        .returns({ id: userId, name: username } as User);

      getUserStub = sinon.stub(robot.client, 'getUser').returns(Promise.resolve({
        ok: false,
        statusCode: 404,
      }));

      return room.user.say(myUsername, `@hubot tell me about @${username}`);
    });

    it('should fetch the user', () => {
      expect(getUserStub).to.have.been.calledWith(userId);
    });

    it('should tell the user that no such user exists', () => {
      expect(room.messages).to.eql([
        [myUsername, `@hubot tell me about @${username}`],
        ['hubot',
         `@${myUsername} "${username}" is not a user I recognise!`,
        ],
      ]);
    });
  });

  describe('when user is unknown by the brain', () => {

    before(setUp);
    after(tearDown);

    let myUsername: string;
    let username: string;
    let getUserStub: sinon.SinonStub;

    before(() => {
      myUsername = 'benny';
      username = 'PigBodine';

      getUserStub = sinon.stub(robot.client, 'getUser');

      sinon
        .stub(dataStore, 'getUserByName')
        .withArgs(username)
        .returns(undefined);

      return room.user.say(myUsername, `@hubot tell me about @${username}`);
    });

    it('should not fetch the user', () => {
      expect(getUserStub).to.not.have.been.calledWith();
    });

    it('should tell the user that no such user exists', () => {
      expect(room.messages).to.eql([
        [myUsername, `@hubot tell me about @${username}`],
        ['hubot',
         `@${myUsername} "${username}" is not a user I recognise!`,
        ],
      ]);
    });
  });

  describe('when getUser errors', () => {

    before(setUp);
    after(tearDown);

    let myUsername: string;
    let userId: string;
    let username: string;

    before(() => {
      myUsername = 'benny';
      userId = 'pig';
      username = 'PigBodine';
      const error = new Error('problem happened');

      sinon.stub(robot, 'emit');
      sinon.stub(robot.client, 'getUser').returns(Promise.reject(error));

      sinon
        .stub(dataStore, 'getUserByName')
        .withArgs(username)
        .returns({ id: userId, name: username } as User);

      return room.user.say(myUsername, `@hubot tell me about @${username}`);
    });

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [myUsername, `@hubot tell me about @${username}`],
      ]);
    });
  });

});
