import pino from 'pino';

import DaoFactory from '../../src/daoFactory';
import { UserData } from '../../src/daos/user';
import ModelFactory from '../../src/modelFactory';
import UserModel from '../../src/models/user';

describe('Model: User', () => {
  describe('Dynamic methods', () => {
    describe('get population', () => {
      test('it calculates correctly', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          units: [
            { type: 'CITIZEN', quantity: 1 },
            { type: 'WORKER', quantity: 2 },
            { level: 1, type: 'OFFENSE', quantity: 3 },
            { level: 1, type: 'DEFENSE', quantity: 4 },
            { level: 1, type: 'SPY', quantity: 5 },
            { level: 1, type: 'SENTRY', quantity: 6 },
          ],
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.population).toBe(21);
      });
    });
    describe('get armySize', () => {
      test('it calculates correctly', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          units: [
            { type: 'CITIZEN', quantity: 1 },
            { type: 'WORKER', quantity: 2 },
            { level: 1, type: 'OFFENSE', quantity: 3 },
            { level: 1, type: 'DEFENSE', quantity: 4 },
            { level: 1, type: 'SPY', quantity: 5 },
            { level: 1, type: 'SENTRY', quantity: 6 },
          ],
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.armySize).toBe(18);
      });
    });
    describe('get citizens', () => {
      test('it calculates correctly', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          units: [
            { type: 'CITIZEN', quantity: 1 },
            { type: 'WORKER', quantity: 2 },
            { level: 1, type: 'OFFENSE', quantity: 3 },
            { level: 1, type: 'DEFENSE', quantity: 4 },
            { level: 1, type: 'SPY', quantity: 5 },
            { level: 1, type: 'SENTRY', quantity: 6 },
          ],
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.citizens).toBe(1);
      });
    });
    describe('get goldPerTurn', () => {
      test('it calculates correctly', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          units: [{ type: 'WORKER', level: 1, quantity: 2 }],
          fortLevel: 1,
          race: 'HUMAN',
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.goldPerTurn).toBe(1130);
      });
      test('it works correctly if there are no WORKER units', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          units: [],
          fortLevel: 1,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.goldPerTurn).toBe(1000);
      });
    });
    describe('get level', () => {
      test('it calculates correctly', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          experience: 199,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.level).toBe(1);
      });
      test('it finds the correct level with XP is exact', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          experience: 9001,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.level).toBe(2);
      });
      test('does not return an error with 0 experience', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          experience: 0,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.level).toBe(1);
      });
    });
    describe('get xpToNextLevel', () => {
      test('it calculates correctly', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          experience: 150,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.xpToNextLevel).toBe(5850);
      });
    });
    describe('get fortHealth', () => {
      test('it calculates correctly', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          fortHitpoints: 50,
          fortLevel: 1,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.fortHealth).toMatchObject({
          current: 50,
          max: 100,
          percentage: 50,
        });
      });
    });
    describe('get availableUnitTypes', () => {
      test('it only returns level 1 units', () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          fortLevel: 1,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(user.availableUnitTypes).toMatchObject([
          { name: 'Worker', type: 'WORKER', level: 1, bonus: 65, cost: 2000 },
          { name: 'Soldier', type: 'OFFENSE', level: 1, bonus: 3, cost: 1500 },
          { name: 'Knight', type: 'OFFENSE', level: 2, bonus: 20, cost: 10000 },
          { name: 'Guard', type: 'DEFENSE', level: 1, bonus: 3, cost: 1500 },
          { name: 'Archer', type: 'DEFENSE', level: 2, bonus: 20, cost: 10000 },
          { name: 'Spy', type: 'SPY', level: 1, bonus: 3, cost: 1500 },
          {
            name: 'Infiltrator',
            type: 'SPY',
            level: 2,
            bonus: 20,
            cost: 10000,
          },
          { name: 'Sentry', type: 'SENTRY', level: 1, bonus: 3, cost: 1500 },
          {
            name: 'Sentinel',
            type: 'SENTRY',
            level: 2,
            bonus: 20,
            cost: 10000,
          },
        ]);
      });
    });
    describe('validatePassword', () => {
      test('it returns false when the provided password is not valid', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          passwordHash: 'password',
        } as unknown as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(await user.validatePassword('wrong password')).toBe(false);
      });
      test('it returns true when the provided password is valid', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {} as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          passwordHash:
            '$2b$10$Zdf/HbQm4.CzYUoj1FoY5O9ng0GxJumavLpgPCqMDaTL4gc7Ntc0S',
        } as unknown as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        expect(await user.validatePassword('password')).toBe(true);
      });
    });
    describe('addGold', () => {
      it('calls the dao to set the gold to the correct amount', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            id: 1111,
            setGold: jest.fn().mockResolvedValue(null),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          gold: 150,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        await user.addGold(100);

        expect(user.gold).toBe(250);
        expect(mockDaoFactory.user.setGold).toHaveBeenCalledWith(user.id, 250);
      });
    });
    describe('subtractGold', () => {
      it('calls the dao to set the gold to the correct amount', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            id: 1111,
            setGold: jest.fn().mockResolvedValue(null),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          gold: 150,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        await user.subtractGold(100);

        expect(user.gold).toBe(50);
        expect(mockDaoFactory.user.setGold).toHaveBeenCalledWith(user.id, 50);
      });
    });
    describe('addBankedGold', () => {
      it('calls the dao to set the gold to the correct amount', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            id: 1111,
            setBankedGold: jest.fn().mockResolvedValue(null),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          goldInBank: 150,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        await user.addBankedGold(100);

        expect(user.goldInBank).toBe(250);
        expect(mockDaoFactory.user.setBankedGold).toHaveBeenCalledWith(
          user.id,
          250
        );
      });
    });
    describe('subtractBankedGold', () => {
      it('calls the dao to set the gold to the correct amount', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            id: 1111,
            setBankedGold: jest.fn().mockResolvedValue(null),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          goldInBank: 150,
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        await user.subtractBankedGold(100);

        expect(user.goldInBank).toBe(50);
        expect(mockDaoFactory.user.setBankedGold).toHaveBeenCalledWith(
          user.id,
          50
        );
      });
    });
    describe('trainNewUnits', () => {
      it('adds new units that previously did not exist', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            setUnits: jest.fn().mockResolvedValue(null),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          gold: 150,
          units: [{ type: 'CITIZEN', level: 1, quantity: 1 }],
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        await user.trainNewUnits([
          { type: 'CITIZEN', level: 1, quantity: 0 },
          { type: 'WORKER', level: 1, quantity: 1 },
        ]);

        expect(user.units).toMatchObject([
          { type: 'CITIZEN', level: 1, quantity: 0 },
          { type: 'WORKER', level: 1, quantity: 1 },
        ]);
        expect(mockDaoFactory.user.setUnits).toHaveBeenCalledWith(user.id, [
          { type: 'CITIZEN', level: 1, quantity: 0 },
          { type: 'WORKER', level: 1, quantity: 1 },
        ]);
      });
      it('increases the count of existing units', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            setUnits: jest.fn().mockResolvedValue(null),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;
        const mockData = {
          gold: 150,
          units: [
            { type: 'CITIZEN', level: 1, quantity: 1 },
            { type: 'WORKER', level: 1, quantity: 1 },
          ],
        } as UserData;

        const user = new UserModel(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          mockData
        );

        await user.trainNewUnits([{ type: 'WORKER', level: 1, quantity: 1 }]);

        expect(user.units).toMatchObject([
          { type: 'CITIZEN', level: 1, quantity: 0 },
          { type: 'WORKER', level: 1, quantity: 2 },
        ]);
        expect(mockDaoFactory.user.setUnits).toHaveBeenCalledWith(user.id, [
          { type: 'CITIZEN', level: 1, quantity: 0 },
          { type: 'WORKER', level: 1, quantity: 2 },
        ]);
      });
    });
  });
  describe('Static methods', () => {
    describe('fetchById', () => {
      test('it resolves an instance of UserModel', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            fetchById: jest.fn().mockResolvedValue({}),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;

        const user = await UserModel.fetchById(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          999
        );
        expect(user).toBeInstanceOf(UserModel);
      });
      test('it returns null when the requested user does not exist', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            fetchById: jest.fn().mockResolvedValue(null),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;

        const user = await UserModel.fetchById(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          999
        );
        expect(user).toBeNull();
      });
    });
    describe('fetchByEmail', () => {
      test('it resolves an instance of UserModel', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            fetchByEmail: jest.fn().mockResolvedValue({}),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;

        const user = await UserModel.fetchByEmail(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          'email@example.com'
        );
        expect(user).toBeInstanceOf(UserModel);
      });
      test('it returns null when the requested user does not exist', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            fetchByEmail: jest.fn().mockResolvedValue(null),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;

        const user = await UserModel.fetchByEmail(
          mockModelFactory,
          mockDaoFactory,
          mockLogger,
          'email@example.com'
        );
        expect(user).toBeNull();
      });
    });
    describe('fetchAll', () => {
      it('returns an array of UserModels', async () => {
        const mockModelFactory = {} as ModelFactory;
        const mockDaoFactory = {
          user: {
            fetchAll: jest.fn().mockResolvedValue([{} as UserData]),
          },
        } as unknown as DaoFactory;
        const mockLogger = {} as pino.Logger;

        const users = await UserModel.fetchAll(
          mockModelFactory,
          mockDaoFactory,
          mockLogger
        );
        expect(users[0]).toBeInstanceOf(UserModel);
      });
    });
  });
});
